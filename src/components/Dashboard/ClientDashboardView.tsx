'use client'

import Header from '@/components/Header'
import { Skeleton, SkeletonBookingCard } from '@/components/ui/Skeleton'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AppleEmoji } from '@/components/AppleEmoji'
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

export default function ClientDashboardView({ initialBookings, initialCars }: ClientDashboardViewProps) {
    const { user, loading } = useAuth()
    const { toast } = useToast()
    const router = useRouter()
    const [bookings, setBookings] = useState<Booking[]>(initialBookings)
    const [cancelBookingId, setCancelBookingId] = useState<string | null>(null)

    // Sync with props when navigation/revalidation happens
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
            <div className="min-h-screen bg-gray-50">
                <Header currentPage="dashboard" />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="mb-8">
                        <Skeleton className="h-8 w-48 mb-2" />
                        <Skeleton className="h-5 w-64" />
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-6">
                            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                                <Skeleton className="h-6 w-40 mb-4" />
                                <SkeletonBookingCard />
                                <div className="mt-4"><SkeletonBookingCard /></div>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
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

    const activeBookings = bookings.filter(b => ['PENDING', 'CONFIRMED', 'ASSIGNED', 'IN_PROGRESS'].includes(b.status))
    const pastBookings = bookings.filter(b => ['COMPLETED', 'CANCELLED'].includes(b.status))

    return (
        <div className="min-h-screen bg-gray-50">
            <Header currentPage="dashboard" />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Mon Espace Client</h1>
                    <p className="text-gray-600 mt-2">Gérez vos réservations et vos véhicules</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Quick Action */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <h2 className="text-xl font-semibold mb-4">Réserver un lavage</h2>
                            <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
                                <div>
                                    <p className="font-medium text-blue-900">Besoin d'un lavage ?</p>
                                    <p className="text-sm text-blue-700">Réservez en quelques clics</p>
                                </div>
                                <button
                                    onClick={() => router.push('/reserver')}
                                    className="px-4 py-2 bg-[#004aad] text-white rounded-lg hover:bg-[#003c8a] transition-colors"
                                >
                                    Réserver maintenant
                                </button>
                            </div>
                        </div>

                        {/* Active Bookings */}
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <h2 className="text-xl font-semibold mb-4">Mes réservations en cours</h2>
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
                                        <div key={booking.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-semibold text-gray-900">{booking.service.name}</span>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                            booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                            booking.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-800' :
                                                            booking.status === 'IN_PROGRESS' ? 'bg-orange-100 text-orange-800' :
                                                            'bg-green-100 text-green-800'
                                                        }`}>
                                                            {booking.status === 'PENDING' ? 'En attente' :
                                                                booking.status === 'ASSIGNED' ? 'Laveur assigné' :
                                                                booking.status === 'IN_PROGRESS' ? 'En cours' :
                                                                booking.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600">
                                                        {new Date(booking.scheduledDate).toLocaleString('fr-FR', {
                                                            dateStyle: 'full',
                                                            timeStyle: 'short'
                                                        })}
                                                    </p>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        <AppleEmoji name="car" className="w-4 h-4 inline mr-1" />
                                                        {booking.car.make} {booking.car.model}
                                                    </p>
                                                    {booking.assignment && (
                                                        <p className="text-sm text-blue-600 mt-2">
                                                            Laveur : {booking.assignment.washer.name}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-gray-900 mb-2">{booking.finalPrice} €</p>
                                                    {booking.status === 'PENDING' || booking.status === 'ASSIGNED' || booking.status === 'CONFIRMED' ? (
                                                        <button
                                                            onClick={() => setCancelBookingId(booking.id)}
                                                            className="text-sm text-red-600 hover:text-red-800 font-medium underline"
                                                        >
                                                            Annuler
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </div>

                                            {/* Validation card for IN_PROGRESS missions */}
                                            <MissionValidationCard
                                                booking={booking}
                                                onValidated={() => router.refresh()}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Past Bookings */}
                        {pastBookings.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                                <h2 className="text-xl font-semibold mb-4">Historique</h2>
                                <div className="space-y-4">
                                    {pastBookings.map(booking => (
                                        <div key={booking.id} className="p-4 border-b border-gray-100 last:border-0">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium text-gray-900">{booking.service.name}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {new Date(booking.scheduledDate).toLocaleDateString('fr-FR')}
                                                    </p>
                                                </div>
                                                <span className={`text-xs px-2 py-1 rounded-full ${booking.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {booking.status === 'COMPLETED' ? 'Terminé' : 'Annulé'}
                                                </span>
                                            </div>

                                            {/* Read-only photo viewer for completed bookings (AC#9) */}
                                            {booking.status === 'COMPLETED' && booking.beforePhotoUrl && booking.afterPhotoUrl && (
                                                <div className="mt-3 grid grid-cols-2 gap-2">
                                                    <div className="space-y-1">
                                                        <p className="text-xs text-gray-400 uppercase tracking-wide">Avant</p>
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={booking.beforePhotoUrl}
                                                            alt="Photo avant lavage"
                                                            className="w-full h-20 object-cover rounded border border-gray-200"
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="text-xs text-gray-400 uppercase tracking-wide">Après</p>
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={booking.afterPhotoUrl}
                                                            alt="Photo après lavage"
                                                            className="w-full h-20 object-cover rounded border border-gray-200"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <h2 className="text-lg font-semibold mb-4">Mes Véhicules</h2>
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
