"use client"

import { type ChangeEvent, useState, useTransition } from "react"
import Link from "next/link"
import { ArrowLeftCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { TextureButton } from "@/components/ui/texture-button"
import { ProjectDeleteConfirmationModal } from "@/components/ui/project-delete-confirmation-modal"
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
  const [formValues, setFormValues] = useState({
    summary: project.summary || "",
    purpose: project.purpose || "",
    targetAudience: project.target_audience || "",
    timeline: project.timeline || "",
    budget: project.budget != null ? String(project.budget) : "",
  })
  const [isPending, startTransition] = useTransition()
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Check if form has changes
  const hasChanges =
    formValues.summary !== (project.summary || "") ||
    formValues.purpose !== (project.purpose || "") ||
    formValues.targetAudience !== (project.target_audience || "") ||
    formValues.timeline !== (project.timeline || "") ||
    formValues.budget !== (project.budget != null ? String(project.budget) : "")

  const handleFieldChange = (field: keyof typeof formValues) => (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: event.target.value,
    }))
  }

  const handleSaveChanges = () => {
    startTransition(async () => {
      try {
        const parsedBudget = formValues.budget.trim() ? Number(formValues.budget) : null

        if (formValues.budget.trim() && Number.isNaN(parsedBudget)) {
          toast.error("Budget must be a valid number.")
          return
        }

        const payload = {
          summary: formValues.summary.trim() || null,
          purpose: formValues.purpose.trim() || null,
          targetAudience: formValues.targetAudience.trim() || null,
          timeline: formValues.timeline.trim() || null,
          budget: parsedBudget,
        }

        const result = await updateProject(project.id, payload)

        if (result.success) {
          toast.success("Project settings saved successfully")
          // Update the original project data to reflect changes
          Object.assign(project, {
            summary: payload.summary || "",
            purpose: payload.purpose,
            target_audience: payload.targetAudience,
            timeline: payload.timeline,
            budget: payload.budget,
            updated_at: new Date().toISOString(),
          })
        } else {
          toast.error(result.error || "Failed to save project settings.")
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "An unexpected error occurred."
        toast.error(message)
      }
    })
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
              Manage your project details and planning preferences. Changes require saving.
            </p>
          </div>
        </div>
      </header>

      <Card className="border-border/80 bg-card/80 shadow-sm backdrop-blur">
        <CardHeader className="space-y-2 border-b border-border/70 pb-4">
          <CardTitle className="font-editorial-new text-2xl font-light text-foreground">
            {project.emoji || "🔧"} {project.name}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Update your project summary, purpose, and planning details below.
          </p>
        </CardHeader>

        <CardContent className="space-y-6 px-6 py-5">
          {/* Project Summary Section */}
          <div className="space-y-3 rounded-xl border border-border/70 bg-muted/30 px-4 py-4">
            <div>
              <p className="text-sm font-medium text-foreground">Project summary</p>
              <p className="text-sm text-muted-foreground">
                AI-generated overview of your project based on your description and goals.
              </p>
            </div>
            <Textarea
              value={formValues.summary}
              onChange={handleFieldChange("summary")}
              rows={4}
              placeholder="Enter or edit your project summary..."
              disabled={isPending}
              className="w-full resize-none"
            />
          </div>

          {/* Project Purpose */}
          <div className="space-y-3 rounded-xl border border-border/70 bg-muted/30 px-4 py-4">
            <div>
              <p className="text-sm font-medium text-foreground">Purpose</p>
              <p className="text-sm text-muted-foreground">
                What success looks like and why this build matters.
              </p>
            </div>
            <Textarea
              value={formValues.purpose}
              onChange={handleFieldChange("purpose")}
              rows={3}
              placeholder="Describe the purpose and goals of this project..."
              disabled={isPending}
              className="w-full"
            />
          </div>

          {/* Target Audience */}
          <div className="space-y-3 rounded-xl border border-border/70 bg-muted/30 px-4 py-4">
            <div>
              <p className="text-sm font-medium text-foreground">Target audience</p>
              <p className="text-sm text-muted-foreground">
                Who you&apos;re building this project for.
              </p>
            </div>
            <Textarea
              value={formValues.targetAudience}
              onChange={handleFieldChange("targetAudience")}
              rows={3}
              placeholder="Who is this project designed for?"
              disabled={isPending}
              className="w-full"
            />
          </div>

          {/* Planning Details */}
          <div className="space-y-4 rounded-xl border border-border/70 bg-muted/30 px-4 py-4">
            <div>
              <p className="text-sm font-medium text-foreground">Planning details</p>
              <p className="text-sm text-muted-foreground">
                Timeline and budget information for project planning.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Timeline
                </p>
                <Input
                  value={formValues.timeline}
                  onChange={handleFieldChange("timeline")}
                  placeholder="Key milestones or target dates"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Budget target (USD)
                </p>
                <Input
                  type="number"
                  min={0}
                  step="1"
                  value={formValues.budget}
                  onChange={handleFieldChange("budget")}
                  placeholder="500"
                  disabled={isPending}
                />
              </div>
            </div>
          </div>

          {/* Project Metadata */}
          <div className="space-y-3 rounded-xl border border-border/70 bg-muted/30 px-4 py-4">
            <div>
              <p className="text-sm font-medium text-foreground">Project metadata</p>
              <p className="text-sm text-muted-foreground">
                Basic information about your project creation and updates.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Created
                </p>
                <p className="text-sm text-foreground">{formatDate(project.created_at)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Last updated
                </p>
                <p className="text-sm text-foreground">{formatDate(project.updated_at)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Project type
                </p>
                <p className="text-sm text-foreground capitalize">{project.type}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </p>
                <p className="text-sm text-foreground capitalize">
                  {project.status.replace("-", " ")}
                </p>
              </div>
            </div>
          </div>

          {/* Save Changes Button */}
          <div className="flex justify-end pt-4 border-t border-border/50">
            <TextureButton
              variant={hasChanges && !isPending ? "accent" : "minimal"}
              size="default"
              onClick={handleSaveChanges}
              disabled={!hasChanges || isPending}
              className="min-w-32"
            >
              {isPending ? "Saving..." : "Save Changes"}
            </TextureButton>
          </div>

          {/* Delete Project Button */}
          <div className="flex justify-end pt-2">
            <TextureButton
              variant="destructive"
              size="default"
              onClick={() => setShowDeleteModal(true)}
              className="min-w-32 bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Project
            </TextureButton>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <ProjectDeleteConfirmationModal
        project={project}
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
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
