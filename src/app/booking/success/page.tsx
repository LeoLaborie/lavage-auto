import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Réservation confirmée',
    description: 'Votre réservation de lavage auto a été confirmée avec succès.',
}

export default async function BookingSuccessPage({
    searchParams,
}: {
    searchParams: Promise<{ bookingId?: string }>
}) {
    const { bookingId } = await searchParams

    if (!bookingId) {
        redirect('/dashboard')
    }

    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()

    if (!authUser) {
        redirect('/login')
    }

    const booking = await prisma.booking.findFirst({
        where: {
            id: bookingId,
            client: { authId: authUser.id },
        },
        include: {
            car: true,
        },
    })

    if (!booking) {
        redirect('/dashboard')
    }

    const formattedDate = new Date(booking.scheduledDate).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })

    const formattedTime = new Date(booking.scheduledDate).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
    })

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
            <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {booking.status === 'PENDING' ? 'Paiement en cours de traitement' : 'Réservation confirmée !'}
                </h1>
                <p className="text-gray-500 mb-8">
                    {booking.status === 'PENDING'
                        ? 'Votre paiement est en cours de vérification. Votre réservation sera confirmée dans quelques instants.'
                        : 'Votre paiement a été accepté. Un laveur sera assigné à votre mission prochainement.'}
                </p>

                <div className="bg-gray-50 rounded-xl p-6 text-left space-y-3 mb-8">
                    <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Service</span>
                        <span className="text-sm font-medium text-gray-900">{booking.serviceName}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Date</span>
                        <span className="text-sm font-medium text-gray-900">{formattedDate}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Heure</span>
                        <span className="text-sm font-medium text-gray-900">{formattedTime}</span>
                    </div>
                    {booking.car && (
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Véhicule</span>
                            <span className="text-sm font-medium text-gray-900">{booking.car.make} {booking.car.model}</span>
                        </div>
                    )}
                    <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Adresse</span>
                        <span className="text-sm font-medium text-gray-900 text-right max-w-[200px]">{booking.serviceAddress}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 flex justify-between">
                        <span className="text-sm font-medium text-gray-700">Total</span>
                        <span className="text-lg font-bold text-gray-900">{booking.amountCents / 100} €</span>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                        href="/dashboard"
                        className="flex-1 px-6 py-3 bg-[#004aad] text-white font-medium rounded-lg hover:bg-[#003c8a] transition-colors text-center"
                    >
                        Voir mes réservations
                    </Link>
                    <Link
                        href="/"
                        className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-center"
                    >
                        Retour à l&apos;accueil
                    </Link>
                </div>
            </div>
        </div>
    )
}
