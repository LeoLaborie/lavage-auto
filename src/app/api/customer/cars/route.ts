import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customer = await prisma.customer.findUnique({
      where: { supabaseUserId: user.id },
      include: {
        cars: true
      }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    return NextResponse.json({ cars: customer.cars })
  } catch (error) {
    console.error('Error fetching cars:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customer = await prisma.customer.findUnique({
      where: { supabaseUserId: user.id }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const body = await request.json()
    const { make, model, year, color, licensePlate, vehicleType, isElectric } = body

    if (!make || !model) {
      return NextResponse.json({ error: 'Make and model are required' }, { status: 400 })
    }

    const car = await prisma.car.create({
      data: {
        customerId: customer.id,
        make,
        model,
        year: year ? parseInt(year) : null,
        color,
        licensePlate,
        vehicleType: vehicleType || null,
        isElectric: isElectric || false,
      }
    })

    return NextResponse.json({ car })
  } catch (error) {
    console.error('Error creating car:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}