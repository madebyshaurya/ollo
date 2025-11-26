import { streamText } from 'ai'
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
        const { projectId, forceRegenerate } = await req.json()

        if (!projectId) {
            return Response.json({ error: 'Project ID is required' }, { status: 400 })
        }

        // Fetch project details including part selections
        const supabase = await createServerSupabaseClient()
        const { data: project, error } = await supabase
            .from('projects')
            .select('*, part_selections')
            .eq('id', projectId)
            .single()

        if (error || !project) {
            return Response.json({ error: 'Project not found' }, { status: 404 })
        }

        // Check if we have saved recommendations and don't need to regenerate
        if (!forceRegenerate && project.part_recommendations && Array.isArray(project.part_recommendations)) {
            console.log('[Parts API] Returning cached recommendations from database')

            // Also fetch part_selections to show which parts are already selected
            const partSelections = project.part_selections || {}

            return Response.json({
                parts: project.part_recommendations,
                projectContext: {
                    name: project.name,
                    type: project.type,
                    budget: project.budget
                },
                selections: partSelections,
                cached: true,
                generatedAt: project.part_recommendations_generated_at
            })
        }

        console.log('[Parts API] Generating new part recommendations with streaming...')

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

        // Create a streaming response
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Send initial status
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: 'status',
                        message: 'Analyzing your project requirements...'
                    })}\n\n`))

                    // Start AI streaming
                    const result = streamText({
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

                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: 'status',
                        message: 'Searching for compatible parts...'
                    })}\n\n`))

                    let fullText = ''

                    // Stream the AI response
                    for await (const chunk of result.textStream) {
                        fullText += chunk
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                            type: 'progress',
                            message: 'Generating recommendations...',
                            chunk
                        })}\n\n`))
                    }

                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: 'status',
                        message: 'Processing AI response...'
                    })}\n\n`))

                    // Parse the complete response
                    let parts: PartRecommendation[] = []
                    try {
                        const jsonMatch = fullText.match(/\[[\s\S]*\]/)
                        if (jsonMatch) {
                            parts = JSON.parse(jsonMatch[0])
                        } else {
                            parts = JSON.parse(fullText)
                        }
                    } catch (parseError) {
                        console.error('[Parts API] Failed to parse AI response:', parseError)
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                            type: 'error',
                            message: 'Failed to parse AI response'
                        })}\n\n`))
                        controller.close()
                        return
                    }

                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: 'status',
                        message: 'Saving recommendations...'
                    })}\n\n`))

                    // Save to database
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

                    // Send final data
                    const partSelections = project.part_selections || {}
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: 'complete',
                        parts,
                        projectContext: {
                            name: project.name,
                            type: project.type,
                            budget: project.budget
                        },
                        selections: partSelections
                    })}\n\n`))

                    controller.close()
                } catch (err) {
                    console.error('[Parts API] Streaming error:', err)
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        type: 'error',
                        message: err instanceof Error ? err.message : 'Unknown error'
                    })}\n\n`))
                    controller.close()
                }
            }
        })

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        })
    } catch (err: unknown) {
        console.error('Parts recommendation API error:', err)
        const message = err instanceof Error ? err.message : 'Unknown error'
        return Response.json({ error: message }, { status: 500 })
    }
}
