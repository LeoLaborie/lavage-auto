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

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <label htmlFor="commission-rate" className="block text-sm font-medium text-gray-700 mb-2">
                Taux de commission
            </label>
            <div className="flex items-center gap-2">
                <input
                    id="commission-rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    inputMode="decimal"
                    value={percent}
                    onChange={(e) => setPercent(e.target.value)}
                    className="flex-1 max-w-[160px] px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-600">%</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
                Sur une mission à 29 € à {percent || '0'} %, le laveur recevra{' '}
                <span className="font-medium text-gray-700">
                    {(() => {
                        const p = Number(percent.replace(',', '.'))
                        if (!Number.isFinite(p)) return '—'
                        const net = 29 * (1 - p / 100)
                        return net.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })
                    })()}
                </span>.
            </p>

            <div className="mt-6 flex items-center gap-4">
                <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    {isSaving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                <span className="text-xs text-gray-500">
                    Dernière modification : {new Date(updatedAt).toLocaleString('fr-FR')}
                </span>
            </div>
        </form>
    )
}
