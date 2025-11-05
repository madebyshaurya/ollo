"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Settings2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ProjectStatusMenu } from "@/components/dashboard/project-status-menu"
import type { ProjectStageId } from "@/lib/workflows"

type ProjectStatus = "planning" | "in-progress" | "completed" | "paused"
type ProjectType = "breadboard" | "pcb" | "custom"

export interface ProjectDetailData {
  id: string
  name: string
  emoji: string | null
  description: string
  summary: string
  status: ProjectStatus
  type: ProjectType
  complexity: number
  budget: number | null
  timeline?: string | null
  microcontroller?: string | null
  microcontroller_other?: string | null
  purpose?: string | null
  target_audience?: string | null
  keywords?: string[] | null
  created_at: string
  updated_at: string
  workflow_stage: ProjectStageId | null
}

export function ProjectDetailShell({ project }: { project: ProjectDetailData }) {
  const [projectState, setProjectState] = useState(project)

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 text-foreground sm:gap-8">
      <header className="flex flex-col gap-5 rounded-2xl border border-border/60 bg-background/80 px-5 py-4 shadow-lg shadow-black/5 backdrop-blur-sm sm:px-6 sm:py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/70 bg-muted/40 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Back to projects"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="inline-flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-3 py-2">
              <span className="text-3xl sm:text-4xl" aria-hidden>
                {projectState.emoji || "🔧"}
              </span>
              <div>
                <h1 className="text-xl font-editorial-new font-light tracking-tight sm:text-2xl">
                  {projectState.name}
                </h1>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {projectState.type === "breadboard"
                    ? "Breadboard prototype"
                    : projectState.type === "pcb"
                      ? "PCB design"
                      : "Custom build"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ProjectStatusMenu
              projectId={project.id}
              status={projectState.status}
              onStatusChange={(nextStatus) =>
                setProjectState((prev) => ({
                  ...prev,
                  status: nextStatus,
                }))
              }
            />
            <Button
              type="button"
              size="sm"
              className="h-9 rounded-lg px-3 text-sm"
              variant="outline"
              asChild
            >
              <Link href={`/dashboard/${project.id}/settings`} className="inline-flex items-center gap-2">
                <Settings2 className="h-4 w-4" />
                Project settings
              </Link>
            </Button>
          </div>
        </div>
      </header>
    </div>
  )
}
