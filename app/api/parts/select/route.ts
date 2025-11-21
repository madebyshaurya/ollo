import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { ProjectPartCategoryRecord, ProjectPartSuggestionRecord } from '@/lib/actions/projects'

interface PartRecommendation {
    name: string
    type: string
    description: string
    estimatedPrice: string
    reason: string
}

export async function POST(req: Request) {
    try {
        const { projectId, partIndex, action } = await req.json()

        if (!projectId || partIndex === undefined || !action) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 })
        }

        if (!['accept', 'reject', 'remove'].includes(action)) {
            return Response.json({ error: 'Invalid action' }, { status: 400 })
        }

        console.log('[Part Selection] Project:', projectId, '| Part Index:', partIndex, '| Action:', action)

        const supabase = await createServerSupabaseClient()

        // Fetch current project data including recommendations and categories
        const { data: project, error } = await supabase
            .from('projects')
            .select('part_selections, part_recommendations, part_categories')
            .eq('id', projectId)
            .single()

        if (error || !project) {
            return Response.json({ error: 'Project not found' }, { status: 404 })
        }

        // Update selections
        const currentSelections = project.part_selections || {}

        if (action === 'remove') {
            // Remove the selection
            delete currentSelections[partIndex]
        } else {
            currentSelections[partIndex] = action
        }

        // If accepting a part, also add it to part_categories for the documentation tab
        if (action === 'accept' && project.part_recommendations) {
            const acceptedPart: PartRecommendation = project.part_recommendations[partIndex]

            if (acceptedPart) {
                console.log('[Part Selection] Adding to part_categories:', acceptedPart.name)

                // Get or create part_categories
                let categories: ProjectPartCategoryRecord[] = (project.part_categories as ProjectPartCategoryRecord[]) || []

                // Find or create "Selected Parts" category
                let selectedCategory = categories.find(cat => cat.name === 'Selected Parts')

                if (!selectedCategory) {
                    selectedCategory = {
                        id: crypto.randomUUID(),
                        name: 'Selected Parts',
                        description: 'Parts you have selected for this project',
                        aiGenerated: false,
                        searchTerms: [],
                        suggestions: [],
                        userItems: [],
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }
                    categories.push(selectedCategory)
                }

                // Convert part recommendation to part suggestion format
                const partSuggestion: ProjectPartSuggestionRecord = {
                    id: crypto.randomUUID(),
                    title: acceptedPart.name,
                    description: acceptedPart.description,
                    supplier: 'Various',
                    supplierUrl: '',
                    manufacturer: null,
                    mpn: null,
                    price: null,
                    currency: null,
                    moq: null,
                    stock: null,
                    leadTime: null,
                    owned: false,
                    status: 'accepted',
                    confidence: 'sample',
                    source: 'recommendation',
                    datasheetUrl: null,
                    datasheetSource: null,
                    appNotes: [],
                    tutorials: []
                }

                // Check if part already exists in this category
                const existingIndex = selectedCategory.suggestions.findIndex(
                    s => s.title === acceptedPart.name
                )

                if (existingIndex === -1) {
                    selectedCategory.suggestions.push(partSuggestion)
                    selectedCategory.updatedAt = new Date().toISOString()
                }

                // Update categories array
                categories = categories.map(cat =>
                    cat.id === selectedCategory!.id ? selectedCategory! : cat
                )

                // Save updated categories
                const { error: categoryError } = await supabase
                    .from('projects')
                    .update({
                        part_selections: currentSelections,
                        part_categories: categories,
                        parts_last_generated_at: new Date().toISOString()
                    })
                    .eq('id', projectId)

                if (categoryError) {
                    console.error('[Part Selection] Failed to save categories:', categoryError)
                }
            }
        } else if (action === 'remove') {
            // Also remove from part_categories if it exists
            let categories: ProjectPartCategoryRecord[] = (project.part_categories as ProjectPartCategoryRecord[]) || []
            const selectedCategory = categories.find(cat => cat.name === 'Selected Parts')

            if (selectedCategory && project.part_recommendations) {
                const removedPart: PartRecommendation = project.part_recommendations[partIndex]

                if (removedPart) {
                    selectedCategory.suggestions = selectedCategory.suggestions.filter(
                        s => s.title !== removedPart.name
                    )
                    selectedCategory.updatedAt = new Date().toISOString()

                    categories = categories.map(cat =>
                        cat.id === selectedCategory.id ? selectedCategory : cat
                    )

                    await supabase
                        .from('projects')
                        .update({
                            part_selections: currentSelections,
                            part_categories: categories,
                            parts_last_generated_at: new Date().toISOString()
                        })
                        .eq('id', projectId)
                }
            }
        } else {
            // Just update selections for 'reject' action
            const { error: updateError } = await supabase
                .from('projects')
                .update({ part_selections: currentSelections })
                .eq('id', projectId)

            if (updateError) {
                console.error('[Part Selection] Failed to save:', updateError)
                return Response.json({ error: 'Failed to save selection' }, { status: 500 })
            }
        }

        console.log('[Part Selection] ✅ Saved:', action, 'for part', partIndex)

        return Response.json({
            success: true,
            selections: currentSelections
        })
    } catch (err: unknown) {
        console.error('[Part Selection] Error:', err)
        const message = err instanceof Error ? err.message : 'Unknown error'
        return Response.json({ error: message }, { status: 500 })
    }
}
