'use client'
import { useState, useEffect } from 'react'

interface Props {
  onAddressSelect: (address: string) => void
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
    onAddressSelect(newValue)
    getSuggestions(newValue)
  }

  const handleSelect = (address: string) => {
    setInput(address)
    onAddressSelect(address)
    setShowSuggestions(false)
  }

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={input}
        onChange={handleInputChange}
        placeholder="Saisissez votre adresse"
        className="w-full pl-12 pr-6 py-4 rounded-lg bg-white/60 backdrop-blur-sm text-lg text-[#004aad] placeholder-[#004aad] focus:outline-none focus:ring-2 focus:ring-[#004aad] border-none shadow-md"
      />
      <svg
        className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#004aad]"
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
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden z-50">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSelect(suggestion.properties.label)}
              className="w-full px-4 py-3 hover:bg-gray-50 cursor-pointer text-left border-b border-gray-100 last:border-b-0"
            >
              <span className="text-[#004aad]">{suggestion.properties.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}