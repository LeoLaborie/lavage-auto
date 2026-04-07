import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { triggerPayout } from '@/lib/actions/payout'

/**
 * POST /api/booking/[id]/complete
 *
 * Marks a booking as COMPLETED and triggers the payout to the laveur.
 *
 * Used by the client post-mission validation flow (Story 5.2 — MissionValidationCard)
 * and by admins to manually complete bookings.
 *
 * Authorization: Only the CLIENT who owns the booking, or an ADMIN, may call this.
 */
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Non authentifié' },
                { status: 401 }
            )
        }

        const { id: bookingId } = await params

        if (!bookingId) {
            return NextResponse.json(
                { success: false, error: 'bookingId manquant' },
                { status: 400 }
            )
        }

        // Load the booking with the client to verify ownership
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                client: true,
            },
        })

        if (!booking) {
            return NextResponse.json(
                { success: false, error: 'Réservation introuvable' },
                { status: 404 }
            )
        }

        // Authorization: must be the booking's client or an ADMIN
        const dbUser = await prisma.user.findUnique({
            where: { authId: user.id },
        })

        if (!dbUser) {
            return NextResponse.json(
                { success: false, error: 'Utilisateur introuvable' },
                { status: 404 }
            )
        }

        const isOwner = booking.client.authId === user.id
        const isAdmin = dbUser.role === 'ADMIN'

        if (!isOwner && !isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Accès refusé' },
                { status: 403 }
            )
        }

        // Guard: booking must be in IN_PROGRESS to be completed
        if (booking.status !== 'IN_PROGRESS') {
            return NextResponse.json(
                {
                    success: false,
                    error: `Impossible de compléter : statut actuel ${booking.status}. Statut attendu : IN_PROGRESS.`,
                },
                { status: 409 }
            )
        }

        // Mark booking as COMPLETED
        await prisma.booking.update({
            where: { id: bookingId },
            data: {
                status: 'COMPLETED',
                completedAt: new Date(),
                validatedAt: new Date(),
            },
        })

        // Trigger payout (non-blocking: failure does not roll back the COMPLETED status)
        const payoutResult = await triggerPayout(bookingId)

        if (!payoutResult.success) {
            // Log but do not fail the request — the booking is still COMPLETED
            // Payout can be retried manually via admin tools
            console.warn(
                `[complete] Booking ${bookingId} completed but payout deferred: ${payoutResult.error}`
            )
        }

        return NextResponse.json({
            success: true,
            data: {
                bookingId,
                status: 'COMPLETED',
                payout: payoutResult.success
                    ? { triggered: true, ...payoutResult.data }
                    : { triggered: false, reason: payoutResult.error },
            },
        })
    } catch (error: any) {
        console.error('[complete] Error:', error)
        return NextResponse.json(
            { success: false, error: error.message || 'Erreur interne du serveur' },
            { status: 500 }
        )
    }
}
