/**
 * DigiKey Token Retrieval Page
 * 
 * Visit /get-digikey-tokens to authorize and retrieve tokens
 * This is a ONE-TIME setup page for the app owner
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')

  // If no code, show authorization link
  if (!code) {
    const clientId = process.env.DIGIKEY_CLIENT_ID || 'NOT_SET'
    const redirectUri = `${request.nextUrl.origin}/get-digikey-tokens`
    
    // Build authorization URL pointing to this endpoint
    const authUrl = `https://sso.digikey.com/as/authorization.oauth2?${new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri
    }).toString()}`

    return new NextResponse(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>DigiKey Authorization</title>
          <style>
            body { font-family: system-ui; max-width: 600px; margin: 50px auto; padding: 20px; }
            h1 { color: #e63946; }
            .step { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; }
            a { color: #e63946; text-decoration: none; font-weight: bold; }
            a:hover { text-decoration: underline; }
            code { background: #fff; padding: 2px 6px; border-radius: 4px; font-size: 14px; }
            .debug { background: #fff3cd; padding: 10px; border-radius: 4px; margin: 10px 0; font-size: 12px; font-family: monospace; }
          </style>
        </head>
        <body>
          <h1>🔑 DigiKey App Authorization</h1>
          <p>Follow these steps to get your access and refresh tokens:</p>
          
          <div class="debug">
            <strong>🔍 Debug Info:</strong><br>
            Client ID: ${clientId.substring(0, 10)}...${clientId.substring(clientId.length - 10)}<br>
            Redirect URI: ${redirectUri}<br>
            Auth URL: <a href="${authUrl}" style="word-break: break-all;">${authUrl}</a>
          </div>
          
          <div class="step">
            <h3>Step 1: Authorize</h3>
            <p><a href="${authUrl}" target="_blank">Click here to authorize with DigiKey →</a></p>
          </div>
          
          <div class="step">
            <h3>Step 2: Get Tokens</h3>
            <p>After authorizing, you'll be redirected back here with your tokens displayed.</p>
          </div>
          
          <div class="step">
            <h3>Step 3: Add to Environment Variables</h3>
            <p>Copy the tokens and add them to your <code>.env.local</code> and Vercel:</p>
            <pre style="background: #fff; padding: 10px; border-radius: 4px; overflow-x: auto;">
DIGIKEY_ACCESS_TOKEN=your_access_token
DIGIKEY_REFRESH_TOKEN=your_refresh_token</pre>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })
  }

  // If we have a code, exchange it for tokens
  try {
    // Exchange code for tokens
    const axios = (await import('axios')).default
    const response = await axios.post('https://api.digikey.com/v1/oauth2/token', 
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.DIGIKEY_CLIENT_ID!,
        client_secret: process.env.DIGIKEY_CLIENT_SECRET!,
        redirect_uri: `${request.nextUrl.origin}/get-digikey-tokens`
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    )

    const { access_token, refresh_token, expires_in } = response.data

    return new NextResponse(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>DigiKey Tokens</title>
          <style>
            body { font-family: system-ui; max-width: 800px; margin: 50px auto; padding: 20px; }
            h1 { color: #06d6a0; }
            .success { background: #d1f4e8; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .token { background: #fff; padding: 15px; border-radius: 4px; margin: 10px 0; word-break: break-all; font-family: monospace; font-size: 12px; }
            .warning { background: #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0; }
            button { background: #e63946; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin: 5px; }
            button:hover { background: #c62936; }
          </style>
        </head>
        <body>
          <h1>✅ Authorization Successful!</h1>
          
          <div class="success">
            <h3>Your DigiKey Tokens:</h3>
            
            <p><strong>Access Token:</strong></p>
            <div class="token" id="accessToken">${access_token}</div>
            <button onclick="navigator.clipboard.writeText('${access_token}')">Copy Access Token</button>
            
            <p><strong>Refresh Token:</strong></p>
            <div class="token" id="refreshToken">${refresh_token}</div>
            <button onclick="navigator.clipboard.writeText('${refresh_token}')">Copy Refresh Token</button>
            
            <p><strong>Expires in:</strong> ${expires_in} seconds (~${Math.round(expires_in / 3600)} hours)</p>
          </div>
          
          <div class="warning">
            <h3>⚠️ Important: Add these to your environment variables</h3>
            <p>1. Add to <code>.env.local</code>:</p>
            <pre style="background: #fff; padding: 10px; border-radius: 4px; overflow-x: auto;">
DIGIKEY_ACCESS_TOKEN=${access_token}
DIGIKEY_REFRESH_TOKEN=${refresh_token}</pre>
            
            <p>2. Add to Vercel (run these commands):</p>
            <pre style="background: #fff; padding: 10px; border-radius: 4px; overflow-x: auto;">
printf "${access_token}" | vercel env add DIGIKEY_ACCESS_TOKEN production --force
printf "${refresh_token}" | vercel env add DIGIKEY_REFRESH_TOKEN production --force</pre>
            
            <p>3. Redeploy your app</p>
            
            <p><strong>🔒 Keep these tokens secret!</strong> Do not commit them to git.</p>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    })
  } catch (error) {
    console.error('Token exchange error:', error)
    return new NextResponse(`
      <html>
        <body>
          <h1>Error</h1>
          <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
          <a href="/get-digikey-tokens">Try again</a>
        </body>
      </html>
    `, {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    })
  }
}
