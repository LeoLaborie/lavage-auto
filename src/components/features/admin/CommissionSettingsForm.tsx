'use client'

import { useState } from 'react'
import { useToast } from '@/contexts/ToastContext'

interface Props {
    initialRate: number
    updatedAt: string
}

export default function CommissionSettingsForm({ initialRate, updatedAt: initialUpdatedAt }: Props) {
    const { toast } = useToast()
    const [percent, setPercent] = useState<string>((initialRate * 100).toFixed(2))
    const [updatedAt, setUpdatedAt] = useState<string>(initialUpdatedAt)
    const [isSaving, setIsSaving] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const parsed = Number(percent.replace(',', '.'))
        if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
            toast.error('Le pourcentage doit être compris entre 0 et 100')
            return
        }
        const rate = Number((parsed / 100).toFixed(4))

        setIsSaving(true)
        try {
            const res = await fetch('/api/admin/settings/commission', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rate }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || 'Erreur lors de la mise à jour')
                return
            }
            setUpdatedAt(data.data.updatedAt)
            setPercent((data.data.commissionRate * 100).toFixed(2))
            toast.success('Taux de commission mis à jour')
        } catch (err) {
            console.error('commission update failed', err)
            toast.error('Une erreur est survenue')
        } finally {
            setIsSaving(false)
        }
    }

    const parsedPercent = Number(percent.replace(',', '.'))
    const previewNet = Number.isFinite(parsedPercent)
        ? (29 * (1 - parsedPercent / 100)).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
        : '—'

    return (
        <form
            onSubmit={handleSubmit}
            className="rounded-[20px] bg-white p-7 shadow-cin-card md:p-9"
            style={{ border: '1px solid rgba(6,8,13,0.094)' }}
        >
            <div className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-ink2/70 md:text-xs">
                Taux courant
            </div>
            <div className="mb-7 font-display text-[56px] font-extrabold leading-none tracking-[-0.04em] text-ink md:text-[72px]">
                {Number.isFinite(parsedPercent) ? parsedPercent.toFixed(2) : '—'}
                <span className="ml-2 font-display text-[28px] font-bold tracking-[-0.03em] text-blue md:text-[36px]">%</span>
            </div>

            <label
                htmlFor="commission-rate"
                className="mb-2 block font-cinsans text-[13px] font-semibold text-ink md:text-sm"
            >
                Taux de commission
            </label>
            <div className="flex items-center gap-3">
                <input
                    id="commission-rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    inputMode="decimal"
                    value={percent}
                    onChange={(e) => setPercent(e.target.value)}
                    className="w-full max-w-[180px] rounded-xl border border-rule bg-white px-4 py-3 font-display text-lg font-semibold text-ink transition-shadow focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue"
                />
                <span className="font-cinsans text-[15px] font-medium text-ink2">%</span>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-ink2 md:text-sm">
                Sur une mission à 29 € à {percent || '0'} %, le laveur recevra{' '}
                <span className="font-display font-semibold text-ink">{previewNet}</span>.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-rule pt-6">
                <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-6 py-3.5 font-cinsans text-[15px] font-semibold text-white shadow-cin-button transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 md:px-7 md:py-4"
                >
                    {isSaving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                <span className="font-mono text-[11px] uppercase tracking-[0.05em] text-ink2/70 md:text-xs">
                    Dernière modif. : {new Date(updatedAt).toLocaleString('fr-FR')}
                </span>
            </div>
        </form>
    )
}
