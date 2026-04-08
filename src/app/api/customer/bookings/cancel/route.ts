import { NextRequest, NextResponse } from 'next/server'
import { withClientGuard } from '@/lib/auth/clientGuard'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

/**
 * POST /api/customer/bookings/cancel
 * Cancels a booking if it belongs to the client and is >24h away.
 * Allowed statuses: PENDING, CONFIRMED (and ACCEPTED as per frontend assigned logic)
 */
export const POST = withClientGuard(async (req: Request, _authUser, dbUser) => {
    try {
        const body = await req.json()
        const { bookingId } = body

        if (!bookingId) {
            return NextResponse.json({ success: false, error: 'Booking ID is required' }, { status: 400 })
        }

        const booking = await prisma.booking.findUnique({
            where: { id: bookingId }
        })

        if (!booking) {
            return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
        }

        // Ownership check
        if (booking.clientId !== dbUser.id) {
            return NextResponse.json({ success: false, error: 'Forbidden: You do not own this booking' }, { status: 403 })
        }

        // Status check
        // Per story AC: reject if status is not PENDING or CONFIRMED
        // Note: Frontend shows cancel button for ASSIGNED (ACCEPTED). 
        // We allow PENDING, CONFIRMED, and ACCEPTED (ASSIGNED) for now as per dashboard logic.
        const cancellableStatuses = ['PENDING', 'CONFIRMED', 'ACCEPTED']
        if (!cancellableStatuses.includes(booking.status)) {
            return NextResponse.json({
                success: false,
                error: `Cannot cancel a booking with status ${booking.status}`
            }, { status: 400 })
        }

        // 24h rule check
        const now = Date.now()
        const scheduledTime = booking.scheduledDate.getTime()
        const diffInMs = scheduledTime - now
        const twentyFourHoursInMs = 24 * 60 * 60 * 1000

        if (diffInMs < twentyFourHoursInMs) {
            return NextResponse.json({
                success: false,
                error: 'Cancellation is only allowed more than 24 hours before the scheduled time.'
            }, { status: 400 })
        }

        // Update booking status
        const updatedBooking = await prisma.booking.update({
            where: { id: bookingId },
            data: {
                status: 'CANCELLED',
                cancelledAt: new Date(),
                cancellationReason: 'Client cancellation'
            },
            include: { payment: true }
        })

        // Auto-refund: only needed if a Payment exists (i.e., after washer acceptance)
        if (updatedBooking.payment && updatedBooking.payment.stripePaymentIntentId) {
            try {
                const pi = await stripe.paymentIntents.retrieve(updatedBooking.payment.stripePaymentIntentId)

                if (pi.status === 'requires_capture') {
                    // Legacy: manual-capture PI not yet captured — cancel to release hold
                    await stripe.paymentIntents.cancel(updatedBooking.payment.stripePaymentIntentId)
                    console.info(
                        '[cancel] Uncaptured PI cancelled for booking %s (PI: %s)',
                        bookingId,
                        updatedBooking.payment.stripePaymentIntentId
                    )
                } else if (pi.status === 'succeeded') {
                    // New flow or legacy captured: issue refund
                    await stripe.refunds.create({
                        payment_intent: updatedBooking.payment.stripePaymentIntentId,
                        amount: updatedBooking.payment.amountCents,
                        reason: 'requested_by_customer',
                    })
                    console.info(
                        '[cancel] Refund issued for booking %s: %d cents',
                        bookingId,
                        updatedBooking.payment.amountCents
                    )
                }
                // If PI is in another state (cancelled, etc.), no action needed

                await prisma.payment.update({
                    where: { id: updatedBooking.payment.id },
                    data: {
                        refundAmountCents: updatedBooking.payment.amountCents,
                        status: 'REFUNDED',
                        refundedAt: new Date(),
                        refundReason: 'Client cancellation',
                    },
                })
            } catch (refundError) {
                // Log but don't block cancellation — admin can retry refund manually
                console.error('[cancel] Auto-refund failed for booking %s:', bookingId, refundError)
            }
        }
        // Before washer acceptance: no Payment exists, nothing to refund

        return NextResponse.json({
            success: true,
            data: {
                bookingId: updatedBooking.id,
                status: 'CANCELLED'
            }
        })

    } catch (error) {
        console.error('Error cancelling customer booking:', error)
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        )
    }
})
