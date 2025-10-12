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
        // For new API keys, we need to use a different approach
        // Create a client that bypasses Supabase auth and uses custom headers
        const client = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        )

        // Override the request method to add the Clerk token
        const originalFetch = client.rest.fetch.bind(client.rest)
        client.rest.fetch = async (url, options = {}) => {
          const headers = new Headers(options.headers)
          headers.set('Authorization', `Bearer ${token}`)
          
          return originalFetch(url, {
            ...options,
            headers
          })
        }

        return client
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


