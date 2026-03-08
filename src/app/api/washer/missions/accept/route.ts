import { NextResponse } from 'next/server'
import { withWasherGuard } from '@/lib/auth/washerGuard'
import { prisma } from '@/lib/prisma'

export const POST = withWasherGuard(async (req, user, profile) => {
    try {
        const { bookingId } = await req.json()

        if (!bookingId || typeof bookingId !== 'string') {
            return NextResponse.json(
                { success: false, error: 'bookingId est requis et doit être une chaîne' },
                { status: 400 }
            )
        }

        // Basic CUID/ID format check to prevent unnecessary DB hits
        if (bookingId.length < 20) {
            return NextResponse.json(
                { success: false, error: 'Format de bookingId invalide' },
                { status: 400 }
            )
        }

        // Use updateMany for atomic conditional update: 
        // will only update if laveurId is still null and status is PENDING or CONFIRMED
        // This prevents double-booking in case of concurrent requests.
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
            // Check if booking exists at all to differentiate between "not found" and "already taken"
            const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
            if (!booking) {
                return NextResponse.json(
                    { success: false, error: 'Mission introuvable' },
                    { status: 404 }
                )
            }

            return NextResponse.json(
                { success: false, error: "Cette mission a déjà été acceptée ou n'est plus disponible." },
                { status: 409 }
            )
        }

        return NextResponse.json({
            success: true,
            data: { bookingId }
        })
    } catch (error) {
        console.error('Error accepting mission:', error)
        return NextResponse.json(
            { success: false, error: 'Une erreur est survenue lors de l\'acceptation de la mission' },
            { status: 500 }
        )
    }
})
