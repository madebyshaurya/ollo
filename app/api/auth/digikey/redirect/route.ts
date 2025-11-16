/**
 * DigiKey OAuth2 Redirect Handler (Alternative endpoint)
 * 
 * Some OAuth implementations use /redirect instead of /callback
 * This simply forwards to our main callback handler
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // DigiKey is redirecting here, but we handle everything in /callback
  // So just forward the request
  const searchParams = request.nextUrl.searchParams
  const callbackUrl = new URL('/api/auth/digikey/callback', request.url)
  
  // Copy all query parameters
  searchParams.forEach((value, key) => {
    callbackUrl.searchParams.set(key, value)
  })
  
  // Redirect to the actual callback handler
  return NextResponse.redirect(callbackUrl)
}
