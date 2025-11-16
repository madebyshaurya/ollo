/**
 * FireCrawl Web Scraper Integration
 * 
 * Uses FireCrawl to scrape electronics component suppliers that don't have APIs
 * Particularly useful for regional suppliers like Robu.in (India), local European distributors, etc.
 * 
 * You have 83,000 credits! Use wisely for suppliers without APIs.
 */

import Firecrawl from '@mendable/firecrawl-js'
import type { SupplierPart } from './digikey'

interface FirecrawlConfig {
  apiKey: string
}

interface ScrapedPartData {
  name?: string
  partNumber?: string
  price?: number
  currency?: string
  stock?: string
  description?: string
  imageUrl?: string
  manufacturer?: string
  specifications?: Record<string, string>
}

/**
 * Regional supplier configurations
 * Add more suppliers as needed
 */
export const REGIONAL_SUPPLIERS = {
  'robu.in': {
    name: 'Robu.in',
    country: 'IN',
    currency: 'INR',
    searchUrl: (query: string) => `https://robu.in/?s=${encodeURIComponent(query)}&post_type=product`,
    extractionPrompt: `Extract the following information from this electronics component product page:
- Product name
- Part number or SKU
- Price (number only, without currency symbol)
- Currency (e.g., INR, USD)
- Stock status (In Stock, Out of Stock, Limited Stock)
- Product description
- Main product image URL
- Manufacturer name
- Any technical specifications (voltage, current, power, etc.)`
  },
  'electronicscomp.com': {
    name: 'ElectronicsComp',
    country: 'IN',
    currency: 'INR',
    searchUrl: (query: string) => `https://www.electronicscomp.com/search?q=${encodeURIComponent(query)}`,
    extractionPrompt: 'Extract product name, price, stock status, image URL, and specifications from this electronics component page'
  },
  'reichelt.de': {
    name: 'Reichelt',
    country: 'DE',
    currency: 'EUR',
    searchUrl: (query: string) => `https://www.reichelt.de/index.html?ACTION=446&q=${encodeURIComponent(query)}`,
    extractionPrompt: 'Extract product information including name, price in EUR, availability, and image from this German electronics supplier page'
  }
} as const

export type SupportedSupplier = keyof typeof REGIONAL_SUPPLIERS

export class FireCrawlScraper {
  private firecrawl: Firecrawl
  private config: FirecrawlConfig

  constructor(config?: FirecrawlConfig) {
    this.config = config || {
      apiKey: process.env.FIRECRAWL_API_KEY!
    }

    if (!this.config.apiKey) {
      throw new Error('FIRECRAWL_API_KEY is required')
    }

    this.firecrawl = new Firecrawl({ apiKey: this.config.apiKey })
  }

  /**
   * Scrape a product page and extract structured data
   */
  async scrapePart(url: string): Promise<ScrapedPartData | null> {
    try {
      console.log('[FireCrawl] Scraping:', url)
      
      const result = await this.firecrawl.scrape(url, {
        formats: ['json', 'markdown']
      })

      // FireCrawl returns markdown and potentially json data
      if (!result.markdown && !result.json) {
        console.error('[FireCrawl] Scraping failed: No data returned')
        return null
      }

      // If we have JSON data, use it
      if (result.json) {
        return result.json as unknown as ScrapedPartData
      }

      // Otherwise parse from markdown (basic fallback)
      return this.parseMarkdownForPartData(result.markdown || '')
    } catch (error) {
      console.error('[FireCrawl] Error scraping part:', error)
      return null
    }
  }

  /**
   * Basic markdown parser for product data (fallback)
   */
  private parseMarkdownForPartData(markdown: string): ScrapedPartData {
    // This is a simple parser - you'd want to enhance this based on actual markdown structure
    return {
      name: this.extractFromMarkdown(markdown, /^#\s+(.+)/m),
      description: this.extractFromMarkdown(markdown, /description:?\s*(.+)/i),
      price: this.extractPrice(markdown),
      currency: this.extractFromMarkdown(markdown, /(USD|INR|EUR|GBP)/),
      stock: this.extractFromMarkdown(markdown, /(in stock|out of stock|limited stock)/i)
    }
  }

  private extractFromMarkdown(markdown: string, regex: RegExp): string | undefined {
    const match = markdown.match(regex)
    return match ? match[1].trim() : undefined
  }

  private extractPrice(markdown: string): number | undefined {
    const priceMatch = markdown.match(/\$?(\d+\.?\d*)/)
    return priceMatch ? parseFloat(priceMatch[1]) : undefined
  }

  /**
   * Search for parts on a regional supplier and scrape results
   */
  async searchSupplier(
    supplier: SupportedSupplier,
    query: string
  ): Promise<SupplierPart[]> {
    const supplierConfig = REGIONAL_SUPPLIERS[supplier]
    const searchUrl = supplierConfig.searchUrl(query)

    try {
      console.log(`[FireCrawl] Searching ${supplierConfig.name} for:`, query)

      // First, crawl the search results page
      const searchResult = await this.firecrawl.scrape(searchUrl, {
        formats: ['markdown']
      })

      if (!searchResult.markdown) {
        console.error('[FireCrawl] Search failed: No markdown returned')
        return []
      }

      // Extract product links from search results (this is simplified - you'd need to parse the markdown)
      // In a real implementation, you'd want to extract product URLs from the search results
      // For now, we'll return empty array - you can enhance this based on the supplier's HTML structure

      console.log('[FireCrawl] Search completed. Found results (manual parsing needed)')
      
      return []
    } catch (error) {
      console.error(`[FireCrawl] Error searching ${supplierConfig.name}:`, error)
      return []
    }
  }

  /**
   * Convert scraped data to standard SupplierPart format
   */
  convertToSupplierPart(
    scraped: ScrapedPartData,
    supplier: SupportedSupplier,
    sourceUrl: string
  ): SupplierPart {
    const supplierConfig = REGIONAL_SUPPLIERS[supplier]
    
    // Parse stock status
    const stockText = (scraped.stock || '').toLowerCase()
    let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = 'out_of_stock'
    let available = 0

    if (stockText.includes('in stock') || stockText.includes('available')) {
      stockStatus = 'in_stock'
      available = 100 // Default estimate
    } else if (stockText.includes('limited') || stockText.includes('low')) {
      stockStatus = 'low_stock'
      available = 5
    }

    return {
      partNumber: scraped.partNumber || scraped.name || 'Unknown',
      name: scraped.name || 'Unknown Part',
      description: scraped.description || '',
      type: this.guessPartType(scraped.description || scraped.name || ''),
      supplier: 'DigiKey', // We use DigiKey as type but track actual supplier separately
      supplierPartNumber: scraped.partNumber || '',
      manufacturer: scraped.manufacturer || 'Unknown',
      imageUrl: scraped.imageUrl,
      thumbnailUrl: scraped.imageUrl,
      additionalImages: [],
      pricing: {
        currency: scraped.currency || supplierConfig.currency,
        unitPrice: scraped.price || 0,
        quantityPricing: scraped.price ? [
          { quantity: 1, price: scraped.price }
        ] : []
      },
      stock: {
        available,
        status: stockStatus
      },
      productUrl: sourceUrl,
      datasheetUrl: undefined,
      specifications: scraped.specifications || {},
      lastUpdated: new Date().toISOString()
    }
  }

  /**
   * Guess part type from description
   */
  private guessPartType(text: string): string {
    const lower = text.toLowerCase()
    
    if (lower.includes('resistor')) return 'Resistor'
    if (lower.includes('capacitor')) return 'Capacitor'
    if (lower.includes('arduino') || lower.includes('development board')) return 'Development Board'
    if (lower.includes('led')) return 'LED'
    if (lower.includes('sensor')) return 'Sensor'
    if (lower.includes('ic') || lower.includes('chip')) return 'IC'
    if (lower.includes('transistor')) return 'Transistor'
    if (lower.includes('diode')) return 'Diode'
    if (lower.includes('connector')) return 'Connector'
    if (lower.includes('switch')) return 'Switch'
    if (lower.includes('display')) return 'Display'
    if (lower.includes('motor')) return 'Motor'
    if (lower.includes('battery')) return 'Battery'
    if (lower.includes('wire') || lower.includes('cable')) return 'Wire/Cable'
    
    return 'Component'
  }

  /**
   * Get recommended supplier for a country
   */
  static getSupplierForCountry(countryCode: string): SupportedSupplier | null {
    switch (countryCode.toUpperCase()) {
      case 'IN':
        return 'robu.in'
      case 'DE':
      case 'AT':
      case 'CH':
        return 'reichelt.de'
      default:
        return null
    }
  }
}

// Singleton instance
let firecrawlInstance: FireCrawlScraper | null = null

export function getFireCrawlScraper(): FireCrawlScraper {
  if (!firecrawlInstance) {
    firecrawlInstance = new FireCrawlScraper()
  }
  return firecrawlInstance
}
