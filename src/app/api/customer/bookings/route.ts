import { NextResponse } from 'next/server'
import { withClientGuard } from '@/lib/auth/clientGuard'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/customer/bookings
 * Returns the list of bookings for the currently authenticated client.
 * Standardizes the shape for the frontend dashboard.
 */
export const GET = withClientGuard(async (_req: Request, _authUser, dbUser) => {
    try {
        const bookings = await prisma.booking.findMany({
            where: {
                clientId: dbUser.id
            },
            include: {
                car: true
            },
            orderBy: {
                scheduledDate: 'desc'
            }
        })

        // Map Prisma records to the shape expected by the frontend dashboard
        const mappedBookings = bookings.map(b => {
            return {
                id: b.id,
                scheduledDate: b.scheduledDate.toISOString(),
                // Map ACCEPTED to ASSIGNED for the frontend; all others pass through unchanged
                status: b.status === 'ACCEPTED' ? 'ASSIGNED' : b.status,
                finalPrice: b.amountCents / 100, // Convert cents to euros
                beforePhotoUrl: b.beforePhotoUrl ?? null,
                afterPhotoUrl: b.afterPhotoUrl ?? null,
                service: {
                    name: b.serviceName
                },
                car: {
                    make: b.car?.make ?? '—',
                    model: b.car?.model ?? '—'
                },
                // Placeholder for assignment (Epic 4)
                assignment: null
            }
        })

        return NextResponse.json({
            success: true,
            bookings: mappedBookings // Dashboard reads .bookings
        })

    } catch (error) {
        console.error('Error fetching customer bookings:', error)
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        )
    }
})
