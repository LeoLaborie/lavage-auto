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

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            skip,
            take: pageSize,
            orderBy: { createdAt: 'desc' },
            include: { profile: true },
        }),
        prisma.user.count(),
    ])

    const items = users.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt.toISOString(),
        profile: u.profile
            ? {
                status: u.profile.status,
                firstName: u.profile.firstName,
                lastName: u.profile.lastName,
                siret: u.profile.siret,
                companyName: u.profile.companyName,
            }
            : null,
    }))

    return NextResponse.json({ success: true, data: { items, total, page, pageSize } })
})
