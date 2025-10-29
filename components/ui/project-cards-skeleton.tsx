"use client"

import { Skeleton } from "@/components/ui/skeleton"

interface ProjectCardsSkeletonProps {
    count?: number
}

export function ProjectCardsSkeleton({ count = 6 }: ProjectCardsSkeletonProps) {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: count }).map((_, i) => (
                <ProjectCardSkeleton key={i} />
            ))}
        </div>
    )
}

function ProjectCardSkeleton() {
    return (
        <div className="border border-border rounded-xl bg-card backdrop-blur-sm p-6">
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-20" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-6 w-6 rounded-sm" />
                    </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-3 w-3" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-8 w-16" />
                </div>
            </div>
        </div>
    )
}
