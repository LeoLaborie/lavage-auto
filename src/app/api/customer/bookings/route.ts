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

        // Get Customer profile
        const customer = await prisma.customer.findUnique({
            where: { email: user.email! }
        })

        if (!customer) {
            return NextResponse.json(
                { error: 'Customer profile not found' },
                { status: 404 }
            )
        }

        // Get bookings
        const bookings = await prisma.booking.findMany({
            where: {
                customerId: customer.id
            },
            include: {
                service: true,
                car: true,
                assignment: {
                    include: {
                        washer: {
                            select: {
                                name: true,
                                phone: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                scheduledDate: 'desc'
            }
        })

        return NextResponse.json({ bookings })

    } catch (error) {
        console.error('Error fetching customer bookings:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
