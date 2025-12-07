'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import AddressAutocomplete from '@/components/AddressAutocomplete';
import BackButton from '@/components/BackButton';
import { validateBookingForm, validateDateTimeBooking, BookingFormData } from '@/lib/validation';
import { AppleEmoji } from '@/components/AppleEmoji';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format, addDays, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';

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

function ReserverContent() {
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
  const { user } = useAuth();
  const [customerInfo, setCustomerInfo] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('booking_customer_info');
      return saved ? JSON.parse(saved) : {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        carType: '',
        licensePlate: '',
        make: '',
        model: '',
        notes: ''
      };
    }
    return {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      carType: '',
      licensePlate: '',
      make: '',
      model: '',
      notes: ''
    };
  });

  // Pre-fill user info if logged in
  useEffect(() => {
    if (user) {
      // First set basic info from auth metadata
      setCustomerInfo((prev: BookingFormData) => ({
        ...prev,
        email: user.email || prev.email,
        firstName: prev.firstName || user.user_metadata?.full_name?.split(' ')[0] || '',
        lastName: prev.lastName || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || ''
      }));

      // Then fetch full profile for phone number
      fetch('/api/customer/profile')
        .then(res => res.json())
        .then(data => {
          if (data.customer) {
            setCustomerInfo((prev: BookingFormData) => ({
              ...prev,
              phone: data.customer.phone || prev.phone,
              // Also update name if available in profile as it might be more up to date
              firstName: data.customer.name.split(' ')[0] || prev.firstName,
              lastName: data.customer.name.split(' ').slice(1).join(' ') || prev.lastName,
            }));
          }
        })
        .catch(err => console.error('Error fetching profile:', err));
    }
  }, [user]);
  const [currentStep, setCurrentStep] = useState(() => {
    if (typeof window !== 'undefined') {
      return parseInt(localStorage.getItem('booking_step') || '1', 10);
    }
    return 1;
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [dateTimeErrors, setDateTimeErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Car selection state
  const [userCars, setUserCars] = useState<any[]>([]);
  const [selectedCarId, setSelectedCarId] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('booking_selected_car_id') || '';
    }
    return '';
  });
  const [isNewCar, setIsNewCar] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('booking_is_new_car');
      return saved ? saved === 'true' : true;
    }
    return true;
  });

  // Fetch user cars
  useEffect(() => {
    if (user) {
      fetch('/api/customer/cars')
        .then(res => res.json())
        .then(data => {
          if (data.cars && data.cars.length > 0) {
            setUserCars(data.cars);
            setIsNewCar(false); // Default to existing car if available
            setSelectedCarId(data.cars[0].id);
          }
        })
        .catch(err => console.error('Error fetching cars:', err));
    }
  }, [user]);

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
    } else if (dateParam) {
      // Cas où seule la date est sélectionnée (ex: depuis le calendrier)
      setSelectedDate(decodeURIComponent(dateParam));
      setCurrentStep(2);
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

  useEffect(() => {
    localStorage.setItem('booking_selected_car_id', selectedCarId);
  }, [selectedCarId]);

  useEffect(() => {
    localStorage.setItem('booking_is_new_car', String(isNewCar));
  }, [isNewCar]);

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
      const validationData = { ...customerInfo } as any;

      if (!isNewCar) {
        if (!selectedCarId) {
          setFormErrors({ carSelection: 'Veuillez sélectionner un véhicule' });
          return;
        }
        // Mock car details to pass validation
        validationData.licensePlate = 'EXISTING';
        validationData.make = 'EXISTING';
        validationData.model = 'EXISTING';
      }

      const validation = validateBookingForm(validationData as BookingFormData);
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
    const validationData = { ...customerInfo } as any;

    if (!isNewCar) {
      if (!selectedCarId) {
        setFormErrors({ carSelection: 'Veuillez sélectionner un véhicule' });
        return;
      }
      // Mock car details to pass validation
      validationData.licensePlate = 'EXISTING';
      validationData.make = 'EXISTING';
      validationData.model = 'EXISTING';
    }

    const customerValidation = validateBookingForm(validationData as BookingFormData);
    const dateTimeValidation = validateDateTimeBooking(selectedDate, selectedTime, address);

    if (!customerValidation.isValid || !dateTimeValidation.isValid) {
      setFormErrors(customerValidation.errors);
      setDateTimeErrors(dateTimeValidation.errors);
      alert("Veuillez vérifier les informations saisies. Des erreurs sont présentes.");
      if (!customerValidation.isValid) setCurrentStep(3);
      else if (!dateTimeValidation.isValid) setCurrentStep(2);
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
      // Submit booking to API
      const bookingData: any = {
        service: selectedService?.id,
        date: selectedDate,
        time: selectedTime,
        address,
        ...customerInfo
      };

      if (!isNewCar && selectedCarId) {
        bookingData.carId = selectedCarId;
      } else {
        bookingData.make = customerInfo.make;
        bookingData.model = customerInfo.model;
        bookingData.licensePlate = customerInfo.licensePlate;
      }

      const bookingResponse = await fetch('/api/booking/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
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

      alert('Réservation confirmée ! Vous allez être redirigé vers votre espace.');

      // Redirect to client dashboard
      // Note: Even if the user is a washer, when they book a service they are acting as a client
      // so redirecting to client dashboard is appropriate.
      window.location.href = '/dashboard/client';

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
          <div className="flex justify-center items-center mb-8 relative max-w-4xl mx-auto">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              />
            </div>

            <div className="flex justify-between w-full px-4">
              {[
                { step: 1, icon: '/icons/step-service.png', label: 'Service' },
                { step: 2, icon: '/icons/step-date.png', label: 'Date & Lieu' },
                { step: 3, icon: '/icons/step-info.png', label: 'Infos' },
                { step: 4, icon: '/icons/step-confirm.png', label: 'Confirmation' }
              ].map((item) => (
                <div key={item.step} className="flex flex-col items-center gap-2 group cursor-default">
                  <div className={`w-16 h-16 md:w-24 md:h-24 rounded-full flex items-center justify-center transition-all duration-300 z-10 border-4 relative overflow-hidden bg-white ${currentStep >= item.step
                    ? 'border-primary shadow-lg scale-110'
                    : 'border-gray-200 grayscale opacity-60'
                    }`}>
                    <Image
                      src={item.icon}
                      alt={item.label}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 64px, 96px"
                    />
                  </div>
                  <span className={`text-sm md:text-base font-bold transition-colors duration-300 ${currentStep >= item.step ? 'text-primary' : 'text-gray-400'
                    }`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          {currentStep === 1 && (
            <div className="animate-fade-in-up">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 title-font text-center">Choisissez votre formule</h2>
              <div className="grid md:grid-cols-3 gap-8">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className={`relative p-8 rounded-3xl cursor-pointer transition-all duration-300 group overflow-hidden ${selectedService?.id === service.id
                      ? 'bg-white shadow-2xl ring-4 ring-primary scale-105 z-10'
                      : 'bg-white shadow-lg hover:shadow-xl hover:-translate-y-1 hover:bg-gray-50'
                      }`}
                    onClick={() => {
                      setSelectedService(service);
                      handleNext();
                    }}
                  >
                    {service.id === 'complete' && (
                      <div className="absolute top-4 right-4 bg-accent text-primary text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide z-20">
                        Populaire
                      </div>
                    )}

                    {/* Background decoration */}
                    <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110 opacity-10 ${service.id === 'premium' ? 'bg-secondary' : service.id === 'complete' ? 'bg-accent' : 'bg-primary'
                      }`} />

                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm transition-colors overflow-hidden border-2 ${selectedService?.id === service.id
                        ? 'bg-primary text-white border-primary'
                        : 'bg-gray-100 text-gray-600 border-gray-100 group-hover:bg-primary group-hover:text-white group-hover:border-primary'
                      }`}>
                      <AppleEmoji name={service.icon} className="w-full h-full object-contain" />
                    </div>

                    <h3 className="text-2xl font-bold text-gray-900 mb-3 title-font">{service.name}</h3>
                    <p className="text-gray-600 mb-6 text-sm leading-relaxed">{service.description}</p>

                    <div className="pt-4 border-t border-gray-100 flex justify-between items-center mt-auto">
                      <span className="text-3xl font-bold text-primary">{service.price}€</span>
                      <div className="flex items-center text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        <span className="mr-1">⏱️</span>
                        {service.duration}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="animate-fade-in-up">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 title-font text-center">Quand et où ?</h2>
              <div className="grid lg:grid-cols-2 gap-6 h-full">
                <div className="space-y-4 flex flex-col">
                  <div className="bg-gray-50 p-4 rounded-2xl flex-1">
                    <label className="block text-md font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <span className="text-xl">📅</span> Choisissez une date
                    </label>
                    <div className="calendar-wrapper-compact">
                      <Calendar
                        onChange={(value: any) => {
                          if (value instanceof Date) {
                            setSelectedDate(format(value, 'yyyy-MM-dd'));
                            setSelectedTime('');
                            if (dateTimeErrors.date) {
                              setDateTimeErrors(prev => ({ ...prev, date: '' }));
                            }
                          }
                        }}
                        value={selectedDate ? new Date(selectedDate) : null}
                        locale="fr-FR"
                        tileDisabled={({ date }) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date < today;
                        }}
                        className="w-full border-none !font-sans rounded-xl shadow-sm overflow-hidden text-sm"
                        tileClassName="rounded-lg hover:bg-blue-50 focus:bg-blue-100 h-8 w-8 flex items-center justify-center font-medium text-xs"
                        navigationLabel={({ date }) => <span className="capitalize font-bold text-primary text-sm">{format(date, 'MMMM yyyy', { locale: fr })}</span>}
                        next2Label={null}
                        prev2Label={null}
                      />
                    </div>
                    {dateTimeErrors.date && (
                      <p className="mt-1 text-xs text-red-600 bg-red-50 p-1 rounded flex items-center gap-1">
                        <span>⚠️</span> {dateTimeErrors.date}
                      </p>
                    )}
                  </div>

                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <label className="block text-md font-bold text-gray-900 mb-2 flex items-center gap-2">
                      <span className="text-xl">📍</span> Adresse
                    </label>
                    <div className={`${dateTimeErrors.address ? 'animate-shake' : ''}`}>
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
                      <p className="mt-1 text-xs text-red-600 bg-red-50 p-1 rounded flex items-center gap-1">
                        <span>⚠️</span> {dateTimeErrors.address}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="bg-white border-2 border-gray-100 p-4 rounded-2xl h-full overflow-hidden flex flex-col">
                    <label className="block text-md font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="text-xl">⏰</span> Créneaux
                    </label>

                    {!selectedDate ? (
                      <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-center p-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <span className="text-2xl mb-2">👈</span>
                        <p className="text-sm">Sélectionnez une date</p>
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                        <p className="text-xs text-gray-500 mb-2 sticky top-0 bg-white py-1 z-10">
                          Pour le <span className="font-bold text-primary capitalize">{format(new Date(selectedDate), 'EEEE d MMMM', { locale: fr })}</span>
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {timeSlots.map((time) => (
                            <button
                              key={time}
                              onClick={() => {
                                setSelectedTime(time);
                                if (dateTimeErrors.time) {
                                  setDateTimeErrors(prev => ({ ...prev, time: '' }));
                                }
                              }}
                              className={`py-2 px-1 rounded-lg text-xs font-bold transition-all transform hover:scale-105 ${selectedTime === time
                                ? 'bg-primary text-white shadow-md ring-2 ring-primary ring-offset-1'
                                : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-100'
                                }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {dateTimeErrors.time && (
                      <p className="mt-2 text-xs text-red-600 bg-red-50 p-1 rounded flex items-center gap-1">
                        <span>⚠️</span> {dateTimeErrors.time}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors text-sm"
                >
                  <span>←</span> Retour
                </button>
                <button
                  onClick={handleNext}
                  disabled={!selectedDate || !selectedTime || !address}
                  className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all transform hover:scale-105 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                >
                  Continuer <span className="ml-2">→</span>
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="animate-fade-in-up">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 title-font text-center">Vos coordonnées</h2>

              <div className="space-y-4">
                {/* Identity & Contact - Dense Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">Prénom*</label>
                    <input
                      type="text"
                      value={customerInfo.firstName}
                      onChange={(e) => {
                        setCustomerInfo({ ...customerInfo, firstName: e.target.value });
                        if (formErrors.firstName) setFormErrors(prev => ({ ...prev, firstName: '' }));
                      }}
                      className={`w-full px-3 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-primary transition-all text-sm ${formErrors.firstName ? 'border-red-500' : 'border-gray-200'}`}
                      placeholder="Jean"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">Nom*</label>
                    <input
                      type="text"
                      value={customerInfo.lastName}
                      onChange={(e) => {
                        setCustomerInfo({ ...customerInfo, lastName: e.target.value });
                        if (formErrors.lastName) setFormErrors(prev => ({ ...prev, lastName: '' }));
                      }}
                      className={`w-full px-3 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-primary transition-all text-sm ${formErrors.lastName ? 'border-red-500' : 'border-gray-200'}`}
                      placeholder="Dupont"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">Email*</label>
                    <input
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => {
                        setCustomerInfo({ ...customerInfo, email: e.target.value });
                        if (formErrors.email) setFormErrors(prev => ({ ...prev, email: '' }));
                      }}
                      className={`w-full px-3 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-primary transition-all text-sm ${formErrors.email ? 'border-red-500' : 'border-gray-200'} ${user ? 'opacity-75' : ''}`}
                      disabled={!!user}
                      placeholder="jean@mail.com"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-700 mb-1 ml-1">Tél*</label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => {
                        setCustomerInfo({ ...customerInfo, phone: e.target.value });
                        if (formErrors.phone) setFormErrors(prev => ({ ...prev, phone: '' }));
                      }}
                      placeholder="06 12..."
                      className={`w-full px-3 py-2 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-primary transition-all text-sm ${formErrors.phone ? 'border-red-500' : 'border-gray-200'}`}
                    />
                  </div>
                </div>

                {/* Vehicle Selection - Compact */}
                <div className="border-t border-gray-100 pt-3">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-gray-900 title-font">Votre Véhicule</h3>
                    {userCars.length > 0 && (
                      <div className="flex gap-2 p-1 bg-gray-100 rounded-lg scale-90 origin-right">
                        <label className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer text-xs transition-all ${!isNewCar ? 'bg-white shadow-sm text-primary font-bold' : 'text-gray-500'
                          }`}>
                          <input type="radio" name="carSelection" checked={!isNewCar} onChange={() => setIsNewCar(false)} className="hidden" />
                          <span>Existant</span>
                        </label>
                        <label className={`flex items-center gap-1 px-2 py-1 rounded cursor-pointer text-xs transition-all ${isNewCar ? 'bg-white shadow-sm text-primary font-bold' : 'text-gray-500'
                          }`}>
                          <input type="radio" name="carSelection" checked={isNewCar} onChange={() => setIsNewCar(true)} className="hidden" />
                          <span>Nouveau</span>
                        </label>
                      </div>
                    )}
                  </div>

                  {!isNewCar && userCars.length > 0 ? (
                    <select
                      value={selectedCarId}
                      onChange={(e) => {
                        setSelectedCarId(e.target.value);
                        if (formErrors.carSelection) setFormErrors(prev => ({ ...prev, carSelection: '' }));
                      }}
                      className={`w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm ${formErrors.carSelection ? 'border-red-500' : 'border-gray-200'}`}
                    >
                      <option value="">Choisir un véhicule...</option>
                      {userCars.map(car => (
                        <option key={car.id} value={car.id}>{car.make} {car.model} - {car.licensePlate}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <input
                          type="text"
                          value={customerInfo.make || ''}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, make: e.target.value })}
                          placeholder="Marque"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={customerInfo.model || ''}
                          onChange={(e) => setCustomerInfo({ ...customerInfo, model: e.target.value })}
                          placeholder="Modèle"
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={customerInfo.licensePlate || ''}
                          onChange={(e) => {
                            setCustomerInfo({ ...customerInfo, licensePlate: e.target.value.toUpperCase() });
                            if (formErrors.licensePlate) setFormErrors(prev => ({ ...prev, licensePlate: '' }));
                          }}
                          placeholder="Plaque"
                          className={`w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm ${formErrors.licensePlate ? 'border-red-500' : 'border-gray-200'}`}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <textarea
                    value={customerInfo.notes}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                    rows={2}
                    placeholder="Notes (code portail, etc.)"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors text-sm"
                >
                  <span>←</span> Retour
                </button>
                <button
                  onClick={handleNext}
                  className="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all transform hover:scale-105 shadow-xl text-sm"
                >
                  Continuer <span className="ml-2">→</span>
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
                    className={`border-2 border-gray-300 text-gray-900 px-8 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-3 ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
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

export default function Reserver() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement...</div>}>
      <ReserverContent />
    </Suspense>
  );
}