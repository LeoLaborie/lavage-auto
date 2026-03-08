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

    const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
            skip,
            take: pageSize,
            orderBy: { scheduledDate: 'desc' },
            include: {
                client: true,
                laveur: true,
                payment: true,
            },
        }),
        prisma.booking.count(),
    ])

    const items = bookings.map((b) => ({
        id: b.id,
        clientEmail: b.client.email,
        laveurEmail: b.laveur?.email ?? null,
        serviceName: b.serviceName,
        amountEur: b.amountCents / 100,
        status: b.status,
        scheduledDate: b.scheduledDate.toISOString(),
        beforePhotoUrl: b.beforePhotoUrl ?? null,
        afterPhotoUrl: b.afterPhotoUrl ?? null,
        paymentStatus: b.payment?.status ?? null,
    }))

    return NextResponse.json({ success: true, data: { items, total, page, pageSize } })
})
