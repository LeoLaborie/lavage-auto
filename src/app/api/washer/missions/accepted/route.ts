import { NextResponse } from 'next/server'
import { withWasherGuard } from '@/lib/auth/washerGuard'
import { prisma } from '@/lib/prisma'
import { services } from '@/lib/constants/services'
import { computeCommission, getCurrentCommissionRate } from '@/lib/constants/commission'
import { geocodeAddressesLimited } from '@/lib/geocoding'

// Static catalog — safe to cache at module level because services.ts is a hardcoded constant.
// If this ever moves to a DB source, move this Map inside the handler to avoid stale cache.
const durationMap = new Map<string, number>(
    services.map(s => [s.name, s.estimatedDuration ?? 60])
)

// GET /api/washer/missions/accepted
// Returns the authenticated laveur's active planning: missions they have accepted
// that are scheduled today or in the future, sorted chronologically.
export const GET = withWasherGuard(async (_req, _user, profile) => {
    // Filter from today 00:00:00 UTC — using UTC to be safe on Vercel (UTC servers).
    // setUTCHours avoids the local-timezone shift that would hide missions at the start
    // of the day for French users (UTC+1/+2).
    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)

    try {
        const [bookings, currentRate] = await Promise.all([
            prisma.booking.findMany({
                where: {
                    laveurId: profile.userId,
                    status: { in: ['ACCEPTED', 'EN_ROUTE', 'IN_PROGRESS'] },
                    scheduledDate: { gte: todayStart }
                },
                orderBy: { scheduledDate: 'asc' },
                take: 100,
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
                console.error('[accepted] Backfill failed, serving without coords:', err)
            }
        }

        const mapped = bookings.map((booking) => {
            const clientProfile = booking.client?.profile
            const { netAmountCents, commissionCents } = computeCommission(booking.amountCents, currentRate)
            return {
                id: booking.id,
                // Expose status so E2E tests can assert that only active statuses are returned.
                status: booking.status,
                scheduledDate: booking.scheduledDate.toISOString(),
                serviceAddress: booking.serviceAddress,
                serviceLat: booking.serviceLat ?? null,
                serviceLng: booking.serviceLng ?? null,
                // Store amountCents in DB; convert to euros with 2-decimal precision for display.
                finalPrice: Number((booking.amountCents / 100).toFixed(2)),
                grossAmountCents: booking.amountCents,
                netAmountCents,
                commissionCents,
                // Photo URLs added by Story 5.1 — used by PhotoUploader component.
                beforePhotoUrl: booking.beforePhotoUrl,
                afterPhotoUrl: booking.afterPhotoUrl,
                service: {
                    name: booking.serviceName,
                    // Fall back to 60 min if the service name doesn't match any catalog entry.
                    estimatedDuration: durationMap.get(booking.serviceName) ?? 60
                },
                car: {
                    // car relation is nullable (booking can be made without a vehicle).
                    make: booking.car?.make ?? "—",
                    model: booking.car?.model ?? "—"
                },
                customer: {
                    // Build full name from profile; fall back to generic label if unnamed.
                    name: `${clientProfile?.firstName ?? ''} ${clientProfile?.lastName ?? ''}`.trim() || "Client"
                }
            }
        })

        const hasMore = bookings.length === 100
        return NextResponse.json(
            {
                success: true,
                data: { bookings: mapped, currentCommissionRate: currentRate.toNumber() },
            },
            {
                headers: {
                    // Signal to clients whether results were truncated by the 100-item limit.
                    'X-Has-More': String(hasMore)
                }
            }
        )
    } catch (error) {
        console.error('[accepted] Prisma query failed:', error)
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        )
    }
})
