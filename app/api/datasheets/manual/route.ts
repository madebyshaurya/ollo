import { getCurrentUserId } from '@/lib/supabase-server'
import { getProjectPartCategories, setProjectPartCategories, ProjectPartCategoryRecord } from '@/lib/actions/projects'

export async function POST(req: Request) {
  try {
    const userId = await getCurrentUserId()

    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, categoryId, suggestionId, datasheetUrl } = await req.json()

    if (!projectId || !categoryId || !suggestionId || !datasheetUrl) {
      return Response.json(
        { error: 'Missing required fields: projectId, categoryId, suggestionId, datasheetUrl' },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      new URL(datasheetUrl)
    } catch {
      return Response.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    console.log('[Manual Datasheet] Adding manual URL:', { projectId, categoryId, suggestionId, datasheetUrl })

    // Get current part categories
    const { categories } = await getProjectPartCategories(projectId)

    if (!categories || categories.length === 0) {
      return Response.json(
        { error: 'No part categories found for this project' },
        { status: 404 }
      )
    }

    // Update the specific suggestion with manual datasheet URL
    const updatedCategories = categories.map((category: ProjectPartCategoryRecord) => {
      if (category.id !== categoryId) return category

      const updatedSuggestions = category.suggestions.map(suggestion => {
        if (suggestion.id !== suggestionId) return suggestion

        return {
          ...suggestion,
          datasheetUrl: datasheetUrl,
          datasheetSource: 'manual' as const
        }
      })

      return {
        ...category,
        suggestions: updatedSuggestions
      }
    })

    // Save updated categories back to database
    const saveResult = await setProjectPartCategories(
      projectId,
      updatedCategories,
      new Date().toISOString()
    )

    if (!saveResult.success) {
      return Response.json(
        { error: 'Failed to update part categories' },
        { status: 500 }
      )
    }

    console.log('[Manual Datasheet] ✅ Successfully added manual datasheet URL')

    return Response.json({
      success: true,
      datasheetUrl: datasheetUrl,
      source: 'manual'
    })
  } catch (error) {
    console.error('[Manual Datasheet] Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
