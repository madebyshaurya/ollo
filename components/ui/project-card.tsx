"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatRelativeTime } from "@/lib/utils/time"
import { MoreHorizontal, Edit, Trash2, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface Project {
    id: string
    name: string
    description: string
    type: "breadboard" | "pcb" | "custom"
    created_at: string
    status: "planning" | "in-progress" | "completed" | "paused"
    microcontroller?: string
    microcontroller_other?: string
    complexity: number
    budget: number
    purpose?: string
    target_audience?: string
    timeline?: string
    custom_description?: string
    emoji?: string | null
}

interface ProjectCardProps {
    project: Project
    onRename?: (project: Project) => void
    onDelete?: (project: Project) => void
    onEditDescription?: (project: Project) => void
}

export function ProjectCard({ project, onRename, onDelete, onEditDescription }: ProjectCardProps) {
    const router = useRouter()

    const getStatusColor = (status: Project["status"]) => {
        switch (status) {
            case "planning":
                return "text-yellow-600 bg-yellow-50 border-yellow-200"
            case "in-progress":
                return "text-blue-600 bg-blue-50 border-blue-200"
            case "completed":
                return "text-green-600 bg-green-50 border-green-200"
            case "paused":
                return "text-orange-600 bg-orange-50 border-orange-200"
            default:
                return "text-gray-600 bg-gray-50 border-gray-200"
        }
    }

    const getDefaultEmoji = (type: Project["type"]) => {
        switch (type) {
            case "breadboard":
                return "🔌"
            case "pcb":
                return "🔧"
            case "custom":
                return "⚡"
            default:
                return "🔧"
        }
    }

    const handleClick = () => {
        router.push(`/dashboard/${project.id}`)
    }

    const displayEmoji = project.emoji || getDefaultEmoji(project.type)

    return (
        <Card
            className={cn(
                "group cursor-pointer border-border bg-card transition-all duration-200 hover:border-ring/60 hover:shadow-sm",
                "backdrop-blur-sm"
            )}
            onClick={handleClick}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    handleClick()
                }
            }}
            role="link"
            tabIndex={0}
            aria-label={`Open project ${project.name}`}
        >
            <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="text-2xl flex-shrink-0" aria-hidden>
                            {displayEmoji}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-foreground text-base leading-tight mb-1 truncate">
                                {project.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
                                {project.description}
                            </p>
                            <div className="flex items-center justify-between">
                                <time className="text-xs text-muted-foreground">
                                    {formatRelativeTime(project.created_at)}
                                </time>
                                <div
                                    className={cn(
                                        "text-xs px-2 py-1 rounded-md border font-medium",
                                        getStatusColor(project.status)
                                    )}
                                >
                                    {project.status === "in-progress" ? "in progress" : project.status}
                                </div>
                            </div>
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-muted rounded-md flex-shrink-0"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onRename?.(project)
                                }}
                            >
                                <Edit className="mr-2 h-4 w-4" />
                                Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onEditDescription?.(project)
                                }}
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                Edit Description
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onDelete?.(project)
                                }}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardContent>
        </Card>
    )
}
