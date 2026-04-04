import { NextRequest, NextResponse } from 'next/server'
import { withClientGuard } from '@/lib/auth/clientGuard'
import { prisma } from '@/lib/prisma'
import { TIME_SLOTS } from '@/lib/constants/services'

/**
 * POST /api/booking/validate-timeslot
 * Validates that a requested date + time is valid and not conflicting.
 * Protected: requires authenticated CLIENT user.
 *
 * Story 2.3 — Task 2
 */
export const POST = withClientGuard(async (req: Request) => {
  try {
    const body = await (req as NextRequest).json()
    const { date, time } = body

    if (!date || !time) {
      return NextResponse.json(
        { success: false, error: 'La date et le créneau horaire sont requis.' },
        { status: 400 }
      )
    }

    // Validate time slot format
    if (!TIME_SLOTS.includes(time)) {
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

    // Build full datetime from date + time.
    // The client sends date (YYYY-MM-DD) and time (HH:MM) in French local time (Europe/Paris).
    // Without a timezone suffix, `new Date()` interprets this as local time on the server.
    // This is consistent with how booking/submit and the frontend construct dates,
    // so conflict checks against existing bookings work correctly.
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
})