import Header from '@/components/Header'
import PendingValidationState from '@/components/features/laveur/PendingValidationState'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export default async function LaveurLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id }
    })

    if (!profile) {
        redirect('/dashboard')
    }

    // Explicitly allow VALIDATED to access the dashboard tools
    if (profile.status === 'VALIDATED') {
        return <>{children}</>
    }

    // Handle specific blocked states
    if (profile.status === 'REJECTED') {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header currentPage="dashboard" />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-red-100 max-w-3xl mx-auto text-center">
                        <h2 className="text-2xl font-bold text-red-600 mb-2">Inscription refusée</h2>
                        <p className="text-gray-600">Votre demande d'inscription n'a pas été retenue.</p>
                    </div>
                </main>
            </div>
        )
    }

    if (profile.status === 'VALIDATION_PENDING') {
        return (
            <div className="min-h-screen bg-gray-50">
                <Header currentPage="dashboard" />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 mb-8 max-w-3xl mx-auto">
                        <PendingValidationState />
                    </div>
                </main>
            </div>
        )
    }

    // Default fail-closed for any unrecognized status
    return (
        <div className="min-h-screen bg-gray-50">
            <Header currentPage="dashboard" />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-yellow-100 max-w-3xl mx-auto text-center">
                    <h2 className="text-2xl font-bold text-yellow-600 mb-2">Statut de profil inattendu</h2>
                    <p className="text-gray-600">Veuillez contacter le support pour réviser l'état de votre compte.</p>
                </div>
            </main>
        </div>
    )
}
