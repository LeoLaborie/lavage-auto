import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase admin client using the service-role key.
 * NEVER import this in client components or expose to the browser.
 * For use in API routes and Server Actions only.
 *
 * Lazy-initialized: the client is only created when first accessed,
 * preventing module-load crashes if the env var is not yet configured.
 */
let _supabaseAdmin: SupabaseClient | null = null

export function getSupabaseAdmin(): SupabaseClient {
  if (_supabaseAdmin) return _supabaseAdmin

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase admin environment variables (NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)'
    )
  }

  _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  })

  return _supabaseAdmin
}
