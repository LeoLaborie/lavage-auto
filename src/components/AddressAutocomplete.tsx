'use client'
import { useState, useEffect } from 'react'

interface Coords {
  lat: number
  lng: number
}

interface Props {
  onAddressSelect: (address: string, coords?: Coords) => void
  value?: string
}

interface AddressFeature {
  properties: {
    label: string
    housenumber?: string
    street?: string
    postcode?: string
    city?: string
    name?: string
  }
  geometry?: {
    type?: string
    coordinates?: [number, number] // [lng, lat]
  }
}

export default function AddressAutocomplete({ onAddressSelect, value = '' }: Props) {
  const [input, setInput] = useState(value)
  const [suggestions, setSuggestions] = useState<AddressFeature[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  useEffect(() => {
    setInput(value)
  }, [value])

  const preprocessSearchValue = (searchValue: string) => {
    // Traitement spécial pour les numéros avec suffixes (bis, ter, etc.)
    const parts = searchValue.split(' ')
    if (parts.length > 0) {
      const firstPart = parts[0].toLowerCase()
      // Si le premier élément contient un nombre
      if (/\d/.test(firstPart)) {
        // Extraire le numéro et le suffixe potentiel
        const matches = firstPart.match(/(\d+)([a-z]+)?/)
        if (matches) {
          const [_, number, suffix] = matches
          // Si un suffixe est présent, faire plusieurs variantes de recherche
          if (suffix) {
            return [
              searchValue,
              // Variante avec espace entre le numéro et le suffixe
              `${number} ${suffix} ${parts.slice(1).join(' ')}`,
              // Variante sans le suffixe
              `${number} ${parts.slice(1).join(' ')}`
            ]
          }
        }
      }
    }
    return [searchValue]
  }

  const getSuggestions = async (searchValue: string) => {
    if (!searchValue || searchValue.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    try {
      const searchVariants = preprocessSearchValue(searchValue)
      const allSuggestions: AddressFeature[] = []

      // Faire des requêtes pour chaque variante de recherche
      await Promise.all(searchVariants.map(async (variant) => {
        const response = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(variant)}&limit=5`
        )
        const data = await response.json()
        if (data.features) {
          allSuggestions.push(...data.features)
        }
      }))

      // Filtrer les doublons basés sur le label
      const uniqueSuggestions = allSuggestions.filter((suggestion, index, self) =>
        index === self.findIndex((s) => s.properties.label === suggestion.properties.label)
      )

      // Trier les résultats pour mettre en avant les correspondances exactes
      const sortedSuggestions = uniqueSuggestions.sort((a, b) => {
        const aStartsWithNumber = /^\d/.test(a.properties.label)
        const bStartsWithNumber = /^\d/.test(b.properties.label)

        if (aStartsWithNumber && !bStartsWithNumber) return -1
        if (!aStartsWithNumber && bStartsWithNumber) return 1

        // Si les deux commencent par un numéro, comparer la pertinence
        if (aStartsWithNumber && bStartsWithNumber) {
          const aNumber = parseInt(a.properties.label.match(/^\d+/)?.[0] || '0')
          const bNumber = parseInt(b.properties.label.match(/^\d+/)?.[0] || '0')
          const searchNumber = parseInt(searchValue.match(/^\d+/)?.[0] || '0')

          if (aNumber === searchNumber && bNumber !== searchNumber) return -1
          if (bNumber === searchNumber && aNumber !== searchNumber) return 1
        }

        return a.properties.label.localeCompare(b.properties.label)
      })

      setSuggestions(sortedSuggestions.slice(0, 5))
      setShowSuggestions(true)
    } catch (error) {
      console.error('Erreur lors de la recherche d\'adresses:', error)
      setSuggestions([])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInput(newValue)
    // Saisie libre : pas de coords. Le call-site doit reset coords à undefined.
    onAddressSelect(newValue, undefined)
    getSuggestions(newValue)
  }

  const handleSelect = (feature: AddressFeature) => {
    const label = feature.properties.label
    const coords =
      feature.geometry?.coordinates && feature.geometry.coordinates.length === 2
        ? { lng: feature.geometry.coordinates[0], lat: feature.geometry.coordinates[1] }
        : undefined
    setInput(label)
    onAddressSelect(label, coords)
    setShowSuggestions(false)
  }

  return (
    <div className="relative w-full">
      <input
        type="text"
        role="combobox"
        aria-expanded={showSuggestions && suggestions.length > 0}
        aria-controls="address-suggestions"
        aria-autocomplete="list"
        aria-label="Rechercher une adresse"
        value={input}
        onChange={handleInputChange}
        placeholder="Saisissez votre adresse"
        className="w-full rounded-[10px] border border-rule bg-white pl-12 pr-6 py-4 font-cinsans text-base text-ink placeholder-ink2/50 focus:border-ink focus:outline-none focus:ring-2 focus:ring-blue/30"
      />
      <svg
        className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>

      {showSuggestions && suggestions.length > 0 && (
        <ul
          id="address-suggestions"
          role="listbox"
          className="absolute top-full left-0 right-0 mt-1 bg-white rounded-[10px] shadow-cin-card border border-rule overflow-hidden z-50 m-0 p-0 list-none"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={index}
              role="option"
              aria-selected={false}
            >
              <button
                onClick={() => handleSelect(suggestion)}
                className="w-full px-4 py-3 hover:bg-blue-wash cursor-pointer text-left border-b border-rule last:border-b-0 focus:outline-none focus:bg-blue-wash"
              >
                <span className="font-cinsans text-sm text-ink">{suggestion.properties.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}