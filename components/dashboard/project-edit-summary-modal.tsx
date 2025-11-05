"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { updateProject } from "@/lib/actions/projects"
import { toast } from "sonner"

interface ProjectEditSummaryModalProps {
  projectId: string
  summary: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (updatedSummary: string) => void
}

export function ProjectEditSummaryModal({
  projectId,
  summary,
  open,
  onOpenChange,
  onSuccess,
}: ProjectEditSummaryModalProps) {
  const [summaryText, setSummaryText] = useState(summary)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setSummaryText(summary)
    }
  }, [open, summary])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const nextSummary = summaryText.trim()
    if (!nextSummary) {
      toast.error("Summary cannot be empty.")
      return
    }

    setIsLoading(true)
    try {
      const result = await updateProject(projectId, {
        summary: nextSummary,
        description: nextSummary,
      })

      if (result.success) {
        toast.success("Summary updated successfully")
        onSuccess?.(nextSummary)
        onOpenChange(false)
      } else {
        toast.error(result.error || "Failed to update summary")
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An error occurred while updating the summary"
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] max-w-[600px] sm:max-w-[680px]">
        <DialogHeader className="space-y-2 sm:space-y-3">
          <DialogTitle>Edit project summary</DialogTitle>
          <DialogDescription>
            Refine the synopsis that appears across the dashboard and detail views.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          <div className="space-y-2">
            <div className="flex flex-col gap-1">
              <Label htmlFor="summary" className="text-sm font-medium text-foreground">
                Summary <span className="text-xs font-normal text-muted-foreground">(supports Markdown)</span>
              </Label>
              <Textarea
                id="summary"
                value={summaryText}
                onChange={(event) => setSummaryText(event.target.value)}
                className="min-h-[220px] resize-y rounded-xl border-border bg-background/90 text-base leading-relaxed"
                placeholder="Capture the current state, core objectives, and immediate priorities. Use Markdown for quick emphasis or lists."
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Tip: Use Markdown for structure. Examples: <code className="rounded bg-muted px-1">**bold**</code>,{" "}
              <code className="rounded bg-muted px-1">- bullet</code>, <code className="rounded bg-muted px-1">[link](https://...)</code>.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !summaryText.trim()}>
              {isLoading ? "Saving..." : "Save summary"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
