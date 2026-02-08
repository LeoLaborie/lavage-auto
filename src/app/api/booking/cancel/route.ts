import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    try {
        // Verify booking exists and is pending
        const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
        });

        if (booking && booking.status === 'PENDING') {
            // Delete the pending booking
            await prisma.booking.delete({
                where: { id: bookingId },
            });
        }

        // Redirect user back to the reservation page with a cancelled flag
        // We can redirect to /reserver or a specific dashboard
        // For now, let's redirect to /reserver with a query param so the UI can show a toast
        return NextResponse.redirect(new URL('/reserver?cancelled=true', request.url));

    } catch (error) {
        console.error('Error cancelling booking:', error);
        // Even if error, redirect home or to reserver to avoid getting stuck
        return NextResponse.redirect(new URL('/reserver?error=cancellation_failed', request.url));
    }
}
