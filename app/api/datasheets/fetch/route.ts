import { createServerSupabaseClient, getCurrentUserId } from '@/lib/supabase-server'
import { getProjectPartCategories, setProjectPartCategories, ProjectPartCategoryRecord } from '@/lib/actions/projects'

interface OctopartResponse {
  datasheetUrl: string | null
  manufacturer: string | null
  mpn: string | null
  source: 'octopart' | 'fallback'
}

// Cache for access token
let cachedToken: { token: string; expiresAt: number } | null = null

async function getNexarAccessToken(): Promise<string | null> {
  const clientId = process.env.NEXAR_CLIENT_ID
  const clientSecret = process.env.NEXAR_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.warn('[Nexar] Client credentials not configured')
    return null
  }

  // Use cached token if still valid (with 5 minute buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 300000) {
    console.log('[Nexar] Using cached access token')
    return cachedToken.token
  }

  try {
    console.log('[Nexar] Fetching new access token...')

    // Get access token using client credentials flow
    const tokenResponse = await fetch('https://identity.nexar.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'supply.domain'
      })
    })

    if (!tokenResponse.ok) {
      console.error('[Nexar] Token request failed:', tokenResponse.status)
      return null
    }

    const tokenData = await tokenResponse.json()

    // Cache the token (expires_in is in seconds)
    cachedToken = {
      token: tokenData.access_token,
      expiresAt: Date.now() + (tokenData.expires_in * 1000)
    }

    console.log('[Nexar] ✅ Access token obtained')
    return tokenData.access_token
  } catch (error) {
    console.error('[Nexar] Error getting access token:', error)
    return null
  }
}

async function fetchDatasheetFromOctopart(
  mpn: string,
  manufacturer?: string
): Promise<OctopartResponse> {
  const accessToken = await getNexarAccessToken()

  if (!accessToken) {
    console.warn('[Octopart] Access token not available, using fallback')
    return {
      datasheetUrl: null,
      manufacturer: manufacturer || null,
      mpn: mpn,
      source: 'fallback'
    }
  }

  try {
    console.log('[Octopart] Fetching datasheet for:', { mpn, manufacturer })

    // Nexar GraphQL API endpoint
    const response = await fetch('https://api.nexar.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        query: `
          query SearchParts($q: String!) {
            supSearchMpn(q: $q, limit: 1) {
              results {
                part {
                  mpn
                  manufacturer {
                    name
                  }
                  bestDatasheet {
                    url
                  }
                }
              }
            }
          }
        `,
        variables: {
          q: manufacturer ? `${manufacturer} ${mpn}` : mpn
        }
      })
    })

    if (!response.ok) {
      console.error('[Octopart] API request failed:', response.status)
      return {
        datasheetUrl: null,
        manufacturer: manufacturer || null,
        mpn: mpn,
        source: 'fallback'
      }
    }

    const data = await response.json()

    // Check for API errors (quota exceeded, etc.)
    if (data.errors && data.errors.length > 0) {
      const errorMsg = data.errors[0].message
      console.error('[Octopart] API Error:', errorMsg)

      // Check if it's a quota/plan limit error
      if (errorMsg.includes('exceeded') || errorMsg.includes('limit') || errorMsg.includes('upgrade')) {
        console.warn('[Octopart] ⚠️  API quota exceeded or plan limit reached')
        console.warn('[Octopart] Consider upgrading Nexar plan or using manual URL entry')
      }

      return {
        datasheetUrl: null,
        manufacturer: manufacturer || null,
        mpn: mpn,
        source: 'fallback'
      }
    }

    const partResult = data?.data?.supSearchMpn?.results?.[0]?.part

    if (partResult?.bestDatasheet?.url) {
      console.log('[Octopart] ✅ Datasheet found:', partResult.bestDatasheet.url)
      return {
        datasheetUrl: partResult.bestDatasheet.url,
        manufacturer: partResult.manufacturer?.name || manufacturer || null,
        mpn: partResult.mpn || mpn,
        source: 'octopart'
      }
    }

    console.log('[Octopart] No datasheet found for part')
    return {
      datasheetUrl: null,
      manufacturer: manufacturer || null,
      mpn: mpn,
      source: 'fallback'
    }
  } catch (error) {
    console.error('[Octopart] Error fetching datasheet:', error)
    return {
      datasheetUrl: null,
      manufacturer: manufacturer || null,
      mpn: mpn,
      source: 'fallback'
    }
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId()

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, categoryId, suggestionId, mpn, manufacturer } = await req.json()

    if (!projectId || !categoryId || !suggestionId) {
      return Response.json(
        { error: 'Missing required fields: projectId, categoryId, suggestionId' },
        { status: 400 }
      )
    }

    if (!mpn) {
      return Response.json(
        { error: 'MPN (Manufacturer Part Number) is required to fetch datasheet' },
        { status: 400 }
      )
    }

    console.log('[Datasheet Fetch] Request:', { projectId, categoryId, suggestionId, mpn, manufacturer })

    // Fetch datasheet from Octopart
    const octopartResult = await fetchDatasheetFromOctopart(mpn, manufacturer)

    // Get current part categories
    const { categories } = await getProjectPartCategories(projectId)

    if (!categories || categories.length === 0) {
      return Response.json(
        { error: 'No part categories found for this project' },
        { status: 404 }
      )
    }

    // Update the specific suggestion with datasheet info
    const updatedCategories = categories.map((category: ProjectPartCategoryRecord) => {
      if (category.id !== categoryId) return category

      const updatedSuggestions = category.suggestions.map(suggestion => {
        if (suggestion.id !== suggestionId) return suggestion

        return {
          ...suggestion,
          datasheetUrl: octopartResult.datasheetUrl,
          datasheetSource: octopartResult.source,
          manufacturer: octopartResult.manufacturer || suggestion.manufacturer,
          mpn: octopartResult.mpn || suggestion.mpn
        }
      })

      return {
        ...category,
        suggestions: updatedSuggestions
      }
    })

    // Save updated categories back to database
    const saveResult = await setProjectPartCategories(
      projectId,
      updatedCategories,
      new Date().toISOString()
    )

    if (!saveResult.success) {
      return Response.json(
        { error: 'Failed to update part categories' },
        { status: 500 }
      )
    }

    console.log('[Datasheet Fetch] ✅ Successfully updated datasheet for suggestion:', suggestionId)

    return Response.json({
      success: true,
      datasheetUrl: octopartResult.datasheetUrl,
      source: octopartResult.source,
      manufacturer: octopartResult.manufacturer,
      mpn: octopartResult.mpn,
      cached: false
    })
  } catch (error) {
    console.error('[Datasheet Fetch] Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
