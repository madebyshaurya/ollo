import { NextResponse } from "next/server"

import { advanceProjectWorkflowStage } from "@/lib/actions/projects"
import { toProjectStageId } from "@/lib/workflows"

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = (await request.json().catch(() => null)) as
      | {
          projectType?: "breadboard" | "pcb" | "custom"
          currentStage?: string | null
        }
      | null

    if (!body?.projectType) {
      return NextResponse.json({ error: "Missing project type" }, { status: 400 })
    }

    const currentStage = toProjectStageId(body.projectType, body.currentStage)

    const result = await advanceProjectWorkflowStage(
      id,
      body.projectType,
      currentStage
    )

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to update stage" }, { status: 400 })
    }

    return NextResponse.json({ nextStage: result.nextStage ?? null })
  } catch (error) {
    console.error("Advance stage API error:", error)
    return NextResponse.json(
      { error: "Unexpected error while advancing stage" },
      { status: 500 }
    )
  }
}
