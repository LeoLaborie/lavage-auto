'use client'
import { useState, useEffect, useRef } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { format, addDays, isSameDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { TIME_SLOTS } from '@/lib/constants/services'

interface TimeSelectorProps {
  onSelect: (type: 'now' | 'later', time?: string, date?: string) => void
  isShaking?: boolean
}

export default function TimeSelector({ onSelect, isShaking = false }: TimeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [displayText, setDisplayText] = useState('Quand ?')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchTimeSlots = async (date: Date) => {
    setIsLoadingSlots(true)
    setAvailableSlots([])
    try {
      const dateStr = format(date, 'yyyy-MM-dd')
      const now = new Date()
      const isToday = date.toDateString() === now.toDateString()

      // Filter past slots if today
      const allSlots = TIME_SLOTS.filter(time => {
        if (!isToday) return true
        const [h, m] = time.split(':').map(Number)
        return h > now.getHours() || (h === now.getHours() && m > now.getMinutes())
      })

      // Fetch booked slots in one call and filter them out
      const res = await fetch(`/api/booking/booked-slots?date=${dateStr}`)
      if (res.ok) {
        const data = await res.json()
        const booked: string[] = data.success ? data.data : []
        setAvailableSlots(allSlots.filter(s => !booked.includes(s)))
      } else {
        // If not authenticated or error, show all slots (landing page visitors)
        setAvailableSlots(allSlots)
      }
    } catch (error) {
      console.error('Error fetching slots:', error)
    } finally {
      setIsLoadingSlots(false)
    }
  }

  const handleDateChange = (value: any) => {
    if (value instanceof Date) {
      setSelectedDate(value)
      setSelectedTime(null) // Reset time when date changes

      // Update display text immediately with the selected date
      let dateDisplay = format(value, 'EEEE d MMMM', { locale: fr })
      if (isSameDay(value, new Date())) dateDisplay = "Aujourd'hui"
      else if (isSameDay(value, addDays(new Date(), 1))) dateDisplay = "Demain"

      setDisplayText(dateDisplay)

      fetchTimeSlots(value)

      // Notify parent component with the selected date (without time for now)
      const dateStr = format(value, 'yyyy-MM-dd')
      onSelect('later', undefined, dateStr)

      // Close the calendar after selecting a date
      setIsOpen(false)
    }
  }

  const handleTimeSelect = (time: string) => {
    if (!selectedDate) return

    setSelectedTime(time)
    const dateStr = format(selectedDate, 'yyyy-MM-dd')

    // Update display text
    let dateDisplay = format(selectedDate, 'EEEE d MMMM', { locale: fr })
    if (isSameDay(selectedDate, new Date())) dateDisplay = "Aujourd'hui"
    else if (isSameDay(selectedDate, addDays(new Date(), 1))) dateDisplay = "Demain"

    setDisplayText(`${dateDisplay} à ${time}`)

    // Determine if it's "now" (today within next hour) or "later"
    // For simplicity, we'll just use 'later' for specific bookings unless it's very soon, 
    // but the backend handles the logic. Let's pass 'later' as it is a specific scheduled time.
    onSelect('later', time, dateStr)
    setIsOpen(false)
  }

  // Custom tile disabled logic (disable past dates)
  const tileDisabled = ({ date }: { date: Date }) => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return date < yesterday
  }

  return (
    <div className={`relative ${isShaking ? 'shake-animation' : ''}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={`Sélectionner une date et heure, actuel: ${displayText}`}
        className="w-full pl-12 pr-6 py-4 rounded-[10px] bg-white text-sm sm:text-lg text-ink font-cinsans focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 border border-rule shadow-cin-sm text-left flex justify-between items-center"
      >
        <span className="capitalize truncate mr-2">{displayText}</span>
        <svg
          className={`w-5 h-5 text-ink transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <svg
        className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-ink"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Sélection de la date et de l'heure"
          className="absolute left-0 right-0 mt-2 z-50 bg-white rounded-[10px] shadow-cin-md border border-rule p-4 animate-fade-in-up"
        >
          <div className="mb-4">
            <Calendar
              onChange={handleDateChange}
              value={selectedDate}
              locale="fr-FR"
              tileDisabled={tileDisabled}
              className="w-full border-none !font-sans"
              tileClassName="rounded-[8px] hover:bg-blue-wash focus:bg-blue-wash font-cinsans"
            />
          </div>

          {selectedDate && (
            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-cinsans font-semibold text-ink/70 mb-3">
                Horaires disponibles pour le {format(selectedDate, 'd MMMM', { locale: fr })}
              </h4>

              {isLoadingSlots ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-ink"></div>
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {availableSlots.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => handleTimeSelect(time)}
                      aria-pressed={selectedTime === time}
                      className={`px-2 py-2 text-sm font-cinsans rounded-[8px] transition-colors focus:outline-none focus:ring-2 focus:ring-blue ${selectedTime === time
                        ? 'bg-ink text-white'
                        : 'bg-white border border-rule text-ink hover:bg-blue-wash hover:text-blue'
                        }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-cinsans text-red-600 text-center py-2">Aucun créneau disponible pour cette date.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}