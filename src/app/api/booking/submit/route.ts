import { NextResponse } from 'next/server'
import { validateBookingForm, validateDateTimeBooking } from '@/lib/validation'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { ServiceType } from '@prisma/client'

export const dynamic = 'force-dynamic'

const getServiceType = (id: string): ServiceType | null => {
  switch (id) {
    case 'exterior': return 'EXTERIOR'
    case 'complete': return 'COMPLETE'
    case 'premium': return 'PREMIUM'
    default: return null
  }
}

// Helper to get service details
const getServiceDetails = (type: ServiceType) => {
  switch (type) {
    case 'EXTERIOR':
      return { name: 'Lavage Extérieur', price: 25, duration: 30, description: 'Nettoyage complet de l\'extérieur' }
    case 'COMPLETE':
      return { name: 'Lavage Complet', price: 45, duration: 60, description: 'Nettoyage intérieur et extérieur' }
    case 'PREMIUM':
      return { name: 'Lavage Premium', price: 75, duration: 90, description: 'Service complet avec finitions' }
  }
}

export async function POST(request: Request) {
  try {
    // 1. Authentication Check
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour réserver' },
        { status: 401 }
      )
    }

    // 2. Get Customer Profile
    let customer = await prisma.customer.findUnique({
      where: { email: user.email! }
    })

    if (!customer) {
      // Check if user is a Washer
      const washer = await prisma.washer.findUnique({
        where: { email: user.email! }
      })

      if (washer) {
        // Auto-create customer profile for the washer
        customer = await prisma.customer.create({
          data: {
            email: user.email!,
            name: washer.name,
            phone: washer.phone,
            profilePicture: washer.profilePicture,
            supabaseUserId: user.id,
            emailVerified: true
          }
        })
      } else {
        return NextResponse.json(
          { error: 'Profil client introuvable. Veuillez compléter votre inscription.' },
          { status: 404 }
        )
      }
    }

    const data = await request.json()
    const {
      service: serviceId,
      date,
      time,
      address,
      firstName,
      lastName,
      email,
      phone,
      carType,
      notes,
      carId,      // New field
      make,       // New field
      model,      // New field
      licensePlate // New field
    } = data

    // 3. Validation
    const customerValidation = validateBookingForm({
      firstName,
      lastName,
      email,
      phone,
      carType: carType || model, // Fallback
      licensePlate: carId ? 'EXISTING' : licensePlate, // Skip validation if existing car
      notes
    })

    const dateTimeValidation = validateDateTimeBooking(date, time, address)

    if (!customerValidation.isValid || !dateTimeValidation.isValid) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          customerErrors: customerValidation.errors,
          dateTimeErrors: dateTimeValidation.errors
        },
        { status: 400 }
      )
    }

    // 4. Time Slot Availability Check
    const dateTime = new Date(`${date}T${time}:00`)
    const existingBookings = await prisma.booking.findMany({
      where: {
        scheduledDate: dateTime,
        status: {
          notIn: ['CANCELLED', 'COMPLETED']
        }
      }
    })

    if (existingBookings.length >= 3) {
      return NextResponse.json(
        { error: 'Ce créneau n\'est plus disponible' },
        { status: 409 }
      )
    }

    // 5. Get or Create Service
    const serviceType = getServiceType(serviceId)
    if (!serviceType) {
      return NextResponse.json(
        { error: 'Service invalide' },
        { status: 400 }
      )
    }

    let service = await prisma.service.findUnique({
      where: { type: serviceType }
    })

    if (!service) {
      const details = getServiceDetails(serviceType)
      service = await prisma.service.create({
        data: {
          type: serviceType,
          name: details.name,
          description: details.description,
          basePrice: details.price,
          estimatedDuration: details.duration,
          features: [],
          requirements: []
        }
      })
    }

    // 6. Handle Car (Create or Get)
    let finalCarId = carId

    // If carId is provided, verify it belongs to the customer
    if (finalCarId) {
      const existingCar = await prisma.car.findUnique({
        where: { id: finalCarId }
      })

      if (!existingCar || existingCar.customerId !== customer.id) {
        return NextResponse.json(
          { error: 'Invalid car selection' },
          { status: 400 }
        )
      }
    } else {
      // Create new car
      // Validate required fields for new car
      if (!make || !model || !licensePlate) {
        return NextResponse.json(
          { error: 'Make, model and license plate are required for new vehicles' },
          { status: 400 }
        )
      }

      const car = await prisma.car.create({
        data: {
          customerId: customer.id,
          make: make,
          model: model,
          licensePlate: licensePlate,
          vehicleType: 'sedan', // Default type
        }
      })
      finalCarId = car.id
    }

    // 7. Update Customer Phone if provided and different
    if (phone) {
      const cleanPhone = phone.replace(/[\s.-]/g, '')
      if (customer.phone !== cleanPhone) {
        await prisma.customer.update({
          where: { id: customer.id },
          data: { phone: cleanPhone }
        })
      }
    }

    // 8. Create Booking
    const booking = await prisma.booking.create({
      data: {
        customerId: customer.id,
        serviceId: service.id,
        carId: finalCarId,
        scheduledDate: dateTime,
        serviceAddress: address,
        finalPrice: service.basePrice,
        status: 'PENDING',
        customerNotes: notes
      }
    })

    return NextResponse.json({
      success: true,
      bookingId: booking.id
    })

  } catch (error: any) {
    console.error('Error submitting booking:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}