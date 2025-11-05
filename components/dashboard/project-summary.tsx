"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Markdown } from "@/components/ui/markdown"
import { cn } from "@/lib/utils"

interface ProjectSummaryProps {
  content: string
  className?: string
}

export function ProjectSummary({ content, className }: ProjectSummaryProps) {
  const [expanded, setExpanded] = useState(false)
  const shouldTruncate =
    content.trim().length > 260 || content.split("\n").filter(Boolean).length > 3

  return (
    <div className={cn("space-y-3", className)}>
      <div
        className={cn(
          "relative transition-all",
          shouldTruncate && !expanded && "max-h-32 overflow-hidden pr-1 sm:max-h-36"
        )}
      >
        <Markdown
          content={content}
          className="[&_p]:text-sm [&_p]:leading-relaxed sm:[&_p]:text-base"
        />
        {shouldTruncate && !expanded && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-background/95 to-transparent"
          />
        )}
      </div>
      {shouldTruncate && (
        <Button
          type="button"
          variant="link"
          className="h-auto px-0 py-0 text-sm text-muted-foreground hover:text-foreground"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
        >
          {expanded ? "Show less" : "Show more"}
        </Button>
      )}
    </div>
  )
}
