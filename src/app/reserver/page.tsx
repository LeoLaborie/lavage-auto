'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import BackButton from '@/components/BackButton';
import { validateBookingForm, validateDateTimeBooking, BookingFormData } from '@/lib/validation';
import { AppleEmoji } from '@/components/AppleEmoji';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  icon: string;
}

const services: Service[] = [
  {
    id: 'exterior',
    name: 'Lavage Extérieur',
    description: 'Nettoyage complet de l\'extérieur de votre véhicule avec des produits de qualité.',
    price: 25,
    duration: '30 min',
    icon: 'sponge'
  },
  {
    id: 'complete',
    name: 'Lavage Complet',
    description: 'Nettoyage intérieur et extérieur pour une voiture impeccable.',
    price: 45,
    duration: '60 min',
    icon: 'sparkles'
  },
  {
    id: 'premium',
    name: 'Lavage Premium',
    description: 'Service complet avec cire, lustrage et traitement des plastiques.',
    price: 75,
    duration: '90 min',
    icon: 'gem'
  }
];

const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
];

export default function Reserver() {
  const searchParams = useSearchParams();
  const [selectedService, setSelectedService] = useState<Service | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('booking_service');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });
  const [selectedDate, setSelectedDate] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('booking_date') || '';
    }
    return '';
  });
  const [selectedTime, setSelectedTime] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('booking_time') || '';
    }
    return '';
  });
  const [address, setAddress] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('booking_address') || '';
    }
    return '';
  });
  const [customerInfo, setCustomerInfo] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('booking_customer_info');
      return saved ? JSON.parse(saved) : {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        carType: '',
        notes: ''
      };
    }
    return {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      carType: '',
      notes: ''
    };
  });
  const [currentStep, setCurrentStep] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('booking_step') || '1', 10);
    }
    return 1;
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [dateTimeErrors, setDateTimeErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load URL parameters
  useEffect(() => {
    const serviceParam = searchParams.get('service');
    const addressParam = searchParams.get('address');
    const timeParam = searchParams.get('time');
    const dateParam = searchParams.get('date');
    
    if (serviceParam) {
      const service = services.find(s => s.id === serviceParam);
      if (service) {
        setSelectedService(service);
      }
    }

    if (addressParam) {
      setAddress(decodeURIComponent(addressParam));
    }

    if (timeParam && dateParam) {
      setSelectedTime(decodeURIComponent(timeParam));
      setSelectedDate(decodeURIComponent(dateParam));
      setCurrentStep(3); // Passer directement à l'étape des informations personnelles
    } else if (serviceParam) {
      setCurrentStep(2); // Sinon aller à l'étape date/heure
    }
  }, [searchParams]);

  // Save state to localStorage
  useEffect(() => {
    if (selectedService) {
      localStorage.setItem('booking_service', JSON.stringify(selectedService));
    } else {
      localStorage.removeItem('booking_service');
    }
  }, [selectedService]);

  useEffect(() => {
    if (selectedDate) {
      localStorage.setItem('booking_date', selectedDate);
    } else {
      localStorage.removeItem('booking_date');
    }
  }, [selectedDate]);

  useEffect(() => {
    if (selectedTime) {
      localStorage.setItem('booking_time', selectedTime);
    } else {
      localStorage.removeItem('booking_time');
    }
  }, [selectedTime]);

  useEffect(() => {
    if (address) {
      localStorage.setItem('booking_address', address);
    } else {
      localStorage.removeItem('booking_address');
    }
  }, [address]);

  useEffect(() => {
    localStorage.setItem('booking_customer_info', JSON.stringify(customerInfo));
  }, [customerInfo]);

  useEffect(() => {
    localStorage.setItem('booking_step', currentStep.toString());
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep === 2) {
      // Validate date, time, and address
      const validation = validateDateTimeBooking(selectedDate, selectedTime, address);
      if (!validation.isValid) {
        setDateTimeErrors(validation.errors);
        return;
      }
      setDateTimeErrors({});
    }
    
    if (currentStep === 3) {
      // Validate customer information
      const validation = validateBookingForm(customerInfo as BookingFormData);
      if (!validation.isValid) {
        setFormErrors(validation.errors);
        return;
      }
      setFormErrors({});
    }
    
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation before submission
    const customerValidation = validateBookingForm(customerInfo as BookingFormData);
    const dateTimeValidation = validateDateTimeBooking(selectedDate, selectedTime, address);
    
    if (!customerValidation.isValid || !dateTimeValidation.isValid) {
      setFormErrors(customerValidation.errors);
      setDateTimeErrors(dateTimeValidation.errors);
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Validate time slot one last time
      const timeSlotResponse = await fetch('/api/booking/validate-timeslot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: selectedDate,
          time: selectedTime
        })
      });

      if (!timeSlotResponse.ok) {
        const error = await timeSlotResponse.json();
        setDateTimeErrors({ time: error.error || 'Ce créneau n\'est plus disponible' });
        return;
      }

      // Submit booking to API
      const bookingResponse = await fetch('/api/booking/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service: selectedService?.id,
          date: selectedDate,
          time: selectedTime,
          address,
          ...customerInfo
        })
      });

      if (!bookingResponse.ok) {
        const error = await bookingResponse.json();
        if (error.customerErrors) {
          setFormErrors(error.customerErrors);
        }
        if (error.dateTimeErrors) {
          setDateTimeErrors(error.dateTimeErrors);
        }
        throw new Error(error.error || 'Error submitting booking');
      }

      const result = await bookingResponse.json();
      
      // Clear stored booking data
      localStorage.removeItem('booking_service');
      localStorage.removeItem('booking_date');
      localStorage.removeItem('booking_time');
      localStorage.removeItem('booking_address');
      localStorage.removeItem('booking_customer_info');
      localStorage.removeItem('booking_step');
      
      alert('Réservation confirmée ! Vous recevrez un email de confirmation.');
    } catch (error) {
      console.error('Error submitting booking:', error);
      alert('Une erreur est survenue lors de la réservation. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <Header currentPage="booking" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Réservez votre lavage
          </h1>
          <div className="flex justify-center items-center">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center relative">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium relative z-10 ${
                  step <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {step}
                </div>
                {step < 4 && (
                  <div className={`w-[120px] h-0.5 absolute top-1/2 left-full -translate-y-1/2 ${
                    step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-2">
            <span className="text-sm text-gray-600">
              {currentStep === 1 && 'Choisissez votre service'}
              {currentStep === 2 && 'Sélectionnez date et heure'}
              {currentStep === 3 && 'Informations personnelles'}
              {currentStep === 4 && 'Confirmation'}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Choisissez votre service</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedService?.id === service.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                    }`}
                    onClick={() => {
                      setSelectedService(service);
                      handleNext();
                    }}
                  >
                    <div className="mb-4">
                      <AppleEmoji name={service.icon} className="w-12 h-12" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.name}</h3>
                    <p className="text-gray-600 mb-4 text-sm">{service.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-blue-600">{service.price}€</span>
                      <span className="text-sm text-gray-500">{service.duration}</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Date et heure</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    Choisissez une date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      if (dateTimeErrors.date) {
                        setDateTimeErrors(prev => ({ ...prev, date: '' }));
                      }
                    }}
                    min={getTomorrowDate()}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                      dateTimeErrors.date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {dateTimeErrors.date && (
                    <p className="mt-1 text-sm text-red-600">{dateTimeErrors.date}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    Adresse du service
                  </label>
                  <div className={dateTimeErrors.address ? 'animate-shake' : ''}>
                    <AddressAutocomplete
                      value={address}
                      onAddressSelect={(selectedAddress) => {
                        setAddress(selectedAddress);
                        if (dateTimeErrors.address) {
                          setDateTimeErrors(prev => ({ ...prev, address: '' }));
                        }
                      }}
                    />
                  </div>
                  {dateTimeErrors.address && (
                    <p className="mt-1 text-sm text-red-600">{dateTimeErrors.address}</p>
                  )}
                </div>
              </div>
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Créneaux disponibles
                </label>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => {
                        setSelectedTime(time);
                        if (dateTimeErrors.time) {
                          setDateTimeErrors(prev => ({ ...prev, time: '' }));
                        }
                      }}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        selectedTime === time
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-900'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
                {dateTimeErrors.time && (
                  <p className="mt-2 text-sm text-red-600">{dateTimeErrors.time}</p>
                )}
              </div>
              <div className="flex justify-between mt-8">
                <button
                  onClick={handleBack}
                  className="border-2 border-gray-300 text-gray-900 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={handleNext}
                  disabled={!selectedDate || !selectedTime || !address}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Continuer
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Vos informations</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    value={customerInfo.firstName}
                    onChange={(e) => {
                      setCustomerInfo({...customerInfo, firstName: e.target.value});
                      if (formErrors.firstName) {
                        setFormErrors(prev => ({ ...prev, firstName: '' }));
                      }
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                      formErrors.firstName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={customerInfo.lastName}
                    onChange={(e) => {
                      setCustomerInfo({...customerInfo, lastName: e.target.value});
                      if (formErrors.lastName) {
                        setFormErrors(prev => ({ ...prev, lastName: '' }));
                      }
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                      formErrors.lastName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.lastName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => {
                      setCustomerInfo({...customerInfo, email: e.target.value});
                      if (formErrors.email) {
                        setFormErrors(prev => ({ ...prev, email: '' }));
                      }
                    }}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                      formErrors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => {
                      setCustomerInfo({...customerInfo, phone: e.target.value});
                      if (formErrors.phone) {
                        setFormErrors(prev => ({ ...prev, phone: '' }));
                      }
                    }}
                    placeholder="Ex: 06 12 34 56 78"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                      formErrors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.phone && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Modèle de voiture
                  </label>
                  <input
                    type="text"
                    value={customerInfo.carType}
                    onChange={(e) => {
                      setCustomerInfo({...customerInfo, carType: e.target.value});
                      if (formErrors.carType) {
                        setFormErrors(prev => ({ ...prev, carType: '' }));
                      }
                    }}
                    placeholder="Ex: Peugeot 308, BMW X3, Renault Clio..."
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                      formErrors.carType ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.carType && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.carType}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Notes particulières
                  </label>
                  <textarea
                    value={customerInfo.notes}
                    onChange={(e) => {
                      setCustomerInfo({...customerInfo, notes: e.target.value});
                      if (formErrors.notes) {
                        setFormErrors(prev => ({ ...prev, notes: '' }));
                      }
                    }}
                    rows={3}
                    placeholder="Instructions particulières, accès au véhicule, etc."
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
                      formErrors.notes ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.notes && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.notes}</p>
                  )}
                </div>
              </div>
              <div className="flex justify-between mt-8">
                <button
                  onClick={handleBack}
                  className="border-2 border-gray-300 text-gray-900 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={handleNext}
                  className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Continuer
                </button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Confirmation de réservation</h2>
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Récapitulatif</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-900">Service:</span>
                    <span className="font-medium text-gray-900">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-900">Date:</span>
                    <span className="font-medium text-gray-900">{new Date(selectedDate).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-900">Heure:</span>
                    <span className="font-medium text-gray-900">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-900">Adresse:</span>
                    <span className="font-medium text-gray-900">{address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-900">Durée estimée:</span>
                    <span className="font-medium text-gray-900">{selectedService?.duration}</span>
                  </div>
                  <div className="flex justify-between border-t pt-3">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span className="text-2xl font-bold text-blue-600">{selectedService?.price}€</span>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Important:</strong> Le laveur arrivera avec tout le matériel nécessaire. 
                  Assurez-vous que votre véhicule soit accessible à l&apos;heure convenue.
                </p>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={isSubmitting}
                    className={`border-2 border-gray-300 text-gray-900 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors ${
                      isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-3 ${
                      isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Confirmation en cours...
                      </>
                    ) : (
                      'Confirmer la réservation'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2025 Lavage Auto. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}