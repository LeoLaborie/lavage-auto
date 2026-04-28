import { NextResponse } from 'next/server'
import { withWasherGuard } from '@/lib/auth/washerGuard'
import { prisma } from '@/lib/prisma'
import { services } from '@/lib/constants/services'
import { computeCommission, getCurrentCommissionRate } from '@/lib/constants/commission'
import { geocodeAddressesLimited } from '@/lib/geocoding'

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

    // Lazy backfill: persist coords for legacy bookings.
    // Bounded concurrency + try/catch keep the response resilient if BAN/Prisma fail.
    const needsBackfill = bookings.filter((b) => b.serviceLat == null || b.serviceLng == null)
    if (needsBackfill.length > 0) {
        try {
            const coordsMap = await geocodeAddressesLimited(needsBackfill, 5)
            if (coordsMap.size > 0) {
                await Promise.all(
                    Array.from(coordsMap, ([id, c]) =>
                        prisma.booking.update({
                            where: { id },
                            data: { serviceLat: c.lat, serviceLng: c.lng },
                        })
                    )
                )
                for (const b of bookings) {
                    const c = coordsMap.get(b.id)
                    if (c) {
                        b.serviceLat = c.lat
                        b.serviceLng = c.lng
                    }
                }
            }
        } catch (err) {
            console.error('[available] Backfill failed, serving without coords:', err)
        }
    }

    const mapped = bookings.map((booking) => {
        const clientProfile = booking.client?.profile
        const { netAmountCents, commissionCents } = computeCommission(booking.amountCents, currentRate)
        return {
            id: booking.id,
            scheduledDate: booking.scheduledDate.toISOString(),
            serviceAddress: booking.serviceAddress,
            serviceLat: booking.serviceLat ?? null,
            serviceLng: booking.serviceLng ?? null,
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
