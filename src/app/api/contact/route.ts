import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateContactForm } from '@/lib/validation'

const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute
const RATE_LIMIT_MAX = 3 // max 3 requests per window

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
    const now = Date.now()
    const timestamps = rateLimitMap.get(ip)?.filter(t => now - t < RATE_LIMIT_WINDOW_MS) ?? []

    if (timestamps.length >= RATE_LIMIT_MAX) {
      return NextResponse.json(
        { error: 'Trop de messages envoyés. Veuillez réessayer dans une minute.' },
        { status: 429 }
      )
    }

    timestamps.push(now)
    rateLimitMap.set(ip, timestamps)

    const body = await request.json()

    const validation = validateContactForm(body)
    if (!validation.isValid) {
      return NextResponse.json({ error: 'Données invalides', errors: validation.errors }, { status: 400 })
    }

    await prisma.contactMessage.create({
      data: {
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        email: body.email.trim().toLowerCase(),
        phone: body.phone.trim(),
        subject: body.subject,
        message: body.message.trim(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json({ error: 'Une erreur est survenue' }, { status: 500 })
  }
}
