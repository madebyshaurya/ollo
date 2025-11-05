"use client"

import { useEffect, useState, useTransition } from "react"
import { Check, Loader2, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { updateProjectStatus } from "@/lib/actions/projects"
import { toast } from "sonner"

const STATUS_OPTIONS: Array<{
  value: "planning" | "in-progress" | "completed" | "paused"
  label: string
  description: string
}> = [
  {
    value: "planning",
    label: "Planning",
    description: "Defining scope, gathering requirements, and lining up parts.",
  },
  {
    value: "in-progress",
    label: "In Progress",
    description: "Actively building, testing, or iterating on the design.",
  },
  {
    value: "paused",
    label: "Paused",
    description: "Temporarily on hold—waiting on parts, feedback, or resources.",
  },
  {
    value: "completed",
    label: "Completed",
    description: "Project assembled, validated, and ready to share.",
  },
]

interface ProjectStatusMenuProps {
  projectId: string
  status: "planning" | "in-progress" | "completed" | "paused"
  onStatusChange?: (status: ProjectStatusMenuProps["status"]) => void
}

export function ProjectStatusMenu({ projectId, status, onStatusChange }: ProjectStatusMenuProps) {
  const [currentStatus, setCurrentStatus] = useState(status)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setCurrentStatus(status)
  }, [status])

  const handleStatusChange = (nextStatus: ProjectStatusMenuProps["status"]) => {
    if (nextStatus === currentStatus || isPending) return

    const previousStatus = currentStatus
    setCurrentStatus(nextStatus)

    startTransition(async () => {
      const result = await updateProjectStatus(projectId, nextStatus)

      if (result.success) {
        toast.success(`Status updated to ${nextStatus.replace("-", " ")}`)
        onStatusChange?.(nextStatus)
      } else {
        setCurrentStatus(previousStatus)
        toast.error(result.error || "Failed to update project status")
      }
    })
  }

  const activeOption = STATUS_OPTIONS.find((option) => option.value === currentStatus)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 rounded-lg border-border/70 bg-background/60 px-3 font-medium"
          aria-label={`Project status: ${activeOption?.label ?? currentStatus}`}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <RefreshCcw className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm">
            {activeOption?.label ?? currentStatus.replace("-", " ")}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <div className="px-3 py-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Update status
          </p>
        </div>
        {STATUS_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            className={cn(
              "flex items-start gap-3 px-3 py-2.5",
              option.value === currentStatus && "bg-accent/60"
            )}
            onClick={() => handleStatusChange(option.value)}
          >
            <span className="mt-0.5 text-muted-foreground">
              {option.value === currentStatus ? (
                <Check className="h-4 w-4 text-emerald-500" />
              ) : (
                <span className="block h-2 w-2 rounded-full bg-border" />
              )}
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">
                {option.label}
              </p>
              <p className="text-sm text-muted-foreground">{option.description}</p>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
