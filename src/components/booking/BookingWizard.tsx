'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { validateBookingForm, validateDateTimeBooking } from '@/lib/validation';
import type { ServiceId } from '@/lib/constants/services';
import Image from 'next/image';

import StepService from './StepService';
import StepAddress from './StepAddress';
import StepSchedule from './StepSchedule';
import StepVehicle from './StepVehicle';
import StepConfirmation from './StepConfirmation';
import { Service, UserCar, services, BookingFormData, getServiceById } from './constants';

const CANONICAL_SERVICE_KEY = 'booking_service_id';
const STORAGE_VERSION_KEY = 'booking_storage_version';
const STORAGE_VERSION = '2';
const BOOKING_STATE_KEYS = [
  'booking_service',
  CANONICAL_SERVICE_KEY,
  'booking_date',
  'booking_time',
  'booking_address',
  'booking_customer_info',
  'booking_step',
  'booking_selected_car_id',
  'booking_is_new_car',
];

const createEmptyCustomerInfo = (): BookingFormData => ({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  carType: '',
  licensePlate: '',
  make: '',
  model: '',
  notes: ''
});

const isStorageVersionCurrent = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_VERSION_KEY) === STORAGE_VERSION;
};

const readStoredService = () => {
  if (typeof window === 'undefined' || !isStorageVersionCurrent()) return null;
  const savedId = localStorage.getItem(CANONICAL_SERVICE_KEY) as ServiceId | null;
  return savedId ? getServiceById(savedId) ?? null : null;
};

const readStoredString = (key: string, fallback = '') => {
  if (typeof window === 'undefined' || !isStorageVersionCurrent()) return fallback;
  return localStorage.getItem(key) ?? fallback;
};

const readStoredBoolean = (key: string, fallback: boolean) => {
  if (typeof window === 'undefined' || !isStorageVersionCurrent()) return fallback;
  const saved = localStorage.getItem(key);
  return saved ? saved === 'true' : fallback;
};

const readStoredCustomerInfo = () => {
  if (typeof window === 'undefined' || !isStorageVersionCurrent()) {
    return createEmptyCustomerInfo();
  }
  const raw = localStorage.getItem('booking_customer_info');
  if (!raw) return createEmptyCustomerInfo();
  try {
    return { ...createEmptyCustomerInfo(), ...JSON.parse(raw) } as BookingFormData;
  } catch {
    return createEmptyCustomerInfo();
  }
};

export default function BookingWizard() {
  const searchParams = useSearchParams();
  const [selectedService, setSelectedService] = useState<Service | null>(readStoredService);
  const [selectedDate, setSelectedDate] = useState(() => readStoredString('booking_date'));
  const [selectedTime, setSelectedTime] = useState(() => readStoredString('booking_time'));
  const [address, setAddress] = useState(() => readStoredString('booking_address'));
  const { user } = useAuth();
  const { toast } = useToast();
  const [customerInfo, setCustomerInfo] = useState<BookingFormData>(readStoredCustomerInfo);

  // Pre-fill user info if logged in
  useEffect(() => {
    if (user) {
      setCustomerInfo((prev: BookingFormData) => ({
        ...prev,
        email: user.email || prev.email,
        firstName: prev.firstName || user.user_metadata?.full_name?.split(' ')[0] || '',
        lastName: prev.lastName || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
        phone: prev.phone || user.user_metadata?.phone || ''
      }));

      // Fetch saved profile (phone, name) from DB
      fetch('/api/customer/profile')
        .then(res => res.json())
        .then(data => {
          const profile = data?.data?.profile;
          if (profile) {
            setCustomerInfo((prev: BookingFormData) => ({
              ...prev,
              phone: prev.phone || profile.phone || '',
              firstName: prev.firstName || profile.firstName || '',
              lastName: prev.lastName || profile.lastName || '',
            }));
          }
        })
        .catch(err => console.error('Error fetching profile:', err));
    }
  }, [user]);

  const [currentStep, setCurrentStep] = useState(() => {
    if (typeof window !== 'undefined' && isStorageVersionCurrent()) {
      return parseInt(localStorage.getItem('booking_step') || '1', 10);
    }
    return 1;
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [dateTimeErrors, setDateTimeErrors] = useState<Record<string, string>>({});
  const [addressError, setAddressError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Car selection state
  const [userCars, setUserCars] = useState<UserCar[]>([]);
  const [selectedCarId, setSelectedCarId] = useState(() => readStoredString('booking_selected_car_id'));
  const [isNewCar, setIsNewCar] = useState(() => readStoredBoolean('booking_is_new_car', true));

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const version = localStorage.getItem(STORAGE_VERSION_KEY);
    if (version === STORAGE_VERSION) return;

    BOOKING_STATE_KEYS.forEach((key) => localStorage.removeItem(key));
    localStorage.setItem(STORAGE_VERSION_KEY, STORAGE_VERSION);
  }, []);

  // Fetch user cars
  useEffect(() => {
    if (user) {
      fetch('/api/customer/cars')
        .then(res => res.json())
        .then(data => {
          const cars = data?.data?.cars;
          if (cars && cars.length > 0) {
            setUserCars(cars);
            const storedIsNewCar = localStorage.getItem('booking_is_new_car');
            const storedCarId = localStorage.getItem('booking_selected_car_id');
            if (storedIsNewCar !== null) {
              setIsNewCar(storedIsNewCar === 'true');
              setSelectedCarId(storedCarId || cars[0].id);
            } else {
              setIsNewCar(false);
              setSelectedCarId(cars[0].id);
            }
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

    let serviceResolved = false;
    if (serviceParam) {
      const service = getServiceById(serviceParam as ServiceId);
      if (service) {
        setSelectedService(service);
        serviceResolved = true;
      }
    }

    // Ne sauter d'étapes que si le service a été résolu
    if (!serviceResolved) return;

    if (addressParam) {
      setAddress(decodeURIComponent(addressParam));
      if (timeParam && dateParam) {
        setSelectedTime(decodeURIComponent(timeParam));
        setSelectedDate(decodeURIComponent(dateParam));
        setCurrentStep(4);
      } else if (dateParam) {
        setSelectedDate(decodeURIComponent(dateParam));
        setCurrentStep(3);
      } else {
        setCurrentStep(2);
      }
    } else {
      setCurrentStep(2);
    }
  }, [searchParams]);

  // Save state to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!selectedService) {
      localStorage.removeItem(CANONICAL_SERVICE_KEY);
      return;
    }
    localStorage.setItem(CANONICAL_SERVICE_KEY, selectedService.id);
  }, [selectedService]);

  useEffect(() => {
    if (selectedDate) localStorage.setItem('booking_date', selectedDate);
    else localStorage.removeItem('booking_date');
  }, [selectedDate]);

  useEffect(() => {
    if (selectedTime) localStorage.setItem('booking_time', selectedTime);
    else localStorage.removeItem('booking_time');
  }, [selectedTime]);

  useEffect(() => {
    if (address) localStorage.setItem('booking_address', address);
    else localStorage.removeItem('booking_address');
  }, [address]);

  useEffect(() => localStorage.setItem('booking_customer_info', JSON.stringify(customerInfo)), [customerInfo]);

  useEffect(() => localStorage.setItem('booking_step', currentStep.toString()), [currentStep]);

  useEffect(() => localStorage.setItem('booking_selected_car_id', selectedCarId), [selectedCarId]);

  useEffect(() => localStorage.setItem('booking_is_new_car', String(isNewCar)), [isNewCar]);

  const handleNext = () => {
    if (currentStep === 2) {
      if (!address.trim()) {
          setAddressError("Veuillez saisir une adresse");
          return;
      }
      if (address.trim().length < 5) {
          setAddressError("Veuillez entrer une adresse complète");
          return;
      }
      setAddressError("");
    }
    
    if (currentStep === 3) {
      const validation = validateDateTimeBooking(selectedDate, selectedTime, address);
      if (!validation.isValid) {
        setDateTimeErrors(validation.errors);
        return;
      }
      setDateTimeErrors({});
    }

    if (currentStep === 4) {
      if (!isNewCar && !selectedCarId) {
        setFormErrors({ carSelection: 'Veuillez sélectionner un véhicule' });
        return;
      }

      const validation = validateBookingForm(customerInfo, { skipCarValidation: !isNewCar });
      if (!validation.isValid) {
        setFormErrors(validation.errors);
        return;
      }
      setFormErrors({});
    }

    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => setCurrentStep(prev => prev - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!selectedService) {
      setCurrentStep(1);
      return;
    }

    if (!isNewCar && !selectedCarId) {
      setFormErrors({ carSelection: 'Veuillez sélectionner un véhicule' });
      return;
    }

    const customerValidation = validateBookingForm(customerInfo, { skipCarValidation: !isNewCar });
    const dateTimeValidation = validateDateTimeBooking(selectedDate, selectedTime, address);

    if (!customerValidation.isValid || !dateTimeValidation.isValid) {
      setFormErrors(customerValidation.errors);
      setDateTimeErrors(dateTimeValidation.errors);
      toast.warning("Veuillez vérifier les informations saisies. Des erreurs sont présentes.");
      if (!customerValidation.isValid) setCurrentStep(4);
      else if (!dateTimeValidation.isValid) setCurrentStep(3);
      return;
    }

    setIsSubmitting(true);

    try {
      const timeSlotResponse = await fetch('/api/booking/validate-timeslot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate, time: selectedTime })
      });

      if (!timeSlotResponse.ok) {
        const error = await timeSlotResponse.json();
        setDateTimeErrors({ time: error.error || 'Ce créneau n\'est plus disponible' });
        return;
      }

      const scheduledAtDate = new Date(`${selectedDate}T${selectedTime}:00`);

      const bookingData: Record<string, unknown> = {
        service: selectedService?.id,
        scheduledAt: scheduledAtDate.toISOString(),
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
        if (error.customerErrors) setFormErrors(error.customerErrors);
        if (error.dateTimeErrors) setDateTimeErrors(error.dateTimeErrors);
        throw new Error(error.error || 'Error submitting booking');
      }

      const result = await bookingResponse.json();

      BOOKING_STATE_KEYS.forEach((key) => localStorage.removeItem(key));

      if (result.data?.checkoutUrl) {
        window.location.href = result.data.checkoutUrl;
        return;
      }

      if (result.data?.warning) {
        toast.warning('La réservation a été créée mais le paiement n\'a pas pu être initialisé. Veuillez réessayer depuis votre espace.');
        window.location.href = '/dashboard';
        return;
      }

      toast.success('Réservation confirmée ! Vous allez être redirigé vers votre espace.');
      window.location.href = '/dashboard';

    } catch (error) {
      console.error('Error submitting booking:', error);
      toast.error('Une erreur est survenue lors de la réservation. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Réservez votre lavage
        </h1>
        <div className="flex justify-center items-center mb-8 relative max-w-4xl mx-auto">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
            />
          </div>

          <div className="flex justify-between w-full px-2 sm:px-4">
            {[
              { step: 1, icon: '/icons/step-service.png', label: 'Service' },
              { step: 2, icon: '/icons/step-date.png', label: '📍 Lieu' },
              { step: 3, icon: '/icons/step-date.png', label: '📅 Date/Heure' },
              { step: 4, icon: '/icons/step-info.png', label: 'Infos' },
              { step: 5, icon: '/icons/step-confirm.png', label: 'Confirmation' }
            ].map((item) => (
              <div
                key={item.step}
                className={`flex flex-col items-center gap-1 sm:gap-2 group ${item.step < currentStep ? 'cursor-pointer' : 'cursor-default'}`}
                onClick={() => { if (item.step < currentStep) setCurrentStep(item.step); }}
              >
                <div className={`w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all duration-300 z-10 border-4 relative overflow-hidden bg-white ${currentStep >= item.step
                  ? 'border-primary shadow-lg scale-110'
                  : 'border-gray-200 grayscale opacity-60'
                  }`}>
                  <Image
                    src={item.icon}
                    alt={item.label}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 48px, 64px"
                  />
                </div>
                <span className={`text-xs sm:text-sm md:text-base font-bold transition-colors duration-300 ${currentStep >= item.step ? 'text-primary' : 'text-gray-400'
                  }`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
        {currentStep === 1 && (
          <StepService
            selectedService={selectedService}
            setSelectedService={setSelectedService}
            handleNext={handleNext}
          />
        )}
        {currentStep === 2 && (
          <StepAddress
            address={address}
            setAddress={setAddress}
            addressError={addressError}
            setAddressError={setAddressError}
            handleBack={handleBack}
            handleNext={handleNext}
          />
        )}
        {currentStep === 3 && (
          <StepSchedule
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedTime={selectedTime}
            setSelectedTime={setSelectedTime}
            dateTimeErrors={dateTimeErrors}
            setDateTimeErrors={setDateTimeErrors}
            handleBack={handleBack}
            handleNext={handleNext}
          />
        )}
        {currentStep === 4 && (
          <StepVehicle
            customerInfo={customerInfo}
            setCustomerInfo={setCustomerInfo}
            formErrors={formErrors}
            setFormErrors={setFormErrors}
            user={user}
            userCars={userCars}
            selectedCarId={selectedCarId}
            setSelectedCarId={setSelectedCarId}
            isNewCar={isNewCar}
            setIsNewCar={setIsNewCar}
            handleBack={handleBack}
            handleNext={handleNext}
          />
        )}
        {currentStep === 5 && (
          <StepConfirmation
            selectedService={selectedService}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            address={address}
            isSubmitting={isSubmitting}
            vehicleLabel={
              !isNewCar && selectedCarId
                ? userCars.find(c => c.id === selectedCarId)
                  ? `${userCars.find(c => c.id === selectedCarId)!.make} ${userCars.find(c => c.id === selectedCarId)!.model}${userCars.find(c => c.id === selectedCarId)!.plate ? ` - ${userCars.find(c => c.id === selectedCarId)!.plate}` : ''}`
                  : 'Véhicule sélectionné'
                : `${customerInfo.make || ''} ${customerInfo.model || ''}${customerInfo.licensePlate ? ` - ${customerInfo.licensePlate}` : ''}`.trim() || 'Nouveau véhicule'
            }
            handleBack={handleBack}
            handleSubmit={handleSubmit}
          />
        )}
      </div>
    </>
  );
}
