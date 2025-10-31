'use client'
import { useState } from 'react'
import type { ReactNode } from 'react'

interface TimeSelectorProps {
  onSelect: (type: 'now' | 'later', time?: string, date?: string) => void
  isShaking?: boolean
}

interface TimeSlot {
  time: string
  date: Date
  isToday: boolean
}

export default function TimeSelector({ onSelect, isShaking = false }: TimeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState<string>('Quand ?')
  const [isLoading, setIsLoading] = useState(false)
  const [_availableSlots, _setAvailableSlots] = useState<string[]>([])
  const [infoMessage, setInfoMessage] = useState<string | null>(null)

  const getAvailableTimeSlots = async (date: Date): Promise<string[]> => {
    const slots = []
    // Horaires de service: 8h à 18h
    for (let hour = 8; hour <= 18; hour++) {
      for (const minutes of [0, 30]) {
        const time = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
        try {
          const response = await fetch('/api/booking/validate-timeslot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              date: date.toISOString().split('T')[0],
              time: time
            })
          })
          
          if (response.ok) {
            slots.push(time)
          }
        } catch (error) {
          console.error('Error validating time slot:', error)
        }
      }
    }
    return slots
  }

  const getNearestAvailableTime = async (): Promise<TimeSlot> => {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinutes = now.getMinutes()
    const currentTimeInMinutes = currentHour * 60 + currentMinutes

    // Obtenir les créneaux pour aujourd'hui
    const todaySlots = await getAvailableTimeSlots(now)
    const todaySlotsInMinutes = todaySlots.map(time => {
      const [hours, minutes] = time.split(':').map(Number)
      return hours * 60 + minutes
    })

    // Trouver le prochain créneau disponible aujourd'hui (avec 30 minutes de marge)
    const nextSlotToday = todaySlotsInMinutes.find(slot => slot > currentTimeInMinutes + 30)

    if (nextSlotToday) {
      // Un créneau est disponible aujourd'hui
      const hours = Math.floor(nextSlotToday / 60)
      const minutes = nextSlotToday % 60
      const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      return {
        time,
        date: now,
        isToday: true
      }
    } else {
      // Pas de créneau aujourd'hui, prendre le premier créneau demain
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(8, 0, 0, 0)
      
      const tomorrowSlots = await getAvailableTimeSlots(tomorrow)
      return {
        time: tomorrowSlots[0] || '08:00',
        date: tomorrow,
        isToday: false
      }
    }
  }

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0] // Format YYYY-MM-DD
  }

  const formatDisplayDate = (date: Date, isToday: boolean): string => {
    if (isToday) {
      return "Aujourd'hui"
    }
    
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (date.toDateString() === tomorrow.toDateString()) {
      return "Demain"
    }
    
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(date)
  }

  const handleSelect = async (type: 'now' | 'later') => {
    if (type === 'now') {
      setIsLoading(true)
      setInfoMessage(null)
      try {
        const nearestSlot = await getNearestAvailableTime()
        const displayDate = formatDisplayDate(nearestSlot.date, nearestSlot.isToday)
        const selectedTime = nearestSlot.time
        
        // Mettre à jour le message sélectionné
        setSelected(`${displayDate} ${selectedTime}`)
        
        // Afficher le message d'information
        if (nearestSlot.isToday) {
          setInfoMessage(`Un laveur peut être chez vous dans 30 minutes ! Le prochain créneau disponible est à ${selectedTime}.`)
        } else {
          setInfoMessage(`Tous les créneaux d'aujourd'hui sont pris. Le prochain créneau disponible est demain à ${selectedTime}.`)
        }
        
        onSelect('now', selectedTime, formatDate(nearestSlot.date))
      } catch (error) {
        console.error('Error handling time selection:', error)
        setSelected('Erreur de chargement')
        setInfoMessage('Désolé, une erreur est survenue lors de la recherche des créneaux disponibles.')
      } finally {
        setIsLoading(false)
      }
    } else {
      setSelected('Planifier')
      setInfoMessage(null)
      onSelect('later')
    }
    setIsOpen(false)
  }

  return (
    <div className={`relative ${isShaking ? 'shake-animation' : ''}`}>
      <button 
        onClick={() => !isLoading && setIsOpen(!isOpen)}
        disabled={isLoading}
        className={`w-full pl-12 pr-6 py-4 rounded-lg bg-white/60 backdrop-blur-sm text-lg text-[#004aad] focus:outline-none focus:ring-2 focus:ring-[#004aad] border-none shadow-md text-left flex justify-between items-center ${
          isLoading ? 'cursor-not-allowed opacity-75' : ''
        }`}
      >
         <span>{selected}</span>
        {isLoading && (
          <svg className="animate-spin h-5 w-5 text-[#004aad]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
      </button>
      {infoMessage && (
        <div className="absolute left-0 right-0 mt-2">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            {infoMessage}
          </div>
        </div>
      )}
      <svg 
        className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#004aad]" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 z-50">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <button 
              onClick={() => handleSelect('now')}
              className="w-full px-6 py-3 text-left text-primary hover:bg-primary hover:text-white transition-all flex items-center gap-3"
            >
              <span className="text-xl">⚡</span>
              Laver sa voiture maintenant
            </button>
              <button 
              onClick={() => handleSelect('later')}
              className="w-full px-6 py-3 text-left text-primary hover:bg-primary hover:text-white transition-all flex items-center gap-3"
            >
              <span className="text-xl">📅</span>
              Planifier son lavage
            </button>
          </div>
        </div>
      )}
    </div>
  )
}