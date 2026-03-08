'use server'

import { prisma } from '@/lib/prisma'
import { capturePaymentIntent, createTransfer } from '@/lib/stripe'

export interface PayoutResult {
    success: boolean
    data?: { transferId: string; paidOutAt: Date }
    error?: string
}

/**
 * Triggers a payout for a completed booking.
 *
 * Flow:
 * 1. Fetch booking with payment + laveur profile (stripeAccountId)
 * 2. Guard: booking must be COMPLETED
 * 3. Guard: payout idempotency — skip if already processed
 * 4. Guard: laveur must have a connected Stripe account
 * 5. Capture the PaymentIntent (release escrow)
 * 6. Create a Stripe Transfer to the laveur's connected account
 * 7. Persist stripeTransferId + paidOutAt in a Prisma transaction
 */
export async function triggerPayout(bookingId: string): Promise<PayoutResult> {
    try {
        // 1. Load booking with all required relations
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                payment: true,
                laveur: {
                    include: { profile: true },
                },
            },
        })

        if (!booking) {
            return { success: false, error: 'Réservation introuvable' }
        }

        // 2. Guard: booking must be COMPLETED
        if (booking.status !== 'COMPLETED') {
            return {
                success: false,
                error: `Impossible de déclencher le reversement : statut de réservation invalide (${booking.status}). Le statut doit être COMPLETED.`,
            }
        }

        // 3. Guard: payment must exist
        if (!booking.payment) {
            return { success: false, error: 'Aucun paiement associé à cette réservation' }
        }

        // 4. Guard: idempotency — skip if payout already processed
        if (booking.payment.paidOutAt !== null) {
            return {
                success: false,
                error: 'Reversement déjà effectué pour cette réservation',
            }
        }

        // 5. Guard: PaymentIntent must exist to capture
        if (!booking.payment.stripePaymentIntentId) {
            return {
                success: false,
                error: 'PaymentIntent Stripe manquant — impossible de capturer les fonds',
            }
        }

        // 6. Guard: laveur must be assigned and have a connected Stripe account
        if (!booking.laveurId || !booking.laveur) {
            console.warn(
                `[triggerPayout] Booking ${bookingId}: no laveur assigned — payout deferred`
            )
            return { success: false, error: 'Aucun laveur assigné à cette réservation' }
        }

        const stripeAccountId = booking.laveur.profile?.stripeAccountId
        if (!stripeAccountId) {
            console.warn(
                `[triggerPayout] Booking ${bookingId}: laveur ${booking.laveurId} has no stripeAccountId — payout deferred`
            )
            return {
                success: false,
                error: 'Le compte Stripe du laveur n\'est pas connecté. Le reversement sera effectué manuellement.',
            }
        }

        // 7. Capture the PaymentIntent (release funds from manual-capture escrow)
        const capturedIntent = await capturePaymentIntent(booking.payment.stripePaymentIntentId)

        // source_transaction requires a Charge ID (ch_...), NOT a PaymentIntent ID (pi_...).
        // After capture, latest_charge holds the Charge ID linked to this PaymentIntent.
        const chargeId = typeof capturedIntent.latest_charge === 'string'
            ? capturedIntent.latest_charge
            : capturedIntent.latest_charge?.id

        if (!chargeId) {
            return {
                success: false,
                error: 'Charge ID introuvable après capture du PaymentIntent — impossible de créer le transfert',
            }
        }

        // 8. Create a Stripe Transfer to the laveur's connected account
        const transfer = await createTransfer(
            booking.payment.amountCents,
            stripeAccountId,
            chargeId,
            bookingId
        )

        const paidOutAt = new Date()

        // 9. Persist transfer details atomically
        await prisma.$transaction([
            prisma.payment.update({
                where: { id: booking.payment.id },
                data: {
                    stripeTransferId: transfer.id,
                    paidOutAt,
                },
            }),
        ])

        return {
            success: true,
            data: { transferId: transfer.id, paidOutAt },
        }
    } catch (error: any) {
        console.error('[triggerPayout] Error:', error)
        return {
            success: false,
            error: error.message || 'Erreur lors du déclenchement du reversement',
        }
    }
}
