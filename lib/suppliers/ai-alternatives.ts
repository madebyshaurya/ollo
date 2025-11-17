/**
 * AI-Powered Alternative Component Finder
 *
 * Uses AI to suggest alternative components based on specifications,
 * project requirements, and availability
 */

import { generateObject } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

const AlternativeComponentsSchema = z.object({
  alternatives: z.array(z.object({
    name: z.string().describe('Component name or part number'),
    type: z.string().describe('Component type (e.g., resistor, capacitor, microcontroller)'),
    description: z.string().describe('Why this is a good alternative'),
    keyFeatures: z.array(z.string()).describe('Key features or specifications'),
    estimatedPrice: z.string().describe('Estimated price range in the target currency'),
    compatibility: z.string().describe('Compatibility notes with the original part'),
    searchTerms: z.array(z.string()).describe('Search terms to find this part on supplier websites')
  }))
})

export type AlternativeComponent = z.infer<typeof AlternativeComponentsSchema>['alternatives'][number]

export interface FindAlternativesParams {
  originalPart: {
    name: string
    type: string
    description?: string
    specifications?: Record<string, string>
  }
  projectContext: string
  targetCurrency: string
  maxAlternatives?: number
}

/**
 * Find alternative components using AI
 */
export async function findAlternativeComponents(
  params: FindAlternativesParams
): Promise<AlternativeComponent[]> {
  const {
    originalPart,
    projectContext,
    targetCurrency,
    maxAlternatives = 5
  } = params

  try {
    console.log(`[AI Alternatives] Finding alternatives for "${originalPart.name}"...`)

    const prompt = `Find ${maxAlternatives} alternative components for this electronics part.

Original Part:
- Name: ${originalPart.name}
- Type: ${originalPart.type}
- Description: ${originalPart.description || 'N/A'}
${originalPart.specifications ? `- Specifications: ${JSON.stringify(originalPart.specifications)}` : ''}

Project Context:
${projectContext}

Target Currency: ${targetCurrency}

Find alternatives that:
1. Are functionally compatible with the original part
2. Are commonly available from electronics suppliers
3. May offer better value, easier sourcing, or improved features
4. Are suitable for the project requirements
5. Include both exact replacements and compatible alternatives

For each alternative, provide:
- Specific part name or common part number
- Component type
- Why it's a good alternative (price, availability, features, etc.)
- Key features and specifications
- Estimated price range in ${targetCurrency}
- Compatibility notes (pin-compatible, drop-in replacement, requires code changes, etc.)
- Search terms that would help find this part on supplier websites

Focus on practical, commonly available parts from reputable manufacturers.`

    const result = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: AlternativeComponentsSchema,
      prompt
    })

    console.log(`[AI Alternatives] Found ${result.object.alternatives.length} alternatives`)
    return result.object.alternatives
  } catch (error) {
    console.error('[AI Alternatives] Error finding alternatives:', error)
    return []
  }
}

/**
 * Generate optimized search queries for finding a component
 */
export async function generateSearchQueries(
  componentName: string,
  componentType: string
): Promise<string[]> {
  const queries = [
    componentName, // Exact name
    componentName.replace(/[-_]/g, ' '), // Name with spaces
    `${componentType} ${componentName}`, // Type + name
    componentType // Just type as fallback
  ]

  // Remove duplicates
  return [...new Set(queries)]
}

/**
 * Compare two components and determine if they're compatible
 */
export async function checkCompatibility(
  originalPart: {
    name: string
    type: string
    specifications?: Record<string, string>
  },
  alternativePart: {
    name: string
    type: string
    specifications?: Record<string, string>
  }
): Promise<{
  compatible: boolean
  confidence: number
  notes: string
}> {
  try {
    const CompatibilitySchema = z.object({
      compatible: z.boolean().describe('Whether the parts are compatible'),
      confidence: z.number().min(0).max(100).describe('Confidence percentage (0-100)'),
      notes: z.string().describe('Compatibility notes and any caveats')
    })

    const prompt = `Compare these two electronic components and determine if they're compatible.

Original Part:
- Name: ${originalPart.name}
- Type: ${originalPart.type}
${originalPart.specifications ? `- Specs: ${JSON.stringify(originalPart.specifications)}` : ''}

Alternative Part:
- Name: ${alternativePart.name}
- Type: ${alternativePart.type}
${alternativePart.specifications ? `- Specs: ${JSON.stringify(alternativePart.specifications)}` : ''}

Determine:
1. Are they compatible? (true/false)
2. Your confidence level (0-100%)
3. Important compatibility notes (pin compatibility, voltage, current ratings, etc.)

Consider:
- Electrical specifications (voltage, current, power)
- Physical compatibility (package type, pin count)
- Functional equivalence
- Common substitution practices in electronics`

    const result = await generateObject({
      model: openai('gpt-4o-mini'),
      schema: CompatibilitySchema,
      prompt
    })

    return result.object
  } catch (error) {
    console.error('[AI Alternatives] Error checking compatibility:', error)
    return {
      compatible: false,
      confidence: 0,
      notes: 'Error checking compatibility'
    }
  }
}
