import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Réservation confirmée',
    description: 'Votre réservation de lavage auto a été confirmée avec succès.',
}

export default async function BookingSuccessPage({
    searchParams,
}: {
    searchParams: Promise<{ bookingId?: string }>
}) {
    const { bookingId } = await searchParams

    if (!bookingId) {
        redirect('/dashboard')
    }

    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
        redirect('/login')
    }

    const booking = await prisma.booking.findFirst({
        where: {
            id: bookingId,
            client: { authId: authUser.id },
        },
        include: {
            car: true,
        },
    })

    if (!booking) {
        redirect('/dashboard')
    }

    const formattedDate = new Date(booking.scheduledDate).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })

    const formattedTime = new Date(booking.scheduledDate).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
    })

    const isPending = booking.status === 'PENDING'

    return (
        <div
            className="flex min-h-screen items-center justify-center px-5 py-16 md:px-12 md:py-[120px]"
            style={{
                background: 'radial-gradient(ellipse at 70% 30%, #eaf0fc 0%, #ffffff 60%)',
            }}
        >
            <div className="w-full max-w-[560px]">
                <div className="rounded-[20px] bg-white p-7 shadow-cin-card md:p-9">
                    <div className="mb-5 flex items-center gap-3">
                        <span
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-blue-wash text-blue"
                            aria-hidden
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2.5}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </span>
                        <span className="inline-block rounded-md bg-blue-wash px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-blue md:text-xs">
                            Confirmation
                        </span>
                    </div>

                    <h1 className="font-display text-[32px] font-extrabold leading-[1.05] tracking-[-0.04em] text-ink md:text-[44px]">
                        {isPending ? 'Carte en cours de vérification.' : 'Réservation enregistrée.'}
                    </h1>
                    <p className="mt-4 text-[15px] leading-relaxed text-ink2 md:text-[17px]">
                        {isPending
                            ? 'Votre carte est en cours de vérification. La confirmation arrive dans quelques instants.'
                            : 'Votre carte a été enregistrée. Vous ne serez débité qu’au moment où un laveur acceptera votre mission.'}
                    </p>

                    <div className="mt-7 border-t border-rule pt-6">
                        <div className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-ink2 md:text-xs">
                            Récapitulatif
                        </div>
                        <dl className="space-y-3">
                            <Row label="Service" value={booking.serviceName} />
                            <Row label="Date" value={formattedDate} capitalize />
                            <Row label="Heure" value={formattedTime} />
                            {booking.car && (
                                <Row label="Véhicule" value={`${booking.car.make} ${booking.car.model}`} />
                            )}
                            <Row label="Adresse" value={booking.serviceAddress} />
                        </dl>
                        <div className="mt-5 flex items-baseline justify-between border-t border-rule pt-5">
                            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-ink2 md:text-xs">
                                Total
                            </span>
                            <span className="font-display text-[28px] font-extrabold leading-none tracking-[-0.03em] text-ink md:text-[32px]">
                                {booking.amountCents / 100} €
                            </span>
                        </div>
                    </div>

                    <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                        <Link
                            href="/dashboard"
                            className="inline-flex flex-1 items-center justify-center gap-2.5 rounded-xl bg-ink px-6 py-4 font-cinsans text-[15px] font-semibold text-white shadow-cin-button transition-transform hover:-translate-y-0.5"
                        >
                            Voir mes réservations
                            <span aria-hidden>→</span>
                        </Link>
                        <Link
                            href="/"
                            className="inline-flex flex-1 items-center justify-center rounded-xl border-[1.5px] border-ink bg-transparent px-6 py-4 font-cinsans text-[15px] font-semibold text-ink transition-colors hover:bg-ink hover:text-white"
                        >
                            Retour à l&apos;accueil
                        </Link>
                    </div>
                </div>

                <p className="mt-5 text-center font-mono text-[11px] uppercase tracking-[0.08em] text-ink2 md:text-xs">
                    Sans eau · Débit à l&apos;acceptation du laveur · Annulation gratuite jusqu&apos;à 24h avant
                </p>
            </div>
        </div>
    )
}

function Row({
    label,
    value,
    capitalize = false,
}: {
    label: string
    value: string
    capitalize?: boolean
}) {
    return (
        <div className="flex justify-between gap-4">
            <dt className="shrink-0 text-[13px] text-ink2 md:text-sm">{label}</dt>
            <dd
                className={`min-w-0 break-words text-right text-[13px] font-medium text-ink md:text-sm${
                    capitalize ? ' first-letter:uppercase' : ''
                }`}
            >
                {value}
            </dd>
        </div>
    )
}
