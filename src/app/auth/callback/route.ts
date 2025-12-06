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

      if (error) {
        console.error('Auth exchange error:', error)
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`)
      }

      console.log('Auth exchange success, user:', data.user?.email)

      if (!error && data.user) {
        try {
          // Check if user is a Customer
          const customer = await prisma.customer.findUnique({
            where: { email: data.user.email! }
          })

          if (customer) {
            return NextResponse.redirect(`${origin}/dashboard/client`)
          }

          // Check if user is a Washer
          const washer = await prisma.washer.findUnique({
            where: { email: data.user.email! }
          })

          if (washer) {
            return NextResponse.redirect(`${origin}/dashboard/laveur`)
          }

          // If neither, redirect to onboarding
          return NextResponse.redirect(`${origin}/onboarding`)

        } catch (dbError) {
          console.error('Database error in callback:', dbError)
          // In case of error, redirect to onboarding as fallback
          return NextResponse.redirect(`${origin}/onboarding`)
        }
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