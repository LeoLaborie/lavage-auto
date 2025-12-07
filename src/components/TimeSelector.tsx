'use client'
import { useState, useEffect, useRef } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { format, addDays, isSameDay, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'

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
                date: format(date, 'yyyy-MM-dd'),
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
      setAvailableSlots(slots)
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
        onClick={() => setIsOpen(!isOpen)}
        className="w-full pl-12 pr-6 py-4 rounded-lg bg-white/60 backdrop-blur-sm text-lg text-[#004aad] focus:outline-none focus:ring-2 focus:ring-[#004aad] border-none shadow-md text-left flex justify-between items-center"
      >
        <span className="capitalize">{displayText}</span>
        <svg
          className={`w-5 h-5 text-[#004aad] transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <svg
        className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#004aad]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 z-50 bg-white rounded-lg shadow-xl border border-gray-100 p-4 animate-fade-in-up">
          <div className="mb-4">
            <Calendar
              onChange={handleDateChange}
              value={selectedDate}
              locale="fr-FR"
              tileDisabled={tileDisabled}
              className="w-full border-none !font-sans"
              tileClassName="rounded-lg hover:bg-blue-50 focus:bg-blue-100"
            />
          </div>

          {selectedDate && (
            <div className="border-t border-gray-100 pt-4">
              <h4 className="text-sm font-semibold text-gray-500 mb-3">
                Horaires disponibles pour le {format(selectedDate, 'd MMMM', { locale: fr })}
              </h4>

              {isLoadingSlots ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {availableSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => handleTimeSelect(time)}
                      className={`px-2 py-2 text-sm rounded-md transition-colors ${selectedTime === time
                        ? 'bg-primary text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-blue-50 hover:text-primary'
                        }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-red-500 text-center py-2">Aucun créneau disponible pour cette date.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}