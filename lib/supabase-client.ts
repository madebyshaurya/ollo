import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client with Clerk authentication
export async function createServerSupabaseClient() {
  // For server-side usage, we'll use the service role key for full access
  // This bypasses RLS and is suitable for server actions and API routes
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  return supabase
}
