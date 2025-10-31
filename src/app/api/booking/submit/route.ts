import { NextResponse } from 'next/server'
import { validateBookingForm, validateDateTimeBooking } from '@/lib/validation'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const {
      service,
      date,
      time,
      address,
      firstName,
      lastName,
      email,
      phone,
      carType,
      notes
    } = data

    // Validate customer information
    const customerValidation = validateBookingForm({
      firstName,
      lastName,
      email,
      phone,
      carType,
      notes
    })

    // Validate date and time
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

    // Validate time slot availability
    const dateTime = new Date(`${date}T${time}:00`)
    const existingBookings = await prisma.booking.findMany({
      where: {
        date: dateTime,
        status: {
          notIn: ['CANCELLED', 'COMPLETED']
        }
      }
    })

    if (existingBookings.length >= 3) {
      return NextResponse.json(
        { error: 'This time slot is no longer available' },
        { status: 409 }
      )
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        service,
        date: dateTime,
        address,
        firstName,
        lastName,
        email,
        phone,
        carType: carType || undefined,
        notes: notes || undefined,
        status: 'PENDING'
      }
    })

    // TODO: Send confirmation email

    return NextResponse.json({ 
      success: true,
      booking: {
        id: booking.id,
        date: booking.date,
        service: booking.service
      }
    })

  } catch (error) {
    console.error('Error creating booking:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}