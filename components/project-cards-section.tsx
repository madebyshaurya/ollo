"use client"

import * as React from "react"
import { ProjectCard, Project } from "@/components/ui/project-card"
import { ProjectRenameModal } from "@/components/ui/project-rename-modal"
import { ProjectDeleteModal } from "@/components/ui/project-delete-modal"
import { ProjectEditDescriptionModal } from "@/components/ui/project-edit-description-modal"

interface ProjectCardsSectionProps {
    projects: Project[]
}

export function ProjectCardsSection({ projects }: ProjectCardsSectionProps) {
    const [renameProject, setRenameProject] = React.useState<Project | null>(null)
    const [deleteProject, setDeleteProject] = React.useState<Project | null>(null)
    const [editDescriptionProject, setEditDescriptionProject] = React.useState<Project | null>(null)

    return (
        <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                    <ProjectCard
                        key={project.id}
                        project={project}
                        onRename={setRenameProject}
                        onDelete={setDeleteProject}
                        onEditDescription={setEditDescriptionProject}
                    />
                ))}
            </div>

            {renameProject && (
                <ProjectRenameModal
                    project={renameProject}
                    open={!!renameProject}
                    onOpenChange={(open) => !open && setRenameProject(null)}
                />
            )}

            {deleteProject && (
                <ProjectDeleteModal
                    project={deleteProject}
                    open={!!deleteProject}
                    onOpenChange={(open) => !open && setDeleteProject(null)}
                />
            )}

            {editDescriptionProject && (
                <ProjectEditDescriptionModal
                    project={editDescriptionProject}
                    open={!!editDescriptionProject}
                    onOpenChange={(open) => !open && setEditDescriptionProject(null)}
                />
            )}
        </>
    )
}
