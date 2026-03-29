import { services as canonicalServices, ServiceId } from '@/lib/constants/services';
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

export const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
];
