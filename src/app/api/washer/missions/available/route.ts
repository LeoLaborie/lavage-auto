import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Verify user is a washer
        const washer = await prisma.washer.findUnique({
            where: { email: user.email! }
        })

        if (!washer) {
            return NextResponse.json(
                { error: 'Access denied. Washer profile required.' },
                { status: 403 }
            )
        }

        // Get available bookings
        console.log('Fetching available bookings for washer:', washer.email)
        const bookings = await prisma.booking.findMany({
            where: {
                status: 'PENDING'
            },
            include: {
                service: true,
                car: true,
                customer: {
                    select: {
                        id: true, // Include ID to check if it's the washer's own booking
                        name: true,
                        address: true
                    }
                }
            },
            orderBy: {
                scheduledDate: 'asc'
            }
        })
        console.log(`Found ${bookings.length} pending bookings`)

        return NextResponse.json({ bookings })

    } catch (error) {
        console.error('Error fetching available missions:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
