'use client'

import { useSession } from '@clerk/nextjs'
import { createClient } from '@supabase/supabase-js'
import { useMemo } from 'react'

export function useSupabase() {
  const { session } = useSession()

  const supabase = useMemo(() => {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  }, [])

  // Function to get authenticated supabase client with token
  const getAuthenticatedSupabase = async () => {
    if (!session) return supabase

    try {
      const token = await session.getToken()
      if (token) {
        // Create a new client instance with the token in global headers
        return createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            },
            global: {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          }
        )
      }
    } catch (error) {
      console.error('Error getting Clerk token:', error)
    }

    return supabase
  }

  return { 
    supabase, 
    getAuthenticatedSupabase,
    isAuthenticated: !!session 
  }
}


