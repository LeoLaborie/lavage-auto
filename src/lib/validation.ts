// Form validation utilities
export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export interface BookingFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  carType: string
  notes: string
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  // French phone number validation (mobile and landline)
  const phoneRegex = /^(?:(?:\+33|0)[1-9](?:[0-9]{8}))$/
  const cleanPhone = phone.replace(/[\s.-]/g, '')
  return phoneRegex.test(cleanPhone)
}

export function validateBookingForm(data: BookingFormData): ValidationResult {
  const errors: Record<string, string> = {}

  // Required fields
  if (!data.firstName.trim()) {
    errors.firstName = 'Le prénom est requis'
  } else if (data.firstName.trim().length < 2) {
    errors.firstName = 'Le prénom doit contenir au moins 2 caractères'
  }

  if (!data.lastName.trim()) {
    errors.lastName = 'Le nom est requis'
  } else if (data.lastName.trim().length < 2) {
    errors.lastName = 'Le nom doit contenir au moins 2 caractères'
  }

  if (!data.email.trim()) {
    errors.email = 'L\'email est requis'
  } else if (!validateEmail(data.email)) {
    errors.email = 'Veuillez entrer un email valide'
  }

  if (!data.phone.trim()) {
    errors.phone = 'Le téléphone est requis'
  } else if (!validatePhone(data.phone)) {
    errors.phone = 'Veuillez entrer un numéro de téléphone français valide'
  }

  // Optional validation for car type
  if (data.carType && data.carType.length > 50) {
    errors.carType = 'Le modèle de voiture ne peut pas dépasser 50 caractères'
  }

  // Optional validation for notes
  if (data.notes && data.notes.length > 500) {
    errors.notes = 'Les notes ne peuvent pas dépasser 500 caractères'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export function validateDateTimeBooking(date: string, time: string, address: string): ValidationResult {
  const errors: Record<string, string> = {}

  if (!date) {
    errors.date = 'Veuillez sélectionner une date'
  } else {
    const selectedDate = new Date(date)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    if (selectedDate < tomorrow) {
      errors.date = 'Veuillez sélectionner une date à partir de demain'
    }
  }

  if (!time) {
    errors.time = 'Veuillez sélectionner un créneau horaire'
  }

  if (!address.trim()) {
    errors.address = 'L\'adresse est requise'
  } else if (address.trim().length < 10) {
    errors.address = 'Veuillez entrer une adresse complète'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export interface ContactFormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  subject: string
  message: string
}

export function validateContactForm(data: ContactFormData): ValidationResult {
  const errors: Record<string, string> = {}

  if (!data.firstName.trim()) {
    errors.firstName = 'Le prénom est requis'
  }

  if (!data.lastName.trim()) {
    errors.lastName = 'Le nom est requis'
  }

  if (!data.email.trim()) {
    errors.email = 'L\'email est requis'
  } else if (!validateEmail(data.email)) {
    errors.email = 'Veuillez entrer un email valide'
  }

  if (!data.phone.trim()) {
    errors.phone = 'Le téléphone est requis'
  } else if (!validatePhone(data.phone)) {
    errors.phone = 'Veuillez entrer un numéro de téléphone français valide'
  }

  if (!data.subject) {
    errors.subject = 'Veuillez sélectionner un sujet'
  }

  if (!data.message.trim()) {
    errors.message = 'Le message est requis'
  } else if (data.message.trim().length < 10) {
    errors.message = 'Le message doit contenir au moins 10 caractères'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}