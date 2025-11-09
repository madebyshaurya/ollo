"use client"

import { useState, useTransition } from "react"
import { useUser } from "@clerk/nextjs"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CurrencySelect } from "@/components/ui/currency-select"
import type { UserPreferences } from "@/lib/actions/user-preferences"

interface PreferencesFormProps {
  initialPreferences: UserPreferences
}

export function PreferencesForm({ initialPreferences }: PreferencesFormProps) {
  const { user } = useUser()
  const [preferences, setPreferences] = useState(initialPreferences)
  const [isPending, startTransition] = useTransition()

  const displayName =
    user?.firstName?.trim() ||
    user?.username ||
    (user?.emailAddresses?.[0]?.emailAddress ?? "Your account")

  const primaryEmail = user?.emailAddresses?.[0]?.emailAddress ?? "No email on file"

  const handleCurrencyChange = (value: string) => {
    if (isPending || value === preferences.currency) return

    const nextValue = value.toUpperCase()
    setPreferences((prev) => ({ ...prev, currency: nextValue }))

    startTransition(async () => {
      const response = await fetch("/api/preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ updates: { currency: nextValue } }),
      })

      if (response.ok) {
        const result: { preferences: UserPreferences } = await response.json()
        setPreferences(result.preferences)
        toast.success("Currency preference updated")
      } else {
        const payload = await safeParseError(response)
        setPreferences((prev) => ({ ...prev, currency: preferences.currency }))
        toast.error(payload?.error || "Unable to update currency preference")
      }
    })
  }

  return (
    <Card className="border-border/80 bg-card/80 shadow-sm backdrop-blur">
      <CardHeader className="space-y-2 border-b border-border/70 pb-4">
        <CardTitle className="font-editorial-new text-2xl font-light text-foreground">
          Account & preferences
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage your account details and tune how ollo supports your workflow. Changes apply immediately across the dashboard.
        </p>
      </CardHeader>

      <CardContent className="space-y-6 px-6 py-5">
        {/* Account info section with enhanced details */}
        <div className="space-y-4 rounded-xl border border-border/70 bg-muted/30 px-4 py-4">
          <div className="flex items-center gap-3 w-full">
            <div className="h-12 w-12 rounded-full overflow-hidden bg-muted/70 flex items-center justify-center">
              {user?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.imageUrl} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-medium text-muted-foreground">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">{displayName}</span>
              <span className="text-sm text-muted-foreground">{primaryEmail}</span>
            </div>
          </div>

          {/* Account details */}
          <div className="space-y-3 pt-2 border-t border-border/50">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Display name
              </p>
              <p className="text-sm text-foreground">{displayName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Primary email
              </p>
              <p className="text-sm text-foreground">{primaryEmail}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              Manage advanced profile settings from the menu in the top-right corner. Updates made
              there sync instantly with this workspace.
            </div>
          </div>
        </div>

        {/* Preferred currency only */}
        <div className="space-y-3 rounded-xl border border-border/70 bg-muted/30 px-4 py-4">
          <div className="flex flex-col gap-2">
            <div>
              <p className="text-sm font-medium text-foreground">Preferred currency</p>
              <p className="text-sm text-muted-foreground">
                Prices across sourcing and recommendations will be shown in your chosen currency.
              </p>
            </div>
            <CurrencySelect
              value={preferences.currency}
              onValueChange={handleCurrencyChange}
              disabled={isPending}
              placeholder="Search for a currency..."
              className="w-full sm:w-96"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

async function safeParseError(response: Response): Promise<{ error?: string } | null> {
  try {
    return (await response.json()) as { error?: string }
  } catch {
    return null
  }
}
