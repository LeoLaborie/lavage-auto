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

    // Get cars
    const cars = await prisma.car.findMany({
      where: {
        customerId: customer.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ cars })

  } catch (error) {
    console.error('Error fetching customer cars:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}