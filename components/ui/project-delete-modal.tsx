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
import { deleteProject } from "@/lib/actions/projects"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ProjectDeleteModalProps {
    project: {
        id: string
        name: string
    }
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ProjectDeleteModal({ project, open, onOpenChange }: ProjectDeleteModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Delete Project</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete &quot;{project.name}&quot;? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isLoading}
                    >
                        {isLoading ? "Deleting..." : "Delete"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
