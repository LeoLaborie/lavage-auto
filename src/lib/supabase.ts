import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string
          email: string
          name: string
          phone: string | null
          address: string | null
          profilePicture: string | null
          hashedPassword: string | null
          emailVerified: boolean
          supabaseUserId: string | null
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          phone?: string | null
          address?: string | null
          profilePicture?: string | null
          hashedPassword?: string | null
          emailVerified?: boolean
          supabaseUserId?: string | null
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          phone?: string | null
          address?: string | null
          profilePicture?: string | null
          hashedPassword?: string | null
          emailVerified?: boolean
          supabaseUserId?: string | null
          createdAt?: string
          updatedAt?: string
        }
      }
    }
  }
}