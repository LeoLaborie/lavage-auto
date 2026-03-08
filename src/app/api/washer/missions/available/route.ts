import { NextResponse } from 'next/server'
import { withWasherGuard } from '@/lib/auth/washerGuard'
import { prisma } from '@/lib/prisma'
import { services } from '@/lib/constants/services'

const durationMap = new Map<string, number>(
    services.map(s => [s.name, s.estimatedDuration ?? 60])
)

export const GET = withWasherGuard(async (req, user, profile) => {
    const bookings = await prisma.booking.findMany({
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
    })

    const mapped = bookings.map((booking) => {
        const clientProfile = booking.client?.profile
        return {
            id: booking.id,
            scheduledDate: booking.scheduledDate.toISOString(),
            serviceAddress: booking.serviceAddress,
            finalPrice: Number((booking.amountCents / 100).toFixed(2)),
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
        data: { bookings: mapped },
        bookings: mapped
    })
})
