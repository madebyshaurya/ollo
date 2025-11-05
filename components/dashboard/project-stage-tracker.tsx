"use client"

import { useState, useTransition } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"

import { PROJECT_WORKFLOW, ProjectStage, ProjectStageId, getStageIndex } from "@/lib/workflows"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ProjectStageTrackerProps {
  projectId: string
  projectType: "breadboard" | "pcb" | "custom"
  currentStage: ProjectStageId | null
  status: "planning" | "in-progress" | "completed" | "paused"
  onStageChange: (nextStage: ProjectStageId | null) => void
}

export function ProjectStageTracker({ projectId, projectType, currentStage, status, onStageChange }: ProjectStageTrackerProps) {
  const stages = PROJECT_WORKFLOW[projectType]
  const baseIndex = currentStage ? getStageIndex(projectType, currentStage) : 0
  const isCompleted = status === "completed"
  const currentIndex = isCompleted ? stages.length : baseIndex
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isStageUnlocked = (index: number) => {
    if (status === "completed") return true
    return index <= currentIndex
  }

  const handleAdvance = () => {
    if (isCompleted) return
    startTransition(async () => {
      try {
        setError(null)
        const response = await fetch(`/api/projects/${projectId}/stage`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ projectType, currentStage }),
        })

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          throw new Error(payload.error || "Unable to advance stage")
        }

        const payload = (await response.json()) as { nextStage: ProjectStageId | null }
        onStageChange(payload.nextStage ?? null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to advance stage")
      }
    })
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-editorial-new font-light text-foreground sm:text-3xl">
            Build progression
          </h2>
          <p className="text-sm text-muted-foreground">
            Follow the staged workflow tailored for your project type. Complete a step to unlock the next.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 rounded-lg border-border/70 bg-background/60 px-3 text-sm"
          disabled={isPending || currentIndex >= stages.length}
          onClick={handleAdvance}
        >
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
          {currentIndex >= stages.length ? "All stages complete" : "Mark stage complete"}
        </Button>
      </header>

      {error && (
        <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <ol className="space-y-4">
        {stages.map((stage, index) => {
          if (!isStageUnlocked(index)) {
            return null
          }
          const state = getStageState(index, currentIndex)
          return (
            <li
              key={stage.id}
              className={cn(
                "rounded-2xl border px-4 py-4 sm:px-6 sm:py-5",
                state === "done" && "border-emerald-400/60 bg-emerald-400/10",
                state === "active" && "border-border/80 bg-muted/30 shadow-sm",
                state === "upcoming" && "border-border/60 bg-muted/20 opacity-80"
              )}
            >
              <StageHeader stage={stage} index={index} state={state} />
              <StageBody stage={stage} state={state} />
            </li>
          )
        })}
        {currentIndex >= stages.length && (
          <li className="rounded-2xl border border-emerald-500/60 bg-emerald-500/10 px-4 py-5 text-sm text-emerald-700 dark:text-emerald-200 sm:px-6">
            ✅ Build workflow complete. Close out outstanding documentation or move into production as needed.
          </li>
        )}
      </ol>
    </section>
  )
}

type StageState = "done" | "active" | "upcoming"

function getStageState(index: number, currentIndex: number): StageState {
  if (index < currentIndex) return "done"
  if (index === currentIndex) return "active"
  return "upcoming"
}

function StageHeader({ stage, index, state }: { stage: ProjectStage; index: number; state: StageState }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Stage {index + 1}
          </span>
          {state === "done" && <span className="text-xs text-emerald-600 dark:text-emerald-300">Completed</span>}
          {state === "active" && <span className="text-xs text-indigo-600 dark:text-indigo-300">In progress</span>}
        </div>
        <h3 className="text-lg font-semibold text-foreground sm:text-xl">{stage.title}</h3>
      </div>
    </div>
  )
}

function StageBody({ stage, state }: { stage: ProjectStage; state: StageState }) {
  return (
    <div className="mt-3 space-y-4">
      <p className={cn("text-sm leading-relaxed", state === "upcoming" ? "text-muted-foreground" : "text-foreground")}> 
        {stage.description}
      </p>
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Key tasks</p>
        <ul className="space-y-2">
          {stage.tasks.map((task) => (
            <li key={task} className="rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-sm text-foreground">
              {task}
            </li>
          ))}
        </ul>
      </div>
      {stage.suggestedArtifacts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Suggested artifacts</p>
          <div className="flex flex-wrap gap-2">
            {stage.suggestedArtifacts.map((artifact) => (
              <span
                key={artifact}
                className="inline-flex items-center rounded-full border border-border/50 bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground"
              >
                {artifact}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
