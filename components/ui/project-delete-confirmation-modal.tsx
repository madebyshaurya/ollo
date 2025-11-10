"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TextureButton } from "@/components/ui/texture-button"
import { deleteProject } from "@/lib/actions/projects"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ProjectDeleteConfirmationModalProps {
    project: {
        id: string
        name: string
    }
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ProjectDeleteConfirmationModal({
    project,
    open,
    onOpenChange
}: ProjectDeleteConfirmationModalProps) {
    const [confirmationText, setConfirmationText] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const isConfirmed = confirmationText === project.name

    const handleDelete = async () => {
        if (!isConfirmed) return

        setIsLoading(true)
        try {
            const result = await deleteProject(project.id)

            if (result.success) {
                toast.success("Project deleted successfully")
                onOpenChange(false)
                router.push("/dashboard")
            } else {
                toast.error(result.error || "Failed to delete project")
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "An error occurred while deleting the project"
            toast.error(message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setConfirmationText("")
        }
        onOpenChange(newOpen)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-red-600 dark:text-red-400">
                        Delete Project
                    </DialogTitle>
                    <DialogDescription>
                        You are about to permanently delete &quot;{project.name}&quot;.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                    <div className="text-sm font-medium text-red-600 dark:text-red-400">
                        This action cannot be undone. All project data, including parts lists,
                        planning details, and workflow progress will be permanently lost.
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Please type <strong>{project.name}</strong> to confirm deletion:
                    </div>
                </div>

                <div className="space-y-2 pt-4">
                    <Label htmlFor="confirmation" className="text-sm font-medium">
                        Project name
                    </Label>
                    <Input
                        id="confirmation"
                        value={confirmationText}
                        onChange={(e) => setConfirmationText(e.target.value)}
                        placeholder="Enter project name"
                        disabled={isLoading}
                        className="w-full"
                    />
                </div>

                <DialogFooter className="gap-2 pt-6">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <TextureButton
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={!isConfirmed || isLoading}
                        className="min-w-32"
                    >
                        {isLoading ? "Deleting..." : "Delete Project"}
                    </TextureButton>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}