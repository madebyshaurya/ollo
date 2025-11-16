import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getUserPreferences } from '@/lib/actions/user-preferences'
import { CURRENCIES } from '@/lib/utils/currencies'
import { getDigiKeyAPI } from '@/lib/integrations/digikey'
import { getFireCrawlScraper, FireCrawlScraper } from '@/lib/integrations/firecrawl-scraper'
import type { SupplierPart } from '@/lib/integrations/digikey'
import { auth } from '@clerk/nextjs/server'

interface PartRecommendation {
    name: string
    type: string
    description: string
    estimatedPrice: string
    reason: string
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

        console.log('[Parts API] Generating new part recommendations...')

        // Get authenticated user for DigiKey
        const { userId } = await auth()
        const { clerkClient } = await import('@clerk/nextjs/server')
        const client = await clerkClient()
        const user = userId ? await client.users.getUser(userId) : null
        const digikeyConnected = user?.privateMetadata.digikeyConnected as boolean || false

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

        const prompt = `Based on the following project details, recommend 5-8 electronic parts/components that would be needed for this project.

${projectContext}

IMPORTANT INSTRUCTIONS:
- All prices MUST be in ${userCurrency} currency
- Recommend parts that are commonly available in ${userCountry}
- Consider local suppliers and distributors common in ${userCountry}
- For India: suggest parts from local suppliers like Robu.in, ElectronicWings, or international sites that ship there
- For USA/Europe: suggest parts from Digi-Key, Mouser, SparkFun, Adafruit
- For Asia-Pacific: consider local suppliers and Aliexpress/Banggood availability
- Price parts realistically for the local market
- Consider import costs and availability for the region

For each part, provide:
1. Part name (be specific with model numbers when relevant)
2. Type/category (e.g., resistor, capacitor, sensor, etc.)
3. Brief description (one sentence)
4. Estimated price range in ${userCurrency}
5. Why it's recommended for this project and region

Format your response as a JSON array with objects containing: name, type, description, estimatedPrice, reason`

        const result = await generateText({
            model: openai('gpt-5-nano'),
            messages: [
                {
                    role: 'system',
                    content: 'You are an expert electronics engineer helping recommend parts for DIY electronics projects. Provide practical, commonly available parts with realistic pricing. Always respond with valid JSON only.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7
        })

        // Parse the AI response
        let parts: PartRecommendation[] = []
        const supplierParts: SupplierPart[] = []
        try {
            // Try to extract JSON from the response
            const jsonMatch = result.text.match(/\[[\s\S]*\]/)
            if (jsonMatch) {
                parts = JSON.parse(jsonMatch[0])
            } else {
                parts = JSON.parse(result.text)
            }

            // Now fetch REAL parts data from DigiKey/suppliers based on AI recommendations
            console.log('[Parts API] Fetching real parts data from suppliers...')
            
            if (digikeyConnected) {
                const digikey = getDigiKeyAPI()
                
                for (const part of parts) {
                    try {
                        // Search for the part on DigiKey
                        const searchResults = await digikey.searchProducts(part.name, {
                            limit: 1,
                            inStock: true
                        })
                        
                        if (searchResults.length > 0) {
                            supplierParts.push(searchResults[0])
                        }
                    } catch (searchError) {
                        console.error('[Parts API] Error searching DigiKey for:', part.name, searchError)
                    }
                }
            } else {
                console.log('[Parts API] DigiKey not connected, checking regional suppliers...')
                
                // Try regional suppliers via FireCrawl
                const firecrawl = getFireCrawlScraper()
                const regionalSupplier = FireCrawlScraper.getSupplierForCountry(userCountry)
                
                if (regionalSupplier) {
                    for (const part of parts.slice(0, 3)) { // Limit to 3 to save credits
                        try {
                            const regionalResults = await firecrawl.searchSupplier(regionalSupplier, part.name)
                            supplierParts.push(...regionalResults)
                        } catch (scrapError) {
                            console.error('[Parts API] Error scraping regional supplier:', scrapError)
                        }
                    }
                }
            }

            console.log('[Parts API] Found', supplierParts.length, 'real parts from suppliers')
        } catch (parseError) {
            console.error('[Parts API] Failed to parse AI response:', parseError)
            // Return raw text if JSON parsing fails
            return Response.json({
                parts: [],
                rawResponse: result.text,
                error: 'Failed to parse AI response'
            })
        }

        // Save recommendations to database
        console.log('[Parts API] Saving', parts.length, 'part recommendations and', supplierParts.length, 'supplier parts to database...')
        try {
            const { error: updateError } = await supabase
                .from('projects')
                .update({
                    part_recommendations: parts,
                    part_recommendations_generated_at: new Date().toISOString(),
                    supplier_parts_data: supplierParts, // Save real supplier data with images
                    supplier_parts_last_fetched_at: new Date().toISOString()
                })
                .eq('id', projectId)

            if (updateError) {
                console.error('[Parts API] Failed to save recommendations:', updateError)
            } else {
                console.log('[Parts API] ✅ Part recommendations and supplier data saved successfully')
            }
        } catch (saveError) {
            console.error('[Parts API] Error saving recommendations:', saveError)
        }

        return Response.json({
            parts,
            supplierParts,
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
