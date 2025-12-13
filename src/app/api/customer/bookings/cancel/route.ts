import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    try {
        // 1. Authentication Check
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // 2. Get Customer Profile
        const customer = await prisma.customer.findUnique({
            where: { email: user.email! }
        })

        if (!customer) {
            return NextResponse.json(
                { error: 'Customer profile not found' },
                { status: 404 }
            )
        }

        const body = await request.json()
        const { bookingId } = body

        if (!bookingId) {
            return NextResponse.json(
                { error: 'Booking ID is required' },
                { status: 400 }
            )
        }

        // 3. Find Booking
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId }
        })

        if (!booking) {
            return NextResponse.json(
                { error: 'Booking not found' },
                { status: 404 }
            )
        }

        // 4. Verify Ownership
        if (booking.customerId !== customer.id) {
            return NextResponse.json(
                { error: 'Unauthorized access to this booking' },
                { status: 403 }
            )
        }

        // 5. Verify Status and Date
        if (['CANCELLED', 'COMPLETED'].includes(booking.status)) {
            return NextResponse.json(
                { error: 'Cannot cancel a completed or already cancelled booking' },
                { status: 400 }
            )
        }

        // Check if booking is in the past (optional, but requested "lavages futures")
        // We allow cancelling if it's not completed, but maybe we should restrict strictly to future?
        // Let's stick to the requirement "lavages futures".
        if (new Date(booking.scheduledDate) < new Date()) {
            return NextResponse.json(
                { error: 'Cannot cancel a past booking' },
                { status: 400 }
            )
        }

        // 6. Cancel Booking
        await prisma.booking.update({
            where: { id: bookingId },
            data: { status: 'CANCELLED' }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Error cancelling booking:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
