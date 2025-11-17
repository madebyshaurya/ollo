/**
 * Parts Search API
 *
 * Search for electronic parts across multiple suppliers using Firecrawl
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getUserPreferences } from '@/lib/actions/user-preferences'
import { getBestSuppliersForUser } from '@/lib/suppliers/supplier-database'
import { getFireCrawlScraper } from '@/lib/suppliers/firecrawl-scraper'

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const searchParams = request.nextUrl.searchParams
        const query = searchParams.get('query')
        const supplierName = searchParams.get('supplier') // Optional: search specific supplier

        if (!query) {
            return NextResponse.json(
                { error: 'Missing query parameter' },
                { status: 400 }
            )
        }

        console.log(`[Parts Search] Searching for "${query}"...`)

        // Get user preferences for their currency/location
        let userCurrency = 'USD'
        try {
            const preferences = await getUserPreferences()
            userCurrency = preferences.currency
        } catch (error) {
            console.warn('[Parts Search] Could not get user preferences:', error)
        }

        // Get best suppliers for this user
        const suppliers = getBestSuppliersForUser(userCurrency, 3)
        console.log(`[Parts Search] Using suppliers: ${suppliers.map(s => s.name).join(', ')}`)

        // Initialize Firecrawl scraper
        const scraper = getFireCrawlScraper()
        const allResults: any[] = []

        // Search across suppliers (limit to first 2 to save credits)
        const suppliersToSearch = supplierName
            ? suppliers.filter(s => s.name.toLowerCase().includes(supplierName.toLowerCase()))
            : suppliers.slice(0, 2)

        for (const supplier of suppliersToSearch) {
            try {
                console.log(`[Parts Search] Searching ${supplier.name}...`)
                const products = await scraper.searchSupplier(supplier, query)

                for (const product of products.slice(0, 10)) { // Limit to 10 results per supplier
                    allResults.push({
                        name: product.name,
                        partNumber: product.partNumber,
                        description: product.description,
                        price: product.price,
                        currency: product.currency || userCurrency,
                        supplier: supplier.name,
                        supplierUrl: product.productUrl,
                        imageUrl: product.imageUrl,
                        manufacturer: product.manufacturer,
                        inStock: product.stock?.toLowerCase().includes('stock') || false,
                        specifications: product.specifications
                    })
                }

                console.log(`[Parts Search] Found ${products.length} results from ${supplier.name}`)
            } catch (error) {
                console.error(`[Parts Search] Error searching ${supplier.name}:`, error)
            }
        }

        // Sort by: in stock first, then by price
        allResults.sort((a, b) => {
            if (a.inStock && !b.inStock) return -1
            if (!a.inStock && b.inStock) return 1
            if (a.price && b.price) return a.price - b.price
            return 0
        })

        console.log(`[Parts Search] ✅ Found ${allResults.length} total results`)

        return NextResponse.json({
            query,
            results: allResults,
            count: allResults.length,
            suppliers: suppliersToSearch.map(s => s.name)
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
