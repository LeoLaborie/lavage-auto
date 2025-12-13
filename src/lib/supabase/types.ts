// Supabase Database types
// This file contains type definitions for the Supabase database schema

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
