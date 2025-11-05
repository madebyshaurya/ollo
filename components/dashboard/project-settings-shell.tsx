"use client"

import { type ChangeEvent, type FormEvent, useState } from "react"
import Link from "next/link"
import { ArrowLeftCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ProjectSummaryCard } from "@/components/dashboard/project-summary-card"
import { ProjectEditSummaryModal } from "@/components/dashboard/project-edit-summary-modal"
import { updateProject } from "@/lib/actions/projects"
import type { ProjectStageId } from "@/lib/workflows"

type ProjectStatus = "planning" | "in-progress" | "completed" | "paused"
type ProjectType = "breadboard" | "pcb" | "custom"

export interface ProjectSettingsData {
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

export function ProjectSettingsShell({ project }: { project: ProjectSettingsData }) {
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [projectState, setProjectState] = useState(project)
  const [isSavingDetails, setIsSavingDetails] = useState(false)
  const [formValues, setFormValues] = useState({
    purpose: project.purpose ?? "",
    targetAudience: project.target_audience ?? "",
    timeline: project.timeline ?? "",
    budget: project.budget != null ? String(project.budget) : "",
  })

  const normalizedPurpose = formValues.purpose.trim()
  const normalizedTarget = formValues.targetAudience.trim()
  const normalizedTimeline = formValues.timeline.trim()
  const parsedBudget = formValues.budget.trim() ? Number(formValues.budget) : null
  const budgetError = formValues.budget.trim().length > 0 && Number.isNaN(parsedBudget)

  const originalPurpose = (projectState.purpose ?? "").trim()
  const originalTarget = (projectState.target_audience ?? "").trim()
  const originalTimeline = (projectState.timeline ?? "").trim()
  const originalBudget = projectState.budget ?? null

  const hasValidationError = budgetError
  const isDirty =
    normalizedPurpose !== originalPurpose ||
    normalizedTarget !== originalTarget ||
    normalizedTimeline !== originalTimeline ||
    (!budgetError && parsedBudget !== originalBudget)

  const handleFormChange =
    (field: keyof typeof formValues) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value
      setFormValues((prev) => ({ ...prev, [field]: value }))
    }

  const handleDetailsSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (budgetError) {
      toast.error("Budget must be a valid number.")
      return
    }

    setIsSavingDetails(true)
    try {
      const payload = {
        purpose: normalizedPurpose || null,
        targetAudience: normalizedTarget || null,
        timeline: normalizedTimeline || null,
        budget: parsedBudget,
      }

      const result = await updateProject(project.id, payload)

      if (result.success) {
        toast.success("Project details updated")
        const updatedAt = new Date().toISOString()

        setProjectState((prev) => ({
          ...prev,
          purpose: payload.purpose,
          target_audience: payload.targetAudience,
          timeline: payload.timeline,
          budget: payload.budget,
          updated_at: updatedAt,
        }))

        setFormValues({
          purpose: normalizedPurpose,
          targetAudience: normalizedTarget,
          timeline: normalizedTimeline,
          budget: parsedBudget != null ? String(parsedBudget) : "",
        })
      } else {
        toast.error(result.error || "Failed to update project.")
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while saving changes."
      toast.error(message)
    } finally {
      setIsSavingDetails(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 text-foreground sm:gap-8">
      <header className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-background/85 px-5 py-4 shadow-sm backdrop-blur sm:px-6 sm:py-5">
        <div className="flex items-start gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full border border-border/60 bg-background/70 text-foreground"
            asChild
          >
            <Link href={`/dashboard/${project.id}`} aria-label="Back to workspace">
              <ArrowLeftCircle className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-editorial-new font-light tracking-tight sm:text-3xl">
              Project settings
            </h1>
            <p className="text-sm text-muted-foreground">
              Update narrative, metadata, and planning preferences for this build.
            </p>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
        <ProjectSummaryCard
          content={projectState.summary}
          description={projectState.description}
          onEdit={() => setSummaryOpen(true)}
          status={projectState.status}
        />
        <Card className="h-full border-border/80 bg-card/80 shadow-sm backdrop-blur">
          <form onSubmit={handleDetailsSubmit} className="flex h-full flex-col">
            <CardContent className="flex flex-1 flex-col gap-6 px-6 py-5">
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose</Label>
                <Textarea
                  id="purpose"
                  value={formValues.purpose}
                  onChange={handleFormChange("purpose")}
                  rows={3}
                  placeholder="What success looks like and why this build matters."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-audience">Target audience</Label>
                <Textarea
                  id="target-audience"
                  value={formValues.targetAudience}
                  onChange={handleFormChange("targetAudience")}
                  rows={3}
                  placeholder="Who you're building for."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="timeline">Timeline</Label>
                  <Input
                    id="timeline"
                    value={formValues.timeline}
                    onChange={handleFormChange("timeline")}
                    placeholder="Key milestones or target dates."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget">Budget target (USD)</Label>
                  <Input
                    id="budget"
                    type="number"
                    min={0}
                    step="1"
                    value={formValues.budget}
                    onChange={handleFormChange("budget")}
                    placeholder="500"
                  />
                  {budgetError && (
                    <p className="text-xs text-destructive">
                      Budget must be a valid number.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="font-semibold uppercase tracking-wide">Created</p>
                  <p className="text-sm text-foreground">{formatDate(projectState.created_at)}</p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold uppercase tracking-wide">Last updated</p>
                  <p className="text-sm text-foreground">{formatDate(projectState.updated_at)}</p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={!isDirty || hasValidationError || isSavingDetails}
                >
                  {isSavingDetails ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </section>

      <ProjectEditSummaryModal
        projectId={project.id}
        summary={projectState.summary}
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        onSuccess={(updatedSummary) => {
          setProjectState((prev) => ({
            ...prev,
            summary: updatedSummary,
            updated_at: new Date().toISOString(),
          }))
        }}
      />
    </div>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}
