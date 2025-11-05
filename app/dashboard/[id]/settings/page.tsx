import { ProjectSettingsShell, ProjectSettingsData } from "@/components/dashboard/project-settings-shell"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { toProjectStageId } from "@/lib/workflows"

interface ProjectRow {
  id: string
  user_id: string
  name: string
  description: string
  summary?: string | null
  emoji?: string | null
  type: "breadboard" | "pcb" | "custom"
  status: "planning" | "in-progress" | "completed" | "paused"
  complexity: number
  budget: number | null
  timeline?: string | null
  microcontroller?: string | null
  microcontroller_other?: string | null
  purpose?: string | null
  target_audience?: string | null
  keywords?: string[] | string | null
  created_at: string
  updated_at: string
  workflow_stage?: string | null
}

async function fetchProject(projectId: string): Promise<ProjectRow> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single()

  if (error || !data) {
    throw new Error("Project not found")
  }

  return data as ProjectRow
}

export default async function ProjectSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = await fetchProject(id)

  const keywords = Array.isArray(project.keywords)
    ? project.keywords
    : typeof project.keywords === "string"
      ? project.keywords.split(/[;,]/).map((keyword) => keyword.trim()).filter(Boolean)
      : null

  const settingsData: ProjectSettingsData = {
    id: project.id,
    name: project.name,
    emoji: project.emoji ?? null,
    description: project.description,
    summary: project.summary ?? project.description,
    status: project.status,
    type: project.type,
    complexity: project.complexity,
    budget: project.budget,
    timeline: project.timeline ?? null,
    microcontroller: project.microcontroller ?? null,
    microcontroller_other: project.microcontroller_other ?? null,
    purpose: project.purpose ?? null,
    target_audience: project.target_audience ?? null,
    keywords,
    created_at: project.created_at,
    updated_at: project.updated_at,
    workflow_stage: toProjectStageId(project.type, project.workflow_stage),
  }

  return <ProjectSettingsShell project={settingsData} />
}
