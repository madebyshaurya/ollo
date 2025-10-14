"use server"

import { createServerSupabaseClient, getCurrentUserId } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"

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

    const supabase = await createServerSupabaseClient()

    // Prepare the project data
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
      status: "planning" as const
    }

    const { data: project, error } = await supabase
      .from("projects")
      .insert(projectData)
      .select()
      .single()

    if (error) {
      console.error("Error creating project:", error)
      throw new Error("Failed to create project")
    }

    // Best-effort: generate and persist AI metadata (summary, emoji)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      const baseInput = `${project.name}: ${project.description}`

      const [summaryRes, emojiRes, keywordsRes] = await Promise.all([
        fetch(`${baseUrl}/api/ai`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preset: "concise_summary", input: baseInput, temperature: 0.2, max_tokens: 120 })
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

      if (aiSummary || aiEmoji || aiKeywords) {
        // Persist if columns exist; ignore if they don't
        await supabase
          .from("projects")
          .update({ summary: aiSummary, emoji: aiEmoji, keywords: aiKeywords })
          .eq("id", project.id)
      }
    } catch (e) {
      // Non-fatal; continue
      console.warn("AI metadata generation failed:", e)
    }

    // Revalidate the dashboard to show the new project
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
      .eq("user_id", userId) // Ensure user can only update their own projects

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

export async function updateProject(projectId: string, data: { name?: string; description?: string; summary?: string | null }) {
  try {
    const userId = await getCurrentUserId()
    
    if (!userId) {
      return { success: false, error: "User not authenticated" }
    }

    const supabase = await createServerSupabaseClient()

    const { error } = await supabase
      .from("projects")
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq("id", projectId)
      .eq("user_id", userId) // Ensure user can only update their own projects

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
      .eq("user_id", userId) // Ensure user can only delete their own projects

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
