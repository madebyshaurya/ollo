import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getUserPreferences } from '@/lib/actions/user-preferences'
import { CURRENCIES } from '@/lib/utils/currencies'

interface PartRecommendation {
    name: string
    type: string
    description: string
    estimatedPrice: string
    reason: string
}

export async function POST(req: Request) {
    try {
        const { projectId, partIndex, rejectedPart } = await req.json()

        if (!projectId || partIndex === undefined) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 })
        }

        console.log('[Regenerate Part] Project:', projectId, '| Part Index:', partIndex)

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

        // Get user preferences for currency/country context
        let userCurrency = 'USD'
        let userCountry = 'United States'
        try {
            const preferences = await getUserPreferences()
            userCurrency = preferences.currency
            const currencyInfo = CURRENCIES.find(c => c.code === userCurrency)
            userCountry = currencyInfo?.country || 'United States'
            console.log('[Regenerate Part] User currency:', userCurrency, '| Country:', userCountry)
        } catch (prefError) {
            console.warn('[Regenerate Part] Could not fetch user preferences, using defaults:', prefError)
        }

        // Build context for AI
        const projectContext = `
Project Name: ${project.name}
Description: ${project.description}
Type: ${project.type}
Microcontroller: ${project.microcontroller || project.microcontroller_other || 'Not specified'}
Complexity: ${project.complexity}/10
Budget: $${project.budget || 'Not specified'}
User Location: ${userCountry}
Preferred Currency: ${userCurrency}
        `.trim()

        const rejectedPartInfo = rejectedPart ? `\n\nThe user REJECTED this part:\n- ${rejectedPart.name} (${rejectedPart.type})\n- Reason it was rejected: User wants an alternative\n\nPlease suggest a DIFFERENT part that serves a similar purpose but is distinct from the rejected option.` : ''

        const prompt = `Based on the following project details, recommend ONE alternative electronic part/component.

${projectContext}${rejectedPartInfo}

IMPORTANT INSTRUCTIONS:
- All prices MUST be in ${userCurrency} currency
- Recommend a part that is commonly available in ${userCountry}
- Consider local suppliers and distributors common in ${userCountry}
- For India: suggest parts from local suppliers like Robu.in, ElectronicWings
- For USA/Europe: suggest parts from Digi-Key, Mouser, SparkFun, Adafruit
- Price realistically for the local market
- Provide a DIFFERENT alternative than what was rejected

Provide ONE part with:
1. Part name (be specific with model numbers)
2. Type/category
3. Brief description (one sentence)
4. Estimated price in ${userCurrency}
5. Why it's recommended

Format your response as a single JSON object (not an array) containing: name, type, description, estimatedPrice, reason`

        console.log('[Regenerate Part] Calling AI for new recommendation...')
        const result = await generateText({
            model: openai('gpt-4o-mini'),
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
            temperature: 0.8 // Higher temperature for more variety
        })

        // Parse the AI response
        let newPart: PartRecommendation
        try {
            // Try to extract JSON from the response
            const jsonMatch = result.text.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
                newPart = JSON.parse(jsonMatch[0])
            } else {
                newPart = JSON.parse(result.text)
            }
        } catch (parseError) {
            console.error('[Regenerate Part] Failed to parse AI response:', parseError)
            return Response.json({
                error: 'Failed to parse AI response',
                rawResponse: result.text
            }, { status: 500 })
        }

        // Update the part recommendations in the database
        const currentRecommendations = project.part_recommendations || []
        if (Array.isArray(currentRecommendations) && partIndex < currentRecommendations.length) {
            currentRecommendations[partIndex] = newPart

            const { error: updateError } = await supabase
                .from('projects')
                .update({
                    part_recommendations: currentRecommendations,
                    part_recommendations_generated_at: new Date().toISOString()
                })
                .eq('id', projectId)

            if (updateError) {
                console.error('[Regenerate Part] Failed to update database:', updateError)
            } else {
                console.log('[Regenerate Part] ✅ Updated part recommendation in database')
            }
        }

        console.log('[Regenerate Part] ✅ Generated new part:', newPart.name)

        return Response.json({
            success: true,
            part: newPart,
            partIndex
        })
    } catch (err: unknown) {
        console.error('[Regenerate Part] Error:', err)
        const message = err instanceof Error ? err.message : 'Unknown error'
        return Response.json({ error: message }, { status: 500 })
    }
}
