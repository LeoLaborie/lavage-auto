import { NextRequest, NextResponse } from 'next/server'
import { withClientGuard } from '@/lib/auth/clientGuard'
import { prisma } from '@/lib/prisma'
import { services } from '@/lib/constants/services'

/**
 * POST /api/booking/submit
 * Creates a new Booking record with status PENDING.
 * Protected: requires authenticated CLIENT user.
 *
 * Story 2.3 — Création de Réservation
 */
export const POST = withClientGuard(async (req: Request, _authUser, dbUser) => {
  const body = await (req as NextRequest).json()

  const { service, date, time, address, notes, make, model, licensePlate, carId } = body

  // --- Validation ---

  // Required fields
  if (!service || !date || !time || !address) {
    return NextResponse.json(
      { success: false, error: 'Les champs service, date, heure et adresse sont requis.' },
      { status: 400 }
    )
  }

  // Validate service ID against canonical catalog
  // Mapping frontend legacy IDs to canonical IDs
  const serviceIdMap: Record<string, string> = {
    'exterior': 'lavage-exterieur',
    'complete': 'lavage-complet',
    'premium': 'lavage-premium'
  }

  const canonicalServiceId = serviceIdMap[service] || service
  const matchedService = services.find((s) => s.id === canonicalServiceId)

  if (!matchedService) {
    return NextResponse.json(
      { success: false, error: `Service inconnu: "${service}". Veuillez sélectionner un service valide.` },
      { status: 400 }
    )
  }

  // Build ISO 8601 scheduledDate from date + time
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

  // --- Duplicate Booking Prevention (Guard) ---
  const conflictingBooking = await prisma.booking.findFirst({
    where: {
      scheduledDate,
      status: {
        in: ['PENDING', 'CONFIRMED', 'ACCEPTED'],
      },
    },
  })

  if (conflictingBooking) {
    return NextResponse.json(
      { success: false, error: 'Ce créneau n\'est plus disponible (déjà réservé).' },
      { status: 409 }
    )
  }

  // --- Server-side price lookup (NEVER trust client-sent price) ---
  const amountCents = matchedService.amountCents

  // --- Handle car info: store details if provided ---
  let finalAccessNotes = notes?.trim() || ''
  if (!carId && (make || model || licensePlate)) {
    const carInfo = `Véhicule: ${make || ''} ${model || ''} (${licensePlate || ''})`.trim()
    finalAccessNotes = finalAccessNotes ? `${carInfo}\n---\n${finalAccessNotes}` : carInfo
  }

  const bookingData: any = {
    clientId: dbUser.id,
    serviceName: matchedService.name,
    amountCents,
    scheduledDate,
    serviceAddress: address.trim(),
    accessNotes: finalAccessNotes || null,
    status: 'PENDING',
  }

  // --- Create Booking ---
  const booking = await prisma.booking.create({
    data: bookingData,
  })

  // Return standardized response — checkoutUrl is null until Epic 3 (Stripe)
  return NextResponse.json({
    success: true,
    data: {
      bookingId: booking.id,
      checkoutUrl: null,
    },
  })
})