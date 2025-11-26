

'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Check, X, Loader2, Edit2, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { updateProject } from '@/lib/actions/projects'

interface PartRecommendation {
    name: string
    type: string
    description: string
    estimatedPrice: string
    reason: string
}

interface ProjectContext {
    name: string
    type: string
    budget: number | null
}

export function ProjectMainContent({ projectId }: { projectId: string }) {
    const [parts, setParts] = useState<PartRecommendation[]>([])
    const [projectContext, setProjectContext] = useState<ProjectContext | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selections, setSelections] = useState<Record<number, 'accept' | 'reject'>>({})
    const [regenerating, setRegenerating] = useState<Record<number, boolean>>({})
    const [editingBudget, setEditingBudget] = useState(false)
    const [budgetValue, setBudgetValue] = useState('')
    const [savingBudget, setSavingBudget] = useState(false)

    useEffect(() => {
        async function fetchParts() {
            try {
                setLoading(true)
                setError(null)

                const response = await fetch('/api/parts/recommend', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ projectId }),
                })

                if (!response.ok) {
                    const errorText = await response.text()
                    console.error('[Parts] API error response:', errorText)
                    throw new Error(`Failed to fetch part recommendations (${response.status}): ${errorText}`)
                }

                const data = await response.json()

                if (data.error) {
                    console.error('[Parts] API returned error:', data.error)
                    throw new Error(`Part recommendations error: ${data.error}`)
                }

                setParts(data.parts || [])
                setProjectContext(data.projectContext || null)
                setBudgetValue(data.projectContext?.budget?.toString() || '')

                // Load existing selections from database
                if (data.selections) {
                    setSelections(data.selections)
                    console.log('[Parts] Loaded existing selections:', data.selections)
                }
            } catch (err) {
                console.error('[Parts] Error fetching parts:', err)
                const errorMsg = err instanceof Error ? err.message : 'Failed to load recommendations'
                setError(`${errorMsg}. Check browser console for details.`)
            } finally {
                setLoading(false)
            }
        }

        fetchParts()
    }, [projectId])

    const handlePartAction = async (partIndex: number, action: 'accept' | 'reject') => {
        try {
            // Save selection to database
            const response = await fetch('/api/parts/select', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, partIndex, action })
            })

            if (!response.ok) {
                throw new Error('Failed to save selection')
            }

            const data = await response.json()
            setSelections(data.selections)

            if (action === 'accept') {
                toast.success('Part added to your list!')
            } else {
                // Regenerate a new part suggestion
                await regeneratePart(partIndex)
            }
        } catch (err) {
            console.error('Error handling part action:', err)
            toast.error('Failed to process your selection')
        }
    }

    const regeneratePart = async (partIndex: number) => {
        setRegenerating(prev => ({ ...prev, [partIndex]: true }))
        toast.info('Finding an alternative part...')

        try {
            const rejectedPart = parts[partIndex]
            const response = await fetch('/api/parts/regenerate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, partIndex, rejectedPart })
            })

            if (!response.ok) {
                throw new Error('Failed to generate alternative')
            }

            const data = await response.json()

            // Update the part in the list
            setParts(prev => {
                const newParts = [...prev]
                newParts[partIndex] = data.part
                return newParts
            })

            toast.success('Here\'s an alternative part!')
        } catch (err) {
            console.error('Error regenerating part:', err)
            toast.error('Failed to generate alternative part')
        } finally {
            setRegenerating(prev => ({ ...prev, [partIndex]: false }))
        }
    }

    const handleRemoveFromList = async (partIndex: number) => {
        try {
            // Remove selection from database by setting it to null/undefined
            const response = await fetch('/api/parts/select', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId, partIndex, action: 'remove' })
            })

            if (!response.ok) {
                throw new Error('Failed to remove from list')
            }

            const data = await response.json()
            setSelections(data.selections)
            toast.success('Part removed from your list')
        } catch (err) {
            console.error('Error removing from list:', err)
            toast.error('Failed to remove from list')
        }
    }

    const handleSaveBudget = async () => {
        setSavingBudget(true)

        try {
            const newBudget = budgetValue.trim() ? Number(budgetValue) : null

            if (budgetValue.trim() && (Number.isNaN(newBudget) || newBudget! < 0)) {
                toast.error('Please enter a valid budget amount')
                setSavingBudget(false)
                return
            }

            await updateProject(projectId, { budget: newBudget })

            // Update local state
            setProjectContext(prev => prev ? { ...prev, budget: newBudget } : null)
            setEditingBudget(false)
            toast.success('Budget updated successfully')
        } catch (err) {
            console.error('Error saving budget:', err)
            toast.error('Failed to update budget')
        } finally {
            setSavingBudget(false)
        }
    }

    return (
        <div className="flex-1 space-y-6">
            {/* Part Selection Section */}
            <div className="rounded-lg border bg-card p-6">
                <div className="mb-6">
                    <h2 className="text-2xl font-editorial-new italic mb-2">Part Selection</h2>
                    <p className="text-sm text-muted-foreground">
                        Here are the parts we recommend for you to use. These are based on price, availability, and your project requirements.
                    </p>
                </div>

                {loading && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-center py-8">
                            <div className="text-muted-foreground">Loading recommendations...</div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                        <p className="text-sm text-destructive">{error}</p>
                    </div>
                )}

                {!loading && !error && parts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        No part recommendations available.
                    </div>
                )}

                {!loading && !error && parts.length > 0 && (
                    <div className="space-y-4">
                        {projectContext && (
                            <div className="relative rounded-xl border border-border/40 bg-gradient-to-br from-background via-background to-muted/20 p-6 shadow-sm mb-8">
                                <div className="flex items-start justify-between gap-6">
                                    {/* Project Type */}
                                    <div className="flex-1">
                                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Project Type</div>
                                        <div className="text-lg font-semibold capitalize">{projectContext.type}</div>
                                    </div>

                                    {/* Budget */}
                                    <div className="flex-1">
                                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">Budget</div>
                                        {!editingBudget ? (
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                                <div className="text-lg font-semibold">
                                                    {projectContext.budget ? projectContext.budget.toLocaleString() : 'Not set'}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setEditingBudget(true)
                                                        setBudgetValue(projectContext.budget?.toString() || '')
                                                    }}
                                                    className="h-7 w-7 p-0 ml-1 hover:bg-muted/80"
                                                >
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <div className="relative flex-1 max-w-[140px]">
                                                    <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        type="number"
                                                        value={budgetValue}
                                                        onChange={(e) => setBudgetValue(e.target.value)}
                                                        className="pl-8 h-9 text-sm"
                                                        placeholder="Enter budget"
                                                        autoFocus
                                                        disabled={savingBudget}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                handleSaveBudget()
                                                            } else if (e.key === 'Escape') {
                                                                setEditingBudget(false)
                                                                setBudgetValue(projectContext.budget?.toString() || '')
                                                            }
                                                        }}
                                                    />
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={handleSaveBudget}
                                                    disabled={savingBudget}
                                                    className="h-7 w-7 p-0 hover:bg-green-500/10 hover:text-green-600"
                                                >
                                                    {savingBudget ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    ) : (
                                                        <Check className="h-3.5 w-3.5" />
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setEditingBudget(false)
                                                        setBudgetValue(projectContext.budget?.toString() || '')
                                                    }}
                                                    disabled={savingBudget}
                                                    className="h-7 w-7 p-0 hover:bg-red-500/10 hover:text-red-600"
                                                >
                                                    <X className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {parts.map((part, index) => {
                                // Rotate each card slightly for sticky note effect
                                const rotations = ['-rotate-1', 'rotate-1', '-rotate-2', 'rotate-2', '0', '-rotate-1'];
                                const rotation = rotations[index % rotations.length];

                                // Different sticky note colors
                                const colors = [
                                    'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-900',
                                    'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900',
                                    'bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-900',
                                    'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900',
                                    'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900',
                                    'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-900',
                                ];
                                const color = colors[index % colors.length];

                                return (
                                    <div
                                        key={index}
                                        className={`group relative ${rotation} hover:rotate-0 transition-all duration-300 hover:scale-105 hover:z-10 pt-3`}
                                    >
                                        {/* Tape effect at top - outside the card */}
                                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-16 h-5 bg-white/50 dark:bg-white/30 backdrop-blur-sm border-l border-r border-black/10 shadow-sm z-10"
                                            style={{ transform: 'translateX(-50%) rotate(-2deg)' }}
                                        />

                                        <div className={`rounded-sm border-2 ${color} p-4 shadow-md hover:shadow-xl transition-shadow relative`}
                                            style={{
                                                backgroundImage: `
                                                    repeating-linear-gradient(
                                                        0deg,
                                                        transparent,
                                                        transparent 2px,
                                                        rgba(0,0,0,0.02) 2px,
                                                        rgba(0,0,0,0.02) 4px
                                                    ),
                                                    repeating-linear-gradient(
                                                        90deg,
                                                        transparent,
                                                        transparent 2px,
                                                        rgba(0,0,0,0.02) 2px,
                                                        rgba(0,0,0,0.02) 4px
                                                    )
                                                `
                                            }}
                                        >
                                            <div className="space-y-3 pt-2">
                                                <div className="space-y-1">
                                                    <div className="flex items-start gap-2">
                                                        <h3 className="font-semibold text-sm leading-tight flex-1 text-foreground/90">
                                                            {part.name}
                                                        </h3>
                                                    </div>
                                                    <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 font-medium">
                                                        {part.type}
                                                    </span>
                                                </div>

                                                <p className="text-xs text-foreground/70 leading-relaxed line-clamp-2">
                                                    {part.description}
                                                </p>

                                                <div className="pt-2 border-t border-black/10 dark:border-white/10">
                                                    <div className="font-semibold text-sm text-foreground/90">
                                                        {part.estimatedPrice}
                                                    </div>
                                                </div>

                                                <div className="pt-1">
                                                    <p className="text-xs text-foreground/60 leading-relaxed line-clamp-2">
                                                        <span className="font-medium">💡</span> {part.reason}
                                                    </p>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="flex gap-2 pt-3 border-t border-black/10 dark:border-white/10">
                                                    {selections[index] === 'accept' ? (
                                                        <div className="flex flex-col gap-2 w-full">
                                                            <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium justify-center py-1.5">
                                                                <Check className="h-3 w-3" />
                                                                Added to list
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-6 text-xs gap-1 text-muted-foreground hover:text-destructive"
                                                                onClick={() => handleRemoveFromList(index)}
                                                            >
                                                                <X className="h-3 w-3" />
                                                                Remove from list
                                                            </Button>
                                                        </div>
                                                    ) : regenerating[index] ? (
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground w-full justify-center py-1.5">
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                            Finding alternative...
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="flex-1 h-7 text-xs gap-1"
                                                                onClick={() => handlePartAction(index, 'accept')}
                                                            >
                                                                <Check className="h-3 w-3" />
                                                                Use this
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="flex-1 h-7 text-xs gap-1"
                                                                onClick={() => handlePartAction(index, 'reject')}
                                                            >
                                                                <X className="h-3 w-3" />
                                                                Suggest else
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
