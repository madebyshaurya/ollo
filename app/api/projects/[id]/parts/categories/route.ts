import { NextResponse } from "next/server"

import { createServerSupabaseClient, getCurrentUserId } from "@/lib/supabase-server"
import {
  getProjectPartCategories,
  setProjectPartCategories,
  type ProjectPartCategoryRecord,
} from "@/lib/actions/projects"
import { generatePartCategories } from "@/lib/services/part-categories"

async function fetchProjectContext(projectId: string) {
  const userId = await getCurrentUserId()

  if (!userId) {
    return { error: "User not authenticated", status: 401 as const }
  }

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, user_id, type, summary, description, complexity, budget"
    )
    .eq("id", projectId)
    .eq("user_id", userId)
    .single()

  if (error || !data) {
    return { error: "Project not found", status: 404 as const }
  }

  return {
    project: {
      id: data.id as string,
      type: data.type as "breadboard" | "pcb" | "custom",
      summary: (data.summary as string | null) ?? (data.description as string),
      description: data.description as string,
      complexity: Number(data.complexity) || 1,
      budget: (data.budget as number | null) ?? null,
    },
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const result = await getProjectPartCategories(id)
  if (!result.success) {
    const status = result.error === "User not authenticated" ? 401 : 400
    return NextResponse.json({ error: result.error }, { status })
  }

  return NextResponse.json({
    categories: result.categories ?? [],
    generatedAt: result.generatedAt ?? null,
  })
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  const { currency = "USD" } = (await request.json().catch(() => ({}))) as { currency?: string }

  const contextResult = await fetchProjectContext(id)
  if ("error" in contextResult) {
    return NextResponse.json({ error: contextResult.error }, { status: contextResult.status })
  }

  const { project } = contextResult

  const categories = await generatePartCategories({
    projectId: project.id,
    projectType: project.type,
    summary: project.summary,
    description: project.description,
    complexity: project.complexity,
    budget: project.budget,
    currency,
  })

  const saveResult = await setProjectPartCategories(id, categories, new Date().toISOString())
  if (!saveResult.success) {
    return NextResponse.json({ error: saveResult.error || "Failed to store categories" }, { status: 400 })
  }

  return NextResponse.json({ categories })
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const payload = (await request.json().catch(() => null)) as {
    categories?: ProjectPartCategoryRecord[]
  } | null

  if (!payload?.categories || !Array.isArray(payload.categories)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const { id } = await context.params
  const result = await setProjectPartCategories(id, payload.categories, new Date().toISOString())

  if (!result.success) {
    const status = result.error === "User not authenticated" ? 401 : 400
    return NextResponse.json({ error: result.error }, { status })
  }

  return NextResponse.json({ success: true })
}
