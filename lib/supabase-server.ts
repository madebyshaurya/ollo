import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

export async function createServerSupabaseClient() {
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

export async function getCurrentUserId() {
  const { userId } = await auth()
  return userId
}
