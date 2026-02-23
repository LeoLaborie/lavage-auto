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
            orderBy: {
                scheduledDate: 'desc'
            }
        })

        // Map Prisma records to the shape expected by the frontend dashboard
        const mappedBookings = bookings.map(b => {
            // Extract car info from accessNotes if possible (Story 2.3 workaround)
            let carMake = '—'
            let carModel = '—'

            if (b.accessNotes?.includes('Véhicule:')) {
                // Try to extract: "Véhicule: [Make] [Model] ([Plate])"
                const carLine = b.accessNotes.split('\n').find(l => l.includes('Véhicule:')) || ''
                const match = carLine.match(/Véhicule:\s*(.*?)\s+(.*?)\s+\((.*?)\)/)
                if (match) {
                    carMake = match[1]
                    carModel = match[2]
                } else {
                    // Fallback for partial matches like "Véhicule: Tesla Model 3"
                    const partialMatch = carLine.match(/Véhicule:\s*(.*)/)
                    if (partialMatch) {
                        carMake = partialMatch[1]
                    }
                }
            }

            return {
                id: b.id,
                scheduledDate: b.scheduledDate.toISOString(),
                // Map ACCEPTED to ASSIGNED for the frontend
                status: b.status === 'ACCEPTED' ? 'ASSIGNED' : b.status,
                finalPrice: b.amountCents / 100, // Convert cents to euros
                service: {
                    name: b.serviceName
                },
                car: {
                    make: carMake,
                    model: carModel
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
