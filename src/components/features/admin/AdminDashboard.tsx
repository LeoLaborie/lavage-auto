'use client'

import { useState } from 'react'

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

function BookingStatusBadge({ status }: { status: BookingStatus }) {
    const classes: Record<BookingStatus, string> = {
        PENDING: 'bg-yellow-100 text-yellow-800',
        CONFIRMED: 'bg-blue-100 text-blue-800',
        ACCEPTED: 'bg-indigo-100 text-indigo-800',
        EN_ROUTE: 'bg-purple-100 text-purple-800',
        IN_PROGRESS: 'bg-orange-100 text-orange-800',
        COMPLETED: 'bg-green-100 text-green-800',
        CANCELLED: 'bg-red-100 text-red-800',
    }
    const labels: Record<BookingStatus, string> = {
        PENDING: 'En attente',
        CONFIRMED: 'Confirmé',
        ACCEPTED: 'Accepté',
        EN_ROUTE: 'En route',
        IN_PROGRESS: 'En cours',
        COMPLETED: 'Terminé',
        CANCELLED: 'Annulé',
    }
    return (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${classes[status]}`}>
            {labels[status]}
        </span>
    )
}

function PaymentStatusBadge({ status }: { status: PaymentStatus | null }) {
    if (!status) return <span className="text-gray-400 text-xs">—</span>
    const classes: Record<PaymentStatus, string> = {
        PENDING: 'bg-yellow-100 text-yellow-800',
        PROCESSING: 'bg-blue-100 text-blue-800',
        SUCCEEDED: 'bg-green-100 text-green-800',
        FAILED: 'bg-red-100 text-red-800',
        REFUNDED: 'bg-gray-100 text-gray-800',
        PARTIALLY_REFUNDED: 'bg-orange-100 text-orange-800',
    }
    return (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${classes[status]}`}>
            {status}
        </span>
    )
}

function ProfileStatusBadge({ status }: { status: ProfileStatus | null }) {
    if (!status) return <span className="text-gray-400 text-xs">—</span>
    const classes: Record<ProfileStatus, string> = {
        VALIDATION_PENDING: 'bg-yellow-100 text-yellow-800',
        VALIDATED: 'bg-green-100 text-green-800',
        REJECTED: 'bg-red-100 text-red-800',
    }
    const labels: Record<ProfileStatus, string> = {
        VALIDATION_PENDING: 'En attente',
        VALIDATED: 'Validé',
        REJECTED: 'Rejeté',
    }
    return (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${classes[status]}`}>
            {labels[status]}
        </span>
    )
}

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
    return (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
            <span>
                Page {page} / {totalPages} &mdash; {total} entrée{total !== 1 ? 's' : ''}
            </span>
            <div className="flex gap-2">
                <button
                    onClick={onPrev}
                    disabled={page <= 1 || loading}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                    Précédent
                </button>
                <button
                    onClick={onNext}
                    disabled={page * pageSize >= total || loading}
                    className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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

    // Per-tab data state
    const [users, setUsers] = useState<AdminUser[]>(initialUsers)
    const [bookings, setBookings] = useState<AdminBooking[]>(initialBookings)
    const [payments, setPayments] = useState<AdminPayment[]>(initialPayments)

    // Per-tab pagination state
    const [usersPagination, setUsersPagination] = useState<PaginationState>({
        page: 1, total: usersTotal, loading: false, error: null,
    })
    const [bookingsPagination, setBookingsPagination] = useState<PaginationState>({
        page: 1, total: bookingsTotal, loading: false, error: null,
    })
    const [paymentsPagination, setPaymentsPagination] = useState<PaginationState>({
        page: 1, total: paymentsTotal, loading: false, error: null,
    })

    // Per-row validate/reject state: key = userId
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
            // Update the user row's profile status in the local state
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
        const base = 'px-4 py-2 text-sm font-medium border-b-2 transition-colors cursor-pointer'
        return activeTab === tab
            ? `${base} border-[#004aad] text-[#004aad]`
            : `${base} border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300`
    }

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Administration</h1>

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-6">
                    <nav className="flex gap-0 -mb-px">
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
                        {usersPagination.error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                                {usersPagination.error}
                            </div>
                        )}
                        <div className={`overflow-x-auto transition-opacity ${usersPagination.loading ? 'opacity-50' : 'opacity-100'}`}>
                            <table className="w-full text-sm text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50">
                                        <th className="px-4 py-3 font-medium text-gray-600">Email</th>
                                        <th className="px-4 py-3 font-medium text-gray-600">Rôle</th>
                                        <th className="px-4 py-3 font-medium text-gray-600">Statut profil</th>
                                        <th className="px-4 py-3 font-medium text-gray-600">SIRET</th>
                                        <th className="px-4 py-3 font-medium text-gray-600">Date d&apos;inscription</th>
                                        <th className="px-4 py-3 font-medium text-gray-600">Actions</th>
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
                                            <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="px-4 py-3 text-gray-900">{u.email}</td>
                                                <td className="px-4 py-3">
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <ProfileStatusBadge status={profileStatus as ProfileStatus | null} />
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                                                    {u.profile?.siret ?? '—'}
                                                </td>
                                                <td className="px-4 py-3 text-gray-600">{formatDate(u.createdAt)}</td>
                                                <td className="px-4 py-3">
                                                    {showActions && (
                                                        <div className="flex gap-2 flex-wrap">
                                                            <button
                                                                onClick={() => handleProfileAction(u.id, 'validate')}
                                                                disabled={state?.loading}
                                                                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                            >
                                                                {state?.loading ? 'En cours…' : 'Valider le profil'}
                                                            </button>
                                                            <button
                                                                onClick={() => handleProfileAction(u.id, 'reject')}
                                                                disabled={state?.loading}
                                                                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                            >
                                                                {state?.loading ? 'En cours…' : 'Rejeter le profil'}
                                                            </button>
                                                        </div>
                                                    )}
                                                    {state?.error && (
                                                        <p className="text-xs text-red-600 mt-1">{state.error}</p>
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
                        {bookingsPagination.error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                                {bookingsPagination.error}
                            </div>
                        )}
                        <div className={`overflow-x-auto transition-opacity ${bookingsPagination.loading ? 'opacity-50' : 'opacity-100'}`}>
                            <table className="w-full text-sm text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50">
                                        <th className="px-4 py-3 font-medium text-gray-600">ID</th>
                                        <th className="px-4 py-3 font-medium text-gray-600">Client</th>
                                        <th className="px-4 py-3 font-medium text-gray-600">Laveur</th>
                                        <th className="px-4 py-3 font-medium text-gray-600">Service</th>
                                        <th className="px-4 py-3 font-medium text-gray-600">Montant</th>
                                        <th className="px-4 py-3 font-medium text-gray-600">Statut</th>
                                        <th className="px-4 py-3 font-medium text-gray-600">Date planifiée</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.map((b) => (
                                        <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="px-4 py-3 font-mono text-xs text-gray-500">{b.id.slice(0, 8)}</td>
                                            <td className="px-4 py-3 text-gray-700">{b.clientEmail}</td>
                                            <td className="px-4 py-3 text-gray-600">{b.laveurEmail ?? 'Non assigné'}</td>
                                            <td className="px-4 py-3 text-gray-700">{b.serviceName}</td>
                                            <td className="px-4 py-3 text-gray-700">{b.amountEur.toFixed(2)} €</td>
                                            <td className="px-4 py-3"><BookingStatusBadge status={b.status} /></td>
                                            <td className="px-4 py-3 text-gray-600">{formatDate(b.scheduledDate)}</td>
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
                        {paymentsPagination.error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                                {paymentsPagination.error}
                            </div>
                        )}
                        <div className={`overflow-x-auto transition-opacity ${paymentsPagination.loading ? 'opacity-50' : 'opacity-100'}`}>
                            <table className="w-full text-sm text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50">
                                        <th className="px-4 py-3 font-medium text-gray-600">ID</th>
                                        <th className="px-4 py-3 font-medium text-gray-600">Réservation</th>
                                        <th className="px-4 py-3 font-medium text-gray-600">Utilisateur</th>
                                        <th className="px-4 py-3 font-medium text-gray-600">Montant</th>
                                        <th className="px-4 py-3 font-medium text-gray-600">Statut</th>
                                        <th className="px-4 py-3 font-medium text-gray-600">Session Stripe</th>
                                        <th className="px-4 py-3 font-medium text-gray-600">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map((p) => (
                                        <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.id.slice(0, 8)}</td>
                                            <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.bookingId.slice(0, 8)}</td>
                                            <td className="px-4 py-3 text-gray-700">{p.userEmail}</td>
                                            <td className="px-4 py-3 text-gray-700">{p.amountEur.toFixed(2)} €</td>
                                            <td className="px-4 py-3"><PaymentStatusBadge status={p.status} /></td>
                                            <td className="px-4 py-3 font-mono text-xs text-gray-500">
                                                {p.stripeSessionId ? truncate(p.stripeSessionId, 16) : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{formatDate(p.createdAt)}</td>
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
