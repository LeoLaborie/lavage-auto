import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';
import { Prisma } from '@prisma/client';

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get('Stripe-Signature') as string;

    let event: Stripe.Event;

    try {
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            throw new Error('STRIPE_WEBHOOK_SECRET is missing');
        }
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error: any) {
        console.error('Webhook signature verification failed.', error.message);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    if (event.type === 'checkout.session.completed') {
        const bookingId = session.metadata?.bookingId;

        if (!bookingId) {
            return new NextResponse('Booking ID is missing in metadata', { status: 400 });
        }

        try {
            // 1. Verify booking exists and update status
            const booking = await prisma.booking.findUnique({
                where: { id: bookingId },
                include: { payment: true },
            });

            if (!booking) {
                return new NextResponse('Booking not found', { status: 404 });
            }

            // Idempotency check: If already paid/confirmed, just return 200
            if (booking.status === 'CONFIRMED' || booking.status === 'PAID' as any) { // 'PAID' might not be in enum, checking CONFIRMED
                return new NextResponse('Booking already confirmed', { status: 200 });
            }

            // Update booking status
            await prisma.booking.update({
                where: { id: bookingId },
                data: {
                    status: 'CONFIRMED',
                },
            });

            // 2. Create Payment Record
            await prisma.payment.create({
                data: {
                    bookingId: booking.id,
                    amount: new Prisma.Decimal(session.amount_total ? session.amount_total / 100 : 0),
                    currency: session.currency || 'eur',
                    status: 'COMPLETED',
                    method: 'CREDIT_CARD', // Defaulting to Credit Card for Stripe Checkout
                    stripePaymentId: session.payment_intent as string || session.id,
                    processedAt: new Date(),
                },
            });

        } catch (error) {
            console.error('Error updating booking/payment:', error);
            return new NextResponse('Internal Server Error', { status: 500 });
        }
    }

    return new NextResponse(null, { status: 200 });
}

