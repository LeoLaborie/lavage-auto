import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Validate request body
    let body;
    try {
      body = await request.json()
    } catch (error) {
      console.error('Error parsing request body:', error)
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { email, password } = body

    // Input validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    // Find customer with error handling
    let customer;
    try {
      customer = await prisma.customer.findUnique({
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
    } catch (error) {
      console.error('Database error finding customer:', error)
      return NextResponse.json(
        { error: 'Erreur de connexion à la base de données' },
        { status: 500 }
      )
    }

    if (!customer || !customer.hashedPassword) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Verify password with error handling
    let isPasswordValid;
    try {
      isPasswordValid = await verifyPassword(password, customer.hashedPassword)
    } catch (error) {
      console.error('Error verifying password:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la vérification du mot de passe' },
        { status: 500 }
      )
    }

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Handle Supabase user creation if needed
    let supabaseUserId = customer.supabaseUserId;
    if (!supabaseUserId) {
      try {
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

        if (error) {
          console.error('Supabase user creation error:', error)
          // Continue without Supabase user - not a critical error
        } else if (data.user) {
          supabaseUserId = data.user.id
          try {
            await prisma.customer.update({
              where: { id: customer.id },
              data: { supabaseUserId }
            })
          } catch (updateError) {
            console.error('Error updating customer with Supabase ID:', updateError)
            // Continue without updating - not a critical error
          }
        }
      } catch (error) {
        console.error('Error creating Supabase client:', error)
        // Continue without Supabase user - not a critical error
      }
    }

    // Return success response
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