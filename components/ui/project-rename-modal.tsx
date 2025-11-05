"use client"

import { useEffect, useState } from "react"
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
import { updateProject } from "@/lib/actions/projects"
import { toast } from "sonner"

interface ProjectRenameModalProps {
    project: {
        id: string
        name: string
    }
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: (updatedName: string) => void
}

export function ProjectRenameModal({ project, open, onOpenChange, onSuccess }: ProjectRenameModalProps) {
    const [name, setName] = useState(project.name)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (open) {
            setName(project.name)
        }
    }, [open, project.name])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        setIsLoading(true)
        try {
            const result = await updateProject(project.id, { name: name.trim() })

            if (result.success) {
                toast.success("Project renamed successfully")
                onSuccess?.(name.trim())
                onOpenChange(false)
            } else {
                toast.error(result.error || "Failed to rename project")
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "An error occurred while renaming the project"
            toast.error(message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Rename Project</DialogTitle>
                    <DialogDescription>
                        Enter a new name for your project.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="col-span-3"
                                placeholder="Enter project name"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading || !name.trim()}>
                            {isLoading ? "Renaming..." : "Rename"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
