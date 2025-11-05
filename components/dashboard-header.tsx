"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserButton, useUser } from "@clerk/nextjs"

import { cn } from "@/lib/utils"

export function DashboardHeader() {
    const { user, isLoaded } = useUser()
    const pathname = usePathname()

    const navItems = [
        {
            href: "/dashboard",
            label: "Projects",
            active:
                pathname === "/dashboard" ||
                (pathname?.startsWith("/dashboard/") && !pathname.startsWith("/dashboard/settings")),
        },
        {
            href: "/dashboard/settings",
            label: "Settings",
            active: pathname?.startsWith("/dashboard/settings"),
        },
    ]

    return (
        <header className="flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center gap-4">
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

                <nav className="flex items-center gap-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                                item.active
                                    ? "bg-foreground text-background shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                            )}
                            aria-current={item.active ? "page" : undefined}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </div>

            <div className="flex items-center gap-3">
                {isLoaded && user && (
                    <span className="hidden text-sm text-muted-foreground sm:block">
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
