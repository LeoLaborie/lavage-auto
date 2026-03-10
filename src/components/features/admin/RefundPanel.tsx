'use client'

import { useRef, useState } from 'react'
import { triggerRefund } from '@/lib/actions/refund'

interface RefundPanelProps {
    bookingId: string
    /** Remaining refundable amount in euros = (payment.amountCents - (payment.refundAmountCents ?? 0)) / 100 */
    maxAmountEuros: number
    /**
     * M2: Externally controlled success message hoisted to BookingDetailClient.
     * Passed in after a successful refund so the message survives router.refresh() remounting this component.
     */
    externalSuccess?: string | null
    onRefundComplete: () => void
}

export function RefundPanel({ bookingId, maxAmountEuros, externalSuccess, onRefundComplete }: RefundPanelProps) {
    const [amountEuros, setAmountEuros] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [internalSuccess, setInternalSuccess] = useState<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Use external success if set (persisted across remounts), otherwise fall back to internal transient state
    const success = externalSuccess ?? internalSuccess

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        setInternalSuccess(null)

        const amount = parseFloat(amountEuros)

        if (isNaN(amount) || amount <= 0) {
            setError('Le montant doit être supérieur à 0.')
            return
        }

        if (amount > maxAmountEuros) {
            setError(`Le montant ne peut pas dépasser ${maxAmountEuros.toFixed(2)} €.`)
            return
        }

        const amountCents = Math.round(amount * 100)

        setLoading(true)

        const result = await triggerRefund(bookingId, amountCents)

        if (result.success) {
            setInternalSuccess('Remboursement effectué avec succès')
            // onRefundComplete triggers router.refresh() in parent — success state is hoisted there (M2)
            // so the notice survives the remount caused by the refresh
            onRefundComplete()
        } else {
            setLoading(false)
            setError(result.error ?? 'Une erreur est survenue.')
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Remboursement</h2>

            <p className="text-sm text-gray-700 mb-4">
                Montant remboursable restant :{' '}
                <span className="font-semibold text-gray-900">{maxAmountEuros.toFixed(2)} €</span>
            </p>

            {success ? (
                <p className="text-green-600 text-sm font-medium">{success}</p>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="refund-amount" className="block text-sm font-medium text-gray-700 mb-1">
                            Montant à rembourser (€)
                        </label>
                        <input
                            id="refund-amount"
                            ref={inputRef}
                            type="number"
                            step="0.01"
                            min="0.01"
                            max={maxAmountEuros}
                            value={amountEuros}
                            onChange={(e) => setAmountEuros(e.target.value)}
                            disabled={loading}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#004aad] disabled:opacity-50 disabled:cursor-not-allowed"
                            placeholder="0.00"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => setAmountEuros(maxAmountEuros.toFixed(2))}
                            className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Total ({maxAmountEuros.toFixed(2)} €)
                        </button>
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => inputRef.current?.focus()}
                            className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Partiel
                        </button>
                    </div>

                    {error && (
                        <p className="text-red-600 text-sm">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? 'Traitement en cours…' : 'Déclencher le remboursement'}
                    </button>
                </form>
            )}
        </div>
    )
}
