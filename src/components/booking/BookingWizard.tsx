'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { validateBookingForm, validateDateTimeBooking } from '@/lib/validation';
import type { ServiceId } from '@/lib/constants/services';

import StepService from './StepService';
import StepAddress from './StepAddress';
import StepSchedule from './StepSchedule';
import StepVehicle from './StepVehicle';
import StepConfirmation from './StepConfirmation';
import { Service, UserCar, BookingFormData, getServiceById } from './constants';

const CANONICAL_SERVICE_KEY = 'booking_service_id';
const STORAGE_VERSION_KEY = 'booking_storage_version';
const STORAGE_VERSION = '3';
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
  'booking_service_lat',
  'booking_service_lng',
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
  const [serviceLat, setServiceLat] = useState<number | null>(() => {
    if (typeof window === 'undefined' || !isStorageVersionCurrent()) return null;
    const raw = localStorage.getItem('booking_service_lat');
    return raw ? Number(raw) : null;
  });
  const [serviceLng, setServiceLng] = useState<number | null>(() => {
    if (typeof window === 'undefined' || !isStorageVersionCurrent()) return null;
    const raw = localStorage.getItem('booking_service_lng');
    return raw ? Number(raw) : null;
  });

  const setCoords = (coords: { lat: number; lng: number } | null) => {
    setServiceLat(coords?.lat ?? null);
    setServiceLng(coords?.lng ?? null);
  };

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

  useEffect(() => {
    if (serviceLat != null) localStorage.setItem('booking_service_lat', String(serviceLat));
    else localStorage.removeItem('booking_service_lat');
  }, [serviceLat]);

  useEffect(() => {
    if (serviceLng != null) localStorage.setItem('booking_service_lng', String(serviceLng));
    else localStorage.removeItem('booking_service_lng');
  }, [serviceLng]);

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
        serviceLat,
        serviceLng,
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

  const steps = [
    { step: 1, label: 'Service', shortLabel: 'Service' },
    { step: 2, label: 'Lieu', shortLabel: 'Lieu' },
    { step: 3, label: 'Date & heure', shortLabel: 'Date' },
    { step: 4, label: 'Infos', shortLabel: 'Infos' },
    { step: 5, label: 'Confirmation', shortLabel: 'Valider' },
  ];

  return (
    <>
      <div className="mb-8 md:mb-12">
        <div className="mb-5 inline-block rounded-md bg-blue-wash px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-blue md:text-xs">
          Réservation · {String(currentStep).padStart(2, '0')} / 05
        </div>
        <h1 className="font-display font-extrabold leading-[0.95] tracking-[-0.04em] text-[40px] md:text-[64px]">
          Réservez votre lavage.
        </h1>

        <div className="mt-8 md:mt-10">
          <div className="relative h-[2px] w-full bg-rule">
            <div
              className="absolute left-0 top-0 h-full bg-ink transition-all duration-500 ease-out"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />
          </div>

          <div className="mt-4 flex justify-between gap-2">
            {steps.map((item) => {
              const isActive = currentStep === item.step;
              const isDone = currentStep > item.step;
              const isClickable = item.step < currentStep;
              return (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => { if (isClickable) setCurrentStep(item.step); }}
                  disabled={!isClickable}
                  className={`flex flex-1 flex-col items-start gap-1.5 text-left ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <span
                    className={`font-mono text-[10px] font-semibold uppercase tracking-[0.08em] md:text-[11px] ${
                      isActive ? 'text-blue' : isDone ? 'text-ink2' : 'text-ink2/40'
                    }`}
                  >
                    {String(item.step).padStart(2, '0')}
                  </span>
                  <span
                    className={`font-cinsans text-[12px] font-semibold leading-tight md:text-sm ${
                      isActive ? 'text-ink' : isDone ? 'text-ink2' : 'text-ink2/40'
                    }`}
                  >
                    <span className="sm:hidden">{item.shortLabel}</span>
                    <span className="hidden sm:inline">{item.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-[20px] border border-rule bg-white p-5 shadow-cin-card md:p-9">
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
            serviceLat={serviceLat}
            serviceLng={serviceLng}
            setCoords={setCoords}
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
