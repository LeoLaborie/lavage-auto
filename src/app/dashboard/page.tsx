import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

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

    const handleSignOut = async () => {
        'use server'
        const supabase = await createClient()
        await supabase.auth.signOut()
        redirect('/login')
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#004aad]/5 to-[#004aad]/10">
            {/* Top bar */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <a href="/" className="flex items-center">
                            <img src="/klyn.png" alt="Klyn" className="h-10 w-auto" />
                        </a>
                        <div className="hidden sm:block h-6 w-px bg-gray-300" />
                        <h1 className="hidden sm:block text-lg font-semibold text-gray-900">
                            Tableau de bord
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                                {dbUser.profile?.firstName || user.email}
                            </p>
                            <p className="text-xs text-gray-500 capitalize">
                                {dbUser.role === 'CLIENT' ? '🚗 Client' : dbUser.role === 'LAVEUR' ? '🧼 Laveur' : '⚙️ Admin'}
                            </p>
                        </div>
                        <form action={handleSignOut}>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                            >
                                Déconnexion
                            </button>
                        </form>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome card */}
                <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Bonjour{dbUser.profile?.firstName ? `, ${dbUser.profile.firstName}` : ''} ! 👋
                    </h2>
                    <p className="text-gray-600">
                        {dbUser.role === 'CLIENT'
                            ? 'Bienvenue sur votre espace client. Réservez votre prochain lavage auto.'
                            : dbUser.role === 'LAVEUR'
                                ? 'Bienvenue sur votre espace laveur. Consultez vos missions disponibles.'
                                : 'Bienvenue sur le panneau d\'administration.'}
                    </p>
                </div>

                {/* Role-specific content */}
                {dbUser.role === 'CLIENT' && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <a
                            href="/reserver"
                            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow group border-2 border-transparent hover:border-[#004aad]"
                        >
                            <div className="w-12 h-12 bg-[#004aad]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#004aad]/20 transition-colors">
                                <span className="text-2xl">📅</span>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">Réserver un lavage</h3>
                            <p className="text-sm text-gray-500">Planifiez un lavage à domicile ou au bureau</p>
                        </a>

                        <div className="bg-white rounded-xl shadow-md p-6 opacity-60">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                                <span className="text-2xl">📋</span>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">Mes réservations</h3>
                            <p className="text-sm text-gray-500">Disponible prochainement</p>
                        </div>

                        <div className="bg-white rounded-xl shadow-md p-6 opacity-60">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                                <span className="text-2xl">⚙️</span>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">Mon profil</h3>
                            <p className="text-sm text-gray-500">Disponible prochainement</p>
                        </div>
                    </div>
                )}

                {dbUser.role === 'LAVEUR' && (
                    <div className="bg-white rounded-xl shadow-md p-8 text-center">
                        <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">⏳</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">En attente de validation</h3>
                        <p className="text-gray-600 max-w-md mx-auto">
                            Votre inscription en tant que laveur est en cours de vérification.
                            Vous recevrez une notification une fois votre profil validé.
                        </p>
                    </div>
                )}

                {dbUser.role === 'ADMIN' && (
                    <div className="bg-white rounded-xl shadow-md p-8 text-center">
                        <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">⚙️</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Administration</h3>
                        <p className="text-gray-600">Panneau d&apos;administration disponible prochainement.</p>
                    </div>
                )}

                {/* User info card */}
                <div className="mt-8 bg-white rounded-xl shadow-md p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Informations du compte</h3>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <dt className="text-sm text-gray-500">Email</dt>
                            <dd className="text-sm font-medium text-gray-900">{user.email}</dd>
                        </div>
                        <div>
                            <dt className="text-sm text-gray-500">Rôle</dt>
                            <dd className="text-sm font-medium text-gray-900 capitalize">{dbUser.role.toLowerCase()}</dd>
                        </div>
                        <div>
                            <dt className="text-sm text-gray-500">Membre depuis</dt>
                            <dd className="text-sm font-medium text-gray-900">
                                {new Date(dbUser.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </dd>
                        </div>
                        {dbUser.profile?.firstName && (
                            <div>
                                <dt className="text-sm text-gray-500">Prénom</dt>
                                <dd className="text-sm font-medium text-gray-900">{dbUser.profile.firstName}</dd>
                            </div>
                        )}
                    </dl>
                </div>
            </main>
        </div>
    )
}
