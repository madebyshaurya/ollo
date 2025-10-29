"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function ProjectPageSkeleton() {
    return (
        <div className="mx-auto w-full max-w-4xl space-y-8 text-foreground">
            {/* Overview Section */}
            <section className="space-y-4">
                <div className="flex items-start gap-3">
                    <Skeleton className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-8 w-64 sm:h-10 sm:w-80" />
                        <Skeleton className="h-5 w-full sm:h-6 sm:w-96" />
                    </div>
                </div>
            </section>

            {/* Summary Section */}
            <section className="space-y-4 rounded-xl border border-border bg-card/60 p-5 backdrop-blur">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8 rounded" />
                        <Skeleton className="h-8 w-8 rounded" />
                    </div>
                </div>

                <div className="space-y-3">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-4/5" />
                    <Skeleton className="h-6 w-3/4" />
                </div>

                {/* Keywords */}
                <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-6 w-16 rounded-md" />
                    <Skeleton className="h-6 w-20 rounded-md" />
                    <Skeleton className="h-6 w-14 rounded-md" />
                    <Skeleton className="h-6 w-18 rounded-md" />
                </div>
            </section>
        </div>
    )
}
