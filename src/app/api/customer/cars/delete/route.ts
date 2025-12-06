import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

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
        const { carId } = body

        if (!carId) {
            return NextResponse.json(
                { error: 'Car ID is required' },
                { status: 400 }
            )
        }

        // 3. Find Car
        const car = await prisma.car.findUnique({
            where: { id: carId }
        })

        if (!car) {
            return NextResponse.json(
                { error: 'Car not found' },
                { status: 404 }
            )
        }

        // 4. Verify Ownership
        if (car.customerId !== customer.id) {
            return NextResponse.json(
                { error: 'Unauthorized access to this car' },
                { status: 403 }
            )
        }

        // 5. Check for existing active or completed bookings
        // We allow deletion if there are only CANCELLED bookings (they will be deleted by cascade)
        const activeBookingCount = await prisma.booking.count({
            where: {
                carId: carId,
                status: {
                    not: 'CANCELLED'
                }
            }
        })

        if (activeBookingCount > 0) {
            return NextResponse.json(
                { error: 'Impossible de supprimer ce véhicule car il est lié à des réservations actives ou terminées.' },
                { status: 400 }
            )
        }

        // 6. Delete Car
        await prisma.car.delete({
            where: { id: carId }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Error deleting car:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
