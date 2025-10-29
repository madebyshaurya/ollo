import { auth, currentUser } from "@clerk/nextjs/server"
import { Plus } from "lucide-react"

import { EmptyState } from "@/components/ui/empty-state"
import { ProjectCardsSection } from "@/components/project-cards-section"
import { ProjectCreationModal } from "@/components/ui/project-creation-modal"
import { TextureButton } from "@/components/ui/texture-button"
import { getUserProjects } from "@/lib/actions/projects"
import { generateSimpleGreeting } from "@/lib/greeting-service"

function GreetingText({ text }: { text: string }) {
  const parts = text.split(/(\*[^*]+\*)/g)

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('*') && part.endsWith('*')) {
          return <span key={index} className="italic">{part.slice(1, -1)}</span>
        }
        return part
      })}
    </>
  )
}

export default async function DashboardPage() {
  const { userId, redirectToSignIn } = await auth()

  if (!userId) {
    return redirectToSignIn({ returnBackUrl: "/dashboard" })
  }

  const user = await currentUser()
  const displayName = user?.firstName?.trim() || user?.username || ""

  const greeting = generateSimpleGreeting(displayName)

  const { success, projects: projectList = [] } = await getUserProjects()
  const projects = success ? projectList : []

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col space-y-6 text-foreground sm:space-y-8">
      <section className="flex flex-col gap-4 items-center text-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-editorial-new font-light text-foreground sm:text-4xl">
            <GreetingText text={greeting} />
          </h1>
        </div>
      </section>


      <section className="space-y-4 sm:space-y-6">
        {projects.length > 0 ? (
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
              <ProjectCreationModal>
                <TextureButton variant="accent" size="default" className="flex items-center gap-2 w-auto">
                  <Plus className="h-4 w-4" />
                  New Project
                </TextureButton>
              </ProjectCreationModal>
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
