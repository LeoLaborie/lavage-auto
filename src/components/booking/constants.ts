import { BookingFormData as ValidationBookingFormData } from '@/lib/validation';

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  icon: string;
  amountCents?: number;
  durationLabel?: string;
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

export const services: Service[] = [
  {
    id: 'exterior',
    name: 'Lavage Extérieur',
    description: 'Nettoyage complet de l\'extérieur de votre véhicule avec des produits de qualité.',
    price: 25,
    duration: '30 min',
    icon: 'sponge',
    amountCents: 2500,
    durationLabel: '30 min',
  },
  {
    id: 'complete',
    name: 'Lavage Complet',
    description: 'Nettoyage intérieur et extérieur pour une voiture impeccable.',
    price: 45,
    duration: '60 min',
    icon: 'sparkles',
    amountCents: 4500,
    durationLabel: '60 min',
  },
  {
    id: 'premium',
    name: 'Lavage Premium',
    description: 'Service complet avec cire, lustrage et traitement des plastiques.',
    price: 75,
    duration: '90 min',
    icon: 'gem',
    amountCents: 7500,
    durationLabel: '90 min'
  }
];

export const timeSlots = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'
];
