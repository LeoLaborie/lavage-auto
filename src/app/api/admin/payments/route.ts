import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAdminGuard } from '@/lib/auth/adminGuard'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { User } from '@prisma/client'

export const dynamic = 'force-dynamic'

export const GET = withAdminGuard(async (req: Request, _authUser: SupabaseUser, _dbUser: User) => {
    const url = new URL(req.url)
    const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1') || 1)
    const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') ?? '20') || 20))
    const skip = (page - 1) * pageSize

    const [payments, total] = await Promise.all([
        prisma.payment.findMany({
            skip,
            take: pageSize,
            orderBy: { createdAt: 'desc' },
            include: { user: true },
        }),
        prisma.payment.count(),
    ])

    const items = payments.map((p) => ({
        id: p.id,
        bookingId: p.bookingId,
        userEmail: p.user.email,
        amountEur: p.amountCents / 100,
        status: p.status,
        stripeSessionId: p.stripeSessionId ?? null,
        stripePaymentIntentId: p.stripePaymentIntentId ?? null,
        refundAmountCents: p.refundAmountCents ?? null,
        paidOutAt: p.paidOutAt ? p.paidOutAt.toISOString() : null,
        createdAt: p.createdAt.toISOString(),
    }))

    return NextResponse.json({ success: true, data: { items, total, page, pageSize } })
})
