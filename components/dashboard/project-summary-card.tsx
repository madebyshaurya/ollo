"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProjectSummary } from "@/components/dashboard/project-summary"

interface ProjectSummaryCardProps {
  content: string
  description?: string
  onEdit: () => void
  status: "planning" | "in-progress" | "completed" | "paused"
}

export function ProjectSummaryCard({
  content,
  description,
  onEdit,
  status,
}: ProjectSummaryCardProps) {
  return (
    <Card className="h-full border-border/80 bg-card/80 shadow-sm backdrop-blur">
      <CardHeader className="border-b border-border/70 pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="space-y-1">
            <CardTitle className="font-editorial-new text-2xl font-light text-foreground">
              Project Summary
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Clear snapshot of where the build stands right now.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-9 rounded-lg border-border/70 bg-background/60 px-3 text-sm"
            onClick={onEdit}
          >
            Edit summary
          </Button>
        </div>
        <div className="mt-4 inline-flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
          <span>Status</span>
          <span className="rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-[11px] font-semibold text-foreground">
            {status.replace("-", " ")}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 px-5 py-5 sm:px-6">
        <ProjectSummary content={content} className="text-base" />
        {description && (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Your project notes
            </p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {description}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
