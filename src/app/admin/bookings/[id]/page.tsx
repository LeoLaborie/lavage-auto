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
            <div className="min-h-screen bg-white flex items-center justify-center px-5">
                <div className="rounded-[20px] bg-white p-9 shadow-cin-card border border-rule text-center max-w-md">
                    <div className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-ink2/70 md:text-xs">
                        404
                    </div>
                    <h1 className="font-display text-[28px] font-bold tracking-[-0.03em] text-ink mb-2 md:text-[34px]">
                        Réservation introuvable.
                    </h1>
                    <p className="text-[13px] leading-relaxed text-ink2 md:text-sm">
                        L&apos;ID de réservation fourni n&apos;existe pas.
                    </p>
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
        <div className="min-h-screen bg-white">
            <main className="mx-auto max-w-cin px-5 py-16 md:px-12 md:py-[120px]">
                <div className="mb-10 max-w-2xl md:mb-14">
                    <div className="mb-5 inline-block rounded-md bg-blue-wash px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-blue md:text-xs">
                        Réservation
                    </div>
                    <h1 className="font-display text-[44px] font-extrabold leading-[0.95] tracking-[-0.04em] text-ink md:text-[64px]">
                        Détail.
                    </h1>
                    <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.08em] text-ink2/70 md:text-xs">
                        ID&nbsp;<span className="text-ink2">{booking.id.slice(0, 8)}…</span>
                    </p>
                </div>
                <BookingDetailClient booking={bookingDetail} />
            </main>
        </div>
    )
}
