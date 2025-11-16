/**
 * DigiKey API Integration
 * 
 * Official API documentation: https://developer.digikey.com/
 * 
 * This integration handles:
 * - OAuth2 authentication
 * - Product search
 * - Price & availability
 * - Product images and details
 */

import axios, { AxiosInstance } from 'axios'

interface DigiKeyConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

interface DigiKeyTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token: string
}

interface DigiKeyPricing {
  quantity: number
  unitPrice: number
}

interface DigiKeyProduct {
  digiKeyPartNumber: string
  manufacturerPartNumber: string
  manufacturer: {
    name: string
  }
  productDescription: string
  detailedDescription?: string
  primaryPhoto?: string
  primaryDatasheet?: string
  productUrl?: string
  quantityAvailable: number
  standardPricing?: DigiKeyPricing[]
  unitPrice?: number
  mediaLinks?: Array<{
    mediaType: string
    url: string
    title?: string
  }>
  parameters?: Array<{
    parameter: string
    value: string
  }>
}

interface DigiKeySearchResponse {
  productsCount: number
  products: DigiKeyProduct[]
  exactManufacturerProductsCount: number
  exactManufacturerProducts: DigiKeyProduct[]
}

export interface SupplierPart {
  partNumber: string
  name: string
  description: string
  type: string
  supplier: 'DigiKey'
  supplierPartNumber: string
  manufacturer: string
  imageUrl?: string
  thumbnailUrl?: string
  additionalImages: string[]
  pricing: {
    currency: string
    unitPrice: number
    quantityPricing: Array<{
      quantity: number
      price: number
    }>
  }
  stock: {
    available: number
    status: 'in_stock' | 'low_stock' | 'out_of_stock'
  }
  productUrl?: string
  datasheetUrl?: string
  specifications: Record<string, string>
  lastUpdated: string
}

export class DigiKeyAPI {
  private config: DigiKeyConfig
  private accessToken: string | null = null
  private refreshToken: string | null = null
  private tokenExpiry: Date | null = null
  private axiosInstance: AxiosInstance

  constructor(config?: DigiKeyConfig) {
    this.config = config || {
      clientId: process.env.DIGIKEY_CLIENT_ID!,
      clientSecret: process.env.DIGIKEY_CLIENT_SECRET!,
      redirectUri: process.env.DIGIKEY_REDIRECT_URI!
    }

    this.axiosInstance = axios.create({
      baseURL: 'https://api.digikey.com',
      headers: {
        'Content-Type': 'application/json',
        'X-DIGIKEY-Client-Id': this.config.clientId
      }
    })
  }

  /**
   * Get OAuth2 authorization URL
   */
  getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri
    })

    return `https://api.digikey.com/v1/oauth2/authorize?${params.toString()}`
  }

  /**
   * Exchange authorization code for access token
   */
  async getAccessToken(code: string): Promise<void> {
    try {
      const response = await axios.post<DigiKeyTokenResponse>(
        'https://api.digikey.com/v1/oauth2/token',
        new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          redirect_uri: this.config.redirectUri
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      )

      this.accessToken = response.data.access_token
      this.refreshToken = response.data.refresh_token
      this.tokenExpiry = new Date(Date.now() + response.data.expires_in * 1000)

      // Store tokens securely (you might want to use a database or secure storage)
      console.log('[DigiKey] Access token obtained, expires:', this.tokenExpiry)
    } catch (error) {
      console.error('[DigiKey] Failed to get access token:', error)
      throw new Error('Failed to authenticate with DigiKey API')
    }
  }

  /**
   * Refresh the access token using refresh token
   */
  async refreshAccessToken(): Promise<void> {
    if (!this.refreshToken) {
      throw new Error('No refresh token available')
    }

    try {
      const response = await axios.post<DigiKeyTokenResponse>(
        'https://api.digikey.com/v1/oauth2/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      )

      this.accessToken = response.data.access_token
      this.refreshToken = response.data.refresh_token
      this.tokenExpiry = new Date(Date.now() + response.data.expires_in * 1000)

      console.log('[DigiKey] Access token refreshed, expires:', this.tokenExpiry)
    } catch (error) {
      console.error('[DigiKey] Failed to refresh access token:', error)
      throw new Error('Failed to refresh DigiKey API token')
    }
  }

  /**
   * Check if token needs refresh
   */
  private async ensureValidToken(): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Not authenticated. Please call getAccessToken() first.')
    }

    // Refresh if token expires in less than 5 minutes
    if (this.tokenExpiry && this.tokenExpiry.getTime() - Date.now() < 5 * 60 * 1000) {
      await this.refreshAccessToken()
    }
  }

  /**
   * Search for products by keyword
   */
  async searchProducts(
    keyword: string,
    options: {
      limit?: number
      offset?: number
      inStock?: boolean
    } = {}
  ): Promise<SupplierPart[]> {
    await this.ensureValidToken()

    const { limit = 10, offset = 0, inStock = true } = options

    try {
      const response = await this.axiosInstance.post<DigiKeySearchResponse>(
        '/Search/v3/Products/Keyword',
        {
          Keywords: keyword,
          Limit: limit,
          Offset: offset,
          FilterOptionsRequest: inStock ? {
            InStockOnly: true
          } : undefined
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`
          }
        }
      )

      // Convert DigiKey products to our standard format
      return this.convertToSupplierParts(response.data.products)
    } catch (error) {
      const err = error as { response?: { data?: unknown }; message: string }
      console.error('[DigiKey] Search failed:', err.response?.data || err.message)
      throw new Error(`DigiKey search failed: ${err.message}`)
    }
  }

  /**
   * Get product details by part number
   */
  async getProductDetails(partNumber: string): Promise<SupplierPart | null> {
    await this.ensureValidToken()

    try {
      const response = await this.axiosInstance.get<DigiKeyProduct>(
        `/Search/v3/Products/${encodeURIComponent(partNumber)}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`
          }
        }
      )

      const converted = this.convertToSupplierParts([response.data])
      return converted[0] || null
    } catch (error) {
      const err = error as { response?: { status?: number; data?: unknown }; message: string }
      if (err.response?.status === 404) {
        return null
      }
      console.error('[DigiKey] Product details failed:', err.response?.data || err.message)
      throw new Error(`Failed to get product details: ${err.message}`)
    }
  }

  /**
   * Convert DigiKey product format to our standard SupplierPart format
   */
  private convertToSupplierParts(products: DigiKeyProduct[]): SupplierPart[] {
    return products.map(product => {
      // Extract images
      const imageUrl = product.primaryPhoto
      const additionalImages = product.mediaLinks
        ?.filter(link => link.mediaType === 'Image')
        .map(link => link.url) || []

      // Determine stock status
      const available = product.quantityAvailable || 0
      let stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = 'out_of_stock'
      if (available > 100) stockStatus = 'in_stock'
      else if (available > 0) stockStatus = 'low_stock'

      // Extract pricing
      const pricing = product.standardPricing || []
      const unitPrice = product.unitPrice || pricing[0]?.unitPrice || 0

      // Extract specifications
      const specifications: Record<string, string> = {}
      if (product.parameters) {
        product.parameters.forEach(param => {
          specifications[param.parameter] = param.value
        })
      }

      return {
        partNumber: product.manufacturerPartNumber,
        name: product.manufacturerPartNumber,
        description: product.productDescription || product.detailedDescription || '',
        type: this.guessPartType(product.productDescription),
        supplier: 'DigiKey',
        supplierPartNumber: product.digiKeyPartNumber,
        manufacturer: product.manufacturer?.name || 'Unknown',
        imageUrl,
        thumbnailUrl: imageUrl, // DigiKey doesn't have separate thumbnails
        additionalImages,
        pricing: {
          currency: 'USD',
          unitPrice,
          quantityPricing: pricing.map(p => ({
            quantity: p.quantity,
            price: p.unitPrice
          }))
        },
        stock: {
          available,
          status: stockStatus
        },
        productUrl: product.productUrl,
        datasheetUrl: product.primaryDatasheet,
        specifications,
        lastUpdated: new Date().toISOString()
      }
    })
  }

  /**
   * Guess part type from description (basic categorization)
   */
  private guessPartType(description: string = ''): string {
    const desc = description.toLowerCase()
    
    if (desc.includes('resistor')) return 'Resistor'
    if (desc.includes('capacitor')) return 'Capacitor'
    if (desc.includes('arduino') || desc.includes('development board')) return 'Development Board'
    if (desc.includes('led')) return 'LED'
    if (desc.includes('sensor')) return 'Sensor'
    if (desc.includes('ic') || desc.includes('integrated circuit')) return 'IC'
    if (desc.includes('transistor')) return 'Transistor'
    if (desc.includes('diode')) return 'Diode'
    if (desc.includes('connector')) return 'Connector'
    if (desc.includes('switch')) return 'Switch'
    if (desc.includes('display')) return 'Display'
    if (desc.includes('motor')) return 'Motor'
    if (desc.includes('battery')) return 'Battery'
    if (desc.includes('wire') || desc.includes('cable')) return 'Wire/Cable'
    
    return 'Component'
  }

  /**
   * Set access token manually (useful for testing or if you store tokens elsewhere)
   */
  setAccessToken(token: string, expiresIn: number = 86400): void {
    this.accessToken = token
    this.tokenExpiry = new Date(Date.now() + expiresIn * 1000)
  }

  /**
   * Set refresh token manually
   */
  setRefreshToken(token: string): void {
    this.refreshToken = token
  }
}

// Singleton instance
let digikeyInstance: DigiKeyAPI | null = null

export function getDigiKeyAPI(): DigiKeyAPI {
  if (!digikeyInstance) {
    digikeyInstance = new DigiKeyAPI()
  }
  return digikeyInstance
}
