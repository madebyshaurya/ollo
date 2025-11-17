"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateProject } from "@/lib/actions/projects"

type ProjectType = "breadboard" | "pcb" | "custom"

interface ProjectEditDetailsModalProps {
  project: {
    id: string
    name: string
    description: string
    summary: string
    type: ProjectType
    microcontroller?: string | null
    microcontroller_other?: string | null
    complexity: number
    budget: number | null
    purpose?: string | null
    target_audience?: string | null
    timeline?: string | null
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (
    update: Partial<{
      name: string
      description: string
      summary: string
      type: ProjectType
      microcontroller?: string | null
      microcontroller_other?: string | null
      complexity: number
      budget: number | null
      purpose?: string | null
      target_audience?: string | null
      timeline?: string | null
    }>
  ) => void
}

const TYPE_OPTIONS: Array<{ value: ProjectType; label: string; helper: string }> = [
  {
    value: "breadboard",
    label: "Breadboard prototype",
    helper: "Quick experiments, component bring-up, and proof of concept builds.",
  },
  { value: "pcb", label: "PCB design", helper: "Printed circuit board layouts and fabrication runs." },
  {
    value: "custom",
    label: "Custom build",
    helper: "Embedded products, enclosures, or mixed hardware/software builds.",
  },
]

export function ProjectEditDetailsModal({
  project,
  open,
  onOpenChange,
  onSuccess,
}: ProjectEditDetailsModalProps) {
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description)
  const [summary, setSummary] = useState(project.summary)
  const [projectType, setProjectType] = useState<ProjectType>(project.type)
  const [microcontroller, setMicrocontroller] = useState(project.microcontroller ?? "")
  const [microcontrollerOther, setMicrocontrollerOther] = useState(
    project.microcontroller_other ?? ""
  )
  const [complexity, setComplexity] = useState<number>(project.complexity ?? 1)
  const [budget, setBudget] = useState<string>(project.budget != null ? String(project.budget) : "")
  const [purpose, setPurpose] = useState(project.purpose ?? "")
  const [targetAudience, setTargetAudience] = useState(project.target_audience ?? "")
  const [timeline, setTimeline] = useState(project.timeline ?? "")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setName(project.name)
      setDescription(project.description)
      setSummary(project.summary)
      setProjectType(project.type)
      setMicrocontroller(project.microcontroller ?? "")
      setMicrocontrollerOther(project.microcontroller_other ?? "")
      setComplexity(project.complexity ?? 1)
      setBudget(project.budget != null ? String(project.budget) : "")
      setPurpose(project.purpose ?? "")
      setTargetAudience(project.target_audience ?? "")
      setTimeline(project.timeline ?? "")
    }
  }, [open, project])

  const isSubmitDisabled = useMemo(() => {
    if (!name.trim()) return true
    if (!description.trim()) return true
    if (!summary.trim()) return true
    return false
  }, [name, description, summary])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitDisabled) return

    const parsedBudget = budget.trim() ? Number(budget) : null
    if (parsedBudget != null && Number.isNaN(parsedBudget)) {
      toast.error("Budget must be a valid number.")
      return
    }

    if (complexity < 1 || complexity > 5) {
      toast.error("Complexity must be between 1 and 5.")
      return
    }

    setIsLoading(true)
    try {
      const result = await updateProject(project.id, {
        name: name.trim(),
        description: description.trim(),
        summary: summary.trim(),
        type: projectType,
        microcontroller: microcontroller.trim() || null,
        microcontrollerOther: microcontrollerOther.trim() || null,
        budget: parsedBudget,
        purpose: purpose.trim() || null,
        targetAudience: targetAudience.trim() || null,
        timeline: timeline.trim() || null,
      })

      if (result.success) {
        toast.success("Project details updated")
        onSuccess?.({
          name: name.trim(),
          description: description.trim(),
          summary: summary.trim(),
          type: projectType,
          microcontroller: microcontroller.trim() || null,
          microcontroller_other: microcontrollerOther.trim() || null,
          complexity,
          budget: parsedBudget,
          purpose: purpose.trim() || null,
          target_audience: targetAudience.trim() || null,
          timeline: timeline.trim() || null,
        })
        onOpenChange(false)
      } else {
        toast.error(result.error || "Failed to update project")
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred while saving changes."
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="space-y-2">
          <DialogTitle>Edit project details</DialogTitle>
          <DialogDescription>
            Keep the essentials aligned with your current build plan. All updates are saved instantly
            for teammates.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="project-name">Project name</Label>
              <Input
                id="project-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="PCB motor driver"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-type">Build type</Label>
              <Select value={projectType} onValueChange={(value: ProjectType) => setProjectType(value)}>
                <SelectTrigger id="project-type">
                  <SelectValue placeholder="Select build type" />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {TYPE_OPTIONS.find((option) => option.value === projectType)?.helper}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="complexity">Complexity (1-5)</Label>
              <Input
                id="complexity"
                type="number"
                min={1}
                max={5}
                value={complexity}
                onChange={(event) => setComplexity(Number(event.target.value) || 1)}
              />
              <p className="text-xs text-muted-foreground">
                Reflects how involved the build is—used to plan milestones and staffing.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Budget (USD)</Label>
              <Input
                id="budget"
                type="number"
                min={0}
                step={1}
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
                placeholder="500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="microcontroller">Primary microcontroller</Label>
              <Input
                id="microcontroller"
                value={microcontroller}
                onChange={(event) => setMicrocontroller(event.target.value)}
                placeholder="ESP32-S3"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="microcontroller-other">Alt / custom controller</Label>
              <Input
                id="microcontroller-other"
                value={microcontrollerOther}
                onChange={(event) => setMicrocontrollerOther(event.target.value)}
                placeholder="Custom STM32 module"
              />
            </div>
          </section>

          <section className="space-y-2">
            <Label htmlFor="summary">Project summary</Label>
            <Textarea
              id="summary"
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              rows={4}
              placeholder="Concise snapshot of the work in-flight."
              required
            />
          </section>

          <section className="space-y-2">
            <Label htmlFor="description">Project description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              placeholder="Extended context, goals, and what success looks like."
              required
            />
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose</Label>
              <Textarea
                id="purpose"
                value={purpose}
                onChange={(event) => setPurpose(event.target.value)}
                rows={3}
                placeholder="Why this build matters, the outcomes you're targeting, and key deliverables."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="audience">Target audience</Label>
              <Textarea
                id="audience"
                value={targetAudience}
                onChange={(event) => setTargetAudience(event.target.value)}
                rows={3}
                placeholder="Who it's for—production team, community release, internal pilots, etc."
              />
            </div>
          </section>

          <div className="space-y-2">
            <Label htmlFor="timeline">Timeline</Label>
            <Input
              id="timeline"
              value={timeline}
              onChange={(event) => setTimeline(event.target.value)}
              placeholder="MVP by June, validation in July"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || isSubmitDisabled}>
              {isLoading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
