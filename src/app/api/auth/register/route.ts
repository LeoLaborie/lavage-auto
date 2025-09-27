import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, validatePassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, phone, address } = body

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, mot de passe et nom sont requis' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format d\'email invalide' },
        { status: 400 }
      )
    }

    // Validate password
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.errors[0] },
        { status: 400 }
      )
    }

    // Check if customer already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Un compte avec cet email existe déjà' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create customer
    const customer = await prisma.customer.create({
      data: {
        email: email.toLowerCase(),
        name: name.trim(),
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        hashedPassword,
        emailVerified: false, // Email verification would be implemented later
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

    return NextResponse.json({
      success: true,
      message: 'Compte créé avec succès',
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