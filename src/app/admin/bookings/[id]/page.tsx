import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { BookingDetailClient, type BookingDetail } from '@/components/features/admin/BookingDetailClient'
import { getSignedPhotoUrl } from '@/lib/utils/storage'

interface Props {
    params: Promise<{ id: string }>
}

/**
 * Admin booking detail page — Server Component.
 * Auth: If no session → redirect('/login'), if not ADMIN → redirect('/dashboard').
 * Fetches booking data directly via Prisma and generates signed URLs for photos.
 */
export default async function AdminBookingDetailPage({ params }: Props) {
    // 1. Admin auth check via redirect (UI page — not API route)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })

    if (!dbUser || dbUser.role !== 'ADMIN') {
        redirect('/dashboard')
    }

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
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-100 text-center">
                    <h1 className="text-xl font-semibold text-gray-900 mb-2">Réservation introuvable</h1>
                    <p className="text-gray-500 text-sm">L&apos;ID de réservation fourni n&apos;existe pas.</p>
                </div>
            </div>
        )
    }

    // 4. Generate signed URLs for private bucket photos
    const [beforePhotoUrl, afterPhotoUrl] = await Promise.all([
        getSignedPhotoUrl(booking.beforePhotoUrl, supabase),
        getSignedPhotoUrl(booking.afterPhotoUrl, supabase),
    ])

    // 5. Build serializable booking detail (dates → ISO strings)
    const bookingDetail: BookingDetail = {
        id: booking.id,
        serviceName: booking.serviceName,
        scheduledDate: booking.scheduledDate.toISOString(),
        status: booking.status as BookingDetail['status'],
        amountCents: booking.amountCents,
        clientEmail: booking.client.email,
        laveurEmail: booking.laveur?.email ?? null,
        car: booking.car
            ? { make: booking.car.make, model: booking.car.model, plate: booking.car.plate }
            : null,
        payment: booking.payment
            ? (() => {
                  const p = booking.payment!
                  type PaymentData = NonNullable<BookingDetail['payment']>
                  const paymentData: PaymentData = {
                      status: p.status as PaymentData['status'],
                      stripeSessionId: p.stripeSessionId,
                      stripePaymentIntentId: p.stripePaymentIntentId,
                      amountCents: p.amountCents,
                      refundAmountCents: p.refundAmountCents,
                      refundedAt: p.refundedAt?.toISOString() ?? null,
                      paidOutAt: p.paidOutAt?.toISOString() ?? null,
                  }
                  return paymentData
              })()
            : null,
        beforePhotoUrl,
        afterPhotoUrl,
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Détail de la réservation</h1>
                <BookingDetailClient booking={bookingDetail} />
            </div>
        </div>
    )
}
