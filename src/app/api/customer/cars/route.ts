import { NextResponse } from 'next/server'
import { withClientGuard } from '@/lib/auth/clientGuard'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/customer/cars
 * Returns the list of vehicles registered by the authenticated client.
 * Protected: requires authenticated CLIENT user.
 *
 * Story 6.3 — Sélection du Véhicule lors de la Réservation
 */
export const GET = withClientGuard(async (_req, _authUser, dbUser) => {
  const cars = await prisma.car.findMany({
    where: { userId: dbUser.id },
    select: {
      id: true,
      make: true,
      model: true,
      plate: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    success: true,
    data: { cars },
  })
})
