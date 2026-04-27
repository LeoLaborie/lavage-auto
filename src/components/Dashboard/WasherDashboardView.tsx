'use client'

import NavCinetique from '@/components/landing/NavCinetique'
import { Skeleton, SkeletonStatsCard, SkeletonMissionCard } from '@/components/ui/Skeleton'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Icon } from '@/components/ui/Icon'

import { startStripeOnboarding } from '@/lib/actions/washer-stripe'
import PhotoUploader from '@/components/features/laveur/PhotoUploader'
import EmptyState, { MissionIcon } from '@/components/ui/EmptyState'
import dynamic from 'next/dynamic'
import MapSkeleton from '@/components/Map/MapSkeleton'

const AddressMap = dynamic(() => import('@/components/Map/AddressMap'), {
    ssr: false,
    loading: () => <MapSkeleton height={220} />,
})

interface Mission {
    id: string
    status: string
    scheduledDate: string
    serviceAddress: string
    serviceLat?: number | null
    serviceLng?: number | null
    finalPrice: number
    grossAmountCents: number
    netAmountCents: number
    commissionCents: number
    beforePhotoUrl?: string | null
    afterPhotoUrl?: string | null
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

interface WasherDashboardProps {
    user: {
        id: string
        email: string
        profile: {
            stripeAccountId: string | null
            stripeAccountReady?: boolean
            status: string
            isAvailable?: boolean
        } | null
    }
}

interface EarningsSummary {
    validatedEarningsCents: number
    pendingEarningsCents: number
    upcomingEarningsCents: number
    completedMissionsCount: number
    totalCommissionCents: number
    currentCommissionRate: number
}

function formatEuros(amountCents: number): string {
    return (amountCents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
}

const PILL_BASE =
    'inline-flex items-center rounded-md px-2 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.05em]'

const MISSION_STATUS: Record<string, { className: string; label: string }> = {
    ACCEPTED: { className: 'bg-blue/10 text-blue', label: 'Accepté' },
    EN_ROUTE: { className: 'bg-blue/10 text-blue', label: 'En route' },
    IN_PROGRESS: { className: 'bg-blue-wash text-blue', label: 'En cours' },
    COMPLETED: { className: 'bg-ink text-white', label: 'Terminé' },
    CANCELLED: { className: 'bg-rule text-ink2', label: 'Annulé' },
}

function MissionStatusBadge({ status }: { status: string }) {
    const cfg = MISSION_STATUS[status] ?? { className: 'bg-blue-wash text-ink2', label: status }
    return <span className={`${PILL_BASE} ${cfg.className}`}>{cfg.label}</span>
}

const CARD_SHELL =
    'rounded-[20px] bg-white p-5 shadow-cin-card border border-rule md:p-6'
const KPI_LABEL =
    'font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-ink2/70 md:text-xs'
const KPI_VALUE =
    'mt-2 font-display text-[24px] font-extrabold leading-none tracking-[-0.03em] text-ink md:text-[32px]'
const KPI_HINT = 'mt-1.5 text-[11px] text-ink2/60 md:text-xs'

export default function WasherDashboardView({ user: initialUser }: WasherDashboardProps) {
    const { user, loading } = useAuth()
    const { toast } = useToast()
    const router = useRouter()
    const [isAvailable, setIsAvailable] = useState(initialUser.profile?.isAvailable ?? true)
    const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false)
    const [activeTab, setActiveTab] = useState<'available' | 'accepted' | 'payments'>('available')

    const handleUpdateAvailability = async (available: boolean) => {
        setIsUpdatingAvailability(true)
        try {
            const res = await fetch('/api/washer/availability', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isAvailable: available })
            })
            if (res.ok) {
                const data = await res.json()
                setIsAvailable(data.data.isAvailable)
                if (data.data.isAvailable) {
                    fetchMissions()
                } else {
                    setAvailableMissions([])
                }
            } else {
                toast.error('Erreur lors de la mise à jour de la disponibilité')
            }
        } catch (error) {
            console.error('Failed to update availability', error)
            toast.error('Une erreur est survenue')
        } finally {
            setIsUpdatingAvailability(false)
        }
    }

    const [availableMissions, setAvailableMissions] = useState<Mission[]>([])
    const [acceptedMissions, setAcceptedMissions] = useState<Mission[]>([])
    const [expandedMapId, setExpandedMapId] = useState<string | null>(null)

    const [isLoading, setIsLoading] = useState(true)
    const [acceptingId, setAcceptingId] = useState<string | null>(null)
    const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)
    const [isOnboarding, setIsOnboarding] = useState(false)

    const [earnings, setEarnings] = useState<EarningsSummary | null>(null)
    const [isEarningsLoading, setIsEarningsLoading] = useState(false)

    const fetchMissions = async () => {
        setIsLoading(true)
        try {
            const availableRes = await fetch('/api/washer/missions/available')
            if (availableRes.ok) {
                const data = await availableRes.json()
                setAvailableMissions(data.data.bookings)
            }

            const acceptedRes = await fetch('/api/washer/missions/accepted')
            if (acceptedRes.ok) {
                const data = await acceptedRes.json()
                setAcceptedMissions(data.data.bookings)
            }
        } catch (error) {
            console.error('Error fetching missions:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchEarnings = async () => {
        setIsEarningsLoading(true)
        try {
            const res = await fetch('/api/washer/earnings')
            if (res.ok) {
                const data = await res.json()
                if (data.success) {
                    setEarnings(data.data)
                }
            }
        } catch (error) {
            console.error('Error fetching earnings:', error)
        } finally {
            setIsEarningsLoading(false)
        }
    }

    useEffect(() => {
        if (user) {
            fetchMissions()
            fetchEarnings()
        }
    }, [user])

    const handleAcceptMission = async (missionId: string) => {
        setAcceptingId(missionId)
        try {
            const response = await fetch('/api/washer/missions/accept', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId: missionId })
            })

            if (response.ok) {
                await fetchMissions()
                toast.success('Mission acceptée avec succès !')
                setActiveTab('accepted')
            } else {
                const error = await response.json()
                toast.error(error.error || 'Erreur lors de l\'acceptation de la mission')
            }
        } catch (error) {
            console.error('Error accepting mission:', error)
            toast.error('Une erreur est survenue')
        } finally {
            setAcceptingId(null)
        }
    }

    const handleUpdateStatus = async (missionId: string, newStatus: 'EN_ROUTE' | 'IN_PROGRESS') => {
        setUpdatingStatusId(missionId)
        try {
            const response = await fetch(`/api/washer/missions/${missionId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            })
            if (response.ok) {
                await fetchMissions()
            } else {
                const error = await response.json()
                toast.error(error.error || 'Erreur lors de la mise à jour du statut')
            }
        } catch (error) {
            console.error('Error updating mission status:', error)
            toast.error('Une erreur est survenue')
        } finally {
            setUpdatingStatusId(null)
        }
    }

    const handleConnectStripe = async () => {
        setIsOnboarding(true)
        try {
            const result = await startStripeOnboarding()
            if (result.success && result.data?.url) {
                window.location.href = result.data.url
            } else {
                toast.error(result.error || 'Erreur lors de l\'initialisation de Stripe')
            }
        } catch (error) {
            console.error('Stripe onboarding error:', error)
            toast.error('Une erreur est survenue lors de la connexion à Stripe')
        } finally {
            setIsOnboarding(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <NavCinetique />
                <main className="mx-auto max-w-cin px-5 py-10 md:px-12 md:py-14">
                    <div className="mb-8">
                        <Skeleton className="h-4 w-24 mb-3" />
                        <Skeleton className="h-12 w-64 mb-2" />
                        <Skeleton className="h-5 w-72" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 sm:gap-5 mb-8 md:grid-cols-4">
                        <SkeletonStatsCard />
                        <SkeletonStatsCard />
                        <SkeletonStatsCard />
                        <SkeletonStatsCard />
                    </div>
                    <div className="rounded-[20px] border border-rule bg-white shadow-cin-card overflow-hidden">
                        <div className="border-b border-rule p-4 flex gap-4">
                            <Skeleton className="h-8 w-32" />
                            <Skeleton className="h-8 w-28" />
                            <Skeleton className="h-8 w-24" />
                        </div>
                        <div className="divide-y divide-rule">
                            <SkeletonMissionCard />
                            <SkeletonMissionCard />
                            <SkeletonMissionCard />
                        </div>
                    </div>
                </main>
            </div>
        )
    }

    if (!user) return null

    const stripeConnected = !!initialUser.profile?.stripeAccountReady

    function tabClass(tab: 'available' | 'accepted' | 'payments') {
        const base = '-mb-px cursor-pointer whitespace-nowrap border-b-2 px-3 py-3 font-cinsans text-xs font-medium transition-colors sm:px-5 sm:py-4 sm:text-sm'
        return activeTab === tab
            ? `${base} border-blue text-blue`
            : `${base} border-transparent text-ink2 hover:text-ink`
    }

    return (
        <div className="min-h-screen bg-white">
            <NavCinetique />

            <main className="mx-auto max-w-cin px-5 py-10 md:px-12 md:py-14">
                <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row md:mb-10">
                    <div>
                        <span className="mb-3 inline-block rounded-md bg-blue-wash px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-blue md:text-xs">
                            Espace laveur
                        </span>
                        <h1 className="font-display text-[40px] font-extrabold leading-[0.95] tracking-[-0.04em] text-ink md:text-[56px]">
                            Mes missions
                        </h1>
                        <p className="mt-3 text-[15px] text-ink2 md:text-[17px]">
                            Gérez vos missions et vos disponibilités.
                        </p>
                    </div>

                    <div className="flex shrink-0 items-center rounded-full border border-rule bg-white p-1 shadow-cin-card">
                        <button
                            onClick={() => handleUpdateAvailability(true)}
                            disabled={isUpdatingAvailability || isAvailable}
                            className={`rounded-full px-4 py-2 font-cinsans text-xs font-semibold transition-colors disabled:opacity-50 sm:text-sm ${isAvailable ? 'bg-ink text-white' : 'text-ink2 hover:text-ink'}`}
                        >
                            {isUpdatingAvailability && isAvailable ? 'Mise à jour…' : 'Disponible'}
                        </button>
                        <button
                            onClick={() => handleUpdateAvailability(false)}
                            disabled={isUpdatingAvailability || !isAvailable}
                            className={`rounded-full px-4 py-2 font-cinsans text-xs font-semibold transition-colors disabled:opacity-50 sm:text-sm ${!isAvailable ? 'bg-rule text-ink' : 'text-ink2 hover:text-ink'}`}
                        >
                            {isUpdatingAvailability && !isAvailable ? 'Mise à jour…' : 'Indisponible'}
                        </button>
                    </div>
                </div>

                <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
                    <div className={CARD_SHELL}>
                        <p className={KPI_LABEL}>Gains validés</p>
                        <p className={`${KPI_VALUE} truncate`}>
                            {earnings ? formatEuros(earnings.validatedEarningsCents) : '—'}
                        </p>
                        <p className={KPI_HINT}>Net, virements effectués</p>
                    </div>
                    <div className={CARD_SHELL}>
                        <p className={KPI_LABEL}>À venir</p>
                        <p className={`${KPI_VALUE} truncate`}>
                            {earnings ? formatEuros(earnings.upcomingEarningsCents) : '—'}
                        </p>
                        <p className={KPI_HINT}>Missions en cours</p>
                    </div>
                    <div className={CARD_SHELL}>
                        <p className={KPI_LABEL}>Lavages réalisés</p>
                        <p className={KPI_VALUE}>{earnings?.completedMissionsCount ?? 0}</p>
                        <p className={KPI_HINT}>Au total</p>
                    </div>
                    <div className={CARD_SHELL}>
                        <p className={KPI_LABEL}>Stripe Connect</p>
                        <p className={`mt-2 font-display text-[18px] font-bold tracking-[-0.02em] md:text-[20px] ${stripeConnected ? 'text-ink' : 'text-amber-700'}`}>
                            {stripeConnected ? 'Activé' : 'Non configuré'}
                        </p>
                        <p className={KPI_HINT}>{stripeConnected ? 'Compte prêt' : 'Action requise'}</p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-[20px] border border-rule bg-white shadow-cin-card">
                    <div className="border-b border-rule">
                        <div className="flex overflow-x-auto px-2 sm:px-4">
                            <button onClick={() => setActiveTab('available')} className={tabClass('available')}>
                                <span className="sm:hidden">Dispo. ({availableMissions.length})</span>
                                <span className="hidden sm:inline">Missions disponibles ({availableMissions.length})</span>
                            </button>
                            <button onClick={() => setActiveTab('accepted')} className={tabClass('accepted')}>
                                <span className="sm:hidden">Mes missions ({acceptedMissions.length})</span>
                                <span className="hidden sm:inline">Mes missions ({acceptedMissions.length})</span>
                            </button>
                            <button onClick={() => setActiveTab('payments')} className={tabClass('payments')}>
                                Paiements
                            </button>
                        </div>
                    </div>

                    {activeTab === 'payments' ? (
                        <div className="max-w-3xl p-6 md:p-8">
                            <h2 className="font-display text-[22px] font-bold tracking-[-0.02em] text-ink md:text-[28px]">
                                Configuration des revenus
                            </h2>
                            <p className="mt-3 text-[15px] leading-relaxed text-ink2 md:text-[17px]">
                                Pour recevoir vos paiements automatiquement après chaque mission, connectez un compte bancaire via notre partenaire Stripe.
                            </p>

                            <div className="mt-6 flex items-start gap-4 rounded-[16px] border border-rule bg-blue-wash p-5">
                                <div className="shrink-0 rounded-[14px] bg-white p-2 shadow-cin-card">
                                    <Icon name="bank" className="h-6 w-6 text-ink" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-display text-[15px] font-bold tracking-[-0.02em] text-ink md:text-[17px]">
                                        {stripeConnected ? 'Votre compte Stripe est configuré' : 'Action requise : configuration Stripe'}
                                    </p>
                                    <p className="mt-1 break-words text-sm text-ink2">
                                        {stripeConnected
                                            ? `ID de compte : ${initialUser.profile?.stripeAccountId?.slice(0, 10)}…`
                                            : 'Vous devez compléter l\'onboarding Stripe pour pouvoir recevoir vos fonds.'}
                                    </p>
                                </div>
                            </div>

                            {!stripeConnected ? (
                                <button
                                    onClick={handleConnectStripe}
                                    disabled={isOnboarding}
                                    className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3.5 font-cinsans text-sm font-semibold text-white shadow-cin-button transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 md:px-7 md:text-[15px]"
                                >
                                    {isOnboarding ? 'Initialisation…' : (
                                        <>
                                            Connecter mon compte bancaire
                                            <span aria-hidden className="text-base leading-none">→</span>
                                        </>
                                    )}
                                </button>
                            ) : (
                                <div className="mt-6 flex flex-wrap items-center gap-4">
                                    <span className={`${PILL_BASE} bg-ink text-white`}>Compte lié</span>
                                    <p className="text-sm italic text-ink2">
                                        Les virements seront effectués automatiquement après validation de mission.
                                    </p>
                                </div>
                            )}

                            <div className="mt-10">
                                <h2 className="font-display text-[22px] font-bold tracking-[-0.02em] text-ink md:text-[28px]">
                                    Récapitulatif des gains
                                </h2>
                                {isEarningsLoading ? (
                                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        <SkeletonStatsCard />
                                        <SkeletonStatsCard />
                                        <SkeletonStatsCard />
                                    </div>
                                ) : (
                                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        <div className="rounded-[16px] border border-rule bg-white p-5 shadow-cin-card">
                                            <p className={KPI_LABEL}>Gains validés</p>
                                            <p className={KPI_VALUE}>
                                                {earnings ? formatEuros(earnings.validatedEarningsCents) : '0,00 €'}
                                            </p>
                                            <p className={KPI_HINT}>Virements effectués</p>
                                        </div>
                                        <div className="rounded-[16px] border border-rule bg-white p-5 shadow-cin-card">
                                            <p className={KPI_LABEL}>En attente de versement</p>
                                            <p className={KPI_VALUE}>
                                                {earnings ? formatEuros(earnings.pendingEarningsCents) : '0,00 €'}
                                            </p>
                                            <p className={KPI_HINT}>En cours de traitement</p>
                                        </div>
                                        <div className="rounded-[16px] border border-rule bg-blue-wash p-5">
                                            <p className={KPI_LABEL}>Missions complétées</p>
                                            <p className={`${KPI_VALUE} text-blue`}>
                                                {earnings ? earnings.completedMissionsCount : 0}
                                            </p>
                                            <p className={KPI_HINT}>Au total</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex justify-end p-4 md:p-5">
                                <button
                                    onClick={fetchMissions}
                                    className="inline-flex items-center gap-1.5 font-cinsans text-xs font-semibold text-blue transition-colors hover:text-ink md:text-sm"
                                >
                                    <span className="text-base leading-none">↻</span> Actualiser
                                </button>
                            </div>

                            {isLoading ? (
                                <div className="divide-y divide-rule">
                                    <SkeletonMissionCard />
                                    <SkeletonMissionCard />
                                    <SkeletonMissionCard />
                                </div>
                            ) : (
                                <div className="divide-y divide-rule">
                                    {(activeTab === 'available' ? availableMissions : acceptedMissions).length === 0 ? (
                                        <EmptyState
                                            icon={<MissionIcon />}
                                            title={activeTab === 'available' ? 'Aucune mission disponible' : 'Aucune mission prévue'}
                                            description={activeTab === 'available'
                                                ? "Il n'y a pas de mission dans votre secteur pour le moment. Revenez bientôt !"
                                                : "Vous n'avez aucune mission prévue. Consultez les missions disponibles."}
                                            action={activeTab === 'accepted' ? { label: 'Voir les missions disponibles', onClick: () => setActiveTab('available') } : undefined}
                                        />
                                    ) : (
                                        (activeTab === 'available' ? availableMissions : acceptedMissions).map((mission) => (
                                            <div key={mission.id} className="p-5 transition-colors hover:bg-blue-wash/40 md:p-6">
                                                <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="mb-2 flex flex-wrap items-center gap-2">
                                                            <span className={`${PILL_BASE} bg-blue-wash text-blue`}>
                                                                {mission.service.name}
                                                            </span>
                                                            {activeTab === 'accepted' && (
                                                                <MissionStatusBadge status={mission.status} />
                                                            )}
                                                            <span className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink2/70 md:text-xs">
                                                                {new Date(mission.scheduledDate).toLocaleString('fr-FR', {
                                                                    weekday: 'long',
                                                                    day: 'numeric',
                                                                    month: 'long',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </span>
                                                        </div>
                                                        <h3 className="mb-2 break-words font-display text-[18px] font-bold tracking-[-0.02em] text-ink md:text-[22px]">
                                                            {mission.serviceAddress}
                                                        </h3>
                                                        <div className="flex flex-wrap items-center gap-3 text-sm text-ink2 sm:gap-4">
                                                            <span className="inline-flex items-center gap-1.5">
                                                                <Icon name="car" className="h-4 w-4" />
                                                                {mission.car.model}
                                                            </span>
                                                            <span className="inline-flex items-center gap-1.5">
                                                                <Icon name="clock" className="h-4 w-4" />
                                                                {mission.service.estimatedDuration} min
                                                            </span>
                                                            {activeTab === 'accepted' && (
                                                                <span className="inline-flex items-center gap-1.5 text-blue">
                                                                    <Icon name="user" className="h-4 w-4" />
                                                                    {mission.customer.name}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex w-full items-center gap-4 md:w-auto">
                                                        <div className="flex-1 text-right md:flex-none">
                                                            <p className="font-display text-[22px] font-extrabold leading-none tracking-[-0.03em] text-ink md:text-[26px]">
                                                                {formatEuros(mission.netAmountCents)}
                                                            </p>
                                                            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.05em] text-ink2/70 md:text-[11px]">
                                                                {formatEuros(mission.grossAmountCents)} brut
                                                                {earnings?.currentCommissionRate != null && (
                                                                    <> · {(earnings.currentCommissionRate * 100).toFixed(0)}% commission</>
                                                                )}
                                                            </p>
                                                        </div>
                                                        {activeTab === 'available' && (
                                                            <button
                                                                onClick={() => handleAcceptMission(mission.id)}
                                                                disabled={acceptingId === mission.id}
                                                                className="whitespace-nowrap rounded-xl bg-ink px-5 py-2.5 font-cinsans text-sm font-semibold text-white shadow-cin-button transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                                                            >
                                                                {acceptingId === mission.id ? 'Acceptation…' : 'Accepter'}
                                                            </button>
                                                        )}
                                                        {activeTab === 'accepted' && (
                                                            <div className="flex items-center gap-2">
                                                                {mission.status === 'ACCEPTED' && (
                                                                    <button
                                                                        onClick={() => handleUpdateStatus(mission.id, 'EN_ROUTE')}
                                                                        disabled={updatingStatusId === mission.id}
                                                                        className="rounded-xl bg-ink px-4 py-2 font-cinsans text-xs font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:text-sm"
                                                                    >
                                                                        {updatingStatusId === mission.id ? 'Mise à jour…' : 'En route'}
                                                                    </button>
                                                                )}
                                                                {mission.status === 'EN_ROUTE' && (
                                                                    <button
                                                                        onClick={() => handleUpdateStatus(mission.id, 'IN_PROGRESS')}
                                                                        disabled={updatingStatusId === mission.id}
                                                                        className="rounded-xl bg-ink px-4 py-2 font-cinsans text-xs font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 sm:text-sm"
                                                                    >
                                                                        {updatingStatusId === mission.id ? 'Mise à jour…' : 'Démarrer le lavage'}
                                                                    </button>
                                                                )}
                                                                {mission.status === 'IN_PROGRESS' && (
                                                                    <span className={`${PILL_BASE} bg-blue-wash text-blue`}>
                                                                        En cours
                                                                    </span>
                                                                )}
                                                                {!['ACCEPTED', 'EN_ROUTE', 'IN_PROGRESS'].includes(mission.status) && (
                                                                    <MissionStatusBadge status={mission.status} />
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {activeTab === 'accepted' && (
                                                    <div className="mt-4 space-y-3 border-t border-rule pt-4">
                                                        {!mission.beforePhotoUrl &&
                                                            (mission.status === 'ACCEPTED' || mission.status === 'EN_ROUTE') && (
                                                                <PhotoUploader
                                                                    bookingId={mission.id}
                                                                    type="avant"
                                                                    onSuccess={() => fetchMissions()}
                                                                />
                                                            )}

                                                        {mission.beforePhotoUrl && (
                                                            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.05em] text-blue md:text-xs">
                                                                <span aria-hidden>✓</span>
                                                                <span>Photo Avant enregistrée</span>
                                                            </div>
                                                        )}

                                                        {mission.beforePhotoUrl &&
                                                            !mission.afterPhotoUrl &&
                                                            mission.status === 'IN_PROGRESS' && (
                                                                <PhotoUploader
                                                                    bookingId={mission.id}
                                                                    type="apres"
                                                                    onSuccess={() => fetchMissions()}
                                                                />
                                                            )}

                                                        {mission.afterPhotoUrl && (
                                                            <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.05em] text-blue md:text-xs">
                                                                <span aria-hidden>✓</span>
                                                                <span>Photo Après enregistrée — En attente de validation client</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="mt-4 border-t border-rule pt-4">
                                                    {expandedMapId === mission.id ? (
                                                        <>
                                                            <AddressMap
                                                                address={mission.serviceAddress}
                                                                lat={mission.serviceLat ?? null}
                                                                lng={mission.serviceLng ?? null}
                                                                draggable={false}
                                                                height={220}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setExpandedMapId(null)}
                                                                className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-rule bg-white px-4 py-2 font-cinsans text-sm font-semibold text-ink2 transition-colors hover:bg-blue-wash"
                                                            >
                                                                Masquer la carte
                                                            </button>
                                                        </>
                                                    ) : mission.serviceLat != null && mission.serviceLng != null ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setExpandedMapId(mission.id)}
                                                            data-testid={`view-map-${mission.id}`}
                                                            className="inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-rule bg-white px-4 py-2 font-cinsans text-sm font-semibold text-ink transition-colors hover:bg-blue-wash"
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                                                <circle cx="12" cy="10" r="3"/>
                                                            </svg>
                                                            Voir sur la carte
                                                        </button>
                                                    ) : (
                                                        <a
                                                            href={`https://maps.google.com/?q=${encodeURIComponent(mission.serviceAddress)}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex items-center justify-center gap-1.5 rounded-[10px] border border-rule bg-white px-4 py-2 font-cinsans text-sm font-semibold text-ink2 transition-colors hover:bg-blue-wash"
                                                        >
                                                            Voir sur Google Maps ↗
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </div>
    )
}
