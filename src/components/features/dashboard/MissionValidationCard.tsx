'use client'

import { useState } from 'react'

interface MissionValidationCardProps {
    booking: {
        id: string
        beforePhotoUrl: string | null
        afterPhotoUrl: string | null
        status: string
    }
    onValidated: () => void
}

/**
 * MissionValidationCard
 *
 * Shown for bookings with status IN_PROGRESS.
 * - If afterPhotoUrl is null: shows a "En attente des photos du laveur" indicator.
 * - If afterPhotoUrl is set: shows before/after photo comparison and a "Valider la prestation" button.
 *
 * On validation, calls POST /api/booking/[id]/complete and triggers onValidated() callback.
 * Uses plain <img> tags (not next/image) to avoid needing Supabase Storage domain in next.config.js.
 */
export default function MissionValidationCard({ booking, onValidated }: MissionValidationCardProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Only render for IN_PROGRESS bookings
    if (booking.status !== 'IN_PROGRESS') return null

    // Washer has not yet uploaded the "Après" photo
    if (!booking.afterPhotoUrl) {
        return (
            <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-4 py-3 rounded-lg">
                    <svg className="w-4 h-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>En attente des photos du laveur</span>
                </div>
            </div>
        )
    }

    const handleValidate = async () => {
        if (!confirm('Êtes-vous sûr de valider la prestation ?')) return

        setLoading(true)
        setError(null)

        try {
            const res = await fetch(`/api/booking/${booking.id}/complete`, {
                method: 'POST',
            })

            const data = await res.json()

            if (data.success) {
                onValidated()
            } else {
                setError(data.error || 'Une erreur est survenue. Veuillez réessayer.')
            }
        } catch {
            setError('Une erreur est survenue. Veuillez réessayer.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-3">Photos du lavage</p>

            {/* Before / After photo comparison */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="space-y-1">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Avant</p>
                    {booking.beforePhotoUrl ? (
                        // Plain <img> to avoid next.config.js remotePatterns requirement for Supabase Storage
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={booking.beforePhotoUrl}
                            alt="Photo avant lavage"
                            className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                    ) : (
                        <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                            Non disponible
                        </div>
                    )}
                </div>
                <div className="space-y-1">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Après</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={booking.afterPhotoUrl}
                        alt="Photo après lavage"
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                </div>
            </div>

            {/* Validation button */}
            <button
                onClick={handleValidate}
                disabled={loading}
                className="w-full bg-[#004aad] text-white py-2.5 px-4 rounded-lg font-medium text-sm hover:bg-[#003c8a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Validation en cours...' : 'Valider la prestation'}
            </button>

            {/* Inline error */}
            {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
        </div>
    )
}
