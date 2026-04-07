'use server'

import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

// Prisma IDs use cuid() format (e.g. "clxyz123abc...")
const CUID_REGEX = /^c[a-z0-9]{8,}$/i

export interface RefundResult {
    success: boolean
    data?: {
        refundId: string
        status: string
        totalRefundedCents: number
    }
    error?: string
}

/**
 * Triggers a refund for a booking via Stripe.
 *
 * Auth: Manually replicates checkAdminAuth logic (cannot use Request-based helper in Server Actions).
 *
 * Flow:
 * 1. Authenticate and verify ADMIN role
 * 2. Load booking with payment
 * 3. Guards: payment exists, not already fully refunded, amount valid
 * 4. Call Stripe refund API
 * 5. Update Payment record with cumulative refund data
 * 6. Log audit trail
 */
export async function triggerRefund(
    bookingId: string,
    amountCents: number
): Promise<RefundResult> {
    try {
        // 1. Auth check (replicated from checkAdminAuth — no Request object in Server Actions)
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { success: false, error: 'Non authentifié' }
        }

        const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })

        if (!dbUser) {
            return { success: false, error: 'Non authentifié' }
        }

        if (dbUser.role !== 'ADMIN') {
            return { success: false, error: 'Accès refusé' }
        }

        // 2. Validate bookingId format (cuid)
        if (!CUID_REGEX.test(bookingId)) {
            return { success: false, error: 'Identifiant de réservation invalide' }
        }

        // 3. Load booking
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: { payment: true },
        })

        if (!booking) {
            return { success: false, error: 'Réservation introuvable' }
        }

        // 3. Guards
        if (!booking.payment) {
            return { success: false, error: 'Aucun paiement associé à cette réservation' }
        }

        if (!booking.payment.stripePaymentIntentId) {
            return { success: false, error: 'Aucun PaymentIntent Stripe associé à ce paiement' }
        }

        if (booking.payment.status === 'REFUNDED') {
            return { success: false, error: 'Ce paiement a déjà été entièrement remboursé' }
        }

        const alreadyRefunded = booking.payment.refundAmountCents ?? 0
        const remaining = booking.payment.amountCents - alreadyRefunded

        if (amountCents <= 0) {
            return { success: false, error: 'Le montant du remboursement doit être supérieur à 0' }
        }

        if (amountCents > remaining) {
            return {
                success: false,
                error: `Montant supérieur au montant remboursable (${(remaining / 100).toFixed(2)} €).`,
            }
        }

        // 4. Call Stripe refund API (idempotency key prevents duplicate refunds on retry — H1)
        // Key is scoped per booking + amount + minute-bucket to allow re-trying if a genuine failure occurs
        const idempotencyKey = `booking-${bookingId}-refund-${amountCents}-${Math.floor(Date.now() / 60000)}`
        const stripeRefund = await stripe.refunds.create(
            {
                payment_intent: booking.payment.stripePaymentIntentId,
                amount: amountCents,
                reason: 'requested_by_customer',
            },
            { idempotencyKey }
        )

        // 5. Update Payment record with cumulative refund data
        const newTotalRefunded = alreadyRefunded + amountCents
        const newStatus = newTotalRefunded >= booking.payment.amountCents
            ? 'REFUNDED'
            : 'PARTIALLY_REFUNDED'

        await prisma.payment.update({
            where: { id: booking.payment.id },
            data: {
                refundAmountCents: newTotalRefunded,
                status: newStatus,
                refundedAt: new Date(),
                refundReason: 'requested_by_customer',
            },
        })

        // 6. Audit log
        console.info(
            '[triggerRefund] Admin %s refunded %d cents on booking %s (Stripe refund: %s)',
            dbUser.id,
            amountCents,
            bookingId,
            stripeRefund.id
        )

        return {
            success: true,
            data: {
                refundId: stripeRefund.id,
                status: newStatus,
                totalRefundedCents: newTotalRefunded,
            },
        }
    } catch (error: unknown) {
        console.error('[triggerRefund] Error:', error)
        // H2: Sanitize Stripe SDK error messages — never expose internal Stripe details to the client
        if (error instanceof Stripe.errors.StripeError) {
            return { success: false, error: `Erreur Stripe (${error.code ?? 'unknown'}) — veuillez réessayer.` }
        }
        const message = error instanceof Error ? error.message : 'Erreur lors du remboursement'
        return { success: false, error: message }
    }
}
