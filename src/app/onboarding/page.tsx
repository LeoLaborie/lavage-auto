'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import NavCinetique from '@/components/landing/NavCinetique'

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
        <div
            className="min-h-screen bg-white"
            style={{
                background:
                    'radial-gradient(ellipse at 70% 20%, #eaf0fc 0%, #ffffff 55%)',
            }}
        >
            <NavCinetique />

            <main className="mx-auto max-w-cin px-5 pt-[calc(var(--nav-h)+48px)] pb-16 md:px-12 md:pt-[calc(var(--nav-h)+96px)] md:pb-[120px]">
                <div className="mx-auto max-w-3xl">
                    <div className="text-center">
                        <div className="mb-5 inline-block rounded-md bg-blue-wash px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-blue md:text-xs">
                            {step === 'role-selection' ? 'Bienvenue' : 'Inscription Laveur'}
                        </div>
                        <h1 className="font-display font-extrabold leading-[0.95] tracking-[-0.04em] text-ink text-[44px] md:text-[64px] lg:text-[72px]">
                            {step === 'role-selection' ? (
                                <>Bienvenue sur <span className="italic text-blue">Nealkar.</span></>
                            ) : (
                                <>Devenir <span className="italic text-blue">laveur.</span></>
                            )}
                        </h1>
                        <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-ink2 md:text-[17px]">
                            {step === 'role-selection'
                                ? 'Choisissez votre rôle pour finaliser la création de votre compte.'
                                : 'Renseignez votre numéro SIRET pour finaliser votre inscription. Validation manuelle sous 24 h.'}
                        </p>
                    </div>

                    {error && (
                        <div className="mx-auto mt-10 max-w-md rounded-[14px] border border-rule bg-white p-4 text-center shadow-cin-card">
                            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-blue">Erreur</p>
                            <p className="mt-1 text-sm text-ink2">{error}</p>
                        </div>
                    )}

                    {step === 'role-selection' && (
                        <div className="mt-12 grid gap-5 md:mt-16 md:grid-cols-2 md:gap-6">
                            <button
                                onClick={() => handleRoleSelection('CLIENT')}
                                disabled={loading}
                                className="group relative flex flex-col rounded-[20px] border border-rule bg-white p-7 text-left shadow-cin-card transition-transform hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-50 md:p-9"
                            >
                                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-blue-wash text-2xl md:h-14 md:w-14 md:text-3xl">
                                    🚗
                                </div>
                                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-blue">
                                    Client
                                </span>
                                <h2 className="mt-2 font-display text-[26px] font-bold leading-[1.05] tracking-[-0.03em] text-ink md:text-[34px]">
                                    Je veux faire laver ma voiture
                                </h2>
                                <p className="mt-3 flex-grow text-[13px] leading-relaxed text-ink2 md:text-sm">
                                    Réservez un lavage sans eau à domicile ou au bureau. Paiement à l&apos;acceptation, annulation gratuite jusqu&apos;à 24 h avant.
                                </p>
                                <div className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-6 py-4 font-cinsans text-[15px] font-semibold text-white shadow-cin-button transition-transform group-hover:-translate-y-0.5">
                                    {loading ? 'Création…' : 'Continuer comme Client →'}
                                </div>
                            </button>

                            <button
                                onClick={() => handleRoleSelection('LAVEUR')}
                                disabled={loading}
                                className="group relative flex flex-col rounded-[20px] bg-ink p-7 text-left text-white shadow-cin-feature transition-transform hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-50 md:p-9"
                            >
                                <div
                                    className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-[14px] text-2xl md:h-14 md:w-14 md:text-3xl"
                                    style={{ background: 'rgba(255,255,255,0.08)' }}
                                >
                                    🧼
                                </div>
                                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-blue-electric">
                                    Laveur Pro
                                </span>
                                <h2 className="mt-2 font-display text-[26px] font-bold leading-[1.05] tracking-[-0.03em] text-white md:text-[34px]">
                                    Je veux devenir laveur
                                </h2>
                                <p className="mt-3 flex-grow text-[13px] leading-relaxed text-white/75 md:text-sm">
                                    Rejoignez le réseau Nealkar : missions à proximité, paiement Stripe sécurisé, agenda flexible. Statut auto-entrepreneur ou société requis.
                                </p>
                                <div className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-4 font-cinsans text-[15px] font-semibold text-ink transition-transform group-hover:-translate-y-0.5">
                                    Continuer comme Laveur →
                                </div>
                            </button>
                        </div>
                    )}

                    {step === 'laveur-siret' && (
                        <div className="mx-auto mt-12 max-w-lg md:mt-16">
                            <form
                                onSubmit={handleLaveurSubmit}
                                className="rounded-[20px] border border-rule bg-white p-7 shadow-cin-card md:p-9"
                            >
                                <div className="mb-7 flex items-center gap-3">
                                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-[14px] bg-blue-wash text-2xl">
                                        🧼
                                    </div>
                                    <div>
                                        <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-blue">
                                            Étape 1 / 2
                                        </span>
                                        <h2 className="font-display text-[22px] font-bold leading-tight tracking-[-0.03em] text-ink">
                                            Identifiant entreprise
                                        </h2>
                                    </div>
                                </div>

                                <div className="mb-5">
                                    <label
                                        htmlFor="siret"
                                        className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-ink2"
                                    >
                                        Numéro SIRET <span className="text-blue-electric">*</span>
                                    </label>
                                    <input
                                        id="siret"
                                        type="text"
                                        value={siret}
                                        onChange={(e) => handleSiretChange(e.target.value)}
                                        placeholder="123 456 789 01234"
                                        className={`w-full rounded-xl border bg-white px-4 py-3.5 font-mono text-lg tracking-wider text-ink outline-none transition-all focus:ring-2 focus:ring-blue ${siretError && siret.replace(/\s/g, '').length === 14
                                            ? 'border-blue-electric'
                                            : isSiretValid()
                                                ? 'border-blue bg-blue-wash'
                                                : 'border-rule'
                                            }`}
                                        disabled={loading}
                                        maxLength={22}
                                        autoComplete="off"
                                    />
                                    {siretError && (
                                        <p
                                            className={`mt-1.5 font-mono text-[11px] uppercase tracking-[0.05em] ${siret.replace(/\s/g, '').length < 14 ? 'text-ink2' : 'text-blue-electric'
                                                }`}
                                        >
                                            {siretError}
                                        </p>
                                    )}
                                    {isSiretValid() && !siretError && (
                                        <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.05em] text-blue">
                                            ✓ Format SIRET valide
                                        </p>
                                    )}
                                    <p className="mt-1.5 text-xs text-ink2">
                                        14 chiffres — disponible sur votre avis de situation INSEE.
                                    </p>
                                </div>

                                <div className="mb-7">
                                    <label
                                        htmlFor="companyName"
                                        className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-ink2"
                                    >
                                        Nom de l&apos;entreprise{' '}
                                        <span className="normal-case tracking-normal text-ink2/60">(optionnel)</span>
                                    </label>
                                    <input
                                        id="companyName"
                                        type="text"
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        placeholder="Ma Société SARL"
                                        className="w-full rounded-xl border border-rule bg-white px-4 py-3.5 text-ink outline-none transition-all focus:ring-2 focus:ring-blue"
                                        disabled={loading}
                                    />
                                </div>

                                <div className="mb-7 rounded-[14px] bg-blue-wash p-4">
                                    <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-blue">
                                        Validation manuelle
                                    </p>
                                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink2 md:text-sm">
                                        Votre dossier est revu sous 24 h. Une fois validé, vous configurerez Stripe Connect depuis votre tableau de bord pour recevoir vos paiements.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStep('role-selection')
                                            setError('')
                                            setSiretError('')
                                        }}
                                        disabled={loading}
                                        className="inline-flex items-center justify-center rounded-xl border-[1.5px] border-ink bg-transparent px-6 py-4 font-cinsans text-[15px] font-semibold text-ink transition-colors hover:bg-ink hover:text-white disabled:opacity-50"
                                    >
                                        ← Retour
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading || !isSiretValid()}
                                        className="inline-flex flex-1 items-center justify-center rounded-xl bg-ink px-6 py-4 font-cinsans text-[15px] font-semibold text-white shadow-cin-button transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                                    >
                                        {loading ? 'Inscription en cours…' : 'Finaliser mon inscription →'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
