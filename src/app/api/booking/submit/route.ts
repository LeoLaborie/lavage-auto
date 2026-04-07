import { NextRequest, NextResponse } from 'next/server'
import { withClientGuard } from '@/lib/auth/clientGuard'
import { prisma } from '@/lib/prisma'
import { services } from '@/lib/constants/services'
import { createCheckoutSession } from '@/lib/stripe'

/**
 * POST /api/booking/submit
 * Creates a new Booking record with status PENDING.
 * Protected: requires authenticated CLIENT user.
 *
 * Story 2.3 — Création de Réservation
 */
export const POST = withClientGuard(async (req: Request, _authUser, dbUser) => {
  const body = await (req as NextRequest).json()

  const { service, date, time, address, notes, make, model, licensePlate, carId, phone, firstName, lastName } = body

  // --- Validation ---

  // Required fields
  if (!service || !date || !time || !address) {
    return NextResponse.json(
      { success: false, error: 'Les champs service, date, heure et adresse sont requis.' },
      { status: 400 }
    )
  }

  // Find the exact service matching the canonical ID provided by frontend, ensuring it's visible
  const matchedService = services.find((s) => s.id === service && s.isVisible)

  if (!matchedService) {
    return NextResponse.json(
      { success: false, error: `Service inconnu: "${service}". Veuillez sélectionner un service valide.` },
      { status: 400 }
    )
  }

  // Build scheduledDate from date + time.
  // The client sends date (YYYY-MM-DD) and time (HH:MM) in French local time (Europe/Paris).
  // Without a timezone suffix, `new Date()` interprets this as local time on the server.
  // This is consistent with how validate-timeslot and the frontend construct dates,
  // so conflict checks against existing bookings work correctly.
  const scheduledDate = new Date(`${date}T${time}:00`)
  if (isNaN(scheduledDate.getTime())) {
    return NextResponse.json(
      { success: false, error: 'Format de date ou heure invalide.' },
      { status: 400 }
    )
  }

  // Reject past dates
  if (scheduledDate <= new Date()) {
    return NextResponse.json(
      { success: false, error: 'La date et l\'heure doivent être dans le futur.' },
      { status: 400 }
    )
  }

  // Validate address length
  if (address.trim().length < 5) {
    return NextResponse.json(
      { success: false, error: 'Veuillez fournir une adresse valide.' },
      { status: 400 }
    )
  }

  // --- Duplicate Booking Prevention (Guard) — per-client ---
  const conflictingBooking = await prisma.booking.findFirst({
    where: {
      clientId: dbUser.id,
      scheduledDate,
      status: {
        in: ['PENDING', 'CONFIRMED', 'ACCEPTED'],
      },
    },
  })

  if (conflictingBooking) {
    return NextResponse.json(
      { success: false, error: 'Vous avez déjà une réservation sur ce créneau.' },
      { status: 409 }
    )
  }

  // --- Server-side price lookup (NEVER trust client-sent price) ---
  const amountCents = matchedService.amountCents

  // --- Handle car info ---
  let finalAccessNotes = notes?.trim() || ''

  // Validate carId ownership if provided
  let validatedCarId: string | undefined
  if (carId) {
    const ownedCar = await prisma.car.findUnique({
      where: { id: carId, userId: dbUser.id },
    })
    if (!ownedCar) {
      return NextResponse.json(
        { success: false, error: 'Véhicule invalide ou non autorisé.' },
        { status: 403 }
      )
    }
    validatedCarId = carId
  } else if (make || model || licensePlate) {
    // Create or reuse a Car record in DB
    const trimmedPlate = licensePlate?.trim() || null
    let newCar = null

    if (trimmedPlate) {
      // If plate provided, try to find existing car with same plate for this user
      newCar = await prisma.car.findUnique({
        where: { userId_plate: { userId: dbUser.id, plate: trimmedPlate } },
      })
      if (newCar) {
        // Update make/model if changed
        newCar = await prisma.car.update({
          where: { id: newCar.id },
          data: { make: make?.trim() || newCar.make, model: model?.trim() || newCar.model },
        })
      }
    }

    if (!newCar) {
      newCar = await prisma.car.create({
        data: {
          userId: dbUser.id,
          make: make?.trim() || '',
          model: model?.trim() || '',
          plate: trimmedPlate,
        },
      })
    }

    validatedCarId = newCar.id
  }

  const bookingData: any = {
    clientId: dbUser.id,
    serviceName: matchedService.name,
    amountCents,
    scheduledDate,
    serviceAddress: address.trim(),
    accessNotes: finalAccessNotes || null,
    status: 'PENDING',
    ...(validatedCarId && { carId: validatedCarId }),
  }

  // --- Create Booking ---
  const booking = await prisma.booking.create({
    data: bookingData,
  })

  // --- Save client profile info (phone, name) for future bookings ---
  if (phone || firstName || lastName) {
    await prisma.profile.upsert({
      where: { userId: dbUser.id },
      update: {
        ...(phone && { phone: phone.trim() }),
        ...(firstName && { firstName: firstName.trim() }),
        ...(lastName && { lastName: lastName.trim() }),
      },
      create: {
        userId: dbUser.id,
        phone: phone?.trim() || null,
        firstName: firstName?.trim() || null,
        lastName: lastName?.trim() || null,
        status: 'VALIDATED',
      },
    })
  }

  // --- Create Stripe Checkout Session ---
  try {
    const session = await createCheckoutSession(
      booking.id,
      amountCents,
      dbUser.email,
      matchedService.name
    )

    if (!session.url) {
      // Stripe returned a session but without a redirect URL — delete orphan booking
      console.error('[Stripe] Session created but missing URL for booking:', booking.id)
      await prisma.booking.delete({ where: { id: booking.id } })
      return NextResponse.json(
        { success: false, error: 'Le paiement n\'a pas pu être initialisé. Veuillez réessayer.' },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        bookingId: booking.id,
        checkoutUrl: session.url,
      },
    })
  } catch (error) {
    console.error('[Stripe] Session creation failed:', error)
    // Delete orphan booking — no payment was initiated
    try {
      await prisma.booking.delete({ where: { id: booking.id } })
    } catch (deleteError) {
      console.error('[Stripe] Failed to delete orphan booking:', booking.id, deleteError)
    }
    return NextResponse.json(
      { success: false, error: 'Le paiement n\'a pas pu être initialisé. Veuillez réessayer.' },
      { status: 502 }
    )
  }
})