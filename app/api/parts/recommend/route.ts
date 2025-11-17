import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getUserPreferences } from '@/lib/actions/user-preferences'
import { CURRENCIES } from '@/lib/utils/currencies'
import { getBestSuppliersForUser } from '@/lib/suppliers/supplier-database'
import { getFireCrawlScraper } from '@/lib/suppliers/firecrawl-scraper'
import type { PartRecommendation as FirecrawlPartRecommendation } from '@/lib/suppliers/firecrawl-scraper'
import { findAlternativeComponents } from '@/lib/suppliers/ai-alternatives'

interface PartRecommendation {
    name: string
    type: string
    description: string
    estimatedPrice?: string
    price?: number
    currency?: string
    reason?: string
    supplier?: string
    supplierUrl?: string
    imageUrl?: string
    partNumber?: string
    manufacturer?: string
    inStock?: boolean
    alternativeFor?: string
    specifications?: Record<string, string>
}

export async function POST(req: Request) {
    try {
        const { projectId, forceRegenerate } = await req.json()

        if (!projectId) {
            return Response.json({ error: 'Project ID is required' }, { status: 400 })
        }

        // Fetch project details
        const supabase = await createServerSupabaseClient()
        const { data: project, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single()

        if (error || !project) {
            return Response.json({ error: 'Project not found' }, { status: 404 })
        }

        // Check if we have saved recommendations and don't need to regenerate
        if (!forceRegenerate && project.part_recommendations && Array.isArray(project.part_recommendations)) {
            console.log('[Parts API] Returning cached recommendations from database')
            return Response.json({
                parts: project.part_recommendations,
                projectContext: {
                    name: project.name,
                    type: project.type,
                    budget: project.budget
                },
                cached: true,
                generatedAt: project.part_recommendations_generated_at
            })
        }

        console.log('[Parts API] 🚀 Generating new part recommendations with real pricing...')

        // Get user preferences for currency/country context
        let userCurrency = 'USD'
        let userCountry = 'United States'
        try {
            const preferences = await getUserPreferences()
            userCurrency = preferences.currency
            const currencyInfo = CURRENCIES.find(c => c.code === userCurrency)
            userCountry = currencyInfo?.country || 'United States'
            console.log('[Parts API] User currency:', userCurrency, '| Country:', userCountry)
        } catch (prefError) {
            console.warn('[Parts API] Could not fetch user preferences, using defaults:', prefError)
        }

        // Get best suppliers for this user's location
        const suppliers = getBestSuppliersForUser(userCurrency, 3)
        console.log('[Parts API] Best suppliers:', suppliers.map(s => s.name).join(', '))

        // Build context for AI
        const projectContext = `
Project Name: ${project.name}
Description: ${project.description}
Type: ${project.type}
Microcontroller: ${project.microcontroller || project.microcontroller_other || 'Not specified'}
Budget: $${project.budget || 'Not specified'}
Purpose: ${project.purpose || 'Not specified'}
Timeline: ${project.timeline || 'Not specified'}
User Location: ${userCountry}
Preferred Currency: ${userCurrency}
    `.trim()

        // Step 1: Get AI recommendations for initial parts list
        console.log('[Parts API] Step 1: Getting AI recommendations...')
        const prompt = `Based on the following project details, recommend 4-5 essential electronic parts/components.

${projectContext}

IMPORTANT:
- Be specific with part names and model numbers when possible
- Focus on commonly available parts
- Consider the user is in ${userCountry}

For each part, provide:
1. Specific part name or model number
2. Type/category
3. Brief description

Format as JSON array with: name, type, description`

        const aiResult = await generateText({
            model: openai('gpt-4o-mini'),
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert electronics engineer. Recommend specific, commonly available parts. Always respond with valid JSON only.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7
        })

        // Parse AI recommendations
        let aiRecommendations: Array<{ name: string; type: string; description: string }> = []
        try {
            const jsonMatch = aiResult.text.match(/\[[\s\S]*\]/)
            if (jsonMatch) {
                aiRecommendations = JSON.parse(jsonMatch[0])
            } else {
                aiRecommendations = JSON.parse(aiResult.text)
            }
            console.log(`[Parts API] ✅ Got ${aiRecommendations.length} AI recommendations`)
        } catch (parseError) {
            console.error('[Parts API] Failed to parse AI response:', parseError)
            return Response.json({
                parts: [],
                error: 'Failed to parse AI response'
            })
        }

        // Step 2: Enrich parts with real pricing using Firecrawl
        console.log('[Parts API] Step 2: Enriching with real pricing from suppliers...')
        const parts: PartRecommendation[] = []

        try {
            const scraper = getFireCrawlScraper()

            // Get real pricing for top 3 parts
            const partsToEnrich = aiRecommendations.slice(0, 3)

            for (const aiPart of partsToEnrich) {
                console.log(`[Parts API] Searching for "${aiPart.name}"...`)

                let foundRealPart = false

                // Try top 2 suppliers
                for (const supplier of suppliers.slice(0, 2)) {
                    if (foundRealPart) break

                    try {
                        const products = await scraper.searchSupplier(supplier, aiPart.name)

                        if (products.length > 0 && products[0].price) {
                            const product = products[0]
                            parts.push({
                                name: product.name || aiPart.name,
                                type: aiPart.type,
                                description: product.description || aiPart.description,
                                price: product.price,
                                currency: product.currency || userCurrency,
                                supplier: supplier.name,
                                supplierUrl: product.productUrl,
                                imageUrl: product.imageUrl,
                                partNumber: product.partNumber,
                                manufacturer: product.manufacturer,
                                inStock: product.stock?.toLowerCase().includes('stock') !== false,
                                specifications: product.specifications
                            })
                            foundRealPart = true
                            console.log(`[Parts API] ✅ Found real pricing: ${product.price} ${product.currency}`)
                        }
                    } catch (error) {
                        console.error(`[Parts API] Error searching ${supplier.name}:`, error)
                    }
                }

                // If no real pricing found, add with AI estimate
                if (!foundRealPart) {
                    parts.push({
                        name: aiPart.name,
                        type: aiPart.type,
                        description: aiPart.description,
                        estimatedPrice: 'Price varies by supplier',
                        currency: userCurrency
                    })
                }
            }

            // Add remaining AI recommendations without real pricing
            for (const aiPart of aiRecommendations.slice(3)) {
                parts.push({
                    name: aiPart.name,
                    type: aiPart.type,
                    description: aiPart.description,
                    estimatedPrice: 'Check supplier for pricing',
                    currency: userCurrency
                })
            }

            // Step 3: Find alternatives for the first key component
            if (parts.length > 0 && parts[0].price) {
                console.log('[Parts API] Step 3: Finding alternative components...')
                try {
                    const alternatives = await findAlternativeComponents({
                        originalPart: {
                            name: parts[0].name,
                            type: parts[0].type,
                            description: parts[0].description,
                            specifications: parts[0].specifications
                        },
                        projectContext,
                        targetCurrency: userCurrency,
                        maxAlternatives: 2
                    })

                    // Try to get real pricing for first alternative
                    if (alternatives.length > 0) {
                        const altSearchTerms = alternatives[0].searchTerms || [alternatives[0].name]

                        for (const searchTerm of altSearchTerms.slice(0, 1)) {
                            try {
                                const scraper = getFireCrawlScraper()
                                const products = await scraper.searchSupplier(suppliers[0], searchTerm)

                                if (products.length > 0 && products[0].price) {
                                    const product = products[0]
                                    parts.push({
                                        name: product.name || alternatives[0].name,
                                        type: alternatives[0].type,
                                        description: alternatives[0].description,
                                        price: product.price,
                                        currency: product.currency || userCurrency,
                                        supplier: suppliers[0].name,
                                        supplierUrl: product.productUrl,
                                        alternativeFor: parts[0].name,
                                        inStock: product.stock?.toLowerCase().includes('stock') !== false
                                    })
                                    console.log('[Parts API] ✅ Found alternative with real pricing')
                                    break
                                }
                            } catch (error) {
                                console.error('[Parts API] Error finding alternative pricing:', error)
                            }
                        }
                    }
                } catch (error) {
                    console.error('[Parts API] Error finding alternatives:', error)
                }
            }

        } catch (error) {
            console.error('[Parts API] Error enriching parts:', error)
            // Fall back to AI-only recommendations
            for (const aiPart of aiRecommendations) {
                parts.push({
                    name: aiPart.name,
                    type: aiPart.type,
                    description: aiPart.description,
                    estimatedPrice: 'Check supplier for pricing',
                    currency: userCurrency
                })
            }
        }

        console.log(`[Parts API] 🎉 Generated ${parts.length} part recommendations`)

        // Log summary
        const partsWithRealPricing = parts.filter(p => p.price !== undefined)
        console.log(`[Parts API] Parts with real pricing: ${partsWithRealPricing.length}/${parts.length}`)

        // Save recommendations to database
        console.log('[Parts API] Saving', parts.length, 'part recommendations to database...')
        try {
            const { error: updateError } = await supabase
                .from('projects')
                .update({
                    part_recommendations: parts,
                    part_recommendations_generated_at: new Date().toISOString()
                })
                .eq('id', projectId)

            if (updateError) {
                console.error('[Parts API] Failed to save recommendations:', updateError)
            } else {
                console.log('[Parts API] ✅ Part recommendations saved successfully')
            }
        } catch (saveError) {
            console.error('[Parts API] Error saving recommendations:', saveError)
        }

        return Response.json({
            parts,
            projectContext: {
                name: project.name,
                type: project.type,
                budget: project.budget
            }
        })
    } catch (err: unknown) {
        console.error('Parts recommendation API error:', err)
        const message = err instanceof Error ? err.message : 'Unknown error'
        return Response.json({ error: message }, { status: 500 })
    }
}
