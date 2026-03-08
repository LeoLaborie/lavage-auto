'use client'

import { useRef, useState } from 'react'

interface PhotoUploaderProps {
  bookingId: string
  type: 'avant' | 'apres'
  onSuccess: (url: string) => void
}

/**
 * PhotoUploader — Client component for laveurs to upload before/after mission photos.
 * Uses `capture="environment"` to open the rear camera on mobile devices.
 */
export default function PhotoUploader({ bookingId, type, onSuccess }: PhotoUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const label = type === 'avant' ? 'Avant' : 'Après'
  const buttonLabel = type === 'avant' ? 'Photo Avant le lavage' : 'Photo Après le lavage'

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    setSuccess(false)
    const file = e.target.files?.[0]
    if (!file) return

    // Client-side validation (server also validates — defense in depth)
    if (!file.type.startsWith('image/')) {
      setError('Seuls les fichiers image sont acceptés.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Le fichier dépasse la taille maximale autorisée (10 Mo).')
      return
    }

    setSelectedFile(file)
    // Show preview
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('type', type)

      const response = await fetch(`/api/washer/missions/${bookingId}/photos`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error ?? 'Une erreur est survenue lors de l\'upload.')
        return
      }

      setSuccess(true)
      setPreview(null)
      setSelectedFile(null)
      if (inputRef.current) inputRef.current.value = ''
      onSuccess(data.data.photoUrl)
    } catch (err) {
      console.error('[PhotoUploader] Upload error:', err)
      setError('Impossible de contacter le serveur. Vérifiez votre connexion et réessayez.')
    } finally {
      setIsUploading(false)
    }
  }

  if (success) {
    return (
      <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm font-medium">
        <span>✓</span>
        <span>Photo {label} enregistrée avec succès.</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">{buttonLabel}</label>

      {/* Hidden file input with camera capture for mobile */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        id={`photo-input-${bookingId}-${type}`}
      />

      {/* Trigger button */}
      {!selectedFile && (
        <label
          htmlFor={`photo-input-${bookingId}-${type}`}
          className="inline-flex items-center gap-2 cursor-pointer bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <span>📷</span>
          <span>Prendre / Choisir une photo</span>
        </label>
      )}

      {/* Preview */}
      {preview && (
        <div className="space-y-3">
          <div className="relative w-full max-w-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt={`Aperçu photo ${label}`}
              className="w-full h-48 object-cover rounded-lg border border-gray-200"
            />
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null)
                setPreview(null)
                if (inputRef.current) inputRef.current.value = ''
              }}
              className="absolute top-2 right-2 bg-white rounded-full w-6 h-6 flex items-center justify-center shadow text-gray-600 hover:text-red-600 text-xs"
              aria-label="Supprimer la photo sélectionnée"
            >
              ✕
            </button>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
              className="bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <span className="animate-spin text-base">⟳</span>
                  <span>Upload en cours...</span>
                </>
              ) : (
                <>
                  <span>✓</span>
                  <span>Confirmer la photo {label}</span>
                </>
              )}
            </button>

            <label
              htmlFor={`photo-input-${bookingId}-${type}`}
              className="cursor-pointer bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Reprendre
            </label>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
