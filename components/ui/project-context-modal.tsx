"use client"

import { useState, useEffect, useTransition, useCallback } from "react"
import { Brain, Edit2, Lock } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { TextureButton } from "@/components/ui/texture-button"
import {
    getProjectContext,
    updateProjectContextField,
    type ProjectContextRecord,
} from "@/lib/actions/context"

interface ProjectContextModalProps {
    projectId: string
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ProjectContextModal({ projectId, open, onOpenChange }: ProjectContextModalProps) {
    const [contexts, setContexts] = useState<ProjectContextRecord[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editContent, setEditContent] = useState("")

    const loadContexts = useCallback(async () => {
        setIsLoading(true)
        try {
            const data = await getProjectContext(projectId)
            setContexts(data)
        } catch (error) {
            toast.error("Failed to load context")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }, [projectId])

    useEffect(() => {
        if (open) {
            loadContexts()
        }
    }, [open, projectId, loadContexts])

    const handleEdit = (context: ProjectContextRecord) => {
        if (!context.editable) return
        setEditingId(context.id)
        setEditContent(context.content)
    }

    const handleCancelEdit = () => {
        setEditingId(null)
        setEditContent("")
    }

    const handleSaveEdit = (contextId: string) => {
        if (!editContent.trim()) {
            toast.error("Content cannot be empty")
            return
        }

        startTransition(async () => {
            const result = await updateProjectContextField(projectId, contextId, editContent)
            if (result.success) {
                toast.success("Context updated successfully")
                setContexts((prev) =>
                    prev.map((ctx) => (ctx.id === contextId ? { ...ctx, content: editContent } : ctx))
                )
                setEditingId(null)
                setEditContent("")
            } else {
                toast.error(result.error || "Failed to update context")
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[80vh] max-w-2xl flex-col p-0">
                <DialogHeader className="flex-shrink-0 border-b border-border/70 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <Brain className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-editorial-new font-light">
                                Project Context
                            </DialogTitle>
                            <DialogDescription className="text-sm">
                                All the context and information the AI has about this project
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <p className="text-sm text-muted-foreground">Loading context...</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {contexts.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-8 text-center">
                                    <Brain className="mx-auto h-12 w-12 text-muted-foreground/40" />
                                    <p className="mt-3 text-sm font-medium text-foreground">
                                        No context yet
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Add project details in settings to build context
                                    </p>
                                </div>
                            ) : (
                                contexts.map((context) => (
                                    <div
                                        key={context.id}
                                        className="group relative rounded-xl border border-border/70 bg-card p-4 transition-all hover:border-border"
                                    >
                                        <div className="mb-2 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                    {context.label}
                                                </p>
                                                {!context.editable && (
                                                    <Lock className="h-3 w-3 text-muted-foreground/50" />
                                                )}
                                            </div>
                                            {context.editable && editingId !== context.id && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                                                    onClick={() => handleEdit(context)}
                                                    disabled={isPending}
                                                >
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>

                                        {editingId === context.id ? (
                                            <>
                                                <Textarea
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    rows={3}
                                                    className="mb-3 w-full resize-none"
                                                    autoFocus
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={handleCancelEdit}
                                                        disabled={isPending}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <TextureButton
                                                        variant="accent"
                                                        size="sm"
                                                        onClick={() => handleSaveEdit(context.id)}
                                                        disabled={isPending || !editContent.trim()}
                                                    >
                                                        {isPending ? "Saving..." : "Save"}
                                                    </TextureButton>
                                                </div>
                                            </>
                                        ) : (
                                            <p className="text-sm text-foreground">{context.content}</p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
