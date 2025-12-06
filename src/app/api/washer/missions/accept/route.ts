import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Verify user is a washer
        const washer = await prisma.washer.findUnique({
            where: { email: user.email! }
        })

        if (!washer) {
            return NextResponse.json(
                { error: 'Access denied. Washer profile required.' },
                { status: 403 }
            )
        }

        const { bookingId } = await request.json()

        if (!bookingId) {
            return NextResponse.json(
                { error: 'Booking ID is required' },
                { status: 400 }
            )
        }

        // Check if booking is still available
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId }
        })

        if (!booking) {
            return NextResponse.json(
                { error: 'Booking not found' },
                { status: 404 }
            )
        }

        if (booking.status !== 'PENDING') {
            return NextResponse.json(
                { error: 'This mission is no longer available' },
                { status: 409 }
            )
        }

        // Check for schedule conflicts
        const newMissionStart = new Date(booking.scheduledDate)
        const newMissionDuration = booking.estimatedDuration || 60 // Default 60 min if null
        const newMissionEnd = new Date(newMissionStart.getTime() + newMissionDuration * 60000)

        // Get washer's existing assignments that might overlap
        // We check for any assignment where the time ranges overlap
        const conflictingAssignment = await prisma.bookingAssignment.findFirst({
            where: {
                washerId: washer.id,
                booking: {
                    status: {
                        notIn: ['CANCELLED', 'COMPLETED']
                    },
                    // Check for overlap: (StartA < EndB) and (EndA > StartB)
                    // We need to fetch bookings and check in JS or use raw query for complex date math
                    // For simplicity/safety with Prisma dates, let's fetch active bookings around this time
                    // A simple approximation is checking same day, then precise check in JS
                    scheduledDate: {
                        gte: new Date(newMissionStart.setHours(0, 0, 0, 0)),
                        lt: new Date(newMissionStart.setHours(23, 59, 59, 999))
                    }
                }
            },
            include: {
                booking: true
            }
        })

        // If there are assignments today, check for precise overlap
        if (conflictingAssignment) {
            // We need to check all assignments for the day, findFirst above was just to see if any exist
            const dayAssignments = await prisma.bookingAssignment.findMany({
                where: {
                    washerId: washer.id,
                    booking: {
                        status: { notIn: ['CANCELLED', 'COMPLETED'] },
                        scheduledDate: {
                            gte: new Date(new Date(booking.scheduledDate).setHours(0, 0, 0, 0)),
                            lt: new Date(new Date(booking.scheduledDate).setHours(23, 59, 59, 999))
                        }
                    }
                },
                include: { booking: true }
            })

            for (const assignment of dayAssignments) {
                const existingStart = new Date(assignment.booking.scheduledDate)
                const existingDuration = assignment.booking.estimatedDuration || 60
                const existingEnd = new Date(existingStart.getTime() + existingDuration * 60000)

                // Reset newMissionStart because setHours mutated it above
                const targetStart = new Date(booking.scheduledDate)
                const targetEnd = new Date(targetStart.getTime() + newMissionDuration * 60000)

                if (targetStart < existingEnd && existingStart < targetEnd) {
                    return NextResponse.json(
                        { error: 'Conflit d\'horaire : Vous avez déjà une mission sur ce créneau.' },
                        { status: 409 }
                    )
                }
            }
        }

        // Create assignment and update booking status transactionally
        const result = await prisma.$transaction(async (tx) => {
            // Create assignment
            const assignment = await tx.bookingAssignment.create({
                data: {
                    bookingId,
                    washerId: washer.id,
                    isAccepted: true,
                    acceptedAt: new Date(),
                }
            })

            // Update booking status
            const updatedBooking = await tx.booking.update({
                where: { id: bookingId },
                data: {
                    status: 'ASSIGNED'
                }
            })

            return { assignment, booking: updatedBooking }
        })

        return NextResponse.json({ success: true, data: result })

    } catch (error) {
        console.error('Error accepting mission:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
