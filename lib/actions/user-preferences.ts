import { createClerkClient, currentUser } from "@clerk/nextjs/server"

export type DefaultProjectView = "overview" | "sourcing"

export interface UserPreferences {
  aiAssist: boolean
  autoSummaries: boolean
  emailDigest: boolean
  partSourcingBeta: boolean
  defaultProjectView: DefaultProjectView
  currency: string
}

const DEFAULT_PREFERENCES: UserPreferences = {
  aiAssist: true,
  autoSummaries: true,
  emailDigest: false,
  partSourcingBeta: false,
  defaultProjectView: "overview",
  currency: "USD",
}

function coercePreferences(input: unknown): UserPreferences {
  if (!input || typeof input !== "object") {
    return { ...DEFAULT_PREFERENCES }
  }

  const raw = input as Partial<Record<keyof UserPreferences, unknown>>

  return {
    aiAssist: typeof raw.aiAssist === "boolean" ? raw.aiAssist : DEFAULT_PREFERENCES.aiAssist,
    autoSummaries:
      typeof raw.autoSummaries === "boolean" ? raw.autoSummaries : DEFAULT_PREFERENCES.autoSummaries,
    emailDigest:
      typeof raw.emailDigest === "boolean" ? raw.emailDigest : DEFAULT_PREFERENCES.emailDigest,
    partSourcingBeta:
      typeof raw.partSourcingBeta === "boolean"
        ? raw.partSourcingBeta
        : DEFAULT_PREFERENCES.partSourcingBeta,
    defaultProjectView:
      raw.defaultProjectView === "sourcing" ? "sourcing" : DEFAULT_PREFERENCES.defaultProjectView,
    currency:
      typeof raw.currency === "string" && raw.currency.trim().length === 3
        ? raw.currency.toUpperCase()
        : DEFAULT_PREFERENCES.currency,
  }
}

export async function getUserPreferences(): Promise<UserPreferences> {
  const user = await currentUser()

  if (!user) {
    throw new Error("User not authenticated")
  }

  const existing = coercePreferences(user.publicMetadata?.preferences)

  return { ...DEFAULT_PREFERENCES, ...existing }
}

export async function updateUserPreferences(
  input: Partial<UserPreferences>
): Promise<{ success: boolean; preferences: UserPreferences; error?: string }> {
  try {
    const user = await currentUser()

    if (!user) {
      return { success: false, preferences: DEFAULT_PREFERENCES, error: "User not authenticated" }
    }

    const current = coercePreferences(user.publicMetadata?.preferences)
    const next: UserPreferences = {
      ...current,
      ...input,
    }

    const secretKey = process.env.CLERK_SECRET_KEY

    if (!secretKey) {
      console.warn("Attempted to update preferences without CLERK_SECRET_KEY configured.")
      return {
        success: false,
        preferences: current,
        error: "Clerk secret key not configured. Update your environment variables and try again.",
      }
    }

    const clerk = createClerkClient({
      secretKey,
      publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    })

    await clerk.users.updateUser(user.id, {
      publicMetadata: {
        ...user.publicMetadata,
        preferences: next,
      },
    })

    return { success: true, preferences: next }
  } catch (error) {
    console.error("Failed to update user preferences:", error)
    const message = error instanceof Error ? error.message : "Unable to update preferences"
    return { success: false, preferences: DEFAULT_PREFERENCES, error: message }
  }
}
