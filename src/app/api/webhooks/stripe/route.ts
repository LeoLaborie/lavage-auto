// src/app/api/webhooks/stripe/route.ts
// Story 3.1 - Stripe Checkout webhook: confirm booking on payment
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'  // Use the canonical shared client
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    const body = await request.text()
    const sig = request.headers.get('stripe-signature')

    if (!sig) {
        return NextResponse.json(
            { success: false, error: 'Missing stripe-signature header' },
            { status: 400 }
        )
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
        console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not configured')
        return NextResponse.json(
            { success: false, error: 'Server configuration error' },
            { status: 500 }
        )
    }

    try {
        const event = stripe.webhooks.constructEvent(
            body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        )

        console.log(`[Stripe Webhook] Received event: ${event.type}`)

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as Stripe.Checkout.Session
            const bookingId = session.metadata?.bookingId

            if (!bookingId) {
                console.error('[Stripe Webhook] Missing bookingId in metadata')
                return NextResponse.json({ success: false, error: 'Missing bookingId' }, { status: 200 })
            }

            if (session.mode === 'setup') {
                // Setup mode: card saved, no payment yet
                // Just confirm the booking — Payment record will be created at washer acceptance
                await prisma.$transaction(async (tx) => {
                    const booking = await tx.booking.findUnique({
                        where: { id: bookingId }
                    })

                    if (!booking) {
                        throw new Error(`Booking not found: ${bookingId}`)
                    }

                    // Idempotency: only transition PENDING → CONFIRMED
                    if (booking.status !== 'PENDING') {
                        console.log(`[Stripe Webhook] Booking ${bookingId} already ${booking.status}, skipping`)
                        return
                    }

                    await tx.booking.update({
                        where: { id: bookingId },
                        data: { status: 'CONFIRMED' }
                    })
                })

                console.log(`[Stripe Webhook] Booking ${bookingId} confirmed (setup mode — card saved)`)
            } else {
                // Legacy payment mode: keep existing logic for backwards compatibility
                const paymentIntentId = typeof session.payment_intent === 'string'
                    ? session.payment_intent
                    : session.payment_intent?.id ?? null;

                await prisma.$transaction(async (tx) => {
                    const booking = await tx.booking.findUnique({
                        where: { id: bookingId }
                    })

                    if (!booking) {
                        throw new Error(`Booking not found: ${bookingId}`)
                    }

                    if (booking.status !== 'PENDING') {
                        console.log(`[Stripe Webhook] Booking ${bookingId} already ${booking.status}, skipping`)
                        return
                    }

                    await tx.booking.update({
                        where: { id: bookingId },
                        data: { status: 'CONFIRMED' }
                    })

                    await tx.payment.upsert({
                        where: { bookingId },
                        update: {
                            status: 'SUCCEEDED',
                            stripeSessionId: session.id,
                            stripePaymentIntentId: paymentIntentId,
                            processedAt: new Date(),
                        },
                        create: {
                            bookingId,
                            userId: booking.clientId,
                            amountCents: booking.amountCents,
                            currency: booking.currency,
                            status: 'SUCCEEDED',
                            stripeSessionId: session.id,
                            stripePaymentIntentId: paymentIntentId,
                            processedAt: new Date(),
                        }
                    })
                })

                console.log(`[Stripe Webhook] Booking ${bookingId} confirmed (payment mode — legacy)`)
            }
        } else if (event.type === 'payment_intent.payment_failed') {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            // The bookingId could be in the metadata if passed at intent creation.
            const bookingId = paymentIntent.metadata?.bookingId;

            if (!bookingId) {
                console.error('[Stripe Webhook] Missing bookingId in metadata for payment_failed');
                return NextResponse.json({ success: false, error: 'Missing bookingId' }, { status: 200 });
            }

            await prisma.$transaction(async (tx) => {
                const booking = await tx.booking.findFirst({
                    where: { id: bookingId, status: 'PENDING' }
                });

                if (booking) {
                    await tx.booking.update({
                        where: { id: bookingId },
                        data: { status: 'CANCELLED' }
                    });

                    // Update corresponding payment status
                    await tx.payment.updateMany({
                        where: { bookingId },
                        data: { status: 'FAILED' }
                    });
                }
            });
            console.log(`[Stripe Webhook] Booking ${bookingId} cancelled due to payment failure`);
        } else if (event.type === 'checkout.session.expired') {
            const session = event.data.object as Stripe.Checkout.Session;
            const bookingId = session.metadata?.bookingId;

            if (!bookingId) {
                console.error('[Stripe Webhook] Missing bookingId in metadata for session.expired');
                return NextResponse.json({ success: false, error: 'Missing bookingId' }, { status: 200 });
            }

            await prisma.$transaction(async (tx) => {
                // Similarly mark booking cancelled if the session expired
                await tx.booking.updateMany({
                    where: { id: bookingId, status: 'PENDING' },
                    data: { status: 'CANCELLED' }
                });

                await tx.payment.updateMany({
                    where: { bookingId },
                    data: { status: 'FAILED' }
                });
            });
            console.log(`[Stripe Webhook] Booking ${bookingId} cancelled due to session timeout`);
        }

        return NextResponse.json({ success: true, data: { received: true } })
    } catch (err) {
        console.error('[Stripe Webhook] Error:', err)
        return NextResponse.json(
            { success: false, error: err instanceof Error ? err.message : 'Unknown error' },
            { status: 500 }
        )
    }
}
