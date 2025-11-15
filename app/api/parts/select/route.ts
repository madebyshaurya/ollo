import { createServerSupabaseClient } from '@/lib/supabase-server'

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

        // Fetch current project data
        const { data: project, error } = await supabase
            .from('projects')
            .select('part_selections')
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

        // Save to database
        const { error: updateError } = await supabase
            .from('projects')
            .update({ part_selections: currentSelections })
            .eq('id', projectId)

        if (updateError) {
            console.error('[Part Selection] Failed to save:', updateError)
            return Response.json({ error: 'Failed to save selection' }, { status: 500 })
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
