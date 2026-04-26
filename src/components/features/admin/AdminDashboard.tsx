'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
    BookingStatusBadge,
    PaymentStatusBadge,
    ProfileStatusBadge,
    RoleBadge,
} from './StatusPill'

// ── Types ─────────────────────────────────────────────────────────────────────

type ProfileStatus = 'VALIDATION_PENDING' | 'VALIDATED' | 'REJECTED'
type UserRole = 'CLIENT' | 'LAVEUR' | 'ADMIN'
type BookingStatus = 'PENDING' | 'CONFIRMED' | 'ACCEPTED' | 'EN_ROUTE' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
type PaymentStatus = 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED'

interface AdminUser {
    id: string
    email: string
    role: UserRole
    createdAt: string
    profile: {
        status: ProfileStatus
        firstName: string | null
        lastName: string | null
        siret: string | null
        companyName: string | null
    } | null
}

interface AdminBooking {
    id: string
    clientEmail: string
    laveurEmail: string | null
    serviceName: string
    amountEur: number
    status: BookingStatus
    scheduledDate: string
    beforePhotoUrl: string | null
    afterPhotoUrl: string | null
    paymentStatus: PaymentStatus | null
}

interface AdminPayment {
    id: string
    bookingId: string
    userEmail: string
    amountEur: number
    status: PaymentStatus
    stripeSessionId: string | null
    stripePaymentIntentId: string | null
    refundAmountCents: number | null
    paidOutAt: string | null
    createdAt: string
}

interface PaginationState {
    page: number
    total: number
    loading: boolean
    error: string | null
}

interface Props {
    initialUsers: AdminUser[]
    usersTotal: number
    initialBookings: AdminBooking[]
    bookingsTotal: number
    initialPayments: AdminPayment[]
    paymentsTotal: number
    pageSize: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function truncate(str: string, len: number) {
    return str.length > len ? str.slice(0, len) + '…' : str
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const TH_CLASS = 'px-4 py-3 text-left font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-ink2/70'
const TD_CLASS = 'px-4 py-3 text-sm text-ink'
const TR_CLASS = 'border-b border-rule transition-colors hover:bg-blue-wash/40'
const ALERT_CLASS = 'mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700'

function Pagination({
    page,
    total,
    pageSize,
    loading,
    onPrev,
    onNext,
}: {
    page: number
    total: number
    pageSize: number
    loading: boolean
    onPrev: () => void
    onNext: () => void
}) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const btn =
        'rounded-lg border-[1.5px] border-ink bg-white px-3 py-1.5 font-cinsans text-xs font-semibold text-ink transition-colors hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-ink'
    return (
        <div className="mt-5 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink2/70 md:text-xs">
                Page {page} / {totalPages} &mdash; {total} entrée{total !== 1 ? 's' : ''}
            </span>
            <div className="flex gap-2">
                <button onClick={onPrev} disabled={page <= 1 || loading} className={btn}>
                    Précédent
                </button>
                <button
                    onClick={onNext}
                    disabled={page * pageSize >= total || loading}
                    className={btn}
                >
                    Suivant
                </button>
            </div>
        </div>
    )
}

// ── Main Component ────────────────────────────────────────────────────────────

type Tab = 'users' | 'bookings' | 'payments'

export default function AdminDashboard({
    initialUsers,
    usersTotal,
    initialBookings,
    bookingsTotal,
    initialPayments,
    paymentsTotal,
    pageSize,
}: Props) {
    const [activeTab, setActiveTab] = useState<Tab>('users')

    const [users, setUsers] = useState<AdminUser[]>(initialUsers)
    const [bookings, setBookings] = useState<AdminBooking[]>(initialBookings)
    const [payments, setPayments] = useState<AdminPayment[]>(initialPayments)

    const [usersPagination, setUsersPagination] = useState<PaginationState>({
        page: 1, total: usersTotal, loading: false, error: null,
    })
    const [bookingsPagination, setBookingsPagination] = useState<PaginationState>({
        page: 1, total: bookingsTotal, loading: false, error: null,
    })
    const [paymentsPagination, setPaymentsPagination] = useState<PaginationState>({
        page: 1, total: paymentsTotal, loading: false, error: null,
    })

    const [actionState, setActionState] = useState<Record<string, {
        loading: boolean
        error: string | null
        done: boolean
        result: 'VALIDATED' | 'REJECTED' | null
    }>>({})

    // ── Fetch helpers ────────────────────────────────────────────────────────

    async function fetchUsers(page: number) {
        setUsersPagination(p => ({ ...p, loading: true, error: null }))
        try {
            const res = await fetch(`/api/admin/users?page=${page}&pageSize=${pageSize}`)
            if (!res.ok) throw new Error('Erreur lors du chargement.')
            const json = await res.json()
            setUsers(json.data.items)
            setUsersPagination({ page, total: json.data.total, loading: false, error: null })
        } catch {
            setUsersPagination(p => ({ ...p, loading: false, error: 'Erreur lors du chargement. Veuillez réessayer.' }))
        }
    }

    async function fetchBookings(page: number) {
        setBookingsPagination(p => ({ ...p, loading: true, error: null }))
        try {
            const res = await fetch(`/api/admin/bookings?page=${page}&pageSize=${pageSize}`)
            if (!res.ok) throw new Error('Erreur lors du chargement.')
            const json = await res.json()
            setBookings(json.data.items)
            setBookingsPagination({ page, total: json.data.total, loading: false, error: null })
        } catch {
            setBookingsPagination(p => ({ ...p, loading: false, error: 'Erreur lors du chargement. Veuillez réessayer.' }))
        }
    }

    async function fetchPayments(page: number) {
        setPaymentsPagination(p => ({ ...p, loading: true, error: null }))
        try {
            const res = await fetch(`/api/admin/payments?page=${page}&pageSize=${pageSize}`)
            if (!res.ok) throw new Error('Erreur lors du chargement.')
            const json = await res.json()
            setPayments(json.data.items)
            setPaymentsPagination({ page, total: json.data.total, loading: false, error: null })
        } catch {
            setPaymentsPagination(p => ({ ...p, loading: false, error: 'Erreur lors du chargement. Veuillez réessayer.' }))
        }
    }

    // ── Validate / Reject actions ────────────────────────────────────────────

    async function handleProfileAction(userId: string, action: 'validate' | 'reject') {
        setActionState(s => ({
            ...s,
            [userId]: { loading: true, error: null, done: false, result: null },
        }))
        try {
            const res = await fetch(`/api/admin/users/${userId}/${action}`, { method: 'PATCH' })
            const json = await res.json()
            if (!res.ok) {
                throw new Error(json.error || 'Une erreur est survenue.')
            }
            const result = action === 'validate' ? 'VALIDATED' : 'REJECTED'
            setActionState(s => ({
                ...s,
                [userId]: { loading: false, error: null, done: true, result },
            }))
            setUsers(prev => prev.map(u =>
                u.id === userId && u.profile
                    ? { ...u, profile: { ...u.profile, status: result } }
                    : u
            ))
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Une erreur est survenue.'
            setActionState(s => ({
                ...s,
                [userId]: { loading: false, error: message, done: false, result: null },
            }))
        }
    }

    // ── Tab styles ───────────────────────────────────────────────────────────

    function tabClass(tab: Tab) {
        const base = '-mb-px cursor-pointer border-b-2 px-4 py-3 font-cinsans text-sm font-medium transition-colors'
        return activeTab === tab
            ? `${base} border-blue text-blue`
            : `${base} border-transparent text-ink2 hover:text-ink`
    }

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-white">
            <div className="mx-auto max-w-cin px-5 py-10 md:px-12 md:py-14">
                <h1 className="mb-8 font-display text-[44px] font-extrabold leading-[0.95] tracking-[-0.04em] text-ink md:text-[56px]">
                    Administration
                </h1>

                {/* Tabs */}
                <div className="mb-8 border-b border-rule">
                    <nav className="flex gap-0">
                        <button className={tabClass('users')} onClick={() => setActiveTab('users')}>
                            Utilisateurs
                        </button>
                        <button className={tabClass('bookings')} onClick={() => setActiveTab('bookings')}>
                            Réservations
                        </button>
                        <button className={tabClass('payments')} onClick={() => setActiveTab('payments')}>
                            Paiements
                        </button>
                    </nav>
                </div>

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div>
                        {usersPagination.error && <div className={ALERT_CLASS}>{usersPagination.error}</div>}
                        <div className={`overflow-x-auto transition-opacity ${usersPagination.loading ? 'opacity-50' : 'opacity-100'}`}>
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-rule">
                                        <th className={TH_CLASS}>Email</th>
                                        <th className={TH_CLASS}>Rôle</th>
                                        <th className={TH_CLASS}>Statut profil</th>
                                        <th className={TH_CLASS}>SIRET</th>
                                        <th className={TH_CLASS}>Date d&apos;inscription</th>
                                        <th className={TH_CLASS}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => {
                                        const state = actionState[u.id]
                                        const profileStatus = state?.done && state.result
                                            ? state.result
                                            : u.profile?.status ?? null
                                        const showActions =
                                            u.role === 'LAVEUR' &&
                                            profileStatus === 'VALIDATION_PENDING' &&
                                            !state?.done

                                        return (
                                            <tr key={u.id} className={TR_CLASS}>
                                                <td className={`${TD_CLASS} max-w-[200px] truncate`}>{u.email}</td>
                                                <td className={TD_CLASS}><RoleBadge role={u.role} /></td>
                                                <td className={TD_CLASS}>
                                                    <ProfileStatusBadge status={profileStatus as ProfileStatus | null} />
                                                </td>
                                                <td className={`${TD_CLASS} font-mono text-xs text-ink2`}>
                                                    {u.profile?.siret ?? '—'}
                                                </td>
                                                <td className={`${TD_CLASS} text-ink2`}>{formatDate(u.createdAt)}</td>
                                                <td className={TD_CLASS}>
                                                    {showActions && (
                                                        <div className="flex flex-wrap gap-2">
                                                            <button
                                                                onClick={() => handleProfileAction(u.id, 'validate')}
                                                                disabled={state?.loading}
                                                                className="rounded-lg bg-ink px-3 py-1.5 font-cinsans text-xs font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                                                            >
                                                                {state?.loading ? 'En cours…' : 'Valider'}
                                                            </button>
                                                            <button
                                                                onClick={() => handleProfileAction(u.id, 'reject')}
                                                                disabled={state?.loading}
                                                                className="rounded-lg border-[1.5px] border-red-300 bg-white px-3 py-1.5 font-cinsans text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"
                                                            >
                                                                {state?.loading ? 'En cours…' : 'Rejeter'}
                                                            </button>
                                                        </div>
                                                    )}
                                                    {state?.error && (
                                                        <p className="mt-1 text-xs text-red-700">{state.error}</p>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            page={usersPagination.page}
                            total={usersPagination.total}
                            pageSize={pageSize}
                            loading={usersPagination.loading}
                            onPrev={() => fetchUsers(usersPagination.page - 1)}
                            onNext={() => fetchUsers(usersPagination.page + 1)}
                        />
                    </div>
                )}

                {/* Bookings Tab */}
                {activeTab === 'bookings' && (
                    <div>
                        {bookingsPagination.error && <div className={ALERT_CLASS}>{bookingsPagination.error}</div>}
                        <div className={`overflow-x-auto transition-opacity ${bookingsPagination.loading ? 'opacity-50' : 'opacity-100'}`}>
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-rule">
                                        <th className={TH_CLASS}>ID</th>
                                        <th className={TH_CLASS}>Client</th>
                                        <th className={TH_CLASS}>Laveur</th>
                                        <th className={TH_CLASS}>Service</th>
                                        <th className={TH_CLASS}>Montant</th>
                                        <th className={TH_CLASS}>Statut</th>
                                        <th className={TH_CLASS}>Date planifiée</th>
                                        <th className={TH_CLASS}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.map((b) => (
                                        <tr key={b.id} className={TR_CLASS}>
                                            <td className={`${TD_CLASS} font-mono text-xs text-ink2/70`}>{b.id.slice(0, 8)}</td>
                                            <td className={`${TD_CLASS} max-w-[180px] truncate text-ink2`}>{b.clientEmail}</td>
                                            <td className={`${TD_CLASS} max-w-[180px] truncate text-ink2`}>{b.laveurEmail ?? 'Non assigné'}</td>
                                            <td className={`${TD_CLASS} text-ink2`}>{b.serviceName}</td>
                                            <td className={`${TD_CLASS} font-display font-semibold`}>{b.amountEur.toFixed(2)} €</td>
                                            <td className={TD_CLASS}><BookingStatusBadge status={b.status} /></td>
                                            <td className={`${TD_CLASS} text-ink2`}>{formatDate(b.scheduledDate)}</td>
                                            <td className={TD_CLASS}>
                                                <Link
                                                    href={`/admin/bookings/${b.id}`}
                                                    className="font-cinsans text-xs font-semibold text-blue hover:underline"
                                                >
                                                    Voir détail →
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            page={bookingsPagination.page}
                            total={bookingsPagination.total}
                            pageSize={pageSize}
                            loading={bookingsPagination.loading}
                            onPrev={() => fetchBookings(bookingsPagination.page - 1)}
                            onNext={() => fetchBookings(bookingsPagination.page + 1)}
                        />
                    </div>
                )}

                {/* Payments Tab */}
                {activeTab === 'payments' && (
                    <div>
                        {paymentsPagination.error && <div className={ALERT_CLASS}>{paymentsPagination.error}</div>}
                        <div className={`overflow-x-auto transition-opacity ${paymentsPagination.loading ? 'opacity-50' : 'opacity-100'}`}>
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-rule">
                                        <th className={TH_CLASS}>ID</th>
                                        <th className={TH_CLASS}>Réservation</th>
                                        <th className={TH_CLASS}>Utilisateur</th>
                                        <th className={TH_CLASS}>Montant</th>
                                        <th className={TH_CLASS}>Statut</th>
                                        <th className={TH_CLASS}>Session Stripe</th>
                                        <th className={TH_CLASS}>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map((p) => (
                                        <tr key={p.id} className={TR_CLASS}>
                                            <td className={`${TD_CLASS} font-mono text-xs text-ink2/70`}>{p.id.slice(0, 8)}</td>
                                            <td className={`${TD_CLASS} font-mono text-xs text-ink2/70`}>{p.bookingId.slice(0, 8)}</td>
                                            <td className={`${TD_CLASS} max-w-[180px] truncate text-ink2`}>{p.userEmail}</td>
                                            <td className={`${TD_CLASS} font-display font-semibold`}>{p.amountEur.toFixed(2)} €</td>
                                            <td className={TD_CLASS}><PaymentStatusBadge status={p.status} /></td>
                                            <td className={`${TD_CLASS} font-mono text-xs text-ink2/70`}>
                                                {p.stripeSessionId ? truncate(p.stripeSessionId, 16) : '—'}
                                            </td>
                                            <td className={`${TD_CLASS} text-ink2`}>{formatDate(p.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination
                            page={paymentsPagination.page}
                            total={paymentsPagination.total}
                            pageSize={pageSize}
                            loading={paymentsPagination.loading}
                            onPrev={() => fetchPayments(paymentsPagination.page - 1)}
                            onNext={() => fetchPayments(paymentsPagination.page + 1)}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
