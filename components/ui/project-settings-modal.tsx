"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { TextureButton } from "@/components/ui/texture-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Settings, Edit, Trash2, Save } from "lucide-react"
import { updateProject, deleteProject } from "@/lib/actions/projects"

interface ProjectSettingsModalProps {
    project: {
        id: string
        name: string
        description: string
        summary?: string | null
    }
    children: React.ReactNode
}

export function ProjectSettingsModal({ project, children }: ProjectSettingsModalProps) {
    const [open, setOpen] = React.useState(false)
    const [isEditing, setIsEditing] = React.useState(false)
    const [isDeleting, setIsDeleting] = React.useState(false)
    const [deleteConfirm, setDeleteConfirm] = React.useState("")
    const [isLoading, setIsLoading] = React.useState(false)

    // Form state
    const [name, setName] = React.useState(project.name)
    const [description, setDescription] = React.useState(project.description)
    const [summary, setSummary] = React.useState(project.summary || "")

    const handleSave = async () => {
        setIsLoading(true)
        try {
            // Update project with new data
            const result = await updateProject(project.id, {
                name,
                description,
                summary: summary || null
            })

            if (result.success) {
                setIsEditing(false)
                // Refresh the page to show updated data
                window.location.reload()
            } else {
                console.error("Failed to update project:", result.error)
            }
        } catch (error) {
            console.error("Error updating project:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async () => {
        if (deleteConfirm !== project.name) {
            return
        }

        setIsLoading(true)
        try {
            const result = await deleteProject(project.id)

            if (result.success) {
                // Redirect to dashboard
                window.location.href = "/dashboard"
            } else {
                console.error("Failed to delete project:", result.error)
            }
        } catch (error) {
            console.error("Error deleting project:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const resetForm = () => {
        setName(project.name)
        setDescription(project.description)
        setSummary(project.summary || "")
        setIsEditing(false)
        setIsDeleting(false)
        setDeleteConfirm("")
    }

    return (
        <Dialog open={open} onOpenChange={(newOpen) => {
            setOpen(newOpen)
            if (!newOpen) {
                resetForm()
            }
        }}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[90vh] overflow-y-auto bg-background border-border backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-editorial-new font-light text-foreground flex items-center gap-2">
                        <Settings className="h-6 w-6" />
                        Project Settings
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {!isDeleting ? (
                        <>
                            {/* Edit Mode Toggle */}
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium text-foreground">Project Details</h3>
                                <TextureButton
                                    variant={isEditing ? "accent" : "minimal"}
                                    onClick={() => setIsEditing(!isEditing)}
                                    className="gap-2"
                                >
                                    <Edit className="h-4 w-4" />
                                    {isEditing ? "Cancel" : "Edit"}
                                </TextureButton>
                            </div>

                            {/* Project Information */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="project-name" className="text-foreground font-inter text-sm font-medium">
                                        Project Name
                                    </Label>
                                    {isEditing ? (
                                        <Input
                                            id="project-name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-ring"
                                        />
                                    ) : (
                                        <p className="text-foreground font-editorial-new italic">{project.name}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="project-description" className="text-foreground font-inter text-sm font-medium">
                                        Description
                                    </Label>
                                    {isEditing ? (
                                        <Textarea
                                            id="project-description"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-ring min-h-[100px] resize-none"
                                        />
                                    ) : (
                                        <p className="text-muted-foreground font-inter">{project.description}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="project-summary" className="text-foreground font-inter text-sm font-medium">
                                        AI Summary
                                    </Label>
                                    {isEditing ? (
                                        <Textarea
                                            id="project-summary"
                                            value={summary}
                                            onChange={(e) => setSummary(e.target.value)}
                                            placeholder="AI-generated summary or custom description..."
                                            className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-ring min-h-[80px] resize-none"
                                        />
                                    ) : (
                                        <p className="text-muted-foreground font-inter">{project.summary || "No summary available"}</p>
                                    )}
                                </div>
                            </div>

                            {/* Save Button */}
                            {isEditing && (
                                <div className="flex justify-end">
                                    <TextureButton
                                        variant="accent"
                                        onClick={handleSave}
                                        disabled={isLoading || !name.trim() || !description.trim()}
                                        className="gap-2"
                                    >
                                        <Save className="h-4 w-4" />
                                        {isLoading ? "Saving..." : "Save Changes"}
                                    </TextureButton>
                                </div>
                            )}

                            {/* Danger Zone */}
                            <div className="border-t border-border pt-6">
                                <h3 className="text-lg font-medium text-destructive mb-4">Danger Zone</h3>
                                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-medium text-destructive">Delete Project</h4>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                This action cannot be undone. This will permanently delete the project and all its data.
                                            </p>
                                        </div>
                                        <TextureButton
                                            variant="destructive"
                                            onClick={() => setIsDeleting(true)}
                                            className="gap-2"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete
                                        </TextureButton>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Delete Confirmation */
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="h-8 w-8 text-destructive" />
                                </div>
                                <h3 className="text-xl font-medium text-foreground mb-2">Delete Project</h3>
                                <p className="text-muted-foreground">
                                    This action cannot be undone. This will permanently delete the project and all its data.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="delete-confirm" className="text-foreground font-inter text-sm font-medium">
                                        Type the project name to confirm deletion
                                    </Label>
                                    <Input
                                        id="delete-confirm"
                                        value={deleteConfirm}
                                        onChange={(e) => setDeleteConfirm(e.target.value)}
                                        placeholder={project.name}
                                        className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-destructive"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <TextureButton
                                    variant="minimal"
                                    onClick={() => setIsDeleting(false)}
                                    className="flex-1"
                                >
                                    Cancel
                                </TextureButton>
                                <TextureButton
                                    variant="destructive"
                                    onClick={handleDelete}
                                    disabled={deleteConfirm !== project.name || isLoading}
                                    className="flex-1 gap-2"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    {isLoading ? "Deleting..." : "Delete Project"}
                                </TextureButton>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
