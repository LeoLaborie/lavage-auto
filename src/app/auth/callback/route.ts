import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Auth exchange error:', error)
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`)
      }

      if (data.user && data.user.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { authId: data.user.id },
            select: { role: true }
          })

          if (dbUser) {
            // All roles use the unified dashboard
            return NextResponse.redirect(`${origin}/dashboard`)
          }

          // No profile found, redirect to onboarding
          return NextResponse.redirect(`${origin}/onboarding`)

        } catch (dbError) {
          console.error('Database error in callback:', dbError)
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }
    } catch (authError) {
      console.error('Auth callback error:', authError)
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}