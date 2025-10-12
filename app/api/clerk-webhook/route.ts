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
      const { id, email_addresses, first_name, last_name } = evt.data
      
      console.log(`👤 Creating profile for user: ${id}`)
      
      // Create user profile in Supabase
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([
          {
            clerk_user_id: id,
            email: email_addresses[0]?.email_address,
            first_name,
            last_name,
          }
        ])
        .select()

      if (error) {
        console.error('Error creating user profile:', error)
        return new Response('Error creating user profile', { status: 500 })
      }

      console.log('✅ User profile created:', data)
      
    } else if (eventType === 'user.deleted') {
      const { id } = evt.data
      
      console.log(`🗑️ Deleting profile for user: ${id}`)
      
      // Delete user profile from Supabase
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('clerk_user_id', id)

      if (error) {
        console.error('Error deleting user profile:', error)
        return new Response('Error deleting user profile', { status: 500 })
      }

      console.log('✅ User profile deleted')
      
    } else if (eventType === 'user.updated') {
      const { id, email_addresses, first_name, last_name } = evt.data
      
      console.log(`📝 Updating profile for user: ${id}`)
      
      // Update user profile in Supabase
      const { error } = await supabase
        .from('user_profiles')
        .update({
          email: email_addresses[0]?.email_address,
          first_name,
          last_name,
          updated_at: new Date().toISOString()
        })
        .eq('clerk_user_id', id)

      if (error) {
        console.error('Error updating user profile:', error)
        return new Response('Error updating user profile', { status: 500 })
      }

      console.log('✅ User profile updated')
    }

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response('Webhook processing error', { status: 500 })
  }

  return new Response('', { status: 200 })
}
