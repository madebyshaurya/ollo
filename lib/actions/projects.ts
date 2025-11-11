"use server"

import { createServerSupabaseClient, getCurrentUserId } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import { getInitialStage, getNextStage, ProjectStageId } from "@/lib/workflows"

export interface ProjectPartSuggestionRecord {
  id: string
  title: string
  description: string
  supplier: string
  supplierUrl: string
  image?: string | null
  manufacturer?: string | null
  mpn?: string | null
  price?: number | null
  currency?: string | null
  moq?: number | null
  stock?: number | null
  leadTime?: string | null
  owned: boolean
  status: "pending" | "accepted" | "dismissed"
  confidence: "sample" | "live"
  source: string
}

export interface ProjectPartUserItemRecord {
  id: string
  title: string
  done: boolean
  createdAt: string
}

export interface ProjectPartCategoryRecord {
  id: string
  name: string
  description: string
  aiGenerated: boolean
  searchTerms: string[]
  suggestions: ProjectPartSuggestionRecord[]
  userItems: ProjectPartUserItemRecord[]
  createdAt: string
  updatedAt: string
}

export interface CreateProjectData {
  name: string
  description: string
  type: "breadboard" | "pcb" | "custom"
  microcontroller?: string
  microcontrollerOther?: string
  complexity: number
  budget: number
  purpose?: string
  targetAudience?: string
  timeline?: string
  customDescription?: string
}

export async function createProject(data: CreateProjectData) {
  try {
    const userId = await getCurrentUserId()

    if (!userId) {
      throw new Error("User not authenticated")
    }

    const supabaseClient = await createServerSupabaseClient()

    const projectData = {
      user_id: userId,
      name: data.name,
      description: data.description,
      type: data.type,
      microcontroller: data.microcontroller || null,
      microcontroller_other: data.microcontrollerOther || null,
      complexity: data.complexity,
      budget: data.budget,
      purpose: data.purpose || null,
      target_audience: data.targetAudience || null,
      timeline: data.timeline || null,
      custom_description: data.customDescription || null,
      status: "in-progress" as const,
      part_categories: null,
      parts_last_generated_at: null
    }

    const { data: project, error } = await supabaseClient
      .from("projects")
      .insert(projectData)
      .select()
      .single()

    if (error) {
      console.error("Error creating project:", error)
      throw new Error("Failed to create project")
    }

    const initialStage = getInitialStage(data.type)

    try {
      await supabaseClient
        .from("projects")
        .update({ workflow_stage: initialStage })
        .eq("id", project.id)
    } catch (stageError) {
      console.warn("Unable to set initial workflow stage:", stageError)
    }

    project.status = "in-progress"
      ; (project as { workflow_stage?: ProjectStageId }).workflow_stage = initialStage

    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
      const baseInput = `${project.name}: ${project.description}`

      const { data: userData } = await supabaseClient.auth.getUser()
      const userName = userData?.user?.user_metadata?.first_name ||
        userData?.user?.user_metadata?.full_name?.split(' ')[0] ||
        "You"

      const [summaryRes, emojiRes, keywordsRes] = await Promise.all([
        fetch(`${baseUrl}/api/ai`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            preset: "complete_summary",
            input: baseInput,
            userName: userName,
            temperature: 0.3,
            max_tokens: 150
          })
        }).catch(() => null),
        fetch(`${baseUrl}/api/ai`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preset: "emoji_only", input: baseInput, temperature: 0.1, max_tokens: 8 })
        }).catch(() => null),
        fetch(`${baseUrl}/api/ai`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preset: "keywords", input: baseInput, temperature: 0.1, max_tokens: 64 })
        }).catch(() => null)
      ])

      const summaryJson = summaryRes && summaryRes.ok ? await summaryRes.json().catch(() => ({})) : {}
      const emojiJson = emojiRes && emojiRes.ok ? await emojiRes.json().catch(() => ({})) : {}
      const keywordsJson = keywordsRes && keywordsRes.ok ? await keywordsRes.json().catch(() => ({})) : {}
      const aiSummary = summaryJson?.summary || null
      const aiEmoji = emojiJson?.emoji || null
      const aiKeywords = keywordsJson?.keywords || null

      const cleanSummaryText = (text: string | null) => {
        if (!text) return null
        return text
          .replace(/^\s*Summary\s+for[^:–-]*[:–-]\s*/i, "")
          .replace(/^\s*Summary\s+for[^,]*,\s*/i, "")
          .trim()
      }

      const cleanedSummary = cleanSummaryText(aiSummary)
      const summaryToUse = cleanedSummary || aiSummary

      if (summaryToUse || aiEmoji || aiKeywords) {
        await supabaseClient
          .from("projects")
          .update({
            summary: summaryToUse,
            description: summaryToUse ?? project.description,
            emoji: aiEmoji,
            keywords: aiKeywords
          })
          .eq("id", project.id)

        project.summary = summaryToUse ?? project.summary ?? null
        project.description = summaryToUse ?? project.description
        project.emoji = aiEmoji ?? project.emoji ?? null
          ; (project as { keywords?: string[] | null }).keywords = aiKeywords ?? null
      }
    } catch (e) {
      console.warn("AI metadata generation failed:", e)
    }

    revalidatePath("/dashboard")

    return { success: true, project }
  } catch (error) {
    console.error("Error in createProject:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function getUserProjects() {
  try {
    const userId = await getCurrentUserId()

    if (!userId) {
      return { success: false, error: "User not authenticated" }
    }

    const supabase = await createServerSupabaseClient()

    const { data: projects, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching projects:", error)
      return { success: false, error: "Failed to fetch projects" }
    }

    return { success: true, projects: projects || [] }
  } catch (error) {
    console.error("Error in getUserProjects:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function updateProjectStatus(projectId: string, status: "planning" | "in-progress" | "completed" | "paused") {
  try {
    const userId = await getCurrentUserId()

    if (!userId) {
      return { success: false, error: "User not authenticated" }
    }

    const supabase = await createServerSupabaseClient()

    const { error } = await supabase
      .from("projects")
      .update({ status })
      .eq("id", projectId)
      .eq("user_id", userId)

    if (error) {
      console.error("Error updating project status:", error)
      return { success: false, error: "Failed to update project status" }
    }

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Error in updateProjectStatus:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

type UpdateProjectData = {
  name?: string
  description?: string
  summary?: string | null
  type?: "breadboard" | "pcb" | "custom"
  microcontroller?: string | null
  microcontrollerOther?: string | null
  complexity?: number
  budget?: number | null
  purpose?: string | null
  targetAudience?: string | null
  timeline?: string | null
  keywords?: string[] | null
  emoji?: string | null
  workflowStage?: ProjectStageId | null
  partCategories?: ProjectPartCategoryRecord[] | null
  partsGeneratedAt?: string | null
}

export async function updateProject(projectId: string, data: UpdateProjectData) {
  try {
    const userId = await getCurrentUserId()

    if (!userId) {
      return { success: false, error: "User not authenticated" }
    }

    const supabase = await createServerSupabaseClient()

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (data.name !== undefined) {
      updatePayload.name = data.name
    }

    if (data.description !== undefined) {
      updatePayload.description = data.description
    }

    if (data.summary !== undefined) {
      updatePayload.summary = data.summary
    }

    if (data.type !== undefined) {
      updatePayload.type = data.type
    }

    if (data.microcontroller !== undefined) {
      updatePayload.microcontroller = data.microcontroller || null
    }

    if (data.microcontrollerOther !== undefined) {
      updatePayload.microcontroller_other = data.microcontrollerOther || null
    }

    if (data.complexity !== undefined) {
      updatePayload.complexity = data.complexity
    }

    if (data.budget !== undefined) {
      updatePayload.budget = data.budget
    }

    if (data.purpose !== undefined) {
      updatePayload.purpose = data.purpose || null
    }

    if (data.targetAudience !== undefined) {
      updatePayload.target_audience = data.targetAudience || null
    }

    if (data.timeline !== undefined) {
      updatePayload.timeline = data.timeline || null
    }

    if (data.keywords !== undefined) {
      updatePayload.keywords = data.keywords
    }

    if (data.emoji !== undefined) {
      updatePayload.emoji = data.emoji
    }

    if (data.workflowStage !== undefined) {
      updatePayload.workflow_stage = data.workflowStage
    }

    if (data.partCategories !== undefined) {
      updatePayload.part_categories = data.partCategories ?? null
    }

    if (data.partsGeneratedAt !== undefined) {
      updatePayload.parts_last_generated_at = data.partsGeneratedAt
    }

    const { error } = await supabase
      .from("projects")
      .update(updatePayload)
      .eq("id", projectId)
      .eq("user_id", userId)

    if (error) {
      console.error("Error updating project:", error)
      return { success: false, error: "Failed to update project" }
    }

    revalidatePath("/dashboard")
    revalidatePath(`/dashboard/${projectId}`)
    return { success: true }
  } catch (error) {
    console.error("Error in updateProject:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function advanceProjectWorkflowStage(
  projectId: string,
  projectType: "breadboard" | "pcb" | "custom",
  currentStage: ProjectStageId | null
) {
  try {
    const userId = await getCurrentUserId()

    if (!userId) {
      return { success: false, error: "User not authenticated" }
    }

    const supabase = await createServerSupabaseClient()

    const nextStage = getNextStage(projectType, currentStage)

    const updatePayload: Record<string, unknown> = {
      workflow_stage: nextStage,
      updated_at: new Date().toISOString(),
    }

    if (!nextStage) {
      updatePayload.status = "completed"
    } else {
      updatePayload.status = "in-progress"
    }

    const { error } = await supabase
      .from("projects")
      .update(updatePayload)
      .eq("id", projectId)
      .eq("user_id", userId)

    if (error) {
      console.error("Error advancing project stage:", error)
      return { success: false, error: "Failed to update stage" }
    }

    revalidatePath(`/dashboard/${projectId}`)
    revalidatePath(`/dashboard/${projectId}/settings`)
    revalidatePath("/dashboard")

    return { success: true, nextStage }
  } catch (error) {
    console.error("Error in advanceProjectWorkflowStage:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function getProjectPartCategories(projectId: string) {
  try {
    const userId = await getCurrentUserId()

    if (!userId) {
      return { success: false, error: "User not authenticated", categories: null as ProjectPartCategoryRecord[] | null }
    }

    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from("projects")
      .select("part_categories, parts_last_generated_at")
      .eq("id", projectId)
      .eq("user_id", userId)
      .single()

    if (error) {
      console.error("Error fetching part categories:", error)
      return { success: false, error: "Failed to fetch categories", categories: null as ProjectPartCategoryRecord[] | null }
    }

    const categories = (data?.part_categories as ProjectPartCategoryRecord[] | null) ?? null
    return { success: true, categories, generatedAt: data?.parts_last_generated_at as string | null }
  } catch (error) {
    console.error("Error in getProjectPartCategories:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error", categories: null as ProjectPartCategoryRecord[] | null }
  }
}

export async function setProjectPartCategories(
  projectId: string,
  categories: ProjectPartCategoryRecord[] | null,
  generatedAt: string | null
) {
  try {
    const userId = await getCurrentUserId()

    if (!userId) {
      return { success: false, error: "User not authenticated" }
    }

    const supabase = await createServerSupabaseClient()

    const { error } = await supabase
      .from("projects")
      .update({
        part_categories: categories,
        parts_last_generated_at: generatedAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId)
      .eq("user_id", userId)

    if (error) {
      console.error("Error updating part categories:", error)
      return { success: false, error: "Failed to update categories" }
    }

    revalidatePath(`/dashboard/${projectId}`)
    revalidatePath(`/dashboard/${projectId}/settings`)

    return { success: true }
  } catch (error) {
    console.error("Error in setProjectPartCategories:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function deleteProject(projectId: string) {
  try {
    const userId = await getCurrentUserId()

    if (!userId) {
      return { success: false, error: "User not authenticated" }
    }

    const supabase = await createServerSupabaseClient()

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId)
      .eq("user_id", userId)

    if (error) {
      console.error("Error deleting project:", error)
      return { success: false, error: "Failed to delete project" }
    }

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Error in deleteProject:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}
