/**
 * Comprehensive Electronics Supplier Database
 * Maps regions/countries to their best electronics suppliers with search capabilities
 */

export interface SupplierConfig {
  name: string
  website: string
  countries: string[] // ISO country codes
  currencies: string[] // Supported currencies
  searchUrl: (query: string) => string
  productUrlPattern?: RegExp // Pattern to identify product pages
  priority: number // 1-10, higher = prefer this supplier for the region
  hasApi: boolean // Whether they have an official API
  notes?: string
}

/**
 * Comprehensive list of electronics suppliers by region
 */
export const SUPPLIERS: Record<string, SupplierConfig> = {
  // === INDIA ===
  'robu': {
    name: 'Robu.in',
    website: 'https://robu.in',
    countries: ['IN'],
    currencies: ['INR'],
    searchUrl: (query) => `https://robu.in/?s=${encodeURIComponent(query)}&post_type=product`,
    priority: 9,
    hasApi: false,
    notes: 'Popular Indian electronics supplier with good maker/hobbyist parts'
  },
  'electronicscomp': {
    name: 'ElectronicsComp',
    website: 'https://www.electronicscomp.com',
    countries: ['IN'],
    currencies: ['INR'],
    searchUrl: (query) => `https://www.electronicscomp.com/search?q=${encodeURIComponent(query)}`,
    priority: 8,
    hasApi: false
  },
  'electronwings': {
    name: 'ElectronWings',
    website: 'https://www.electronwings.com',
    countries: ['IN'],
    currencies: ['INR'],
    searchUrl: (query) => `https://www.electronwings.com/search?q=${encodeURIComponent(query)}`,
    priority: 7,
    hasApi: false
  },
  'ktron': {
    name: 'Ktron India',
    website: 'https://www.ktron.in',
    countries: ['IN'],
    currencies: ['INR'],
    searchUrl: (query) => `https://www.ktron.in/search?q=${encodeURIComponent(query)}`,
    priority: 7,
    hasApi: false
  },

  // === USA ===
  'mouser': {
    name: 'Mouser Electronics',
    website: 'https://www.mouser.com',
    countries: ['US', 'CA'],
    currencies: ['USD', 'CAD'],
    searchUrl: (query) => `https://www.mouser.com/c/?q=${encodeURIComponent(query)}`,
    priority: 10,
    hasApi: true,
    notes: 'Major global distributor with extensive inventory'
  },
  'sparkfun': {
    name: 'SparkFun',
    website: 'https://www.sparkfun.com',
    countries: ['US', 'CA'],
    currencies: ['USD'],
    searchUrl: (query) => `https://www.sparkfun.com/search/results?term=${encodeURIComponent(query)}`,
    priority: 9,
    hasApi: false,
    notes: 'Great for hobbyists and makers, breakout boards'
  },
  'adafruit': {
    name: 'Adafruit',
    website: 'https://www.adafruit.com',
    countries: ['US', 'CA'],
    currencies: ['USD'],
    searchUrl: (query) => `https://www.adafruit.com/search?q=${encodeURIComponent(query)}`,
    priority: 9,
    hasApi: false,
    notes: 'Excellent for hobbyists, great tutorials and support'
  },
  'pololu': {
    name: 'Pololu',
    website: 'https://www.pololu.com',
    countries: ['US', 'CA'],
    currencies: ['USD'],
    searchUrl: (query) => `https://www.pololu.com/search?query=${encodeURIComponent(query)}`,
    priority: 8,
    hasApi: false,
    notes: 'Robotics and motor control specialists'
  },

  // === EUROPE (Multi-country) ===
  'reichelt': {
    name: 'Reichelt Elektronik',
    website: 'https://www.reichelt.com',
    countries: ['DE', 'AT', 'CH', 'FR', 'NL', 'BE', 'LU'],
    currencies: ['EUR'],
    searchUrl: (query) => `https://www.reichelt.com/index.html?ACTION=446&q=${encodeURIComponent(query)}`,
    priority: 9,
    hasApi: false,
    notes: 'Major German distributor, ships across Europe'
  },
  'conrad': {
    name: 'Conrad Electronic',
    website: 'https://www.conrad.com',
    countries: ['DE', 'AT', 'CH', 'FR', 'NL', 'BE'],
    currencies: ['EUR'],
    searchUrl: (query) => `https://www.conrad.com/en/search.html?search=${encodeURIComponent(query)}`,
    priority: 9,
    hasApi: false,
    notes: 'Large European distributor with retail stores'
  },
  'rs-components': {
    name: 'RS Components',
    website: 'https://www.rs-online.com',
    countries: ['GB', 'IE', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE'],
    currencies: ['GBP', 'EUR'],
    searchUrl: (query) => `https://www.rs-online.com/web/c/?searchTerm=${encodeURIComponent(query)}`,
    priority: 10,
    hasApi: true,
    notes: 'Major industrial and professional distributor'
  },
  'farnell': {
    name: 'Farnell',
    website: 'https://www.farnell.com',
    countries: ['GB', 'IE', 'DE', 'FR', 'IT', 'ES'],
    currencies: ['GBP', 'EUR'],
    searchUrl: (query) => `https://www.farnell.com/search?st=${encodeURIComponent(query)}`,
    priority: 10,
    hasApi: true,
    notes: 'Part of Avnet, extensive inventory'
  },

  // === UK Specific ===
  'pimoroni': {
    name: 'Pimoroni',
    website: 'https://shop.pimoroni.com',
    countries: ['GB'],
    currencies: ['GBP'],
    searchUrl: (query) => `https://shop.pimoroni.com/search?q=${encodeURIComponent(query)}`,
    priority: 9,
    hasApi: false,
    notes: 'Raspberry Pi and maker-focused, great for hobbyists'
  },

  // === CHINA ===
  'lcsc': {
    name: 'LCSC Electronics',
    website: 'https://www.lcsc.com',
    countries: ['CN', 'HK', 'TW'],
    currencies: ['CNY', 'USD'],
    searchUrl: (query) => `https://www.lcsc.com/search?q=${encodeURIComponent(query)}`,
    priority: 10,
    hasApi: false,
    notes: 'Massive inventory, often cheapest option, associated with JLCPCB'
  },

  // === AUSTRALIA ===
  'core-electronics': {
    name: 'Core Electronics',
    website: 'https://core-electronics.com.au',
    countries: ['AU', 'NZ'],
    currencies: ['AUD', 'NZD'],
    searchUrl: (query) => `https://core-electronics.com.au/search?q=${encodeURIComponent(query)}`,
    priority: 9,
    hasApi: false,
    notes: 'Leading Australian maker/hobbyist supplier'
  },
  'jaycar': {
    name: 'Jaycar Electronics',
    website: 'https://www.jaycar.com.au',
    countries: ['AU', 'NZ'],
    currencies: ['AUD', 'NZD'],
    searchUrl: (query) => `https://www.jaycar.com.au/search?text=${encodeURIComponent(query)}`,
    priority: 8,
    hasApi: false,
    notes: 'Australian electronics retailer with physical stores'
  },

  // === CANADA ===
  'digikey-ca': {
    name: 'Digi-Key Canada',
    website: 'https://www.digikey.ca',
    countries: ['CA'],
    currencies: ['CAD'],
    searchUrl: (query) => `https://www.digikey.ca/en/products/result?s=${encodeURIComponent(query)}`,
    priority: 10,
    hasApi: true,
    notes: 'Canadian version of Digi-Key'
  },
  'creatron': {
    name: 'Creatron Inc',
    website: 'https://www.creatroninc.com',
    countries: ['CA'],
    currencies: ['CAD'],
    searchUrl: (query) => `https://www.creatroninc.com/search.php?search_query=${encodeURIComponent(query)}`,
    priority: 8,
    hasApi: false,
    notes: 'Toronto-based maker/hobbyist supplier'
  },

  // === JAPAN ===
  'akizuki': {
    name: 'Akizuki Denshi',
    website: 'https://akizukidenshi.com',
    countries: ['JP'],
    currencies: ['JPY'],
    searchUrl: (query) => `https://akizukidenshi.com/catalog/goods/search.aspx?search=x&keyword=${encodeURIComponent(query)}`,
    priority: 9,
    hasApi: false,
    notes: 'Popular Japanese electronics parts shop'
  },

  // === SOUTH KOREA ===
  'devicemart': {
    name: 'DeviceMart',
    website: 'https://www.devicemart.co.kr',
    countries: ['KR'],
    currencies: ['KRW'],
    searchUrl: (query) => `https://www.devicemart.co.kr/goods/search?keyword=${encodeURIComponent(query)}`,
    priority: 9,
    hasApi: false,
    notes: 'Major Korean electronics distributor'
  },

  // === SINGAPORE ===
  'sg-electronics': {
    name: 'SG Electronics',
    website: 'https://www.sgelectronics.com',
    countries: ['SG'],
    currencies: ['SGD'],
    searchUrl: (query) => `https://www.sgelectronics.com/search?q=${encodeURIComponent(query)}`,
    priority: 8,
    hasApi: false
  },

  // === BRAZIL ===
  'baudaeletronica': {
    name: 'Baú da Eletrônica',
    website: 'https://www.baudaeletronica.com.br',
    countries: ['BR'],
    currencies: ['BRL'],
    searchUrl: (query) => `https://www.baudaeletronica.com.br/catalogsearch/result/?q=${encodeURIComponent(query)}`,
    priority: 9,
    hasApi: false,
    notes: 'Popular Brazilian electronics supplier'
  },

  // === MEXICO ===
  'steren': {
    name: 'Steren',
    website: 'https://www.steren.com.mx',
    countries: ['MX'],
    currencies: ['MXN'],
    searchUrl: (query) => `https://www.steren.com.mx/catalogsearch/result/?q=${encodeURIComponent(query)}`,
    priority: 9,
    hasApi: false,
    notes: 'Large Mexican electronics retailer'
  },

  // === SOUTH AFRICA ===
  'mantech': {
    name: 'Mantech Electronics',
    website: 'https://www.mantech.co.za',
    countries: ['ZA'],
    currencies: ['ZAR'],
    searchUrl: (query) => `https://www.mantech.co.za/search/${encodeURIComponent(query)}`,
    priority: 9,
    hasApi: false,
    notes: 'Leading South African electronics supplier'
  },

  // === GLOBAL / INTERNATIONAL ===
  'aliexpress': {
    name: 'AliExpress',
    website: 'https://www.aliexpress.com',
    countries: ['*'], // Global
    currencies: ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'BRL', 'RUB'],
    searchUrl: (query) => `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}`,
    priority: 5, // Lower priority, but global fallback
    hasApi: false,
    notes: 'Global marketplace, long shipping times but very cheap'
  },
  'amazon': {
    name: 'Amazon',
    website: 'https://www.amazon.com',
    countries: ['*'], // Global with regional sites
    currencies: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR'],
    searchUrl: (query) => `https://www.amazon.com/s?k=${encodeURIComponent(query)}`,
    priority: 6,
    hasApi: true,
    notes: 'Global marketplace with fast shipping, prices vary'
  }
}

/**
 * Get suppliers for a specific country, sorted by priority
 */
export function getSuppliersForCountry(countryCode: string): SupplierConfig[] {
  const suppliers = Object.values(SUPPLIERS)
    .filter(s =>
      s.countries.includes(countryCode) ||
      s.countries.includes('*')
    )
    .sort((a, b) => b.priority - a.priority)

  return suppliers
}

/**
 * Get suppliers that support a specific currency
 */
export function getSuppliersForCurrency(currency: string): SupplierConfig[] {
  return Object.values(SUPPLIERS)
    .filter(s => s.currencies.includes(currency))
    .sort((a, b) => b.priority - a.priority)
}

/**
 * Get country code from currency code
 */
export function getCountryFromCurrency(currency: string): string {
  const currencyToCountry: Record<string, string> = {
    'USD': 'US',
    'EUR': 'DE', // Default to Germany for EUR
    'GBP': 'GB',
    'JPY': 'JP',
    'CHF': 'CH',
    'CAD': 'CA',
    'AUD': 'AU',
    'NZD': 'NZ',
    'CNY': 'CN',
    'INR': 'IN',
    'KRW': 'KR',
    'SGD': 'SG',
    'HKD': 'HK',
    'TWD': 'TW',
    'THB': 'TH',
    'MYR': 'MY',
    'IDR': 'ID',
    'PHP': 'PH',
    'VND': 'VN',
    'BRL': 'BR',
    'MXN': 'MX',
    'ZAR': 'ZA',
    'RUB': 'RU',
    'TRY': 'TR',
    'PLN': 'PL',
    'CZK': 'CZ',
    'NOK': 'NO',
    'SEK': 'SE',
    'DKK': 'DK'
  }

  return currencyToCountry[currency] || 'US'
}

/**
 * Get best suppliers for a user based on their currency
 */
export function getBestSuppliersForUser(currency: string, limit: number = 3): SupplierConfig[] {
  const country = getCountryFromCurrency(currency)
  const suppliers = getSuppliersForCountry(country)

  // Prioritize suppliers that match the currency
  const currencyMatch = suppliers.filter(s => s.currencies.includes(currency))
  const otherSuppliers = suppliers.filter(s => !s.currencies.includes(currency))

  return [...currencyMatch, ...otherSuppliers].slice(0, limit)
}
