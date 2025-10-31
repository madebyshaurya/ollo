import { createServerSupabaseClient } from "@/lib/supabase-server"

interface ProjectRow {
  id: string
  user_id: string
  name: string
  description: string
  type: "breadboard" | "pcb" | "custom"
  status: "planning" | "in-progress" | "completed" | "paused"
  created_at: string
  updated_at: string
  emoji?: string | null
}

async function fetchProject(id: string): Promise<ProjectRow> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !data) {
    throw new Error("Project not found")
  }

  return data as ProjectRow
}

async function generateEmoji(input: string) {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

    const res = await fetch(`${baseUrl}/api/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preset: "emoji_only", input }),
    })
    if (!res.ok) return null
    const json = await res.json()
    return json.emoji as string | null
  } catch {
    return null
  }
}


export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const project = await fetchProject(id)

  const baseInput = `${project.name}: ${project.description}`

  const emoji = project.emoji
    ? project.emoji as string
    : await generateEmoji(baseInput)

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 text-foreground">
      <section id="overview" className="space-y-4">
        <div className="flex flex-col items-center gap-3 text-center sm:gap-4">
          <div className="text-5xl sm:text-6xl">{emoji || "🔧"}</div>
          <h1 className="text-3xl font-editorial-new italic sm:text-4xl">
            {project.name}
          </h1>
          <p className="font-inter text-sm text-muted-foreground sm:max-w-xl sm:text-base">
            {project.description}
          </p>
        </div>
      </section>

    </div>
  )
}
