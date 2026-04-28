'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefundPanel } from './RefundPanel'
import { BookingStatusBadge, PaymentStatusBadge } from './StatusPill'

// ── Types ──────────────────────────────────────────────────────────────────────

type BookingStatus =
    | 'PENDING'
    | 'CONFIRMED'
    | 'ACCEPTED'
    | 'EN_ROUTE'
    | 'IN_PROGRESS'
    | 'AWAITING_REVIEW'
    | 'COMPLETED'
    | 'CANCELLED'

type PaymentStatus =
    | 'PENDING'
    | 'PROCESSING'
    | 'SUCCEEDED'
    | 'FAILED'
    | 'REFUNDED'
    | 'PARTIALLY_REFUNDED'

export interface BookingDetail {
    id: string
    serviceName: string
    scheduledDate: string  // ISO string
    status: BookingStatus
    amountCents: number
    clientEmail: string
    laveurEmail: string | null
    car: { make: string; model: string; plate: string | null } | null
    payment: {
        status: PaymentStatus
        stripeSessionId: string | null
        stripePaymentIntentId: string | null
        amountCents: number
        refundAmountCents: number | null
        refundedAt: string | null         // ISO string or null
        paidOutAt: string | null          // ISO string or null
    } | null
    beforePhotoUrl: string | null
    afterPhotoUrl: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

// Card shell: shared structure (Cinétique)
const CARD_SHELL =
    'rounded-[20px] bg-white p-7 shadow-cin-card border border-rule md:p-9'
const CARD_TITLE =
    'font-display text-[22px] font-bold tracking-[-0.02em] text-ink mb-5 md:text-[26px]'
const DT_CLASS =
    'font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-ink2/70 md:text-xs'
const DD_CLASS = 'mt-1 text-[15px] text-ink md:text-[16px]'

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
    booking: BookingDetail
}

export function BookingDetailClient({ booking }: Props) {
    const router = useRouter()
    // M2: Hoist success state here so it survives router.refresh() remounting RefundPanel
    const [refundSuccess, setRefundSuccess] = useState<string | null>(null)

    const payment = booking.payment

    // Compute remaining refundable amount
    const alreadyRefunded = payment?.refundAmountCents ?? 0
    const remainingCents = payment ? payment.amountCents - alreadyRefunded : 0
    const maxAmountEuros = remainingCents / 100

    // Determine refund panel visibility
    const showRefundPanel =
        payment &&
        payment.stripePaymentIntentId &&
        (payment.status === 'SUCCEEDED' || payment.status === 'PARTIALLY_REFUNDED')

    const showFullyRefunded = payment?.status === 'REFUNDED'
    // H3: Split into two distinct states with separate notices
    const showNoPaymentRecord = !payment
    const showNoStripeId = payment != null && !payment.stripePaymentIntentId

    return (
        <div className="space-y-6">
            {/* Back link */}
            <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-blue transition-colors hover:text-ink md:text-xs"
            >
                ← Retour à la liste
            </Link>

            {/* Booking Metadata */}
            <div className={CARD_SHELL}>
                <h2 className={CARD_TITLE}>Détails de la réservation</h2>
                <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                    <div className="min-w-0">
                        <dt className={DT_CLASS}>ID</dt>
                        <dd className="mt-1 font-mono text-[13px] text-ink2 truncate md:text-sm">{booking.id}</dd>
                    </div>
                    <div>
                        <dt className={DT_CLASS}>Service</dt>
                        <dd className={DD_CLASS}>{booking.serviceName}</dd>
                    </div>
                    <div>
                        <dt className={DT_CLASS}>Date planifiée</dt>
                        <dd className={DD_CLASS}>{formatDate(booking.scheduledDate)}</dd>
                    </div>
                    <div>
                        <dt className={DT_CLASS}>Montant</dt>
                        <dd className="mt-1 font-display text-[22px] font-extrabold leading-none tracking-[-0.03em] text-ink md:text-[26px]">
                            {(booking.amountCents / 100).toFixed(2)}&nbsp;€
                        </dd>
                    </div>
                    <div>
                        <dt className={DT_CLASS}>Statut</dt>
                        <dd className="mt-1.5"><BookingStatusBadge status={booking.status} /></dd>
                    </div>
                    {booking.car && (
                        <div>
                            <dt className={DT_CLASS}>Véhicule</dt>
                            <dd className={DD_CLASS}>
                                {booking.car.make} {booking.car.model}
                                {booking.car.plate ? ` — ${booking.car.plate}` : ''}
                            </dd>
                        </div>
                    )}
                </dl>
            </div>

            {/* Client & Laveur Info */}
            <div className={CARD_SHELL}>
                <h2 className={CARD_TITLE}>Personnes concernées</h2>
                <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                    <div>
                        <dt className={DT_CLASS}>Client</dt>
                        <dd className={DD_CLASS}>{booking.clientEmail}</dd>
                    </div>
                    <div>
                        <dt className={DT_CLASS}>Laveur</dt>
                        <dd className={`${DD_CLASS} ${booking.laveurEmail ? '' : 'text-ink2/60'}`}>
                            {booking.laveurEmail ?? 'Non assigné'}
                        </dd>
                    </div>
                </dl>
            </div>

            {/* Payment Info */}
            {payment && (
                <div className={CARD_SHELL}>
                    <h2 className={CARD_TITLE}>Paiement</h2>
                    <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                        <div>
                            <dt className={DT_CLASS}>Session Stripe</dt>
                            <dd className="mt-1 font-mono text-[13px] text-ink2 md:text-sm">
                                {payment.stripeSessionId
                                    ? payment.stripeSessionId.slice(0, 16)
                                    : '—'}
                            </dd>
                        </div>
                        <div>
                            <dt className={DT_CLASS}>Statut paiement</dt>
                            <dd className="mt-1.5"><PaymentStatusBadge status={payment.status} /></dd>
                        </div>
                        <div>
                            <dt className={DT_CLASS}>Reversement laveur</dt>
                            <dd className={`${DD_CLASS} ${payment.paidOutAt ? '' : 'text-ink2/60'}`}>
                                {payment.paidOutAt
                                    ? formatDate(payment.paidOutAt)
                                    : 'Non encore versé'}
                            </dd>
                        </div>
                        {payment.refundAmountCents != null && payment.refundAmountCents > 0 && (
                            <div>
                                <dt className={DT_CLASS}>Total remboursé</dt>
                                <dd className="mt-1 font-display text-[18px] font-bold tracking-[-0.02em] text-ink md:text-[20px]">
                                    {(payment.refundAmountCents / 100).toFixed(2)}&nbsp;€
                                </dd>
                            </div>
                        )}
                    </dl>
                </div>
            )}

            {/* Before / After Photos */}
            <div className={CARD_SHELL}>
                <h2 className={CARD_TITLE}>Photos</h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {(['Avant', 'Après'] as const).map((label) => {
                        const url = label === 'Avant' ? booking.beforePhotoUrl : booking.afterPhotoUrl
                        const alt = `Photo ${label.toLowerCase()} lavage`
                        return (
                            <div key={label} className="relative overflow-hidden rounded-[16px] border border-rule">
                                {url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={url}
                                        alt={alt}
                                        className="h-56 w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-56 w-full items-center justify-center bg-blue-wash">
                                        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink2/60 md:text-xs">
                                            Aucune photo
                                        </span>
                                    </div>
                                )}
                                <span
                                    className="absolute left-3 top-3 rounded-md px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-ink backdrop-blur-md"
                                    style={{ background: 'rgba(255,255,255,0.82)' }}
                                >
                                    {label}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Refund Panel */}
            {showRefundPanel && (
                <RefundPanel
                    bookingId={booking.id}
                    maxAmountEuros={maxAmountEuros}
                    externalSuccess={refundSuccess}
                    onRefundComplete={() => {
                        setRefundSuccess('Remboursement effectué avec succès')
                        router.refresh()
                    }}
                />
            )}

            {showFullyRefunded && (
                <div className={CARD_SHELL}>
                    <p className="text-[15px] leading-relaxed text-ink2 md:text-[16px]">
                        Remboursement total effectué le{' '}
                        <span className="font-display font-semibold text-ink">
                            {payment?.refundedAt ? formatDate(payment.refundedAt) : '—'}
                        </span>
                    </p>
                </div>
            )}

            {/* H3: Distinguish "no payment record" from "payment exists but no Stripe ID" */}
            {showNoStripeId && !showFullyRefunded && (
                <div className={CARD_SHELL}>
                    <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink2/70 md:text-xs">
                        Aucun PaymentIntent Stripe associé à ce paiement
                    </p>
                </div>
            )}

            {showNoPaymentRecord && (
                <div className={CARD_SHELL}>
                    <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink2/70 md:text-xs">
                        Aucun paiement associé à cette réservation
                    </p>
                </div>
            )}
        </div>
    )
}
