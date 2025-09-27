import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  console.log('Auth callback received code:', code)

  if (code) {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      console.log('Auth exchange result:', { user: data.user?.email, error })
      
      if (!error && data.user) {
        try {
          // Check if customer profile exists in our database
          const existingCustomer = await prisma.customer.findUnique({
            where: { supabaseUserId: data.user.id }
          })

          if (!existingCustomer) {
            // Create customer profile from Google auth data
            await prisma.customer.create({
              data: {
                email: data.user.email!,
                name: data.user.user_metadata.full_name || data.user.email!.split('@')[0],
                profilePicture: data.user.user_metadata.avatar_url,
                supabaseUserId: data.user.id,
                emailVerified: true, // Google auth means email is verified
              }
            })
            console.log('Customer profile created successfully')
          } else {
            console.log('Customer profile already exists')
          }
        } catch (dbError) {
          console.error('Database error (will continue without profile creation):', dbError)
          // Continue anyway - auth works, profile creation can be done later
        }

        return NextResponse.redirect(`${origin}${next}`)
      } else {
        console.error('Auth exchange failed:', error)
      }
    } catch (authError) {
      console.error('Auth callback error:', authError)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}