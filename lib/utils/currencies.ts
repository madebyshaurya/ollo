export interface Currency {
    code: string
    name: string
    symbol: string
    country?: string
}

export const CURRENCIES: Currency[] = [
    // Major currencies
    { code: "USD", name: "US Dollar", symbol: "$", country: "United States" },
    { code: "EUR", name: "Euro", symbol: "€", country: "European Union" },
    { code: "GBP", name: "British Pound", symbol: "£", country: "United Kingdom" },
    { code: "JPY", name: "Japanese Yen", symbol: "¥", country: "Japan" },
    { code: "CHF", name: "Swiss Franc", symbol: "Fr", country: "Switzerland" },
    { code: "CAD", name: "Canadian Dollar", symbol: "C$", country: "Canada" },
    { code: "AUD", name: "Australian Dollar", symbol: "A$", country: "Australia" },
    { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", country: "New Zealand" },

    // Asian currencies
    { code: "CNY", name: "Chinese Yuan", symbol: "¥", country: "China" },
    { code: "INR", name: "Indian Rupee", symbol: "₹", country: "India" },
    { code: "KRW", name: "South Korean Won", symbol: "₩", country: "South Korea" },
    { code: "SGD", name: "Singapore Dollar", symbol: "S$", country: "Singapore" },
    { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", country: "Hong Kong" },
    { code: "TWD", name: "Taiwan Dollar", symbol: "NT$", country: "Taiwan" },
    { code: "THB", name: "Thai Baht", symbol: "฿", country: "Thailand" },
    { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", country: "Malaysia" },
    { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", country: "Indonesia" },
    { code: "PHP", name: "Philippine Peso", symbol: "₱", country: "Philippines" },
    { code: "VND", name: "Vietnamese Dong", symbol: "₫", country: "Vietnam" },

    // European currencies
    { code: "NOK", name: "Norwegian Krone", symbol: "kr", country: "Norway" },
    { code: "SEK", name: "Swedish Krona", symbol: "kr", country: "Sweden" },
    { code: "DKK", name: "Danish Krone", symbol: "kr", country: "Denmark" },
    { code: "PLN", name: "Polish Zloty", symbol: "zł", country: "Poland" },
    { code: "CZK", name: "Czech Koruna", symbol: "Kč", country: "Czech Republic" },
    { code: "HUF", name: "Hungarian Forint", symbol: "Ft", country: "Hungary" },
    { code: "RON", name: "Romanian Leu", symbol: "lei", country: "Romania" },
    { code: "BGN", name: "Bulgarian Lev", symbol: "лв", country: "Bulgaria" },
    { code: "HRK", name: "Croatian Kuna", symbol: "kn", country: "Croatia" },
    { code: "RSD", name: "Serbian Dinar", symbol: "din", country: "Serbia" },
    { code: "RUB", name: "Russian Ruble", symbol: "₽", country: "Russia" },
    { code: "UAH", name: "Ukrainian Hryvnia", symbol: "₴", country: "Ukraine" },
    { code: "TRY", name: "Turkish Lira", symbol: "₺", country: "Turkey" },

    // Middle East & Africa
    { code: "AED", name: "UAE Dirham", symbol: "د.إ", country: "United Arab Emirates" },
    { code: "SAR", name: "Saudi Riyal", symbol: "﷼", country: "Saudi Arabia" },
    { code: "QAR", name: "Qatari Riyal", symbol: "﷼", country: "Qatar" },
    { code: "KWD", name: "Kuwaiti Dinar", symbol: "د.ك", country: "Kuwait" },
    { code: "BHD", name: "Bahraini Dinar", symbol: ".د.ب", country: "Bahrain" },
    { code: "OMR", name: "Omani Rial", symbol: "﷼", country: "Oman" },
    { code: "JOD", name: "Jordanian Dinar", symbol: "د.ا", country: "Jordan" },
    { code: "LBP", name: "Lebanese Pound", symbol: "ل.ل", country: "Lebanon" },
    { code: "EGP", name: "Egyptian Pound", symbol: "£", country: "Egypt" },
    { code: "ILS", name: "Israeli Shekel", symbol: "₪", country: "Israel" },
    { code: "ZAR", name: "South African Rand", symbol: "R", country: "South Africa" },
    { code: "NGN", name: "Nigerian Naira", symbol: "₦", country: "Nigeria" },
    { code: "GHS", name: "Ghanaian Cedi", symbol: "₵", country: "Ghana" },
    { code: "KES", name: "Kenyan Shilling", symbol: "Sh", country: "Kenya" },
    { code: "TND", name: "Tunisian Dinar", symbol: "د.ت", country: "Tunisia" },
    { code: "MAD", name: "Moroccan Dirham", symbol: "د.م.", country: "Morocco" },

    // Latin America
    { code: "BRL", name: "Brazilian Real", symbol: "R$", country: "Brazil" },
    { code: "MXN", name: "Mexican Peso", symbol: "$", country: "Mexico" },
    { code: "ARS", name: "Argentine Peso", symbol: "$", country: "Argentina" },
    { code: "CLP", name: "Chilean Peso", symbol: "$", country: "Chile" },
    { code: "COP", name: "Colombian Peso", symbol: "$", country: "Colombia" },
    { code: "PEN", name: "Peruvian Sol", symbol: "S/", country: "Peru" },
    { code: "UYU", name: "Uruguayan Peso", symbol: "$", country: "Uruguay" },
    { code: "PYG", name: "Paraguayan Guarani", symbol: "₲", country: "Paraguay" },
    { code: "BOB", name: "Bolivian Boliviano", symbol: "Bs.", country: "Bolivia" },
    { code: "VES", name: "Venezuelan Bolívar", symbol: "Bs.", country: "Venezuela" },
    { code: "GTQ", name: "Guatemalan Quetzal", symbol: "Q", country: "Guatemala" },
    { code: "HNL", name: "Honduran Lempira", symbol: "L", country: "Honduras" },
    { code: "NIO", name: "Nicaraguan Córdoba", symbol: "C$", country: "Nicaragua" },
    { code: "CRC", name: "Costa Rican Colón", symbol: "₡", country: "Costa Rica" },
    { code: "PAB", name: "Panamanian Balboa", symbol: "B/.", country: "Panama" },
    { code: "DOP", name: "Dominican Peso", symbol: "$", country: "Dominican Republic" },
    { code: "JMD", name: "Jamaican Dollar", symbol: "J$", country: "Jamaica" },
    { code: "TTD", name: "Trinidad and Tobago Dollar", symbol: "TT$", country: "Trinidad and Tobago" },
    { code: "BBD", name: "Barbadian Dollar", symbol: "Bds$", country: "Barbados" },

    // Other currencies
    { code: "ISK", name: "Icelandic Krona", symbol: "kr", country: "Iceland" },
    { code: "AMD", name: "Armenian Dram", symbol: "֏", country: "Armenia" },
    { code: "GEL", name: "Georgian Lari", symbol: "₾", country: "Georgia" },
    { code: "AZN", name: "Azerbaijani Manat", symbol: "₼", country: "Azerbaijan" },
    { code: "KZT", name: "Kazakhstani Tenge", symbol: "₸", country: "Kazakhstan" },
    { code: "UZS", name: "Uzbekistani Som", symbol: "so'm", country: "Uzbekistan" },
    { code: "KGS", name: "Kyrgyzstani Som", symbol: "с", country: "Kyrgyzstan" },
    { code: "TJS", name: "Tajikistani Somoni", symbol: "ЅМ", country: "Tajikistan" },
    { code: "TMT", name: "Turkmenistani Manat", symbol: "m", country: "Turkmenistan" },
    { code: "MNT", name: "Mongolian Tugrik", symbol: "₮", country: "Mongolia" },
    { code: "NPR", name: "Nepalese Rupee", symbol: "₨", country: "Nepal" },
    { code: "LKR", name: "Sri Lankan Rupee", symbol: "₨", country: "Sri Lanka" },
    { code: "BDT", name: "Bangladeshi Taka", symbol: "৳", country: "Bangladesh" },
    { code: "PKR", name: "Pakistani Rupee", symbol: "₨", country: "Pakistan" },
    { code: "AFN", name: "Afghan Afghani", symbol: "؋", country: "Afghanistan" },
    { code: "IRR", name: "Iranian Rial", symbol: "﷼", country: "Iran" },
    { code: "IQD", name: "Iraqi Dinar", symbol: "د.ع", country: "Iraq" },
    { code: "SYP", name: "Syrian Pound", symbol: "£", country: "Syria" },
    { code: "LYD", name: "Libyan Dinar", symbol: "ل.د", country: "Libya" },
    { code: "DZD", name: "Algerian Dinar", symbol: "د.ج", country: "Algeria" },
    { code: "SDG", name: "Sudanese Pound", symbol: "ج.س.", country: "Sudan" },
    { code: "ETB", name: "Ethiopian Birr", symbol: "Br", country: "Ethiopia" },
    { code: "UGX", name: "Ugandan Shilling", symbol: "Sh", country: "Uganda" },
    { code: "TZS", name: "Tanzanian Shilling", symbol: "Sh", country: "Tanzania" },
    { code: "RWF", name: "Rwandan Franc", symbol: "Fr", country: "Rwanda" },
    { code: "MGA", name: "Malagasy Ariary", symbol: "Ar", country: "Madagascar" },
    { code: "MUR", name: "Mauritian Rupee", symbol: "₨", country: "Mauritius" },
    { code: "SCR", name: "Seychellois Rupee", symbol: "₨", country: "Seychelles" },
]

export function getCurrencySymbol(code: string): string {
    const currency = CURRENCIES.find(c => c.code === code)
    return currency?.symbol || code
}

export function getCurrencyName(code: string): string {
    const currency = CURRENCIES.find(c => c.code === code)
    return currency?.name || code
}

export function searchCurrencies(query: string): Currency[] {
    if (!query) return CURRENCIES

    const searchTerm = query.toLowerCase()
    return CURRENCIES.filter(currency =>
        currency.code.toLowerCase().includes(searchTerm) ||
        currency.name.toLowerCase().includes(searchTerm) ||
        (currency.country && currency.country.toLowerCase().includes(searchTerm))
    ).sort((a, b) => {
        // Prioritize exact code matches
        if (a.code.toLowerCase() === searchTerm) return -1
        if (b.code.toLowerCase() === searchTerm) return 1

        // Then prioritize code starts with
        if (a.code.toLowerCase().startsWith(searchTerm) && !b.code.toLowerCase().startsWith(searchTerm)) return -1
        if (b.code.toLowerCase().startsWith(searchTerm) && !a.code.toLowerCase().startsWith(searchTerm)) return 1

        // Then alphabetical by code
        return a.code.localeCompare(b.code)
    })
}