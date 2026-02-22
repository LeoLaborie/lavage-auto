'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Onboarding() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const supabase = createClient()

    const handleRoleSelection = async (role: 'CLIENT' | 'LAVEUR') => {
        setLoading(true)
        setError('')

        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            const response = await fetch('/api/auth/create-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    role,
                    name: user.user_metadata.full_name || user.email?.split('@')[0],
                }),
            })

            const data = await response.json()

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Échec de la création du profil')
            }

            // Redirect based on role
            if (role === 'CLIENT') {
                router.push('/dashboard')
            } else {
                // Laveur goes to a pending page until validated
                router.push('/dashboard')
            }

            router.refresh()

        } catch (err) {
            console.error('Error selecting role:', err)
            setError(err instanceof Error ? err.message : 'Une erreur est survenue lors de la création de votre profil.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#004aad]/5 to-[#004aad]/10 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Bienvenue sur Klyn !
                    </h1>
                    <p className="text-xl text-gray-600">
                        Comment souhaitez-vous utiliser l&apos;application ?
                    </p>
                </div>

                {error && (
                    <div className="max-w-md mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
                        {error}
                    </div>
                )}

                <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                    {/* Client Card */}
                    <button
                        onClick={() => handleRoleSelection('CLIENT')}
                        disabled={loading}
                        className="group relative bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 text-left border-2 border-transparent hover:border-[#004aad] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="h-full flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-[#004aad]/10 transition-colors">
                                <span className="text-4xl">🚗</span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                Je veux faire laver ma voiture
                            </h2>
                            <p className="text-gray-600 mb-8 flex-grow">
                                Réservez un lavage professionnel à domicile ou au bureau en quelques clics.
                            </p>
                            <div className="w-full py-3 px-6 bg-[#004aad] text-white rounded-lg font-medium opacity-90 group-hover:opacity-100 transition-opacity">
                                {loading ? 'Création...' : 'Continuer comme Client'}
                            </div>
                        </div>
                    </button>

                    {/* Laveur Card */}
                    <button
                        onClick={() => handleRoleSelection('LAVEUR')}
                        disabled={loading}
                        className="group relative bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 text-left border-2 border-transparent hover:border-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <div className="h-full flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-green-100 transition-colors">
                                <span className="text-4xl">🧼</span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">
                                Je veux devenir laveur
                            </h2>
                            <p className="text-gray-600 mb-8 flex-grow">
                                Rejoignez notre réseau de professionnels, gérez votre emploi du temps et augmentez vos revenus.
                            </p>
                            <div className="w-full py-3 px-6 bg-green-600 text-white rounded-lg font-medium opacity-90 group-hover:opacity-100 transition-opacity">
                                {loading ? 'Création...' : 'Continuer comme Laveur'}
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    )
}
