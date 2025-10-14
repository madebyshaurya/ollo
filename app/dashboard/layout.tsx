import Image from "next/image"
import Link from "next/link"
import { UserButton } from "@clerk/nextjs"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Link
          href="/dashboard"
          aria-label="Ollo dashboard"
          className="flex items-center rounded-md p-2 transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Image
            src="/logo.png"
            alt="Ollo logo"
            width={32}
            height={32}
            className="size-8 rounded-sm"
            priority
          />
        </Link>

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
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4 sm:px-6 sm:pb-10 sm:pt-6">
        {children}
      </div>
    </div>
  )
}
