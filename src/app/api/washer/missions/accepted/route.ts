import { NextResponse } from 'next/server'
import { withWasherGuard } from '@/lib/auth/washerGuard'
import { prisma } from '@/lib/prisma'
import { services } from '@/lib/constants/services'

// O(1) service duration lookup — established pattern from Story 4.1 code review
const durationMap = new Map<string, number>(
    services.map(s => [s.name, s.estimatedDuration ?? 60])
)

// GET /api/washer/missions/accepted
// Returns the authenticated laveur's active accepted missions (planning view)
// AC#1: Returns ACCEPTED, EN_ROUTE, IN_PROGRESS missions for the current laveur
// AC#5: Only today's or future missions (excludes past)
// AC#11: Pagination capped at 100
export const GET = withWasherGuard(async (req, user, profile) => {
    // AC#5: Filter from today 00:00:00 to include all of today's missions
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const bookings = await prisma.booking.findMany({
        where: {
            laveurId: profile.userId,                                // AC#1: Only this laveur's missions
            status: { in: ['ACCEPTED', 'EN_ROUTE', 'IN_PROGRESS'] }, // AC#1: Active statuses only
            scheduledDate: { gte: todayStart }                       // AC#5: Today or future
        },
        orderBy: { scheduledDate: 'asc' }, // AC#4: Chronological order
        take: 100,                         // AC#11: Pagination safety
        include: {
            client: { include: { profile: true } }, // AC#10: Need profile for customer.name
            car: true                                // AC#9: May be null — use optional chaining
        }
    })

    // Map to the Mission shape expected by WasherDashboardView.tsx
    const mapped = bookings.map((booking) => {
        const clientProfile = booking.client?.profile
        return {
            id: booking.id,
            scheduledDate: booking.scheduledDate.toISOString(),         // AC#3: ISO 8601 format
            serviceAddress: booking.serviceAddress,
            finalPrice: Number((booking.amountCents / 100).toFixed(2)), // AC#3: euros, 2 decimal precision
            service: {
                name: booking.serviceName,
                estimatedDuration: durationMap.get(booking.serviceName) ?? 60 // AC#8: fallback 60min
            },
            car: {
                make: booking.car?.make ?? "—",   // AC#9: fallback if no car
                model: booking.car?.model ?? "—"  // AC#9: fallback if no car
            },
            customer: {
                // AC#10: Full name from profile, fallback to "Client"
                name: `${clientProfile?.firstName ?? ''} ${clientProfile?.lastName ?? ''}`.trim() || "Client"
            }
        }
    })

    // AC#2: Return bookings at both root level and under data for WasherDashboardView compat
    return NextResponse.json({
        success: true,
        data: { bookings: mapped },
        bookings: mapped
    })
})
