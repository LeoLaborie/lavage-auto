import { NextRequest, NextResponse } from 'next/server'
import { withClientGuard } from '@/lib/auth/clientGuard'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/customer/profile
 * Returns the authenticated client's profile (phone, firstName, lastName).
 * Protected: requires authenticated CLIENT user.
 */
export const GET = withClientGuard(async (_req, _authUser, dbUser) => {
  const profile = await prisma.profile.findUnique({
    where: { userId: dbUser.id },
    select: {
      firstName: true,
      lastName: true,
      phone: true,
    },
  })

  return NextResponse.json({
    success: true,
    data: { profile },
  })
})

/**
 * PATCH /api/customer/profile
 * Updates the authenticated client's profile fields (phone, firstName, lastName).
 * Creates the profile if it doesn't exist yet.
 * Protected: requires authenticated CLIENT user.
 */
export const PATCH = withClientGuard(async (req, _authUser, dbUser) => {
  const body = await (req as NextRequest).json()
  const { phone, firstName, lastName } = body

  const profile = await prisma.profile.upsert({
    where: { userId: dbUser.id },
    update: {
      ...(phone !== undefined && { phone }),
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
    },
    create: {
      userId: dbUser.id,
      phone: phone || null,
      firstName: firstName || null,
      lastName: lastName || null,
      status: 'VALIDATED',
    },
    select: {
      firstName: true,
      lastName: true,
      phone: true,
    },
  })

  return NextResponse.json({
    success: true,
    data: { profile },
  })
})
