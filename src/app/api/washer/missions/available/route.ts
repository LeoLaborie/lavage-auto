import { NextResponse } from 'next/server'
import { withWasherGuard } from '@/lib/auth/washerGuard'
import { prisma } from '@/lib/prisma'
import { services } from '@/lib/constants/services'

function getEstimatedDuration(serviceName: string): number {
    const service = services.find(s => s.name === serviceName)
    return service?.estimatedDuration ?? 60
}

export const GET = withWasherGuard(async (req, user, profile) => {
    const bookings = await prisma.booking.findMany({
        where: {
            status: { in: ['PENDING', 'CONFIRMED'] },
            laveurId: null
        },
        orderBy: { scheduledDate: 'asc' },
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
            finalPrice: booking.amountCents / 100,
            service: {
                name: booking.serviceName,
                estimatedDuration: getEstimatedDuration(booking.serviceName)
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
