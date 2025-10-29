"use client"

import Image from "next/image"
import Link from "next/link"
import { UserButton, useUser } from "@clerk/nextjs"

export function DashboardHeader() {
    const { user, isLoaded } = useUser()

    return (
        <header className="flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <Link
                href="/dashboard"
                aria-label="Ollo dashboard"
                className="flex items-center rounded-md p-2 transition-colors"
            >
                <Image
                    src="/logo.png"
                    alt="Ollo logo"
                    width={128}
                    height={128}
                    className="size-12 rounded-sm"
                    priority
                />
            </Link>

            <div className="flex items-center gap-3">
                {isLoaded && user && (
                    <span className="text-sm text-muted-foreground hidden sm:block">
                        {user.firstName || user.username || "User"}
                    </span>
                )}
                <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                        elements: {
                            userButtonAvatarBox: "size-9 rounded-lg",
                            userButtonPopoverCard:
                                "bg-background/95 backdrop-blur border border-border rounded-xl",
                            userButtonPopoverActionButton:
                                "hover:bg-accent hover:text-accent-foreground",
                        },
                    }}
                />
            </div>
        </header>
    )
}

