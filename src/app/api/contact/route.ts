import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateContactForm } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
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
