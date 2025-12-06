import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

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

        // Get accepted bookings via BookingAssignment
        const assignments = await prisma.bookingAssignment.findMany({
            where: {
                washerId: washer.id,
                booking: {
                    status: {
                        notIn: ['CANCELLED', 'COMPLETED'] // Only active missions
                    }
                }
            },
            include: {
                booking: {
                    include: {
                        service: true,
                        car: true,
                        customer: {
                            select: {
                                name: true,
                                address: true,
                                phone: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                booking: {
                    scheduledDate: 'asc'
                }
            }
        })

        // Flatten structure for easier frontend consumption
        const bookings = assignments.map(a => a.booking)

        return NextResponse.json({ bookings })

    } catch (error) {
        console.error('Error fetching accepted missions:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
