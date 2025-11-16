/**
 * One-Time DigiKey Authorization Script
 * 
 * Run this ONCE to get your access and refresh tokens
 * Then add them to your environment variables
 */

import { getDigiKeyAPI } from './lib/integrations/digikey'

async function authorizeDigiKey() {
  const digikey = getDigiKeyAPI()
  
  // Step 1: Get authorization URL
  const authUrl = digikey.getAuthorizationUrl()
  
  console.log('\n🔑 DigiKey Authorization\n')
  console.log('1. Open this URL in your browser:')
  console.log('\n   ', authUrl, '\n')
  console.log('2. Log in to DigiKey and authorize the app')
  console.log('3. You\'ll be redirected to your callback URL with a code parameter')
  console.log('4. Copy the FULL callback URL and paste it below\n')
  
  // For manual token retrieval, user needs to:
  // 1. Visit the auth URL
  // 2. Get redirected with code
  // 3. Use that code to get tokens
  
  console.log('Once you have the callback URL with the code, run:')
  console.log('\nnode -e "')
  console.log('const axios = require(\'axios\');')
  console.log('const code = \'PASTE_CODE_HERE\';')
  console.log('axios.post(\'https://api.digikey.com/v1/oauth2/token\', new URLSearchParams({')
  console.log('  grant_type: \'authorization_code\',')
  console.log('  code,')
  console.log('  client_id: process.env.DIGIKEY_CLIENT_ID,')
  console.log('  client_secret: process.env.DIGIKEY_CLIENT_SECRET,')
  console.log('  redirect_uri: process.env.DIGIKEY_REDIRECT_URI')
  console.log('}), {')
  console.log('  headers: { \'Content-Type\': \'application/x-www-form-urlencoded\' }')
  console.log('}).then(r => console.log(r.data)).catch(e => console.error(e.response?.data || e))')
  console.log('"')
}

authorizeDigiKey()
