import { currentUser } from "@clerk/nextjs/server"
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
  summary?: string | null
  emoji?: string | null
  keywords?: string | null
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

async function generateSummary(input: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preset: "concise_summary", input }),
    })
    if (!res.ok) return null
    const json = await res.json()
    return json.summary as string | null
  } catch {
    return null
  }
}

async function generateEmoji(input: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/ai`, {
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
  const user = await currentUser()
  const project = await fetchProject(id)

  const ownerName = user?.firstName || user?.username || "You"
  const baseInput = `${project.name}: ${project.description}`
  const [summary, emoji] = await Promise.all([
    project.summary
      ? Promise.resolve(project.summary as string)
      : generateSummary(baseInput),
    project.emoji
      ? Promise.resolve(project.emoji as string)
      : generateEmoji(baseInput),
  ])

  const keywords = project.keywords
    ? String(project.keywords)
      .split(",")
      .map((keyword) => keyword.trim())
      .filter(Boolean)
    : []

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 text-foreground">
      <section id="overview" className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="text-3xl sm:text-4xl">{emoji || "🔧"}</div>
          <div>
            <h1 className="text-2xl font-editorial-new italic sm:text-3xl">
              {project.name}
            </h1>
            <p className="font-inter text-sm text-muted-foreground sm:text-base">
              {project.description}
            </p>
          </div>
        </div>
      </section>

      <section
        id="summary"
        className="space-y-4 rounded-xl border border-border bg-card/60 p-5 backdrop-blur"
      >
        <div className="text-sm font-inter text-muted-foreground">
          Project Summary
        </div>
        <div className="font-inter text-lg leading-relaxed">
          <span className="font-editorial-new italic">{ownerName}</span>
          <span> is building </span>
          <span className="font-editorial-new italic">
            {project.type === "pcb"
              ? "a PCB"
              : project.type === "breadboard"
                ? "a prototype"
                : "a custom device"}
          </span>
          <span> — {summary || "summary coming soon..."}</span>
        </div>
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword) => (
              <span
                key={keyword}
                className="rounded-md border border-border bg-background/60 px-2 py-1 text-sm font-editorial-new italic"
              >
                {keyword}
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
