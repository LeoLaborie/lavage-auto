import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { withAdminGuard } from '@/lib/auth/adminGuard'
import { prisma } from '@/lib/prisma'
import { DEFAULT_COMMISSION_RATE } from '@/lib/constants/commission'

export const GET = withAdminGuard(async () => {
    const settings = await prisma.platformSettings.findFirst()
    if (!settings) {
        const created = await prisma.platformSettings.create({
            data: { commissionRate: DEFAULT_COMMISSION_RATE },
        })
        return NextResponse.json({
            success: true,
            data: { commissionRate: created.commissionRate.toNumber(), updatedAt: created.updatedAt.toISOString() },
        })
    }
    return NextResponse.json({
        success: true,
        data: { commissionRate: settings.commissionRate.toNumber(), updatedAt: settings.updatedAt.toISOString() },
    })
})

export const PATCH = withAdminGuard(async (req, _authUser, dbUser) => {
    let body: unknown
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ success: false, error: 'Corps JSON invalide' }, { status: 400 })
    }

    const rate = (body as any)?.rate
    if (typeof rate !== 'number' || !Number.isFinite(rate) || rate < 0 || rate > 1) {
        return NextResponse.json(
            { success: false, error: 'rate doit être un nombre entre 0 et 1 (ex: 0.15 pour 15%)' },
            { status: 400 }
        )
    }

    const rateDecimal = new Prisma.Decimal(rate.toFixed(4))

    const existing = await prisma.platformSettings.findFirst()
    const updated = existing
        ? await prisma.platformSettings.update({
            where: { id: existing.id },
            data: { commissionRate: rateDecimal, updatedByUserId: dbUser.id },
        })
        : await prisma.platformSettings.create({
            data: { commissionRate: rateDecimal, updatedByUserId: dbUser.id },
        })

    return NextResponse.json({
        success: true,
        data: { commissionRate: updated.commissionRate.toNumber(), updatedAt: updated.updatedAt.toISOString() },
    })
})
