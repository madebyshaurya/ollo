"use client"

import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { UserPreferences } from "@/lib/actions/user-preferences"
import { cn } from "@/lib/utils"

const TOGGLE_FIELDS: Array<{
  key: keyof UserPreferences
  title: string
  description: string
}> = [
  {
    key: "aiAssist",
    title: "AI-guided planning",
    description: "Use ollo's assistant to outline build steps, test plans, and sourcing strategy.",
  },
  {
    key: "autoSummaries",
    title: "Auto-generate summaries",
    description:
      "Keep project summaries fresh when description changes or new milestones are logged.",
  },
  {
    key: "emailDigest",
    title: "Weekly progress digest",
    description: "Receive a Monday recap covering status changes, sourcing alerts, and blockers.",
  },
  {
    key: "partSourcingBeta",
    title: "Part sourcing beta",
    description:
      "Enable experimental supplier matching and inventory lookups powered by Digikey and Mouser.",
  },
]

interface PreferencesFormProps {
  initialPreferences: UserPreferences
}

type ToggleKey = Extract<keyof UserPreferences, "aiAssist" | "autoSummaries" | "emailDigest" | "partSourcingBeta">

export function PreferencesForm({ initialPreferences }: PreferencesFormProps) {
  const [preferences, setPreferences] = useState(initialPreferences)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setPreferences(initialPreferences)
  }, [initialPreferences])

  const handleToggle = (key: ToggleKey) => {
    if (isPending) return
    const nextValue = !preferences[key]

    setPreferences((prev) => ({ ...prev, [key]: nextValue }))

    startTransition(async () => {
      const response = await fetch("/api/preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ updates: { [key]: nextValue } }),
      })

      if (response.ok) {
        const result: { preferences: UserPreferences } = await response.json()
        setPreferences(result.preferences)
        toast.success(
          `${TOGGLE_FIELDS.find((field) => field.key === key)?.title ?? "Preference"} updated`
        )
      } else {
        const payload = await safeParseError(response)
        setPreferences((prev) => ({ ...prev, [key]: !nextValue }))
        toast.error(payload?.error || "We couldn't update that preference just yet.")
      }
    })
  }

  const handleDefaultViewChange = (value: UserPreferences["defaultProjectView"]) => {
    if (isPending || value === preferences.defaultProjectView) return

    setPreferences((prev) => ({ ...prev, defaultProjectView: value }))

    startTransition(async () => {
      const response = await fetch("/api/preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ updates: { defaultProjectView: value } }),
      })

      if (response.ok) {
        const result: { preferences: UserPreferences } = await response.json()
        setPreferences(result.preferences)
        toast.success("Default dashboard view updated")
      } else {
        const payload = await safeParseError(response)
        setPreferences((prev) => ({ ...prev, defaultProjectView: preferences.defaultProjectView }))
        toast.error(payload?.error || "Unable to update default view")
      }
    })
  }

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
          Workspace preferences
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Tune how ollo supports your workflow. Changes apply immediately across the dashboard.
        </p>
      </CardHeader>

      <CardContent className="space-y-6 px-6 py-5">
        <div className="space-y-5">
          {TOGGLE_FIELDS.map((field) => (
            <div
              key={field.key}
              className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">{field.title}</p>
                <p className="text-sm text-muted-foreground">{field.description}</p>
              </div>
              <ToggleSwitch
                checked={preferences[field.key] as boolean}
                disabled={isPending}
                onToggle={() => handleToggle(field.key as ToggleKey)}
              />
            </div>
          ))}
        </div>

        <div className="space-y-3 rounded-xl border border-border/70 bg-muted/30 px-4 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Default dashboard view</p>
              <p className="text-sm text-muted-foreground">
                Choose what you want to see first when opening a project.
              </p>
            </div>
            <Select
              value={preferences.defaultProjectView}
              onValueChange={(value) => handleDefaultViewChange(value as UserPreferences["defaultProjectView"])}
              disabled={isPending}
            >
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="Select a view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview &amp; status</SelectItem>
                <SelectItem value="sourcing">Parts sourcing workspace</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            You can switch views at any time inside a project—this only sets the default.
          </p>
        </div>

        <div className="space-y-3 rounded-xl border border-border/70 bg-muted/30 px-4 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Preferred currency</p>
              <p className="text-sm text-muted-foreground">
                Prices across sourcing and recommendations will be shown in your chosen currency.
              </p>
            </div>
            <Select
              value={preferences.currency}
              onValueChange={handleCurrencyChange}
              disabled={isPending}
            >
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "INR", "CNY"].map((code) => (
                  <SelectItem key={code} value={code}>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ToggleSwitch({
  checked,
  disabled,
  onToggle,
}: {
  checked: boolean
  disabled?: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "relative h-6 w-11 rounded-full border transition-all focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-1 disabled:cursor-not-allowed",
        checked ? "border-primary bg-primary" : "border-border bg-muted/60",
        disabled && "opacity-70"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-background shadow-sm transition-transform",
          checked ? "translate-x-5" : "translate-x-0"
        )}
        aria-hidden
      />
    </button>
  )
}

async function safeParseError(response: Response): Promise<{ error?: string } | null> {
  try {
    return (await response.json()) as { error?: string }
  } catch {
    return null
  }
}
