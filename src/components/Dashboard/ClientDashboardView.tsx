'use client'

import Header from '@/components/Header'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AppleEmoji } from '@/components/AppleEmoji'
import VehicleForm from '@/components/features/dashboard/VehicleForm'
import VehicleList from '@/components/features/dashboard/VehicleList'

interface Booking {
    id: string
    scheduledDate: string
    status: string
    finalPrice: number
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
    const router = useRouter()
    const [bookings, setBookings] = useState<Booking[]>(initialBookings)

    // Sync with props when navigation/revalidation happens
    useEffect(() => {
        setBookings(initialBookings)
    }, [initialBookings])

    const handleCancelBooking = async (bookingId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) return

        try {
            const res = await fetch('/api/customer/bookings/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId })
            })

            if (res.ok) {
                alert('Réservation annulée avec succès')
                router.refresh()
            } else {
                const data = await res.json()
                alert(data.error || 'Erreur lors de l\'annulation')
            }
        } catch (error) {
            console.error('Error cancelling booking:', error)
            alert('Une erreur est survenue')
        }
    }

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Chargement...</div>
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
                                <div className="text-center py-8 text-gray-500">
                                    Aucune réservation en cours
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {activeBookings.map(booking => (
                                        <div key={booking.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-semibold text-gray-900">{booking.service.name}</span>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                            booking.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-green-100 text-green-800'
                                                            }`}>
                                                            {booking.status === 'PENDING' ? 'En attente' :
                                                                booking.status === 'ASSIGNED' ? 'Laveur assigné' : booking.status}
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
                                                            onClick={() => handleCancelBooking(booking.id)}
                                                            className="text-sm text-red-600 hover:text-red-800 font-medium underline"
                                                        >
                                                            Annuler
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </div>
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
                                        <div key={booking.id} className="flex justify-between items-center p-4 border-b border-gray-100 last:border-0">
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
        </div>
    )
}
