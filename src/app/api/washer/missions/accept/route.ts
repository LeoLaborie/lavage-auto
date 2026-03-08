import { NextResponse } from 'next/server'
import { withWasherGuard } from '@/lib/auth/washerGuard'
import { prisma } from '@/lib/prisma'

export const POST = withWasherGuard(async (req, user, profile) => {
    try {
        const { bookingId } = await req.json()

        if (!bookingId || typeof bookingId !== 'string') {
            return NextResponse.json(
                { success: false, error: 'bookingId est requis' },
                { status: 400 }
            )
        }

        // Use updateMany for atomic conditional update: 
        // will only update if laveurId is still null and status is PENDING or CONFIRMED.
        // This ensures atomicity and prevents race conditions.
        const result = await prisma.booking.updateMany({
            where: {
                id: bookingId,
                laveurId: null,
                status: { in: ['PENDING', 'CONFIRMED'] }
            },
            data: {
                laveurId: user.id, // Use authenticated user ID directly
                status: 'ACCEPTED'
            }
        })

        if (result.count === 0) {
            // Optimization: We return a generic conflict message. 
            // Differentiating between 404 and 409 requires an extra query which 
            // breaks the single-operation atomicity benefit and adds overhead.
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
