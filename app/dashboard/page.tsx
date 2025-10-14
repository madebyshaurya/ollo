import { auth, currentUser } from "@clerk/nextjs/server"
import { Plus, FolderOpen, TrendingUp, Clock } from "lucide-react"

import { ProjectCreationModal } from "@/components/ui/project-creation-modal"
import { EmptyState } from "@/components/ui/empty-state"
import { TextureButton } from "@/components/ui/texture-button"
import { ProjectCardsSection } from "@/components/project-cards-section"
import { getUserProjects } from "@/lib/actions/projects"

export default async function DashboardPage() {
  const { userId, redirectToSignIn } = await auth()

  if (!userId) {
    return redirectToSignIn({ returnBackUrl: "/dashboard" })
  }

  const user = await currentUser()
  const displayName = user?.firstName?.trim() || user?.username || ""

  const projectsResult = await getUserProjects()
  const projects = projectsResult.success ? projectsResult.projects || [] : []

  const totalProjects = projects.length
  const inProgressProjects = projects.filter(
    (project) => project.status === "in-progress"
  ).length
  const planningProjects = projects.filter(
    (project) => project.status === "planning"
  ).length

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col space-y-6 text-foreground sm:space-y-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-editorial-new font-light text-foreground sm:text-4xl">
            Welcome back<span className="italic">{displayName ? `, ${displayName}` : ""}</span>
          </h1>
          <p className="font-inter text-sm text-muted-foreground sm:text-base">
            Ready to build something amazing?
          </p>
        </div>
        <ProjectCreationModal>
          <TextureButton
            variant="accent"
            className="w-full gap-2 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            New Project
          </TextureButton>
        </ProjectCreationModal>
      </section>

      {totalProjects > 0 && (
        <section
          aria-label="Project overview"
          className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6"
        >
          <div className="bg-card border border-border rounded-xl p-4 sm:p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <FolderOpen className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5" />
              </div>
              <div>
                <p className="font-inter text-xs text-muted-foreground sm:text-sm">
                  Total Projects
                </p>
                <p className="font-inter text-xl font-semibold text-foreground sm:text-2xl">
                  {totalProjects}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 sm:p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <TrendingUp className="h-4 w-4 text-green-600 sm:h-5 sm:w-5" />
              </div>
              <div>
                <p className="font-inter text-xs text-muted-foreground sm:text-sm">
                  In Progress
                </p>
                <p className="font-inter text-xl font-semibold text-foreground sm:text-2xl">
                  {inProgressProjects}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 sm:p-6 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-100 p-2">
                <Clock className="h-4 w-4 text-yellow-600 sm:h-5 sm:w-5" />
              </div>
              <div>
                <p className="font-inter text-xs text-muted-foreground sm:text-sm">
                  Planning
                </p>
                <p className="font-inter text-xl font-semibold text-foreground sm:text-2xl">
                  {planningProjects}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="space-y-4 sm:space-y-6">
        {totalProjects > 0 ? (
          <>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-editorial-new text-foreground sm:text-3xl">
                  Your Projects
                </h2>
                <p className="font-inter text-sm text-muted-foreground sm:text-base">
                  Manage and track your hardware builds
                </p>
              </div>
            </div>

            <ProjectCardsSection projects={projects} />
          </>
        ) : (
          <EmptyState />
        )}
      </section>
    </div>
  )
}
