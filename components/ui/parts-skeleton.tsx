export function PartsSkeleton() {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, index) => {
                    // Rotate each card slightly for sticky note effect
                    const rotations = ['-rotate-1', 'rotate-1', '-rotate-2', 'rotate-2', '0', '-rotate-1'];
                    const rotation = rotations[index % rotations.length];

                    // Different sticky note colors with skeleton overlay
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
                            className={`group relative ${rotation} transition-all duration-300 pt-3 animate-pulse`}
                        >
                            {/* Tape effect at top - outside the card */}
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-16 h-5 bg-white/50 dark:bg-white/30 backdrop-blur-sm border-l border-r border-black/10 shadow-sm z-10"
                                style={{ transform: 'translateX(-50%) rotate(-2deg)' }}
                            />

                            <div className={`rounded-sm border-2 ${color} p-4 shadow-md relative`}
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
                                        {/* Title skeleton */}
                                        <div className="h-4 bg-black/20 dark:bg-white/20 rounded w-3/4" />
                                        {/* Type badge skeleton */}
                                        <div className="h-5 bg-black/10 dark:bg-white/10 rounded-full w-20 inline-block" />
                                    </div>

                                    {/* Description skeleton */}
                                    <div className="space-y-1">
                                        <div className="h-3 bg-black/10 dark:bg-white/10 rounded w-full" />
                                        <div className="h-3 bg-black/10 dark:bg-white/10 rounded w-5/6" />
                                    </div>

                                    <div className="pt-2 border-t border-black/10 dark:border-white/10">
                                        {/* Price skeleton */}
                                        <div className="h-4 bg-black/20 dark:bg-white/20 rounded w-1/3" />
                                    </div>

                                    <div className="pt-1">
                                        {/* Reason skeleton */}
                                        <div className="space-y-1">
                                            <div className="h-3 bg-black/10 dark:bg-white/10 rounded w-full" />
                                            <div className="h-3 bg-black/10 dark:bg-white/10 rounded w-4/5" />
                                        </div>
                                    </div>

                                    {/* Action Buttons skeleton */}
                                    <div className="flex gap-2 pt-3 border-t border-black/10 dark:border-white/10">
                                        <div className="h-7 bg-black/10 dark:bg-white/10 rounded flex-1" />
                                        <div className="h-7 bg-black/10 dark:bg-white/10 rounded flex-1" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
