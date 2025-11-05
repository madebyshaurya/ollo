"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Cpu, CircuitBoard, Wrench, MoreHorizontal, Edit, Trash2, FileText } from "lucide-react"
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
                return "text-yellow-400 bg-yellow-400/10"
            case "in-progress":
                return "text-blue-400 bg-blue-400/10"
            case "completed":
                return "text-green-400 bg-green-400/10"
            case "paused":
                return "text-orange-400 bg-orange-400/10"
            default:
                return "text-gray-400 bg-gray-400/10"
        }
    }

    const getTypeIcon = (type: Project["type"]) => {
        switch (type) {
            case "breadboard":
                return <Cpu className="h-4 w-4 text-blue-500" />
            case "pcb":
                return <CircuitBoard className="h-4 w-4 text-emerald-500" />
            case "custom":
                return <Wrench className="h-4 w-4 text-purple-500" />
            default:
                return <Cpu className="h-4 w-4 text-gray-400" />
        }
    }

    const getTypeLabel = (type: Project["type"]) => {
        switch (type) {
            case "breadboard":
                return "Breadboard"
            case "pcb":
                return "PCB Design"
            case "custom":
                return "Custom"
            default:
                return "Project"
        }
    }

    const handleClick = () => {
        router.push(`/dashboard/${project.id}`)
    };

    return (
        <Card
            className={cn(
                "group cursor-pointer border-border bg-card transition-all duration-200 hover:border-ring/60 hover:bg-accent/50",
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
            <CardContent className="p-4 sm:p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <div
                            className={cn(
                                "rounded-lg border border-border/60 bg-muted/40 p-2 shadow-sm",
                                project.type === "breadboard"
                                    ? "text-blue-500"
                                    : project.type === "pcb"
                                        ? "text-emerald-500"
                                        : "text-purple-500"
                            )}
                            aria-hidden
                        >
                            {getTypeIcon(project.type)}
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-base font-medium text-card-foreground transition-colors group-hover:text-card-foreground/80 sm:text-lg">
                                {project.name}
                            </CardTitle>
                            <CardDescription className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                {getTypeLabel(project.type)}
                            </CardDescription>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div
                            className={cn(
                                "rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide",
                                getStatusColor(project.status)
                            )}
                        >
                            {project.status.replace("-", " ")}
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-accent rounded-md"
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
                </div>

                <p className="mb-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {project.description}
                </p>

                <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    <span className="text-[10px] sm:text-[11px]">
                        {new Date(project.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                        })}
                    </span>
                    <span className="opacity-60 transition-opacity group-hover:opacity-100">
                        Open →
                    </span>
                </div>
            </CardContent>
        </Card>
    )
}
