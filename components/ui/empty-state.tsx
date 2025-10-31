"use client"

import Image from "next/image"
import { Plus } from "lucide-react"

import { ProjectCreationModal } from "@/components/ui/project-creation-modal"
import { TextureButton } from "@/components/ui/texture-button"

export function EmptyState() {
  return (
    <div className="px-4 py-16 text-center">
      <div className="mx-auto flex max-w-md flex-col items-center gap-8">
        <div className="mx-auto flex h-64 w-64 items-center justify-center">
          <Image
            src="/illustrations/electronics.png"
            alt="Electronics illustration"
            width={256}
            height={256}
            className="h-full w-full object-contain"
            priority
          />
        </div>

        <div className="space-y-4">
          <h3 className="font-editorial-new text-2xl font-light text-foreground">
            Ready to build something <span className="font-editorial-new-italic">amazing</span>?
          </h3>
          <p className="font-sans text-base leading-relaxed text-muted-foreground">
            Start your hardware journey with ollo. Create your first project and let AI guide you from idea to completion.
          </p>
        </div>

        <ProjectCreationModal>
          <TextureButton variant="accent" className="text-base font-medium">
            <Plus className="h-5 w-5" />
            Create Your First Project
          </TextureButton>
        </ProjectCreationModal>
      </div>
    </div>
  )
}
