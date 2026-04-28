'use client'

import NavCinetique from '@/components/landing/NavCinetique'
import { Skeleton, SkeletonBookingCard } from '@/components/ui/Skeleton'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import VehicleForm from '@/components/features/dashboard/VehicleForm'
import VehicleList from '@/components/features/dashboard/VehicleList'
import MissionValidationCard from '@/components/features/dashboard/MissionValidationCard'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import EmptyState, { CalendarIcon } from '@/components/ui/EmptyState'

interface Booking {
    id: string
    scheduledDate: string
    status: string
    finalPrice: number
    beforePhotoUrl: string | null
    afterPhotoUrl: string | null
    awaitingReviewSince: string | null
    service: {
        name: string
    }
    car: {
        make: string
        model: string
    }
    assignment?: {
        washer: {
            name: string
            phone: string
        }
    }
}

interface Car {
    id: string
    make: string
    model: string
    plate: string | null
}

interface ClientDashboardViewProps {
    initialBookings: Booking[]
    initialCars: Car[]
}

const PILL_BASE =
    'inline-flex items-center rounded-md px-2 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.05em]'

const STATUS_PILL: Record<string, { className: string; label: string }> = {
    PENDING: { className: 'bg-blue-wash text-ink2', label: 'En attente' },
    CONFIRMED: { className: 'bg-blue/10 text-blue', label: 'Confirmé' },
    ASSIGNED: { className: 'bg-blue/10 text-blue', label: 'Laveur assigné' },
    IN_PROGRESS: { className: 'bg-blue-wash text-blue', label: 'En cours' },
    AWAITING_REVIEW: { className: 'bg-amber-50 text-amber-700', label: 'À valider' },
    COMPLETED: { className: 'bg-ink text-white', label: 'Terminé' },
    CANCELLED: { className: 'bg-rule text-ink2', label: 'Annulé' },
}

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_PILL[status] ?? { className: 'bg-blue-wash text-ink2', label: status }
    return <span className={`${PILL_BASE} ${cfg.className}`}>{cfg.label}</span>
}

const CARD_SHELL =
    'rounded-[20px] bg-white p-6 shadow-cin-card border border-rule md:p-7'
const CARD_TITLE =
    'font-display text-[20px] font-bold tracking-[-0.02em] text-ink mb-5 md:text-[24px]'

export default function ClientDashboardView({ initialBookings, initialCars }: ClientDashboardViewProps) {
    const { user, loading } = useAuth()
    const { toast } = useToast()
    const router = useRouter()
    const [bookings, setBookings] = useState<Booking[]>(initialBookings)
    const [cancelBookingId, setCancelBookingId] = useState<string | null>(null)

    useEffect(() => {
        setBookings(initialBookings)
    }, [initialBookings])

    const confirmCancelBooking = async (bookingId: string) => {
        try {
            const res = await fetch('/api/customer/bookings/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId })
            })

            if (res.ok) {
                toast.success('Réservation annulée avec succès')
                router.refresh()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Erreur lors de l\'annulation')
            }
        } catch (error) {
            console.error('Error cancelling booking:', error)
            toast.error('Une erreur est survenue')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <NavCinetique />
                <main className="mx-auto max-w-cin px-5 py-10 md:px-12 md:py-14">
                    <div className="mb-8">
                        <Skeleton className="h-4 w-24 mb-3" />
                        <Skeleton className="h-12 w-72 mb-2" />
                        <Skeleton className="h-5 w-64" />
                    </div>
                    <div className="grid gap-6 md:grid-cols-3">
                        <div className="space-y-6 md:col-span-2">
                            <div className={CARD_SHELL}>
                                <Skeleton className="h-6 w-40 mb-4" />
                                <SkeletonBookingCard />
                                <div className="mt-4"><SkeletonBookingCard /></div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className={CARD_SHELL}>
                                <Skeleton className="h-6 w-32 mb-4" />
                                <div className="space-y-3">
                                    <Skeleton className="h-16 w-full rounded-xl" />
                                    <Skeleton className="h-16 w-full rounded-xl" />
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    if (!user) return null

    const activeBookings = bookings.filter(b => ['PENDING', 'CONFIRMED', 'ASSIGNED', 'IN_PROGRESS', 'AWAITING_REVIEW'].includes(b.status))
    const pastBookings = bookings.filter(b => ['COMPLETED', 'CANCELLED'].includes(b.status))

    return (
        <div className="min-h-screen bg-white">
            <NavCinetique />

            <main className="mx-auto max-w-cin px-5 py-10 md:px-12 md:py-14">
                <div className="mb-8 md:mb-10">
                    <span className="mb-3 inline-block rounded-md bg-blue-wash px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-blue md:text-xs">
                        Mon espace
                    </span>
                    <h1 className="font-display text-[40px] font-extrabold leading-[0.95] tracking-[-0.04em] text-ink md:text-[56px]">
                        Mes lavages
                    </h1>
                    <p className="mt-3 text-[15px] text-ink2 md:text-[17px]">
                        Gérez vos réservations et vos véhicules.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-6 md:col-span-2">
                        <div className={CARD_SHELL}>
                            <h2 className={CARD_TITLE}>Réserver un lavage</h2>
                            <div className="flex flex-col items-start justify-between gap-3 rounded-[16px] bg-blue-wash p-5 sm:flex-row sm:items-center">
                                <div className="min-w-0">
                                    <p className="font-display text-[17px] font-bold tracking-[-0.02em] text-ink">
                                        Besoin d&apos;un lavage&nbsp;?
                                    </p>
                                    <p className="mt-1 text-sm text-ink2">Réservez en quelques clics.</p>
                                </div>
                                <button
                                    onClick={() => router.push('/reserver')}
                                    className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 font-cinsans text-sm font-semibold text-white shadow-cin-button transition-transform hover:-translate-y-0.5 sm:w-auto"
                                >
                                    Réserver maintenant
                                    <span className="rounded-md bg-blue-electric px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.05em]">
                                        2 min
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div className={CARD_SHELL}>
                            <h2 className={CARD_TITLE}>Mes réservations en cours</h2>
                            {activeBookings.length === 0 ? (
                                <EmptyState
                                    icon={<CalendarIcon />}
                                    title="Aucune réservation en cours"
                                    description="Réservez votre premier lavage auto à domicile en quelques clics."
                                    action={{ label: "Réserver un lavage", href: "/reserver" }}
                                />
                            ) : (
                                <div className="space-y-4">
                                    {activeBookings.map(booking => (
                                        <div
                                            key={booking.id}
                                            className="rounded-[16px] border border-rule p-5 transition-colors hover:bg-blue-wash/40"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex-1">
                                                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                                                        <span className="font-display text-[17px] font-bold tracking-[-0.02em] text-ink">
                                                            {booking.service.name}
                                                        </span>
                                                        <StatusBadge status={booking.status} />
                                                    </div>
                                                    <p className="break-words text-sm text-ink2">
                                                        {new Date(booking.scheduledDate).toLocaleString('fr-FR', {
                                                            dateStyle: 'full',
                                                            timeStyle: 'short'
                                                        })}
                                                    </p>
                                                    <p className="mt-1 flex items-center gap-1.5 text-sm text-ink2">
                                                        <Icon name="car" className="h-4 w-4" />
                                                        {booking.car.make} {booking.car.model}
                                                    </p>
                                                    {booking.assignment && (
                                                        <p className="mt-2 text-sm text-blue">
                                                            Laveur&nbsp;: <span className="font-semibold">{booking.assignment.washer.name}</span>
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="shrink-0 text-right">
                                                    <p className="font-display text-[22px] font-extrabold leading-none tracking-[-0.03em] text-ink md:text-[26px]">
                                                        {booking.finalPrice}&nbsp;€
                                                    </p>
                                                    {(booking.status === 'PENDING' || booking.status === 'ASSIGNED' || booking.status === 'CONFIRMED') && (
                                                        <button
                                                            onClick={() => setCancelBookingId(booking.id)}
                                                            className="mt-2 font-cinsans text-xs font-semibold text-red-700 underline-offset-2 transition-colors hover:underline"
                                                        >
                                                            Annuler
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <MissionValidationCard
                                                booking={booking}
                                                onValidated={() => router.refresh()}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {pastBookings.length > 0 && (
                            <div className={CARD_SHELL}>
                                <h2 className={CARD_TITLE}>Historique</h2>
                                <div className="space-y-4">
                                    {pastBookings.map(booking => (
                                        <div key={booking.id} className="border-b border-rule pb-4 last:border-0 last:pb-0">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="font-display text-[15px] font-semibold tracking-[-0.01em] text-ink md:text-base">
                                                        {booking.service.name}
                                                    </p>
                                                    <p className="text-sm text-ink2">
                                                        {new Date(booking.scheduledDate).toLocaleDateString('fr-FR')}
                                                    </p>
                                                </div>
                                                <StatusBadge status={booking.status} />
                                            </div>

                                            {booking.status === 'COMPLETED' && booking.beforePhotoUrl && booking.afterPhotoUrl && (
                                                <div className="mt-3 grid grid-cols-2 gap-2">
                                                    {(['Avant', 'Après'] as const).map((label) => {
                                                        const url = label === 'Avant' ? booking.beforePhotoUrl : booking.afterPhotoUrl
                                                        return (
                                                            <div key={label} className="relative overflow-hidden rounded-[12px] border border-rule">
                                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                <img
                                                                    src={url!}
                                                                    alt={`Photo ${label.toLowerCase()} lavage`}
                                                                    className="h-24 w-full object-cover"
                                                                />
                                                                <span
                                                                    className="absolute left-2 top-2 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-ink backdrop-blur-md"
                                                                    style={{ background: 'rgba(255,255,255,0.82)' }}
                                                                >
                                                                    {label}
                                                                </span>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className={CARD_SHELL}>
                            <h2 className={CARD_TITLE}>Mes véhicules</h2>
                            <div className="space-y-4">
                                <VehicleList cars={initialCars} />
                                <VehicleForm />
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <ConfirmDialog
                isOpen={!!cancelBookingId}
                onConfirm={() => {
                    confirmCancelBooking(cancelBookingId!)
                    setCancelBookingId(null)
                }}
                onCancel={() => setCancelBookingId(null)}
                title="Annuler la réservation"
                message="Êtes-vous sûr de vouloir annuler cette réservation ?"
                confirmLabel="Annuler la réservation"
                variant="danger"
            />
        </div>
    )
}
