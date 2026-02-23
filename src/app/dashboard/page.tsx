import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import ClientDashboardView from '@/components/Dashboard/ClientDashboardView'
import WasherDashboardView from '@/components/Dashboard/WasherDashboardView'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: 'Tableau de bord - Klyn',
    description: 'Gérez vos réservations de lavage auto',
}

export default async function Dashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch DB user with profile
    const dbUser = await prisma.user.findUnique({
        where: { authId: user.id },
        include: { profile: true }
    })

    if (!dbUser) {
        redirect('/onboarding')
    }

    if (dbUser.role === 'CLIENT') {
        return <ClientDashboardView />
    }

    if (dbUser.role === 'LAVEUR') {
        return <WasherDashboardView />
    }

    // Default view for ADMIN or others
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-md">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Espace Administration</h1>
                <p className="text-gray-600 mb-6">
                    Bienvenue sur le panneau d'administration. Les fonctionnalités de gestion seront bientôt disponibles ici.
                </p>
                <form action={async () => {
                    'use server'
                    const supabase = await createClient()
                    await supabase.auth.signOut()
                    redirect('/login')
                }}>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Déconnexion
                    </button>
                </form>
            </div>
        </div>
    )
}
