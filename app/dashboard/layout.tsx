import { DashboardHeader } from "@/components/dashboard-header"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardHeader />

      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-4 sm:px-6 sm:pb-10 sm:pt-6">
        {children}
      </div>
    </div>
  )
}
