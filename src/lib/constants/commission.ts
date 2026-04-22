import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export const DEFAULT_COMMISSION_RATE = new Prisma.Decimal('0.1500')

/**
 * Reads the current platform commission rate from DB.
 * Seeds the singleton row on first read if missing (idempotent).
 */
export async function getCurrentCommissionRate(): Promise<Prisma.Decimal> {
    const existing = await prisma.platformSettings.findFirst()
    if (existing) return existing.commissionRate

    const created = await prisma.platformSettings.create({
        data: { commissionRate: DEFAULT_COMMISSION_RATE },
    })
    return created.commissionRate
}

export interface CommissionBreakdown {
    commissionCents: number
    netAmountCents: number
    rateUsed: Prisma.Decimal
}

/**
 * Splits a gross amount into platform commission + laveur net.
 * Commission is rounded to the nearest cent; net absorbs the rounding residual
 * so that net + commission === gross for every input.
 */
export function computeCommission(
    amountCents: number,
    rate: Prisma.Decimal
): CommissionBreakdown {
    if (amountCents < 0) throw new Error('amountCents must be non-negative')
    const rateNum = rate.toNumber()
    if (rateNum < 0 || rateNum > 1) {
        throw new Error(`commission rate must be in [0,1], got ${rateNum}`)
    }
    const commissionCents = Math.round(amountCents * rateNum)
    return {
        commissionCents,
        netAmountCents: amountCents - commissionCents,
        rateUsed: rate,
    }
}
