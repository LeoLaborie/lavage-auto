import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
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

        const body = await request.json()
        const { make, model, vehicleType, licensePlate, color, year } = body

        if (!make || !model) {
            return NextResponse.json(
                { error: 'Make and model are required' },
                { status: 400 }
            )
        }

        // Create car
        const car = await prisma.car.create({
            data: {
                customerId: customer.id,
                make,
                model,
                vehicleType,
                licensePlate,
                color,
                year: year ? parseInt(year) : undefined
            }
        })

        return NextResponse.json({ car })

    } catch (error) {
        console.error('Error adding customer car:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
