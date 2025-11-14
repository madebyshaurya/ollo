

'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Check, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

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
    complexity: number
}

export function ProjectMainContent({ projectId }: { projectId: string }) {
    const [parts, setParts] = useState<PartRecommendation[]>([])
    const [projectContext, setProjectContext] = useState<ProjectContext | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selections, setSelections] = useState<Record<number, 'accept' | 'reject'>>({})
    const [regenerating, setRegenerating] = useState<Record<number, boolean>>({})

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
                    throw new Error('Failed to fetch part recommendations')
                }

                const data = await response.json()

                if (data.error) {
                    throw new Error(data.error)
                }

                setParts(data.parts || [])
                setProjectContext(data.projectContext || null)
            } catch (err) {
                console.error('Error fetching parts:', err)
                setError(err instanceof Error ? err.message : 'Failed to load recommendations')
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

    return (
        <div className="flex-1 space-y-6">
            {/* Part Selection Section */}
            <div className="rounded-lg border bg-card p-6">
                <div className="mb-6">
                    <h2 className="text-2xl font-semibold mb-2">Part Selection</h2>
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
                            <div className="rounded-lg bg-muted/50 p-4 mb-6">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium">Project Type:</span> {projectContext.type}
                                    </div>
                                    <div>
                                        <span className="font-medium">Complexity:</span> {projectContext.complexity}/10
                                    </div>
                                    {projectContext.budget && (
                                        <div>
                                            <span className="font-medium">Budget:</span> ${projectContext.budget}
                                        </div>
                                    )}
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
                                                        <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium w-full justify-center py-1.5">
                                                            <Check className="h-3 w-3" />
                                                            Added to list
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
