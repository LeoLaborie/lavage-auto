import { services as canonicalServices, ServiceId, TIME_SLOTS } from '@/lib/constants/services';
import { BookingFormData as ValidationBookingFormData } from '@/lib/validation';

const uiServices = canonicalServices
  .filter((service) => service.isVisible)
  .map((service) => ({
    id: service.id,
    name: service.name,
    description: service.description,
    price: service.amountCents / 100,
    duration: service.durationLabel,
    icon: service.icon,
    amountCents: service.amountCents,
    durationLabel: service.durationLabel,
  }));

export type Service = (typeof uiServices)[number];
export const services: Service[] = uiServices;
export function getServiceById(id: ServiceId): Service | undefined {
  return uiServices.find((service) => service.id === id);
}

export interface UserCar {
  id: string;
  make: string;
  model: string;
  plate: string | null;
}

export interface BookingFormData extends ValidationBookingFormData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    carType: string;
    licensePlate: string;
    make: string;
    model: string;
    notes: string;
}

export const timeSlots = [...TIME_SLOTS];
