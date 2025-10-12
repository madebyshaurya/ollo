import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

// Server-side Supabase client for use in Server Actions and Route Handlers
export async function createServerSupabaseClient() {
  const { getToken } = auth()
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: async () => {
          const token = await getToken()
          return {
            Authorization: `Bearer ${token}`
          }
        }
      }
    }
  )

  return supabase
}

// Utility function to get the current user's ID from Clerk
export async function getCurrentUserId() {
  const { userId } = auth()
  return userId
}
