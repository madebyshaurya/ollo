"use client"

import { useState } from "react"

import { Project } from "@/components/ui/project-card"
import { ProjectCardsSkeleton } from "@/components/ui/project-cards-skeleton"
import { ProjectDeleteModal } from "@/components/ui/project-delete-modal"
import { ProjectEditDescriptionModal } from "@/components/ui/project-edit-description-modal"
import { ProjectRenameModal } from "@/components/ui/project-rename-modal"
import { ProjectCard } from "@/components/ui/project-card"

interface ProjectCardsSectionProps {
    projects: Project[]
    isLoading?: boolean
}

export function ProjectCardsSection({ projects, isLoading = false }: ProjectCardsSectionProps) {
  const [renameProject, setRenameProject] = useState<Project | null>(null)
  const [deleteProject, setDeleteProject] = useState<Project | null>(null)
  const [editDescriptionProject, setEditDescriptionProject] = useState<Project | null>(null)

  if (isLoading) {
    return <ProjectCardsSkeleton count={6} />
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
          open
          onOpenChange={(open) => !open && setRenameProject(null)}
        />
      )}

      {deleteProject && (
        <ProjectDeleteModal
          project={deleteProject}
          open
          onOpenChange={(open) => !open && setDeleteProject(null)}
        />
      )}

      {editDescriptionProject && (
        <ProjectEditDescriptionModal
          project={editDescriptionProject}
          open
          onOpenChange={(open) => !open && setEditDescriptionProject(null)}
        />
      )}
    </>
  )
}
