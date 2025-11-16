/**
 * DigiKey OAuth2 Authorization Initiator
 * 
 * Redirects the user to DigiKey's OAuth2 authorization page
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

    // Get the authorization URL from DigiKey API
    const digikey = getDigiKeyAPI()
    const authUrl = digikey.getAuthorizationUrl()

    console.log('[DigiKey OAuth] Redirecting user to authorization URL')

    // Redirect to DigiKey
    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('[DigiKey OAuth] Authorization error:', error)
    return NextResponse.redirect(
      new URL('/dashboard/settings?error=auth_failed', request.url)
    )
  }
}
