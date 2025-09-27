import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, phone, address } = body

    console.log('Registration request received:', { email, name })

    // Basic validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, mot de passe et nom sont requis' },
        { status: 400 }
      )
    }

    // Check if customer already exists
    console.log('Checking if customer exists...')
    const existingCustomer = await prisma.customer.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Un compte avec cet email existe déjà' },
        { status: 409 }
      )
    }

    console.log('Creating customer...')
    // Create customer without password hashing for now
    const customer = await prisma.customer.create({
      data: {
        email: email.toLowerCase(),
        name: name.trim(),
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        hashedPassword: 'temp_password', // Temporary - will fix later
        emailVerified: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        address: true,
        emailVerified: true,
        createdAt: true,
      }
    })

    console.log('Customer created successfully:', customer.id)
    return NextResponse.json({
      success: true,
      message: 'Compte créé avec succès (test mode)',
      customer
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la création du compte' },
      { status: 500 }
    )
  }
}