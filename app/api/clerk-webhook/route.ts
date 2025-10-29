import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client with service role key for webhook operations
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

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '')

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return new Response('Error occured', {
      status: 400
    })
  }

  // Handle the webhook
  const eventType = evt.type
  console.log(`🔔 Clerk webhook received: ${eventType}`)

  try {
    if (eventType === 'user.created') {
      const { id } = evt.data

      console.log(`👤 User created: ${id}`)
      // No additional setup needed - projects table uses user_id directly from Clerk
      // User data is handled through Clerk's user object when needed

    } else if (eventType === 'user.deleted') {
      const { id } = evt.data

      console.log(`🗑️ Deleting all data for user: ${id}`)

      // 1. Delete all projects associated with the user
      const { error: projectsError } = await supabase
        .from('projects')
        .delete()
        .eq('user_id', id)

      if (projectsError) {
        console.error('Error deleting user projects:', projectsError)
        return new Response('Error deleting user projects', { status: 500 })
      }

      // 2. Delete user profile if it exists (for consistency)
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('clerk_user_id', id)

      if (profileError) {
        console.error('Error deleting user profile:', profileError)
        // Don't return error here as profile deletion is non-critical
      }

      // Extend this cleanup when additional user-owned tables are introduced

      console.log('✅ All user data deleted')
    }
  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response('Webhook processing error', { status: 500 })
  }

  return new Response('', { status: 200 })
}
