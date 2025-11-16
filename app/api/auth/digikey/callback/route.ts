/**
 * DigiKey OAuth2 Callback Handler
 * 
 * Handles the OAuth2 authorization code callback from DigiKey
 * and exchanges it for access/refresh tokens
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getDigiKeyAPI } from '@/lib/integrations/digikey'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get authorization code from query params
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    // Check for OAuth errors
    if (error) {
      console.error('[DigiKey OAuth] Error:', error)
      return NextResponse.redirect(
        new URL(`/dashboard/settings?error=${encodeURIComponent(error)}`, request.url)
      )
    }

    if (!code) {
      return NextResponse.json(
        { error: 'Missing authorization code' },
        { status: 400 }
      )
    }

    // Exchange code for tokens
    const digikey = getDigiKeyAPI()
    await digikey.getAccessToken(code)

    // Get the tokens from the DigiKey instance
    // Note: In production, you'd want to store these securely
    // For now, we'll just mark the connection as successful
    const { clerkClient } = await import('@clerk/nextjs/server')
    const client = await clerkClient()
    await client.users.updateUserMetadata(userId, {
      privateMetadata: {
        digikeyConnected: true,
        digikeyConnectedAt: Date.now()
      }
    })

    console.log('[DigiKey OAuth] Successfully authenticated for user:', userId)

    // Redirect back to settings with success message
    return NextResponse.redirect(
      new URL('/dashboard/settings?digikey=connected', request.url)
    )
  } catch (error) {
    console.error('[DigiKey OAuth] Callback error:', error)
    return NextResponse.redirect(
      new URL('/dashboard/settings?error=callback_failed', request.url)
    )
  }
}
