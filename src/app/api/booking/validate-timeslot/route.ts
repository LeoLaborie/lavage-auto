import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const VALID_TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
]

/**
 * POST /api/booking/validate-timeslot
 * Validates that a requested date + time is valid and not conflicting.
 *
 * Story 2.3 — Task 2
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, time } = body

    if (!date || !time) {
      return NextResponse.json(
        { success: false, error: 'La date et le créneau horaire sont requis.' },
        { status: 400 }
      )
    }

    // Validate time slot format
    if (!VALID_TIME_SLOTS.includes(time)) {
      return NextResponse.json(
        { success: false, error: 'Créneau horaire invalide.' },
        { status: 400 }
      )
    }

    // Validate date format
    const selectedDate = new Date(date)
    if (isNaN(selectedDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Format de date invalide.' },
        { status: 400 }
      )
    }

    // Build full datetime
    const scheduledAt = new Date(`${date}T${time}:00`)

    // Reject past datetimes
    if (scheduledAt <= new Date()) {
      return NextResponse.json(
        { success: false, error: 'Veuillez sélectionner une date et un créneau dans le futur.' },
        { status: 400 }
      )
    }

    // Check for conflicting bookings at same date+time (basic MVP check)
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        scheduledDate: scheduledAt,
        status: {
          in: ['PENDING', 'CONFIRMED', 'ACCEPTED'],
        },
      },
    })

    if (conflictingBooking) {
      return NextResponse.json(
        { success: false, error: 'Ce créneau n\'est plus disponible. Veuillez en choisir un autre.' },
        { status: 409 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        scheduledAt: scheduledAt.toISOString(),
        date,
        time
      }
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la validation du créneau.' },
      { status: 500 }
    )
  }
}