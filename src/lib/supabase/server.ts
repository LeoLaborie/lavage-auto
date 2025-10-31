import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '../supabase'

export async function createClient() {
  try {
    const cookieStore = cookies()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables')
    }

    return createServerClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set(name, value, options)
            } catch (error) {
              // Handle cookie setting error in Server Components
              console.error('Error setting cookie:', error)
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set(name, '', { ...options, maxAge: 0 })
            } catch (error) {
              // Handle cookie removal error in Server Components
              console.error('Error removing cookie:', error)
            }
          },
        },
      }
    )
  } catch (error) {
    console.error('Error creating Supabase client:', error)
    throw error
  }
}