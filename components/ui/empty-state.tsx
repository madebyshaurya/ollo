"use client"

import * as React from "react"
import { TextureButton } from "@/components/ui/texture-button"
import { ProjectCreationModal } from "@/components/ui/project-creation-modal"
import { Plus } from "lucide-react"
import Image from "next/image"

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface EmptyStateProps { }

export function EmptyState({ }: EmptyStateProps) {
    return (
        <div className="text-center py-16 px-4">
            <div className="max-w-md mx-auto space-y-8">
                {/* Electronics Illustration */}
                <div className="relative">
                    <div className="mx-auto w-64 h-64 flex items-center justify-center">
                        <Image
                            src="/illustrations/electronics.png"
                            alt="Electronics illustration"
                            width={256}
                            height={256}
                            className="w-full h-full object-contain"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                    <h3 className="text-2xl font-editorial-new font-light text-foreground">
                        Ready to build something <span className="font-editorial-new-italic">amazing</span>?
                    </h3>
                    <p className="text-muted-foreground font-inter text-base leading-relaxed">
                        Start your hardware journey with ollo. Create your first project and let AI guide you from idea to completion, or explore with a template project.
                    </p>
                </div>

                {/* Call to Action */}
                <div className="space-y-4">
                    <ProjectCreationModal>
                        <TextureButton
                            variant="accent"
                            className=" text-base font-medium"
                        >
                            <Plus className="h-5 w-5" />
                            Create Your First Project
                        </TextureButton>
                    </ProjectCreationModal>

                    <div className="text-center">
                        <p className="text-xs text-muted-foreground font-inter mb-3">
                            Or start with a template project
                        </p>
                        <TextureButton
                            variant="secondary"
                            className="text-sm font-medium"
                            onClick={() => {
                                // TODO: Implement template project creation
                                console.log("Creating template project for exploration");
                            }}
                        >
                            Explore with Template
                        </TextureButton>
                    </div>

                    <p className="text-xs text-muted-foreground font-inter">
                        Choose between breadboard prototyping or PCB design
                    </p>
                </div>
            </div>
        </div>
    )
}
