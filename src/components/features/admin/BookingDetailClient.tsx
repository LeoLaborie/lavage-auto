'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefundPanel } from './RefundPanel'

// ── Types ──────────────────────────────────────────────────────────────────────

type BookingStatus =
    | 'PENDING'
    | 'CONFIRMED'
    | 'ACCEPTED'
    | 'EN_ROUTE'
    | 'IN_PROGRESS'
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

const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
    PENDING: 'En attente',
    CONFIRMED: 'Confirmé',
    ACCEPTED: 'Accepté',
    EN_ROUTE: 'En route',
    IN_PROGRESS: 'En cours',
    COMPLETED: 'Terminé',
    CANCELLED: 'Annulé',
}

const BOOKING_STATUS_CLASS: Record<BookingStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-blue-100 text-blue-800',
    ACCEPTED: 'bg-indigo-100 text-indigo-800',
    EN_ROUTE: 'bg-purple-100 text-purple-800',
    IN_PROGRESS: 'bg-orange-100 text-orange-800',
    COMPLETED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
}

const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
    PENDING: 'En attente',
    PROCESSING: 'En cours',
    SUCCEEDED: 'Réussi',
    FAILED: 'Échoué',
    REFUNDED: 'Remboursé',
    PARTIALLY_REFUNDED: 'Part. remboursé',
}

const PAYMENT_STATUS_CLASS: Record<PaymentStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
    SUCCEEDED: 'bg-green-100 text-green-800',
    FAILED: 'bg-red-100 text-red-800',
    REFUNDED: 'bg-gray-100 text-gray-800',
    PARTIALLY_REFUNDED: 'bg-orange-100 text-orange-800',
}

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
                className="inline-flex items-center gap-1 text-sm text-[#004aad] hover:underline"
            >
                ← Retour à la liste
            </Link>

            {/* Booking Metadata */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Détails de la réservation</h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <div>
                        <dt className="text-gray-500">ID</dt>
                        <dd className="font-mono text-gray-900">{booking.id}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500">Service</dt>
                        <dd className="text-gray-900">{booking.serviceName}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500">Date planifiée</dt>
                        <dd className="text-gray-900">{formatDate(booking.scheduledDate)}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500">Montant</dt>
                        <dd className="text-gray-900 font-medium">{(booking.amountCents / 100).toFixed(2)} €</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500">Statut</dt>
                        <dd>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BOOKING_STATUS_CLASS[booking.status]}`}>
                                {BOOKING_STATUS_LABEL[booking.status]}
                            </span>
                        </dd>
                    </div>
                    {booking.car && (
                        <div>
                            <dt className="text-gray-500">Véhicule</dt>
                            <dd className="text-gray-900">
                                {booking.car.make} {booking.car.model}
                                {booking.car.plate ? ` — ${booking.car.plate}` : ''}
                            </dd>
                        </div>
                    )}
                </dl>
            </div>

            {/* Client & Laveur Info */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Personnes concernées</h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <div>
                        <dt className="text-gray-500">Client</dt>
                        <dd className="text-gray-900">{booking.clientEmail}</dd>
                    </div>
                    <div>
                        <dt className="text-gray-500">Laveur</dt>
                        <dd className="text-gray-900">{booking.laveurEmail ?? 'Non assigné'}</dd>
                    </div>
                </dl>
            </div>

            {/* Payment Info */}
            {payment && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Paiement</h2>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                        <div>
                            <dt className="text-gray-500">Session Stripe</dt>
                            <dd className="font-mono text-gray-900 text-xs">
                                {payment.stripeSessionId
                                    ? payment.stripeSessionId.slice(0, 16)
                                    : '—'}
                            </dd>
                        </div>
                        <div>
                            <dt className="text-gray-500">Statut paiement</dt>
                            <dd>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAYMENT_STATUS_CLASS[payment.status]}`}>
                                    {PAYMENT_STATUS_LABEL[payment.status]}
                                </span>
                            </dd>
                        </div>
                        <div>
                            <dt className="text-gray-500">Reversement laveur</dt>
                            <dd className="text-gray-900">
                                {payment.paidOutAt
                                    ? formatDate(payment.paidOutAt)
                                    : 'Non encore versé'}
                            </dd>
                        </div>
                        {payment.refundAmountCents != null && payment.refundAmountCents > 0 && (
                            <div>
                                <dt className="text-gray-500">Total remboursé</dt>
                                <dd className="text-gray-900">{(payment.refundAmountCents / 100).toFixed(2)} €</dd>
                            </div>
                        )}
                    </dl>
                </div>
            )}

            {/* Before / After Photos */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Photos</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-500 mb-2">Avant</p>
                        {booking.beforePhotoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={booking.beforePhotoUrl}
                                alt="Photo avant lavage"
                                className="w-full object-cover rounded-lg h-48"
                            />
                        ) : (
                            <div className="bg-gray-100 rounded-lg flex items-center justify-center h-48">
                                <span className="text-gray-400 text-sm">Aucune photo</span>
                            </div>
                        )}
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 mb-2">Après</p>
                        {booking.afterPhotoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={booking.afterPhotoUrl}
                                alt="Photo après lavage"
                                className="w-full object-cover rounded-lg h-48"
                            />
                        ) : (
                            <div className="bg-gray-100 rounded-lg flex items-center justify-center h-48">
                                <span className="text-gray-400 text-sm">Aucune photo</span>
                            </div>
                        )}
                    </div>
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
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <p className="text-sm text-gray-700">
                        Remboursement total effectué le{' '}
                        <span className="font-medium">{payment?.refundedAt ? formatDate(payment.refundedAt) : '—'}</span>
                    </p>
                </div>
            )}

            {/* H3: Distinguish "no payment record" from "payment exists but no Stripe ID" */}
            {showNoStripeId && !showFullyRefunded && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <p className="text-sm text-gray-500">Aucun PaymentIntent Stripe associé à ce paiement</p>
                </div>
            )}

            {showNoPaymentRecord && (
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                    <p className="text-sm text-gray-500">Aucun paiement associé à cette réservation</p>
                </div>
            )}
        </div>
    )
}
