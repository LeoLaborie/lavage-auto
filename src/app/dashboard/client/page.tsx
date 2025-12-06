'use client'



import Header from '@/components/Header'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AppleEmoji } from '@/components/AppleEmoji'

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
    licensePlate?: string
}

export default function ClientDashboard() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [bookings, setBookings] = useState<Booking[]>([])
    const [cars, setCars] = useState<Car[]>([])
    const [isLoadingData, setIsLoadingData] = useState(true)
    const [showAddCarModal, setShowAddCarModal] = useState(false)
    const [newCar, setNewCar] = useState({ make: '', model: '', licensePlate: '' })

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        }
    }, [user, loading, router])

    const fetchData = async () => {
        setIsLoadingData(true)
        try {
            const [bookingsRes, carsRes] = await Promise.all([
                fetch('/api/customer/bookings'),
                fetch('/api/customer/cars')
            ])

            if (bookingsRes.ok) {
                const data = await bookingsRes.json()
                setBookings(data.bookings)
            }
            if (carsRes.ok) {
                const data = await carsRes.json()
                setCars(data.cars)
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error)
        } finally {
            setIsLoadingData(false)
        }
    }

    useEffect(() => {
        if (user) {
            fetchData()
        }
    }, [user])

    const handleAddCar = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/customer/cars/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCar)
            })
            if (res.ok) {
                setShowAddCarModal(false)
                setNewCar({ make: '', model: '', licensePlate: '' })
                fetchData() // Refresh list
            } else {
                alert('Erreur lors de l\'ajout du véhicule')
            }
        } catch (error) {
            console.error('Error adding car:', error)
        }
    }

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
                fetchData()
            } else {
                const data = await res.json()
                alert(data.error || 'Erreur lors de l\'annulation')
            }
        } catch (error) {
            console.error('Error cancelling booking:', error)
            alert('Une erreur est survenue')
        }
    }

    const handleDeleteCar = async (carId: string) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce véhicule ?')) return

        try {
            const res = await fetch('/api/customer/cars/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ carId })
            })

            if (res.ok) {
                fetchData() // Refresh list
            } else {
                const data = await res.json()
                alert(data.error || 'Erreur lors de la suppression')
            }
        } catch (error) {
            console.error('Error deleting car:', error)
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
                            {isLoadingData ? (
                                <div className="text-center py-8 text-gray-500">Chargement...</div>
                            ) : activeBookings.length === 0 ? (
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
                                                    {booking.status === 'PENDING' || booking.status === 'ASSIGNED' ? (
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
                            {cars.length > 0 && (
                                <div className="mb-4 space-y-2">
                                    {cars.map(car => (
                                        <div key={car.id} className="p-3 bg-gray-50 rounded-lg text-sm flex justify-between items-center group">
                                            <div>
                                                <p className="font-medium text-gray-900">{car.make} {car.model}</p>
                                                {car.licensePlate && <p className="text-gray-500">{car.licensePlate}</p>}
                                            </div>
                                            <button
                                                onClick={() => handleDeleteCar(car.id)}
                                                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all p-1"
                                                title="Supprimer ce véhicule"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <button
                                onClick={() => setShowAddCarModal(true)}
                                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-[#004aad] hover:text-[#004aad] transition-colors"
                            >
                                + Ajouter un véhicule
                            </button>
                        </div>
                    </div>
                </div>
            </main >

            {/* Add Car Modal */}
            {
                showAddCarModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white rounded-xl p-6 max-w-md w-full">
                            <h3 className="text-xl font-bold mb-4">Ajouter un véhicule</h3>
                            <form onSubmit={handleAddCar} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Marque</label>
                                    <input
                                        type="text"
                                        required
                                        value={newCar.make}
                                        onChange={e => setNewCar({ ...newCar, make: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                        placeholder="Ex: Peugeot"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Modèle</label>
                                    <input
                                        type="text"
                                        required
                                        value={newCar.model}
                                        onChange={e => setNewCar({ ...newCar, model: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                        placeholder="Ex: 308"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Immatriculation (optionnel)</label>
                                    <input
                                        type="text"
                                        value={newCar.licensePlate}
                                        onChange={e => setNewCar({ ...newCar, licensePlate: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                        placeholder="Ex: AA-123-BB"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddCarModal(false)}
                                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Ajouter
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    )
}
