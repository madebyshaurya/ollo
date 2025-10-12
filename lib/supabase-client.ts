import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

// Server-side Supabase client with Clerk authentication
export async function createServerSupabaseClient() {
  const { getToken } = await auth()
  
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
