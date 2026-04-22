import { NextResponse } from 'next/server'
import { withWasherGuard } from '@/lib/auth/washerGuard'
import { prisma } from '@/lib/prisma'
import { services } from '@/lib/constants/services'
import { computeCommission, getCurrentCommissionRate } from '@/lib/constants/commission'

const durationMap = new Map<string, number>(
    services.map(s => [s.name, s.estimatedDuration ?? 60])
)

export const GET = withWasherGuard(async (req, user, profile) => {
    // Return early if washer is not available
    if (!profile.isAvailable) {
        return NextResponse.json({
            success: true,
            data: { bookings: [], currentCommissionRate: 0 },
        })
    }

    const [bookings, currentRate] = await Promise.all([
        prisma.booking.findMany({
            where: {
                status: { in: ['PENDING', 'CONFIRMED'] },
                laveurId: null,
                scheduledDate: { gte: new Date() }
            },
            orderBy: { scheduledDate: 'asc' },
            take: 50,
            include: {
                client: { include: { profile: true } },
                car: true
            }
        }),
        getCurrentCommissionRate(),
    ])

    const mapped = bookings.map((booking) => {
        const clientProfile = booking.client?.profile
        const { netAmountCents, commissionCents } = computeCommission(booking.amountCents, currentRate)
        return {
            id: booking.id,
            scheduledDate: booking.scheduledDate.toISOString(),
            serviceAddress: booking.serviceAddress,
            finalPrice: Number((booking.amountCents / 100).toFixed(2)),
            grossAmountCents: booking.amountCents,
            netAmountCents,
            commissionCents,
            service: {
                name: booking.serviceName,
                estimatedDuration: durationMap.get(booking.serviceName) ?? 60
            },
            car: {
                make: booking.car?.make ?? "—",
                model: booking.car?.model ?? "—"
            },
            customer: {
                name: `${clientProfile?.firstName ?? ''} ${clientProfile?.lastName ?? ''}`.trim() || "Client"
            }
        }
    })

    return NextResponse.json({
        success: true,
        data: { bookings: mapped, currentCommissionRate: currentRate.toNumber() },
    })
})
