'use server'

import { prisma } from '@/lib/prisma'
import { stripe, capturePaymentIntent, createTransfer } from '@/lib/stripe'
import { computeCommission, getCurrentCommissionRate } from '@/lib/constants/commission'

type PayoutErrorCode =
    | 'not_found'
    | 'wrong_status'
    | 'no_payment'
    | 'already_paid_out'
    | 'no_payment_intent'
    | 'no_laveur'
    | 'no_stripe_account'
    | 'unexpected_pi_status'
    | 'no_charge_id'
    | 'transfer_failed'
    | 'unknown'

async function recordAttempt(
    bookingId: string,
    triggeredBy: 'client' | 'cron' | 'admin',
    success: boolean,
    errorCode: PayoutErrorCode | null,
    errorMessage: string | null,
): Promise<void> {
    try {
        await prisma.payoutAttempt.create({
            data: { bookingId, triggeredBy, success, errorCode, errorMessage },
        })
    } catch (err) {
        console.error('[triggerPayout] Failed to record audit row:', err)
    }
}

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
 *
 * Every invocation (success or failure) creates a `PayoutAttempt` audit row.
 */
export async function triggerPayout(
    bookingId: string,
    opts: { triggeredBy: 'client' | 'cron' | 'admin' }
): Promise<PayoutResult> {
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
            const error = 'Réservation introuvable'
            await recordAttempt(bookingId, opts.triggeredBy, false, 'not_found', error)
            return { success: false, error }
        }

        // 2. Guard: booking must be COMPLETED
        if (booking.status !== 'COMPLETED') {
            const error = `Impossible de déclencher le reversement : statut de réservation invalide (${booking.status}). Le statut doit être COMPLETED.`
            await recordAttempt(bookingId, opts.triggeredBy, false, 'wrong_status', error)
            return { success: false, error }
        }

        // 3. Guard: payment must exist
        if (!booking.payment) {
            const error = 'Aucun paiement associé à cette réservation'
            await recordAttempt(bookingId, opts.triggeredBy, false, 'no_payment', error)
            return { success: false, error }
        }

        // 4. Guard: idempotency — skip if payout already processed
        if (booking.payment.paidOutAt !== null) {
            const error = 'Reversement déjà effectué pour cette réservation'
            await recordAttempt(bookingId, opts.triggeredBy, false, 'already_paid_out', error)
            return { success: false, error }
        }

        // 5. Guard: PaymentIntent must exist to capture
        if (!booking.payment.stripePaymentIntentId) {
            const error = 'PaymentIntent Stripe manquant — impossible de capturer les fonds'
            await recordAttempt(bookingId, opts.triggeredBy, false, 'no_payment_intent', error)
            return { success: false, error }
        }

        // 6. Guard: laveur must be assigned and have a connected Stripe account
        if (!booking.laveurId || !booking.laveur) {
            console.warn(
                `[triggerPayout] Booking ${bookingId}: no laveur assigned — payout deferred`
            )
            const error = 'Aucun laveur assigné à cette réservation'
            await recordAttempt(bookingId, opts.triggeredBy, false, 'no_laveur', error)
            return { success: false, error }
        }

        const stripeAccountId = booking.laveur.profile?.stripeAccountId
        if (!stripeAccountId) {
            console.warn(
                `[triggerPayout] Booking ${bookingId}: laveur ${booking.laveurId} has no stripeAccountId — payout deferred`
            )
            const error = 'Le compte Stripe du laveur n\'est pas connecté. Le reversement sera effectué manuellement.'
            await recordAttempt(bookingId, opts.triggeredBy, false, 'no_stripe_account', error)
            return { success: false, error }
        }

        // 7. Get the PaymentIntent — may need capture (legacy) or already succeeded (new flow)
        const pi = await stripe.paymentIntents.retrieve(booking.payment.stripePaymentIntentId)

        let chargeId: string | undefined

        if (pi.status === 'requires_capture') {
            // Legacy flow: manual-capture PI — capture it now
            const capturedIntent = await capturePaymentIntent(booking.payment.stripePaymentIntentId)
            chargeId = typeof capturedIntent.latest_charge === 'string'
                ? capturedIntent.latest_charge
                : capturedIntent.latest_charge?.id
        } else if (pi.status === 'succeeded') {
            // New flow: PI already captured at washer acceptance
            chargeId = typeof pi.latest_charge === 'string'
                ? pi.latest_charge
                : pi.latest_charge?.id
        } else {
            const error = `PaymentIntent dans un état inattendu: ${pi.status}. Capture impossible.`
            await recordAttempt(bookingId, opts.triggeredBy, false, 'unexpected_pi_status', error)
            return { success: false, error }
        }

        if (!chargeId) {
            const error = 'Charge ID introuvable — impossible de créer le transfert'
            await recordAttempt(bookingId, opts.triggeredBy, false, 'no_charge_id', error)
            return { success: false, error }
        }

        // 8. Compute commission using the current platform rate (snapshot for this payout)
        const currentRate = await getCurrentCommissionRate()
        const { commissionCents, netAmountCents, rateUsed } = computeCommission(
            booking.payment.amountCents,
            currentRate
        )

        // 9. Create a Stripe Transfer for the NET amount only — commission stays on platform
        const transfer = await createTransfer(
            netAmountCents,
            stripeAccountId,
            chargeId,
            bookingId
        )

        const paidOutAt = new Date()

        // 10. Persist transfer details + commission snapshot atomically
        await prisma.payment.update({
            where: { id: booking.payment.id },
            data: {
                stripeTransferId: transfer.id,
                paidOutAt,
                commissionCents,
                netAmountCents,
                commissionRate: rateUsed,
            },
        })

        await recordAttempt(bookingId, opts.triggeredBy, true, null, null)

        return {
            success: true,
            data: { transferId: transfer.id, paidOutAt },
        }
    } catch (error: any) {
        console.error('[triggerPayout] Error:', error)
        const message = error?.message || 'Erreur lors du déclenchement du reversement'
        await recordAttempt(bookingId, opts.triggeredBy, false, 'unknown', message)
        return { success: false, error: message }
    }
}
