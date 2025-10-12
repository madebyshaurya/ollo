import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

// Server-side Supabase client for use in Server Actions and Route Handlers
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

// Utility function to get the current user's ID from Clerk
export async function getCurrentUserId() {
  const { userId } = await auth()
  return userId
}
