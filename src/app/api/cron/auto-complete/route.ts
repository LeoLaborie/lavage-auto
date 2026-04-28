import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { triggerPayout } from '@/lib/actions/payout'

/**
 * POST /api/cron/auto-complete
 *
 * Called by Supabase pg_cron every hour. Two responsibilities:
 * 1. Auto-complete bookings that have been in AWAITING_REVIEW for > 24h.
 * 2. Auto-complete legacy bookings stuck in IN_PROGRESS for > 7 days
 *    AND have an afterPhotoUrl (proof of work).
 *
 * Auth: header `x-cron-secret` must match process.env.CRON_SECRET.
 */
export async function POST(req: Request) {
    if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const reviewCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const legacyCutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const candidates = await prisma.booking.findMany({
        where: {
            OR: [
                { status: 'AWAITING_REVIEW', awaitingReviewSince: { lt: reviewCutoff } },
                {
                    status: 'IN_PROGRESS',
                    startedAt: { lt: legacyCutoff },
                    afterPhotoUrl: { not: null },
                },
            ],
        },
        select: { id: true, status: true },
    })

    const errors: { bookingId: string; error: string }[] = []
    let succeeded = 0
    let failed = 0

    for (const candidate of candidates) {
        try {
            const result = await prisma.booking.updateMany({
                where: { id: candidate.id, status: candidate.status },
                data: {
                    status: 'COMPLETED',
                    completedAt: now,
                    validatedAt: now,
                },
            })

            if (result.count === 0) continue

            const payoutResult = await triggerPayout(candidate.id, { triggeredBy: 'cron' })
            if (payoutResult.success) {
                succeeded += 1
            } else {
                failed += 1
                errors.push({ bookingId: candidate.id, error: payoutResult.error || 'unknown payout error' })
            }
        } catch (err: any) {
            failed += 1
            errors.push({ bookingId: candidate.id, error: err?.message || 'exception during processing' })
        }
    }

    return NextResponse.json({
        success: true,
        processed: candidates.length,
        succeeded,
        failed,
        errors,
    })
}
