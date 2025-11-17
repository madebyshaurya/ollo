/**
 * FireCrawl Web Scraper Integration
 *
 * Uses FireCrawl to scrape electronics component suppliers and extract real pricing
 * Supports multiple regional suppliers and finds actual parts with live data
 */

import Firecrawl from '@mendable/firecrawl-js'
import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import type { SupplierConfig } from './supplier-database'

// Zod schemas for structured data extraction
const ProductSchema = z.object({
  name: z.string().describe('Product name'),
  partNumber: z.string().optional().describe('Part number or SKU'),
  price: z.number().optional().describe('Price as a number'),
  currency: z.string().optional().describe('Currency code (e.g., USD, INR, EUR)'),
  stock: z.string().optional().describe('Stock status (in stock, out of stock, etc.)'),
  description: z.string().optional().describe('Product description'),
  imageUrl: z.string().optional().describe('Main product image URL'),
  manufacturer: z.string().optional().describe('Manufacturer name'),
  productUrl: z.string().optional().describe('Direct product page URL'),
  specifications: z.record(z.string()).optional().describe('Technical specifications')
})

const SearchResultsSchema = z.object({
  products: z.array(z.object({
    name: z.string(),
    price: z.number().optional(),
    currency: z.string().optional(),
    url: z.string().optional(),
    inStock: z.boolean().optional()
  })).describe('Array of products found in search results')
})

export type ScrapedProduct = z.infer<typeof ProductSchema>
export type SearchResults = z.infer<typeof SearchResultsSchema>

export interface PartRecommendation {
  name: string
  type: string
  description: string
  price: number
  currency: string
  supplier: string
  supplierUrl?: string
  imageUrl?: string
  partNumber?: string
  manufacturer?: string
  inStock: boolean
  alternativeFor?: string // If this is an alternative for another part
  specifications?: Record<string, string>
}

export class FireCrawlScraper {
  private firecrawl: Firecrawl
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.FIRECRAWL_API_KEY!

    if (!this.apiKey) {
      throw new Error('FIRECRAWL_API_KEY is required')
    }

    this.firecrawl = new Firecrawl({ apiKey: this.apiKey })
  }

  /**
   * Search a supplier website for parts matching a query
   */
  async searchSupplier(
    supplier: SupplierConfig,
    query: string
  ): Promise<ScrapedProduct[]> {
    try {
      const searchUrl = supplier.searchUrl(query)
      console.log(`[FireCrawl] Searching ${supplier.name} for "${query}"...`)
      console.log(`[FireCrawl] URL: ${searchUrl}`)

      // Scrape the search results page
      const result = await this.firecrawl.scrape(searchUrl, {
        formats: ['markdown', 'html']
      })

      if (!result.markdown && !result.html) {
        console.error('[FireCrawl] No content returned from search')
        return []
      }

      console.log('[FireCrawl] Received content, extracting product data...')

      // Use AI to extract structured product data from the search results
      const products = await this.extractProductsFromMarkdown(
        result.markdown || result.html || '',
        supplier,
        query
      )

      console.log(`[FireCrawl] Extracted ${products.length} products from ${supplier.name}`)
      return products
    } catch (error) {
      console.error(`[FireCrawl] Error searching ${supplier.name}:`, error)
      return []
    }
  }

  /**
   * Scrape a specific product page for detailed information
   */
  async scrapeProductPage(url: string, supplier: SupplierConfig): Promise<ScrapedProduct | null> {
    try {
      console.log(`[FireCrawl] Scraping product page: ${url}`)

      const result = await this.firecrawl.scrape(url, {
        formats: ['markdown', 'html']
      })

      if (!result.markdown && !result.html) {
        console.error('[FireCrawl] No content returned from product page')
        return null
      }

      // Use AI to extract structured product data
      const product = await this.extractProductFromMarkdown(
        result.markdown || result.html || '',
        supplier,
        url
      )

      return product
    } catch (error) {
      console.error('[FireCrawl] Error scraping product page:', error)
      return null
    }
  }

  /**
   * Extract product information from markdown using AI
   */
  private async extractProductFromMarkdown(
    markdown: string,
    supplier: SupplierConfig,
    productUrl: string
  ): Promise<ScrapedProduct | null> {
    try {
      // Truncate markdown if too long (keep first 10k chars)
      const truncatedMarkdown = markdown.slice(0, 10000)

      const result = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: ProductSchema,
        prompt: `Extract product information from this ${supplier.name} product page.

Currency should be one of: ${supplier.currencies.join(', ')}

Markdown content:
${truncatedMarkdown}

Extract all relevant product information. If price is shown as a range, use the lowest price.`
      })

      return {
        ...result.object,
        productUrl,
        currency: result.object.currency || supplier.currencies[0]
      }
    } catch (error) {
      console.error('[FireCrawl] Error extracting product data with AI:', error)
      return null
    }
  }

  /**
   * Extract multiple products from search results using AI
   */
  private async extractProductsFromMarkdown(
    markdown: string,
    supplier: SupplierConfig,
    searchQuery: string
  ): Promise<ScrapedProduct[]> {
    try {
      // Truncate markdown if too long
      const truncatedMarkdown = markdown.slice(0, 15000)

      const result = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: SearchResultsSchema,
        prompt: `Extract product information from these ${supplier.name} search results for "${searchQuery}".

Expected currency: ${supplier.currencies.join(', ')}

Find all products listed in the search results. For each product extract:
- Product name
- Price (as a number, without currency symbols)
- Currency code
- Product page URL (if available)
- Stock status (true if in stock, false if out of stock)

Markdown content:
${truncatedMarkdown}

Return an array of all products found. Focus on electronic components and parts.`
      })

      // Convert search results to ScrapedProduct format
      return result.object.products.map(p => ({
        name: p.name,
        price: p.price,
        currency: p.currency || supplier.currencies[0],
        productUrl: p.url,
        stock: p.inStock ? 'In Stock' : 'Out of Stock'
      }))
    } catch (error) {
      console.error('[FireCrawl] Error extracting products with AI:', error)
      return []
    }
  }

  /**
   * Find alternatives for a specific part
   */
  async findAlternatives(
    partName: string,
    partType: string,
    suppliers: SupplierConfig[],
    targetCurrency: string
  ): Promise<PartRecommendation[]> {
    const alternatives: PartRecommendation[] = []

    // Search query variations for finding alternatives
    const searchQueries = [
      partName, // Exact part name
      `${partType} alternative`, // Generic alternative search
      partType // Just the type
    ]

    for (const supplier of suppliers) {
      if (alternatives.length >= 5) break // Limit to 5 alternatives total

      for (const query of searchQueries) {
        try {
          const products = await this.searchSupplier(supplier, query)

          for (const product of products.slice(0, 2)) { // Max 2 per supplier
            if (product.price && product.name) {
              alternatives.push({
                name: product.name,
                type: partType,
                description: product.description || `Alternative ${partType}`,
                price: product.price,
                currency: product.currency || targetCurrency,
                supplier: supplier.name,
                supplierUrl: product.productUrl,
                imageUrl: product.imageUrl,
                partNumber: product.partNumber,
                manufacturer: product.manufacturer,
                inStock: product.stock?.toLowerCase().includes('stock') || false,
                alternativeFor: partName,
                specifications: product.specifications
              })
            }
          }

          if (alternatives.length >= 5) break
        } catch (error) {
          console.error(`[FireCrawl] Error finding alternatives on ${supplier.name}:`, error)
        }
      }
    }

    return alternatives
  }

  /**
   * Search for specific parts recommended by AI and get real pricing
   */
  async enrichPartsWithRealData(
    aiRecommendedParts: Array<{ name: string; type: string; description: string }>,
    suppliers: SupplierConfig[],
    targetCurrency: string
  ): Promise<PartRecommendation[]> {
    const enrichedParts: PartRecommendation[] = []

    for (const part of aiRecommendedParts) {
      console.log(`[FireCrawl] Enriching "${part.name}" with real data...`)

      // Try to find this part on the top suppliers
      let foundPart = false

      for (const supplier of suppliers.slice(0, 2)) { // Check top 2 suppliers
        if (foundPart) break

        try {
          const products = await this.searchSupplier(supplier, part.name)

          if (products.length > 0) {
            const bestMatch = products[0]

            if (bestMatch.price) {
              enrichedParts.push({
                name: bestMatch.name || part.name,
                type: part.type,
                description: bestMatch.description || part.description,
                price: bestMatch.price,
                currency: bestMatch.currency || targetCurrency,
                supplier: supplier.name,
                supplierUrl: bestMatch.productUrl,
                imageUrl: bestMatch.imageUrl,
                partNumber: bestMatch.partNumber,
                manufacturer: bestMatch.manufacturer,
                inStock: bestMatch.stock?.toLowerCase().includes('stock') || true,
                specifications: bestMatch.specifications
              })

              foundPart = true
              console.log(`[FireCrawl] ✅ Found "${part.name}" on ${supplier.name} for ${bestMatch.price} ${bestMatch.currency}`)
            }
          }
        } catch (error) {
          console.error(`[FireCrawl] Error enriching part on ${supplier.name}:`, error)
        }
      }

      // If we didn't find real pricing, add it with AI-estimated pricing
      if (!foundPart) {
        console.log(`[FireCrawl] ⚠️  Could not find real pricing for "${part.name}", using estimate`)
        // We'll let the API handler deal with this
      }
    }

    return enrichedParts
  }

  /**
   * Get comprehensive recommendations: AI suggestions + real pricing + alternatives
   */
  async getComprehensiveRecommendations(
    projectContext: string,
    aiRecommendations: Array<{ name: string; type: string; description: string; estimatedPrice?: string }>,
    suppliers: SupplierConfig[],
    targetCurrency: string,
    includeAlternatives: boolean = true
  ): Promise<PartRecommendation[]> {
    const allRecommendations: PartRecommendation[] = []

    // Step 1: Enrich AI recommendations with real data
    console.log('[FireCrawl] Step 1: Enriching AI recommendations with real pricing...')
    const enrichedParts = await this.enrichPartsWithRealData(
      aiRecommendations,
      suppliers,
      targetCurrency
    )

    allRecommendations.push(...enrichedParts)

    // Step 2: Find alternatives for key components (if requested)
    if (includeAlternatives && enrichedParts.length > 0) {
      console.log('[FireCrawl] Step 2: Finding alternative components...')

      // Find alternatives for the first 2 most important parts
      const partsToFindAlternativesFor = enrichedParts.slice(0, 2)

      for (const part of partsToFindAlternativesFor) {
        const alternatives = await this.findAlternatives(
          part.name,
          part.type,
          suppliers.slice(0, 2), // Use top 2 suppliers
          targetCurrency
        )

        // Add up to 2 alternatives per part
        allRecommendations.push(...alternatives.slice(0, 2))
      }
    }

    return allRecommendations
  }
}

// Singleton instance
let scraperInstance: FireCrawlScraper | null = null

export function getFireCrawlScraper(): FireCrawlScraper {
  if (!scraperInstance) {
    scraperInstance = new FireCrawlScraper()
  }
  return scraperInstance
}
