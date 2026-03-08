import { NextResponse } from 'next/server'
import { withWasherGuard } from '@/lib/auth/washerGuard'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/washer/earnings
 *
 * Returns an earnings summary for the authenticated laveur:
 * - validatedEarningsCents: sum of payments already transferred (paidOutAt is set)
 * - pendingEarningsCents: sum of payments succeeded but not yet transferred (paidOutAt is null)
 * - completedMissionsCount: count of COMPLETED bookings assigned to this laveur
 *
 * Authorization: LAVEUR role with VALIDATED profile (via withWasherGuard)
 */
export const GET = withWasherGuard(async (_req, user, _profile) => {
    // withWasherGuard passes the Supabase Auth user object.
    // We need the internal DB user ID (cuid) to query bookings/payments by laveurId.
    const dbUser = await prisma.user.findUnique({
        where: { authId: user.id },
        select: { id: true },
    })

    if (!dbUser) {
        return NextResponse.json(
            { success: false, error: 'Utilisateur introuvable' },
            { status: 404 }
        )
    }

    const laveurId = dbUser.id

    // Run all three aggregation queries in parallel for performance
    const [validatedResult, pendingResult, completedCount] = await Promise.all([
        // Gains validés : payments with paidOutAt set (already transferred to laveur)
        prisma.payment.aggregate({
            where: {
                booking: { laveurId },
                status: 'SUCCEEDED',
                paidOutAt: { not: null },
            },
            _sum: { amountCents: true },
        }),

        // En attente de versement : payments succeeded but payout not yet triggered
        prisma.payment.aggregate({
            where: {
                booking: { laveurId },
                status: 'SUCCEEDED',
                paidOutAt: null,
            },
            _sum: { amountCents: true },
        }),

        // Nombre de missions complétées
        prisma.booking.count({
            where: {
                laveurId,
                status: 'COMPLETED',
            },
        }),
    ])

    return NextResponse.json({
        success: true,
        data: {
            validatedEarningsCents: validatedResult._sum.amountCents ?? 0,
            pendingEarningsCents: pendingResult._sum.amountCents ?? 0,
            completedMissionsCount: completedCount,
        },
    })
})
