import { NextResponse } from "next/server"

import { getRecommendedParts } from "@/lib/services/parts-recommendation"

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as
      | {
          project: {
            type: "breadboard" | "pcb" | "custom"
            summary: string
            description: string
            complexity: number
            budget: number | null
          }
          currency?: string
        }
      | null

    if (!body?.project) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 })
    }

    const parts = await getRecommendedParts({
      type: body.project.type,
      summary: body.project.summary,
      description: body.project.description,
      complexity: body.project.complexity,
      budget: body.project.budget ?? null,
      preferredCurrency: body.currency ?? "USD",
    })

    return NextResponse.json({ parts })
  } catch (error) {
    console.error("Parts recommendation error:", error)
    return NextResponse.json(
      { error: "Unable to generate recommended parts. Check supplier API configuration." },
      { status: 500 }
    )
  }
}
