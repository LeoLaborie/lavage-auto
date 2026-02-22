'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Step = 'role-selection' | 'laveur-siret'

export default function Onboarding() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [step, setStep] = useState<Step>('role-selection')
    const [siret, setSiret] = useState('')
    const [companyName, setCompanyName] = useState('')
    const [siretError, setSiretError] = useState('')
    const supabase = useMemo(() => createClient(), [])

    const formatSiret = (value: string): string => {
        const digits = value.replace(/\D/g, '').slice(0, 14)
        // Format as XXX XXX XXX XXXXX (SIREN + NIC)
        if (digits.length <= 3) return digits
        if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`
        if (digits.length <= 9) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
        return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`
    }

    const handleSiretChange = (value: string) => {
        const formatted = formatSiret(value)
        setSiret(formatted)
        setSiretError('')

        const digits = formatted.replace(/\s/g, '')
        if (digits.length > 0 && digits.length < 14) {
            setSiretError(`${digits.length}/14 chiffres`)
        }
    }

    const isSiretValid = (): boolean => {
        const digits = siret.replace(/\s/g, '')
        return /^\d{14}$/.test(digits)
    }

    const handleRoleSelection = async (role: 'CLIENT' | 'LAVEUR') => {
        if (role === 'LAVEUR') {
            setStep('laveur-siret')
            return
        }

        // CLIENT flow — direct creation
        await submitProfile('CLIENT')
    }

    const handleLaveurSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isSiretValid()) {
            setSiretError('Le SIRET doit contenir exactement 14 chiffres.')
            return
        }
        await submitProfile('LAVEUR')
    }

    const submitProfile = async (role: 'CLIENT' | 'LAVEUR') => {
        setLoading(true)
        setError('')

        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            const body: Record<string, string> = {
                role,
                name: user.user_metadata.full_name || user.email?.split('@')[0] || '',
            }

            if (role === 'LAVEUR') {
                body.siret = siret.replace(/\s/g, '')
                if (companyName.trim()) {
                    body.companyName = companyName.trim()
                }
            }

            const response = await fetch('/api/auth/create-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })

            const data = await response.json()

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Échec de la création du profil')
            }

            router.push('/dashboard')
            router.refresh()

        } catch (err) {
            console.error('Error creating profile:', err)
            const message = err instanceof Error ? err.message : 'Une erreur est survenue.'
            if (step === 'laveur-siret' && (message.toLowerCase().includes('siret') || message.includes('14 chiffres'))) {
                setSiretError(message)
            } else {
                setError(message)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#004aad]/5 to-[#004aad]/10 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        {step === 'role-selection'
                            ? 'Bienvenue sur Klyn !'
                            : 'Inscription Laveur Professionnel'}
                    </h1>
                    <p className="text-xl text-gray-600">
                        {step === 'role-selection'
                            ? 'Comment souhaitez-vous utiliser l\'application ?'
                            : 'Renseignez votre numéro SIRET pour finaliser votre inscription.'}
                    </p>
                </div>

                {error && (
                    <div className="max-w-md mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
                        {error}
                    </div>
                )}

                {/* Step 1: Role Selection */}
                {step === 'role-selection' && (
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
                                    Continuer comme Laveur
                                </div>
                            </div>
                        </button>
                    </div>
                )}

                {/* Step 2: SIRET Form for Laveur */}
                {step === 'laveur-siret' && (
                    <div className="max-w-lg mx-auto">
                        <form onSubmit={handleLaveurSubmit} className="bg-white rounded-2xl shadow-xl p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                                    <span className="text-2xl">🧼</span>
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Devenir Laveur</h2>
                                    <p className="text-sm text-gray-500">Statut auto-entrepreneur ou société</p>
                                </div>
                            </div>

                            {/* SIRET Input */}
                            <div className="mb-4">
                                <label htmlFor="siret" className="block text-sm font-medium text-gray-700 mb-1">
                                    Numéro SIRET <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="siret"
                                    type="text"
                                    value={siret}
                                    onChange={(e) => handleSiretChange(e.target.value)}
                                    placeholder="123 456 789 01234"
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-900 font-mono text-lg tracking-wider ${siretError && siret.replace(/\s/g, '').length === 14
                                        ? 'border-red-300 bg-red-50'
                                        : isSiretValid()
                                            ? 'border-green-300 bg-green-50'
                                            : 'border-gray-300'
                                        }`}
                                    disabled={loading}
                                    maxLength={17} // 14 digits + 3 spaces
                                    autoComplete="off"
                                />
                                {siretError && (
                                    <p className={`text-xs mt-1 ${siret.replace(/\s/g, '').length < 14 ? 'text-gray-500' : 'text-red-600'
                                        }`}>
                                        {siretError}
                                    </p>
                                )}
                                {isSiretValid() && !siretError && (
                                    <p className="text-xs text-green-600 mt-1">✓ Format SIRET valide</p>
                                )}
                                <p className="text-xs text-gray-400 mt-1">
                                    14 chiffres — trouvable sur votre avis de situation INSEE
                                </p>
                            </div>

                            {/* Company Name (optional) */}
                            <div className="mb-6">
                                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                                    Nom de l&apos;entreprise <span className="text-gray-400">(optionnel)</span>
                                </label>
                                <input
                                    id="companyName"
                                    type="text"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    placeholder="Ma Société SARL"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-gray-900"
                                    disabled={loading}
                                />
                            </div>

                            {/* Info box */}
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                                <p className="text-sm text-yellow-800">
                                    <strong>ℹ️ Bon à savoir :</strong> Votre inscription sera soumise à une validation manuelle.
                                    Vous recevrez une confirmation une fois votre profil vérifié.
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => { setStep('role-selection'); setError(''); setSiretError('') }}
                                    disabled={loading}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                    ← Retour
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !isSiretValid()}
                                    className="flex-1 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Inscription en cours...' : 'Finaliser mon inscription'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    )
}
