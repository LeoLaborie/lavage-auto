import { NextRequest, NextResponse } from 'next/server'
import { withClientGuard } from '@/lib/auth/clientGuard'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/booking/booked-slots?date=YYYY-MM-DD
 * Returns the list of time slots already booked by the current client for a given date.
 */
export const GET = withClientGuard(async (req: Request, _user: any, dbUser: any) => {
  try {
    const { searchParams } = new URL((req as NextRequest).url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json(
        { success: false, error: 'Le paramètre date est requis.' },
        { status: 400 }
      )
    }

    const parsedDate = new Date(date)
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Format de date invalide.' },
        { status: 400 }
      )
    }

    // Find all active bookings for this client on the given date
    const startOfDay = new Date(`${date}T00:00:00`)
    const endOfDay = new Date(`${date}T23:59:59`)

    // Ignore stale PENDING bookings (no payment after 30 min)
    const pendingCutoff = new Date(Date.now() - 30 * 60 * 1000)

    const bookings = await prisma.booking.findMany({
      where: {
        clientId: dbUser.id,
        scheduledDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { in: ['PENDING', 'CONFIRMED', 'ACCEPTED'] },
        NOT: {
          status: 'PENDING',
          createdAt: { lt: pendingCutoff },
        },
      },
      select: {
        scheduledDate: true,
      },
    })

    // Extract time slots (HH:MM) from scheduled dates
    const bookedSlots = bookings.map((b) => {
      const d = new Date(b.scheduledDate)
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    })

    return NextResponse.json({ success: true, data: bookedSlots })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des créneaux.' },
      { status: 500 }
    )
  }
})
