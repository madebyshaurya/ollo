import { NextResponse } from "next/server"

import { updateUserPreferences } from "@/lib/actions/user-preferences"

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => null) as { updates?: Record<string, unknown> } | null

    if (!body || typeof body.updates !== "object" || body.updates === null) {
      return NextResponse.json(
        { error: "Invalid request payload. Provide an object of updates." },
        { status: 400 }
      )
    }

    const result = await updateUserPreferences(body.updates)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Unable to update preferences." },
        { status: result.error === "User not authenticated" ? 401 : 400 }
      )
    }

    return NextResponse.json({ preferences: result.preferences })
  } catch (error) {
    console.error("Failed to update preferences:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred while updating preferences." },
      { status: 500 }
    )
  }
}
