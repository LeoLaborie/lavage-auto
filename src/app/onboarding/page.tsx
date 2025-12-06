'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Onboarding() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const supabase = createClient()

    const handleRoleSelection = async (role: 'CLIENT' | 'WASHER') => {
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
                    email: user.email,
                    name: user.user_metadata.full_name || user.email?.split('@')[0],
                    avatarUrl: user.user_metadata.avatar_url
                }),
            })

            if (!response.ok) {
                throw new Error('Failed to create profile')
            }

            // Refresh session to ensure middleware picks up new role/data if needed
            await supabase.auth.refreshSession()

            // Redirect based on role
            if (role === 'CLIENT') {
                router.push('/dashboard/client')
            } else {
                router.push('/dashboard/laveur')
            }

            router.refresh()

        } catch (err) {
            console.error('Error selecting role:', err)
            setError('Une erreur est survenue lors de la création de votre profil.')
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
                        Comment souhaitez-vous utiliser l'application ?
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
                        className="group relative bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 text-left border-2 border-transparent hover:border-[#004aad]"
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
                                Continuer comme Client
                            </div>
                        </div>
                    </button>

                    {/* Washer Card */}
                    <button
                        onClick={() => handleRoleSelection('WASHER')}
                        disabled={loading}
                        className="group relative bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 text-left border-2 border-transparent hover:border-green-500"
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
                                Continuer comme Laveur
                            </div>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    )
}
