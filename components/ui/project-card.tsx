"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Cpu, Zap, MoreHorizontal, Edit, Trash2, FileText } from "lucide-react"
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
                return <Cpu className="h-5 w-5 text-blue-400" />
            case "pcb":
                return <Zap className="h-5 w-5 text-green-400" />
            case "custom":
                return <Cpu className="h-5 w-5 text-purple-400" />
            default:
                return <Cpu className="h-5 w-5 text-gray-400" />
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
                "group cursor-pointer transition-all duration-200 border-border bg-card hover:bg-accent/50 hover:border-ring/50",
                "backdrop-blur-sm"
            )}
            onClick={handleClick}
        >
            <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "p-2 rounded-lg",
                            project.type === "breadboard" ? "bg-blue-50 dark:bg-blue-950/30" :
                                project.type === "pcb" ? "bg-green-50 dark:bg-green-950/30" :
                                    "bg-purple-50 dark:bg-purple-950/30"
                        )}>
                            {getTypeIcon(project.type)}
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-card-foreground font-medium text-lg group-hover:text-card-foreground/80 transition-colors">
                                {project.name}
                            </CardTitle>
                            <CardDescription className="text-muted-foreground text-sm">
                                {getTypeLabel(project.type)}
                            </CardDescription>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium",
                            getStatusColor(project.status)
                        )}>
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

                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    {project.description}
                </p>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                        {new Date(project.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                        })}
                    </span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                        Open →
                    </span>
                </div>
            </CardContent>
        </Card>
    )
}
