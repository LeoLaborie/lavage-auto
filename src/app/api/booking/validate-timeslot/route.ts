import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { date, time } = await request.json()

    if (!date || !time) {
      return NextResponse.json(
        { error: 'Date and time are required' },
        { status: 400 }
      )
    }

    // Convert date and time to a DateTime object
    const dateTime = new Date(`${date}T${time}:00`)

    // Check if the date is in the past
    const now = new Date()
    if (dateTime < now) {
      return NextResponse.json(
        { error: 'Cannot book a time slot in the past' },
        { status: 400 }
      )
    }

    // Check if it's within business hours (8h-18h30)
    const hour = dateTime.getHours()
    const minutes = dateTime.getMinutes()
    const timeInMinutes = hour * 60 + minutes

    if (timeInMinutes < 8 * 60 || timeInMinutes > 18.5 * 60) {
      return NextResponse.json(
        { error: 'Outside of business hours (8h-18h30)' },
        { status: 400 }
      )
    }

    // For same-day bookings, require at least 30 minutes notice
    if (
      dateTime.toDateString() === now.toDateString() &&
      timeInMinutes <= now.getHours() * 60 + now.getMinutes() + 30
    ) {
      return NextResponse.json(
        { error: 'Same-day bookings require at least 30 minutes notice' },
        { status: 400 }
      )
    }

    // Get existing bookings for the selected date and time
    const existingBookings = await prisma.booking.findMany({
      where: {
        scheduledDate: dateTime,
        status: {
          notIn: ['CANCELLED', 'COMPLETED']
        }
      }
    })

    // Maximum concurrent bookings allowed
    const MAX_CONCURRENT_BOOKINGS = 3

    if (existingBookings.length >= MAX_CONCURRENT_BOOKINGS) {
      return NextResponse.json(
        { error: 'This time slot is no longer available' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { available: true }
    )

  } catch (error) {
    console.error('Error validating time slot:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}