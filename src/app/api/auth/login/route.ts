import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    // Find customer
    const customer = await prisma.customer.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        address: true,
        hashedPassword: true,
        emailVerified: true,
        supabaseUserId: true,
      }
    })

    if (!customer || !customer.hashedPassword) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, customer.hashedPassword)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    // If customer doesn't have a Supabase user, create one for session management
    let supabaseUserId = customer.supabaseUserId
    if (!supabaseUserId) {
      const supabase = await createClient()
      const { data, error } = await supabase.auth.admin.createUser({
        email: customer.email,
        password: password,
        email_confirm: customer.emailVerified,
        user_metadata: {
          name: customer.name,
          phone: customer.phone,
        }
      })

      if (!error && data.user) {
        supabaseUserId = data.user.id
        // Update customer with Supabase user ID
        await prisma.customer.update({
          where: { id: customer.id },
          data: { supabaseUserId }
        })
      }
    }

    // Return success with customer data (without password)
    const { hashedPassword: _, ...customerData } = customer
    return NextResponse.json({
      success: true,
      message: 'Connexion réussie',
      customer: {
        ...customerData,
        supabaseUserId
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur lors de la connexion' },
      { status: 500 }
    )
  }
}