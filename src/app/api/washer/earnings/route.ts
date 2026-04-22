import { NextResponse } from 'next/server'
import { withWasherGuard } from '@/lib/auth/washerGuard'
import { prisma } from '@/lib/prisma'
import { computeCommission, getCurrentCommissionRate } from '@/lib/constants/commission'

/**
 * GET /api/washer/earnings
 *
 * Returns an earnings summary for the authenticated laveur, expressed in NET euros
 * (= what the laveur actually receives after platform commission).
 *
 * - validatedEarningsCents   : net of payments already transferred (paidOutAt set)
 * - pendingEarningsCents     : net of payments awaiting payout (booking COMPLETED, paidOutAt null)
 * - upcomingEarningsCents    : projected net on accepted-but-not-completed missions (uses current rate)
 * - completedMissionsCount   : count of COMPLETED bookings assigned to this laveur
 * - totalCommissionCents     : total commission kept by the platform on this laveur's past transfers
 * - currentCommissionRate    : current platform rate (0..1)
 *
 * Nullable commission columns in Payment are treated as "legacy" (laveur received 100%).
 * COALESCE(net_amount_cents, amount_cents) models this at the application layer by running
 * two aggregates in parallel (one per branch) and summing.
 */
export const GET = withWasherGuard(async (_req, user, _profile) => {
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

    // Refund handling: PARTIALLY_REFUNDED rows are still counted, but we subtract refundAmountCents.
    const activePaymentStatuses = ['SUCCEEDED', 'PARTIALLY_REFUNDED'] as const

    // Validated = transferred. Query in two parts to handle nullable netAmountCents.
    const validatedSnapshotP = prisma.payment.aggregate({
        where: {
            booking: { laveurId },
            status: { in: activePaymentStatuses as any },
            paidOutAt: { not: null },
            netAmountCents: { not: null },
        },
        _sum: { netAmountCents: true, refundAmountCents: true },
    })
    const validatedLegacyP = prisma.payment.aggregate({
        where: {
            booking: { laveurId },
            status: { in: activePaymentStatuses as any },
            paidOutAt: { not: null },
            netAmountCents: null,
        },
        _sum: { amountCents: true, refundAmountCents: true },
    })

    // Pending = completed booking, payout deferred.
    const pendingSnapshotP = prisma.payment.aggregate({
        where: {
            booking: { laveurId, status: 'COMPLETED' },
            status: { in: activePaymentStatuses as any },
            paidOutAt: null,
            netAmountCents: { not: null },
        },
        _sum: { netAmountCents: true, refundAmountCents: true },
    })
    const pendingLegacyP = prisma.payment.aggregate({
        where: {
            booking: { laveurId, status: 'COMPLETED' },
            status: { in: activePaymentStatuses as any },
            paidOutAt: null,
            netAmountCents: null,
        },
        _sum: { amountCents: true, refundAmountCents: true },
    })

    // Upcoming = booking ACCEPTED/EN_ROUTE/IN_PROGRESS, payment SUCCEEDED.
    // No snapshot exists yet — we aggregate gross and apply the current rate below.
    const upcomingP = prisma.payment.aggregate({
        where: {
            booking: { laveurId, status: { in: ['ACCEPTED', 'EN_ROUTE', 'IN_PROGRESS'] } },
            status: 'SUCCEEDED',
        },
        _sum: { amountCents: true },
    })

    const completedCountP = prisma.booking.count({
        where: { laveurId, status: 'COMPLETED' },
    })

    const totalCommissionP = prisma.payment.aggregate({
        where: {
            booking: { laveurId },
            commissionCents: { not: null },
        },
        _sum: { commissionCents: true },
    })

    const currentRateP = getCurrentCommissionRate()

    const [
        validatedSnapshot,
        validatedLegacy,
        pendingSnapshot,
        pendingLegacy,
        upcoming,
        completedCount,
        totalCommission,
        currentRate,
    ] = await Promise.all([
        validatedSnapshotP,
        validatedLegacyP,
        pendingSnapshotP,
        pendingLegacyP,
        upcomingP,
        completedCountP,
        totalCommissionP,
        currentRateP,
    ])

    const validatedEarningsCents =
        (validatedSnapshot._sum.netAmountCents ?? 0) +
        (validatedLegacy._sum.amountCents ?? 0) -
        (validatedSnapshot._sum.refundAmountCents ?? 0) -
        (validatedLegacy._sum.refundAmountCents ?? 0)

    const pendingEarningsCents =
        (pendingSnapshot._sum.netAmountCents ?? 0) +
        (pendingLegacy._sum.amountCents ?? 0) -
        (pendingSnapshot._sum.refundAmountCents ?? 0) -
        (pendingLegacy._sum.refundAmountCents ?? 0)

    const upcomingGross = upcoming._sum.amountCents ?? 0
    const { netAmountCents: upcomingEarningsCents } = computeCommission(upcomingGross, currentRate)

    return NextResponse.json({
        success: true,
        data: {
            validatedEarningsCents: Math.max(0, validatedEarningsCents),
            pendingEarningsCents: Math.max(0, pendingEarningsCents),
            upcomingEarningsCents,
            completedMissionsCount: completedCount,
            totalCommissionCents: totalCommission._sum.commissionCents ?? 0,
            currentCommissionRate: currentRate.toNumber(),
        },
    })
})
