"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
    return (
        <div className="mx-auto flex w-full max-w-7xl flex-col space-y-6 text-foreground sm:space-y-8">
            {/* Header Section */}
            <section className="space-y-4 sm:space-y-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64 sm:h-10 sm:w-80" />
                        <Skeleton className="h-4 w-48 sm:h-5 sm:w-64" />
                    </div>
                    <Skeleton className="h-10 w-32 sm:w-36" />
                </div>
            </section>

            {/* Stats Section */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="bg-card border border-border rounded-xl p-4 sm:p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-6 w-8" />
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 sm:p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-6 w-8" />
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 sm:p-6 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-6 w-8" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Projects Section */}
            <section className="space-y-4 sm:space-y-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48 sm:h-10 sm:w-64" />
                        <Skeleton className="h-4 w-64 sm:h-5 sm:w-80" />
                    </div>
                </div>

                {/* Project Cards Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <ProjectCardSkeleton key={i} />
                    ))}
                </div>
            </section>
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
