import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/booking/cancel
 * Handles redirection from Stripe cancel_url.
 * Deletes the PENDING booking to keep the DB clean if the user abandons payment.
 *
 * SECURITY: Verifies that the authenticated user owns the booking before deletion.
 */
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams
    const bookingId = searchParams.get('bookingId')

    if (!bookingId) {
        return NextResponse.redirect(new URL('/reserver', req.url))
    }

    try {
        // --- Auth: verify the user owns this booking ---
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            // Unauthenticated — redirect to login, cannot clean up
            return NextResponse.redirect(new URL('/login', req.url))
        }

        // Fetch the booking and verify ownership
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
            select: {
                status: true,
                client: {
                    select: { authId: true }
                }
            }
        })

        if (!booking) {
            // Booking doesn't exist — already cleaned up or invalid ID
            return NextResponse.redirect(new URL('/reserver?cancelled=true', req.url))
        }

        // Ownership check: only the booking's client can cancel
        if (booking.client.authId !== user.id) {
            console.warn(`[Booking Cancel] Unauthorized attempt: user ${user.id} tried to cancel booking ${bookingId}`)
            return NextResponse.redirect(new URL('/dashboard', req.url))
        }

        // Delete the booking ONLY if it is still in PENDING status
        if (booking.status === 'PENDING') {
            await prisma.booking.delete({
                where: { id: bookingId }
            })
            console.log(`[Booking Cancel] Deleted abandoned PENDING booking: ${bookingId}`)
        }

        return NextResponse.redirect(new URL('/reserver?cancelled=true', req.url))
    } catch (error) {
        console.error('[Booking Cancel] Error during cleanup:', error)
        return NextResponse.redirect(new URL('/reserver', req.url))
    }
}
