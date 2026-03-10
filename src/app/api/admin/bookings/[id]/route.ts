import { NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/auth/adminGuard'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { getSignedPhotoUrl } from '@/lib/utils/storage'

/**
 * GET /api/admin/bookings/[id]
 *
 * Returns full booking detail for admin review.
 * Auth: checkAdminAuth inline (NOT withAdminGuard — dynamic route with params is incompatible with HOC).
 * Photos: signed URLs generated for private Supabase bucket (1-hour expiry).
 */
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    // 1. Auth check
    const auth = await checkAdminAuth(req)
    if (!auth.ok) return auth.response

    // 2. Next.js 15 async params
    const { id } = await params

    // 3. Fetch booking with all relations
    const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
            client: true,
            laveur: true,
            payment: true,
            car: true,
        },
    })

    if (!booking) {
        return NextResponse.json({ success: false, error: 'Réservation introuvable' }, { status: 404 })
    }

    // 4. Generate signed URLs for private photos
    const supabase = await createClient()

    const [beforePhotoUrl, afterPhotoUrl] = await Promise.all([
        getSignedPhotoUrl(booking.beforePhotoUrl, supabase),
        getSignedPhotoUrl(booking.afterPhotoUrl, supabase),
    ])

    // 5. Serialize response
    const data = {
        id: booking.id,
        serviceName: booking.serviceName,
        scheduledDate: booking.scheduledDate.toISOString(),
        status: booking.status,
        amountCents: booking.amountCents,
        clientEmail: booking.client.email,
        laveurEmail: booking.laveur?.email ?? null,
        car: booking.car
            ? { make: booking.car.make, model: booking.car.model, plate: booking.car.plate }
            : null,
        payment: booking.payment
            ? {
                  status: booking.payment.status,
                  stripeSessionId: booking.payment.stripeSessionId,
                  stripePaymentIntentId: booking.payment.stripePaymentIntentId,
                  amountCents: booking.payment.amountCents,
                  refundAmountCents: booking.payment.refundAmountCents,
                  refundedAt: booking.payment.refundedAt?.toISOString() ?? null,
                  paidOutAt: booking.payment.paidOutAt?.toISOString() ?? null,
              }
            : null,
        beforePhotoUrl,
        afterPhotoUrl,
    }

    return NextResponse.json({ success: true, data })
}
