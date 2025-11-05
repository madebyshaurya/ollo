import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

type ProjectStatus = "planning" | "in-progress" | "completed" | "paused"

interface ProjectMetadataCardProps {
  project: {
    type: "breadboard" | "pcb" | "custom"
    status: ProjectStatus
    complexity: number
    budget: number | null
    timeline?: string | null
    microcontroller?: string | null
    microcontroller_other?: string | null
    purpose?: string | null
    target_audience?: string | null
    created_at: string
    updated_at: string
  }
}

const TYPE_LABELS: Record<ProjectMetadataCardProps["project"]["type"], string> = {
  breadboard: "Breadboard prototype",
  pcb: "PCB design",
  custom: "Custom build",
}

const STATUS_COLORS: Record<ProjectStatus, string> = {
  planning: "bg-amber-400/90",
  "in-progress": "bg-blue-500/90",
  completed: "bg-emerald-500/90",
  paused: "bg-orange-500/90",
}

function formatCurrency(value: number | null) {
  if (value == null || Number.isNaN(value)) {
    return "Not set"
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `$${value}`
  }
}

function formatDate(value: string) {
  const date = new Date(value)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function ComplexityIndicator({ complexity }: { complexity: number }) {
  const normalized = Math.min(Math.max(Math.round(complexity ?? 0), 1), 5)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <span
            key={index}
            aria-hidden
            className={cn(
              "h-2 flex-1 rounded-full bg-muted",
              index < normalized && "bg-primary"
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Level {normalized} &mdash; {complexityDescriptor(normalized)}
      </p>
    </div>
  )
}

function complexityDescriptor(level: number) {
  switch (level) {
    case 1:
      return "Simple bring-up"
    case 2:
      return "Foundational build"
    case 3:
      return "Intermediate integration"
    case 4:
      return "Advanced fabrication"
    case 5:
      return "Production-grade complexity"
    default:
      return "Undefined"
  }
}

export function ProjectMetadataCard({ project }: ProjectMetadataCardProps) {
  const microcontroller =
    project.microcontroller_other?.trim() ||
    project.microcontroller?.trim() ||
    "Not specified"

  const purpose = project.purpose?.trim()
  const audience = project.target_audience?.trim()
  const timeline = project.timeline?.trim() || "Define target schedule"

  return (
    <Card className="border-border/80 bg-card/80 shadow-sm backdrop-blur">
      <CardHeader className="space-y-1 border-b border-border/70 pb-4">
        <CardTitle className="font-editorial-new text-2xl font-light text-foreground">
          Project Profile
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Core parameters that guide planning, sourcing, and build cadence.
        </p>
      </CardHeader>

      <CardContent className="space-y-6 px-6 py-5">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-muted/40 px-3 py-2.5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Build phase
            </p>
            <p className="text-sm font-medium text-foreground">{TYPE_LABELS[project.type]}</p>
          </div>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white",
              STATUS_COLORS[project.status]
            )}
          >
            {project.status.replace("-", " ")}
          </span>
        </div>

        <div className="space-y-4">
          <section className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Target microcontroller
            </p>
            <p className="text-sm text-foreground">{microcontroller}</p>
          </section>

          <Separator />

          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Complexity
            </p>
            <ComplexityIndicator complexity={project.complexity ?? 1} />
          </section>

          <Separator />

          <section className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Budget target
            </p>
            <p className="text-sm text-foreground">{formatCurrency(project.budget ?? null)}</p>
          </section>

          <Separator />

          <section className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Timeline
            </p>
            <p className="text-sm text-foreground">{timeline}</p>
          </section>

          {purpose && (
            <>
              <Separator />
              <section className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Purpose
                </p>
                <p className="text-sm leading-relaxed text-foreground">{purpose}</p>
              </section>
            </>
          )}

          {audience && (
            <>
              <Separator />
              <section className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Target audience
                </p>
                <p className="text-sm leading-relaxed text-foreground">{audience}</p>
              </section>
            </>
          )}
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
          <div className="space-y-1">
            <p className="font-semibold uppercase tracking-wide">Created</p>
            <p className="text-sm text-foreground">{formatDate(project.created_at)}</p>
          </div>
          <div className="space-y-1">
            <p className="font-semibold uppercase tracking-wide">Last updated</p>
            <p className="text-sm text-foreground">{formatDate(project.updated_at)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
