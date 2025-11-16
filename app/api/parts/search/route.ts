/**
 * Parts Search API
 * 
 * Searches for electronic components across multiple suppliers:
 * - DigiKey API (primary, free, unlimited)
 * - FireCrawl scraping (regional suppliers based on user's country)
 * 
 * Returns standardized parts data with images, pricing, and stock info
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getDigiKeyAPI } from '@/lib/integrations/digikey'
import { getFireCrawlScraper } from '@/lib/integrations/firecrawl-scraper'
import type { SupplierPart } from '@/lib/integrations/digikey'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get search query
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query) {
      return NextResponse.json(
        { error: 'Missing query parameter' },
        { status: 400 }
      )
    }

    // Get user's country preference for regional supplier selection
    const { clerkClient } = await import('@clerk/nextjs/server')
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const userCountry = user.publicMetadata.country as string || 'US'

    console.log('[Parts Search] Searching for:', query, 'Country:', userCountry)

    const results: SupplierPart[] = []

    // 1. Search DigiKey (primary source - free and unlimited)
    try {
      const digikey = getDigiKeyAPI()
      
      // Get stored tokens from Clerk metadata
      const digikeyConnected = user.privateMetadata.digikeyConnected as boolean

      if (digikeyConnected) {
        // Search DigiKey with proper parameters
        const digikeyResults = await digikey.searchProducts(query, {
          limit,
          inStock: true
        })
        results.push(...digikeyResults)
        console.log('[Parts Search] DigiKey returned', digikeyResults.length, 'results')
      } else {
        console.log('[Parts Search] DigiKey not connected - skipping')
      }
    } catch (error) {
      console.error('[Parts Search] DigiKey error:', error)
      // Continue with other suppliers
    }

    // 2. Search regional suppliers with FireCrawl (based on user country)
    try {
      const firecrawl = getFireCrawlScraper()
      const regionalSupplier = FireCrawlScraper.getSupplierForCountry(userCountry)

      if (regionalSupplier) {
        console.log('[Parts Search] Searching regional supplier:', regionalSupplier)
        const regionalResults = await firecrawl.searchSupplier(regionalSupplier, query)
        results.push(...regionalResults)
        console.log('[Parts Search] Regional supplier returned', regionalResults.length, 'results')
      }
    } catch (error) {
      console.error('[Parts Search] FireCrawl error:', error)
      // Continue even if scraping fails
    }

    // Sort results by relevance (parts with images first, then by stock status)
    const sortedResults = results.sort((a, b) => {
      // Prioritize parts with images
      if (a.imageUrl && !b.imageUrl) return -1
      if (!a.imageUrl && b.imageUrl) return 1
      
      // Then by stock status
      const stockPriority = { in_stock: 0, low_stock: 1, out_of_stock: 2 }
      return stockPriority[a.stock.status] - stockPriority[b.stock.status]
    })

    return NextResponse.json({
      query,
      results: sortedResults.slice(0, limit),
      count: sortedResults.length,
      sources: {
        digikey: results.filter(r => r.supplier === 'DigiKey').length,
        regional: results.filter(r => r.supplier !== 'DigiKey').length
      }
    })
  } catch (error) {
    console.error('[Parts Search] Error:', error)
    return NextResponse.json(
      { 
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Import FireCrawlScraper for static method access
import { FireCrawlScraper } from '@/lib/integrations/firecrawl-scraper'
