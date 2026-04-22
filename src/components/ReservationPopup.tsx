'use client'
import { AppleEmoji } from '@/components/AppleEmoji'
import { services } from '@/lib/constants/services'

interface ReservationPopupProps {
  isOpen: boolean
  onClose: () => void
  address: string
  selectedTime?: {
    type: 'now' | 'later'
    time?: string
    date?: string
  } | null
}

const visibleServices = services.filter((s) => s.isVisible)

export default function ReservationPopup({ isOpen, onClose, address, selectedTime }: ReservationPopupProps) {
  if (!isOpen) return null

  const buildHref = (serviceId: string) => {
    const params = new URLSearchParams({ service: serviceId, address })
    if (selectedTime?.date) params.set('date', selectedTime.date)
    if (selectedTime?.time) params.set('time', selectedTime.time)
    return `/reserver?${params.toString()}`
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 max-w-4xl w-full mx-4 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-[#004aad] mb-6">Réserver un lavage</h2>

        <div className="mb-6">
          <p className="text-gray-600 mb-2">Adresse sélectionnée :</p>
          <p className="text-[#004aad] font-medium break-words">{address}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8" style={{ minHeight: '250px' }}>
          {visibleServices.map((service) => (
            <a
              key={service.id}
              href={buildHref(service.id)}
              className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow border-2 border-[#004aad]/10"
            >
              <div className="w-12 h-12 bg-[#004aad]/10 rounded-lg flex items-center justify-center mb-4">
                <AppleEmoji name={service.icon} />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.name}</h3>
              <p className="text-gray-600 mb-4 text-sm">{service.description}</p>
              <p className="text-xl font-bold text-[#004aad]">{service.amountCents / 100}€</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}