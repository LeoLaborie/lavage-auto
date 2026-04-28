import { NextResponse } from 'next/server'
import { withAdminGuard } from '@/lib/auth/adminGuard'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/payouts/failures
 *
 * Returns one row per booking whose latest PayoutAttempt has success=false.
 * Used to surface silent payout breakdowns (issue #24, cause B).
 */
export const GET = withAdminGuard(async () => {
    const recentAttempts = await prisma.payoutAttempt.findMany({
        orderBy: [{ bookingId: 'asc' }, { attemptedAt: 'desc' }],
        include: {
            booking: {
                select: {
                    status: true,
                    payment: { select: { paidOutAt: true } },
                },
            },
        },
    })

    type Aggregated = {
        bookingId: string
        lastAttemptAt: Date
        errorCode: string | null
        errorMessage: string | null
        attemptCount: number
        bookingStatus: string
        paidOut: boolean
        latestSuccess: boolean
    }

    const byBooking = new Map<string, Aggregated>()
    for (const attempt of recentAttempts) {
        const existing = byBooking.get(attempt.bookingId)
        if (!existing) {
            byBooking.set(attempt.bookingId, {
                bookingId: attempt.bookingId,
                lastAttemptAt: attempt.attemptedAt,
                errorCode: attempt.errorCode,
                errorMessage: attempt.errorMessage,
                attemptCount: 1,
                bookingStatus: attempt.booking.status,
                paidOut: attempt.booking.payment?.paidOutAt != null,
                latestSuccess: attempt.success,
            })
        } else {
            existing.attemptCount += 1
        }
    }

    const failures = Array.from(byBooking.values())
        .filter((row) => !row.latestSuccess)
        .map(({ latestSuccess: _ls, ...rest }) => rest)
        .sort((a, b) => b.lastAttemptAt.getTime() - a.lastAttemptAt.getTime())

    return NextResponse.json({ success: true, failures })
})
