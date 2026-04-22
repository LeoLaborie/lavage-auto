import { NextResponse } from 'next/server'
import { withWasherGuard } from '@/lib/auth/washerGuard'
import { prisma } from '@/lib/prisma'
import { chargeCustomer } from '@/lib/stripe'

export const POST = withWasherGuard(async (req, _user, profile) => {
    try {
        const { bookingId } = await req.json()

        if (!bookingId || typeof bookingId !== 'string') {
            return NextResponse.json(
                { success: false, error: 'bookingId est requis' },
                { status: 400 }
            )
        }

        // Pre-guard: block acceptance if the laveur's Stripe Connect account isn't fully onboarded.
        // Without this, we'd charge the client at accept time but fail to pay the laveur later.
        if (!profile.stripeAccountReady) {
            return NextResponse.json(
                { success: false, error: 'Votre compte Stripe n\'est pas encore activé. Terminez l\'onboarding avant d\'accepter des missions.' },
                { status: 403 }
            )
        }

        // 1. Atomic claim: only one washer can win
        const result = await prisma.booking.updateMany({
            where: {
                id: bookingId,
                laveurId: null,
                status: { in: ['PENDING', 'CONFIRMED'] }
            },
            data: {
                laveurId: profile.userId,
                status: 'ACCEPTED'
            }
        })

        if (result.count === 0) {
            return NextResponse.json(
                { success: false, error: "Cette mission a déjà été acceptée ou n'est plus disponible." },
                { status: 409 }
            )
        }

        // 2. Load booking with client profile to get stripeCustomerId
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                client: {
                    include: { profile: true }
                }
            }
        })

        if (!booking) {
            return NextResponse.json(
                { success: false, error: 'Réservation introuvable après acceptation' },
                { status: 500 }
            )
        }

        const stripeCustomerId = booking.client.profile?.stripeCustomerId
        if (!stripeCustomerId) {
            console.error(`[accept] Booking ${bookingId}: client has no stripeCustomerId — cancelling`)
            await prisma.booking.update({
                where: { id: bookingId },
                data: {
                    status: 'CANCELLED',
                    laveurId: null,
                    cancelledAt: new Date(),
                    cancellationReason: 'Client sans moyen de paiement enregistré',
                },
            })
            return NextResponse.json(
                { success: false, error: 'Le client n\'a pas de moyen de paiement enregistré. La mission a été annulée.' },
                { status: 422 }
            )
        }

        // 3. Charge the customer off-session
        try {
            const paymentIntent = await chargeCustomer(
                stripeCustomerId,
                booking.amountCents,
                bookingId,
                booking.serviceName
            )

            // 4. Create Payment record
            await prisma.payment.create({
                data: {
                    bookingId,
                    userId: booking.clientId,
                    amountCents: booking.amountCents,
                    currency: booking.currency,
                    status: 'SUCCEEDED',
                    stripePaymentIntentId: paymentIntent.id,
                    processedAt: new Date(),
                },
            })

            return NextResponse.json({
                success: true,
                data: { bookingId }
            })
        } catch (stripeError: any) {
            // 5. Payment failed — cancel the booking
            console.error(`[accept] Payment failed for booking ${bookingId}:`, stripeError.message)
            await prisma.booking.update({
                where: { id: bookingId },
                data: {
                    status: 'CANCELLED',
                    laveurId: null,
                    cancelledAt: new Date(),
                    cancellationReason: `Échec du paiement: ${stripeError.message}`,
                },
            })
            return NextResponse.json(
                { success: false, error: 'Le paiement du client a échoué. La mission a été annulée.' },
                { status: 422 }
            )
        }
    } catch (error) {
        console.error('Error accepting mission:', error)
        return NextResponse.json(
            { success: false, error: 'Une erreur est survenue lors de l\'acceptation de la mission' },
            { status: 500 }
        )
    }
})
