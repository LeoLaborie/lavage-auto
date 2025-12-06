'use client'

import Header from '@/components/Header'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AppleEmoji } from '@/components/AppleEmoji'

interface Mission {
    id: string
    scheduledDate: string
    serviceAddress: string
    finalPrice: number
    service: {
        name: string
        estimatedDuration: number
    }
    car: {
        make: string
        model: string
    }
    customer: {
        name: string
    }
}

export default function WasherDashboard() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [isAvailable, setIsAvailable] = useState(true)
    const [activeTab, setActiveTab] = useState<'available' | 'accepted'>('available')

    const [availableMissions, setAvailableMissions] = useState<Mission[]>([])
    const [acceptedMissions, setAcceptedMissions] = useState<Mission[]>([])

    const [isLoading, setIsLoading] = useState(true)
    const [acceptingId, setAcceptingId] = useState<string | null>(null)

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        }
    }, [user, loading, router])

    const fetchMissions = async () => {
        setIsLoading(true)
        try {
            // Fetch available missions
            const availableRes = await fetch('/api/washer/missions/available')
            if (availableRes.ok) {
                const data = await availableRes.json()
                setAvailableMissions(data.bookings)
            }

            // Fetch accepted missions
            const acceptedRes = await fetch('/api/washer/missions/accepted')
            if (acceptedRes.ok) {
                const data = await acceptedRes.json()
                setAcceptedMissions(data.bookings)
            }
        } catch (error) {
            console.error('Error fetching missions:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (user) {
            fetchMissions()
        }
    }, [user])

    const handleAcceptMission = async (missionId: string) => {
        setAcceptingId(missionId)
        try {
            const response = await fetch('/api/washer/missions/accept', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ bookingId: missionId })
            })

            if (response.ok) {
                await fetchMissions()
                alert('Mission acceptée avec succès !')
                setActiveTab('accepted') // Switch to accepted tab
            } else {
                const error = await response.json()
                alert(error.error || 'Erreur lors de l\'acceptation de la mission')
            }
        } catch (error) {
            console.error('Error accepting mission:', error)
            alert('Une erreur est survenue')
        } finally {
            setAcceptingId(null)
        }
    }

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Chargement...</div>
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-gray-50">
            <Header currentPage="dashboard" />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Espace Laveur</h1>
                        <p className="text-gray-600 mt-2">Gérez vos missions et vos disponibilités</p>
                    </div>

                    <div className="flex items-center bg-white rounded-full p-1 shadow-sm border border-gray-200">
                        <button
                            onClick={() => setIsAvailable(true)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${isAvailable ? 'bg-green-500 text-white' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Disponible
                        </button>
                        <button
                            onClick={() => setIsAvailable(false)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${!isAvailable ? 'bg-red-500 text-white' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Indisponible
                        </button>
                    </div>
                </div>

                <div className="grid md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500 mb-1">Gains du jour</p>
                        <p className="text-2xl font-bold text-gray-900">0,00 €</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500 mb-1">Lavages réalisés</p>
                        <p className="text-2xl font-bold text-gray-900">{acceptedMissions.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500 mb-1">Note moyenne</p>
                        <p className="text-2xl font-bold text-gray-900">-</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-500 mb-1">Prochain rdv</p>
                        <p className="text-lg font-medium text-gray-900">
                            {acceptedMissions.length > 0
                                ? new Date(acceptedMissions[0].scheduledDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                                : 'Aucun'}
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="border-b border-gray-100">
                        <div className="flex">
                            <button
                                onClick={() => setActiveTab('available')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'available'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Missions disponibles ({availableMissions.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('accepted')}
                                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'accepted'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Mes missions ({acceptedMissions.length})
                            </button>
                        </div>
                    </div>

                    <div className="p-6 flex justify-end">
                        <button
                            onClick={fetchMissions}
                            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                            <span className="text-lg">↻</span> Actualiser
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500">Chargement des missions...</div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {(activeTab === 'available' ? availableMissions : acceptedMissions).length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    {activeTab === 'available'
                                        ? 'Aucune mission disponible dans votre secteur pour le moment.'
                                        : 'Vous n\'avez aucune mission prévue.'}
                                </div>
                            ) : (
                                (activeTab === 'available' ? availableMissions : acceptedMissions).map((mission) => (
                                    <div key={mission.id} className="p-6 hover:bg-gray-50 transition-colors">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${activeTab === 'accepted' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                        {mission.service.name}
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        {new Date(mission.scheduledDate).toLocaleString('fr-FR', {
                                                            weekday: 'long',
                                                            day: 'numeric',
                                                            month: 'long',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg font-medium text-gray-900 mb-1">
                                                    {mission.serviceAddress}
                                                </h3>
                                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                                    <span className="flex items-center gap-1">
                                                        <AppleEmoji name="car" className="w-4 h-4" />
                                                        {mission.car.model}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <AppleEmoji name="clock" className="w-4 h-4" />
                                                        {mission.service.estimatedDuration} min
                                                    </span>
                                                    {activeTab === 'accepted' && (
                                                        <span className="flex items-center gap-1 text-blue-600">
                                                            <AppleEmoji name="bust_in_silhouette" className="w-4 h-4" />
                                                            {mission.customer.name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 w-full md:w-auto">
                                                <div className="text-right flex-1 md:flex-none">
                                                    <p className="text-lg font-bold text-gray-900">{mission.finalPrice} €</p>
                                                    <p className="text-xs text-gray-500">Commission incluse</p>
                                                </div>
                                                {activeTab === 'available' && (
                                                    <button
                                                        onClick={() => handleAcceptMission(mission.id)}
                                                        disabled={acceptingId === mission.id}
                                                        className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                                    >
                                                        {acceptingId === mission.id ? 'Acceptation...' : 'Accepter'}
                                                    </button>
                                                )}
                                                {activeTab === 'accepted' && (
                                                    <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg font-medium text-sm">
                                                        Acceptée
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
