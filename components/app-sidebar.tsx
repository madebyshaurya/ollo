"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useMemo } from "react"
import { UserButton, useUser } from "@clerk/nextjs"
import { FileText, Grid2x2, Home } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"

type NavItem = {
  title: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  match?: string
  external?: boolean
  tooltip?: string
}

const projectNav: NavItem[] = [
  {
    title: "Overview",
    href: "#overview",
    icon: Grid2x2,
    tooltip: "Project overview",
  },
  {
    title: "Summary",
    href: "#summary",
    icon: FileText,
    tooltip: "Project summary",
  },
]
export function AppSidebar() {
  const pathname = usePathname()
  const { user, isLoaded } = useUser()
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  const name = useMemo(() => {
    if (!user) return "Account"
    return (
      user.fullName ||
      user.username ||
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      "Account"
    )
  }, [user])

  const email = useMemo(() => {
    if (!user) return ""
    return (
      user.primaryEmailAddress?.emailAddress ||
      user.emailAddresses[0]?.emailAddress ||
      ""
    )
  }, [user])

  const renderNavGroup = (title: string, items: NavItem[]) => {
    if (!items.length) return null

    return (
      <SidebarGroup>
        <SidebarGroupLabel>{title}</SidebarGroupLabel>
        <SidebarGroupContent className="group-data-[collapsible=icon]:block group-data-[collapsible=icon]:p-0">
          <SidebarMenu>
            {items.map((item) => {
              const Icon = item.icon
              const isAnchor = item.href.startsWith("#")
              const isActive = isAnchor
                ? false
                : item.match
                  ? pathname.startsWith(item.match)
                  : pathname === item.href

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.tooltip ?? item.title}
                  >
                    <Link
                      href={item.href}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noreferrer" : undefined}
                    >
                      <Icon className="size-4 shrink-0" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    )
  }

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <Link
          href="/dashboard"
          aria-label="Ollo dashboard"
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            isCollapsed && "justify-center px-0"
          )}
        >
          {isCollapsed ? (
            <>
              <Home className="size-5" aria-hidden="true" />
              <span className="sr-only">Dashboard</span>
            </>
          ) : (
            <>
              <Image
                src="/logo.png"
                alt="Ollo logo"
                width={128}
                height={128}
                className="size-12 rounded-sm"
                priority
              />
            </>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {renderNavGroup("Project", projectNav)}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {isLoaded ? (
              <SidebarMenuButton
                asChild
                size="lg"
                className={cn(
                  "flex items-center gap-3 rounded-md",
                  isCollapsed && "justify-center gap-0 px-0"
                )}
              >
                <div
                  className={cn(
                    "flex w-full items-center gap-3",
                    isCollapsed && "justify-center gap-0"
                  )}
                >
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
                  {!isCollapsed && (
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{name}</span>
                      <span className="truncate text-xs text-sidebar-foreground/70">
                        {email || "Signed in"}
                      </span>
                    </div>
                  )}
                </div>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                asChild
                size="lg"
                className={cn(
                  "flex items-center gap-3 rounded-md",
                  isCollapsed && "justify-center gap-0 px-0"
                )}
              >
                <div
                  className={cn(
                    "flex w-full items-center gap-3",
                    isCollapsed && "justify-center gap-0"
                  )}
                >
                  <Skeleton className="size-9 rounded-lg" />
                  {!isCollapsed && (
                    <div className="grid flex-1 gap-1">
                      <Skeleton className="h-3.5 rounded" />
                      <Skeleton className="h-3 rounded" />
                    </div>
                  )}
                </div>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
