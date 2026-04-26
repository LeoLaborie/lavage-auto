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
        <div className="rounded-[20px] bg-white p-7 shadow-cin-card border border-rule md:p-9">
            <div className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-red-700 md:text-xs">
                Action destructive
            </div>
            <h2 className="font-display text-[22px] font-bold tracking-[-0.02em] text-ink mb-4 md:text-[26px]">
                Remboursement
            </h2>

            <p className="mb-6 text-[15px] leading-relaxed text-ink2 md:text-[16px]">
                Montant remboursable restant&nbsp;:{' '}
                <span className="font-display font-semibold text-ink">{maxAmountEuros.toFixed(2)}&nbsp;€</span>
            </p>

            {success ? (
                <p className="font-mono text-[13px] font-semibold uppercase tracking-[0.05em] text-emerald-700 md:text-sm">
                    {success}
                </p>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label
                            htmlFor="refund-amount"
                            className="mb-2 block font-cinsans text-[13px] font-semibold text-ink md:text-sm"
                        >
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
                            className="w-full max-w-[220px] rounded-xl border border-rule bg-white px-4 py-3 font-display text-lg font-semibold text-ink transition-shadow focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="0.00"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => setAmountEuros(maxAmountEuros.toFixed(2))}
                            className="inline-flex items-center rounded-[10px] border border-rule bg-white px-3.5 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-ink transition-colors hover:bg-blue-wash disabled:cursor-not-allowed disabled:opacity-50 md:text-xs"
                        >
                            Total ({maxAmountEuros.toFixed(2)} €)
                        </button>
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => inputRef.current?.focus()}
                            className="inline-flex items-center rounded-[10px] border border-rule bg-white px-3.5 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-ink transition-colors hover:bg-blue-wash disabled:cursor-not-allowed disabled:opacity-50 md:text-xs"
                        >
                            Partiel
                        </button>
                    </div>

                    {error && (
                        <p className="text-[13px] leading-relaxed text-red-700 md:text-sm">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3.5 font-cinsans text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(220,38,38,0.25)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 md:px-7 md:py-4"
                    >
                        {loading ? 'Traitement en cours…' : 'Déclencher le remboursement'}
                    </button>
                </form>
            )}
        </div>
    )
}
