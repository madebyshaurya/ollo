import { NextResponse } from "next/server"
import { IntakeAnswerRecord, MAX_DYNAMIC_QUESTIONS, MIN_DYNAMIC_QUESTIONS, ProjectType } from "@/lib/intake"
import { createProject } from "@/lib/actions/projects"
import { getCurrentUserId } from "@/lib/supabase-server"

interface CompleteRequest {
  projectType: ProjectType
  projectName: string
  purpose: string
  experienceLevel?: number
  answers?: IntakeAnswerRecord[]
  skipMinimumCheck?: boolean
}

function validateProjectType(value: unknown): value is ProjectType {
  return value === "breadboard" || value === "pcb" || value === "custom"
}

function coerceNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function normalizeAnswers(raw: unknown): IntakeAnswerRecord[] {
  if (!Array.isArray(raw)) return []
  return raw
    .reduce<IntakeAnswerRecord[]>((acc, entry) => {
      if (!entry || typeof entry !== "object") {
        return acc
      }
      const record = entry as Partial<IntakeAnswerRecord>
      if (typeof record.sequence !== "number") {
        return acc
      }
      const question = record.question
      if (!question || typeof question !== "object") {
        return acc
      }

      acc.push({
        sequence: record.sequence,
        question: question as IntakeAnswerRecord["question"],
        answer: Object.prototype.hasOwnProperty.call(record, "answer") ? record.answer ?? null : null
      })
      return acc
    }, [])
    .slice(0, MAX_DYNAMIC_QUESTIONS)
}

function inferSliderValue(records: IntakeAnswerRecord[], keyword: string): number | null {
  for (const record of records) {
    if (record.question.type === "slider") {
      const prompt = record.question.prompt.toLowerCase()
      if (prompt.includes(keyword)) {
        const numeric = coerceNumber(record.answer)
        if (numeric != null) {
          return Math.round(Math.max(record.question.slider.min, Math.min(record.question.slider.max, numeric)))
        }
      }
    }
  }
  return null
}

function extractBudgetFromAnswer(record: IntakeAnswerRecord): number | null {
  if (record.question.type !== "slider") {
    return null
  }

  const prompt = record.question.prompt.toLowerCase()
  if (!/budget|cost|price|spend|expense/.test(prompt)) {
    return null
  }

  const answer = record.answer
  let num: number | null = null

  if (typeof answer === "string") {
    const match = answer.match(/[\d.]+/)
    if (match) {
      const parsed = Number.parseFloat(match[0])
      if (!isNaN(parsed) && isFinite(parsed)) {
        num = parsed
      }
    }
  } else {
    num = coerceNumber(answer)
  }

  if (num == null) return null
  return Math.max(1, Math.min(100, Math.round(num)))
}

function validateRequest(body: unknown): CompleteRequest {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid request payload")
  }

  const data = body as Record<string, unknown>

  if (!validateProjectType(data.projectType)) {
    throw new Error("projectType must be breadboard, pcb, or custom")
  }

  const projectName = typeof data.projectName === "string" ? data.projectName.trim() : ""
  if (!projectName) {
    throw new Error("projectName is required")
  }

  const purpose = typeof data.purpose === "string" ? data.purpose.trim() : ""
  if (!purpose) {
    throw new Error("purpose is required")
  }

  const experienceRaw = data.experienceLevel
  const experienceLevel =
    typeof experienceRaw === "number" && Number.isFinite(experienceRaw) && experienceRaw >= 1 && experienceRaw <= 10
      ? Math.round(experienceRaw)
      : 5

  const answers = normalizeAnswers(data.answers)
  const skipMinimumCheck = data.skipMinimumCheck === true

  return {
    projectType: data.projectType,
    projectName,
    purpose,
    experienceLevel,
    answers,
    skipMinimumCheck
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const payload = validateRequest(await request.json())
    const answers = payload.answers ?? []

    if (!payload.skipMinimumCheck && answers.length < MIN_DYNAMIC_QUESTIONS) {
      return new NextResponse("Minimum number of questions not yet answered", { status: 400 })
    }

    if (answers.length > MAX_DYNAMIC_QUESTIONS) {
      answers.length = MAX_DYNAMIC_QUESTIONS
    }

    const inferredComplexity = inferSliderValue(answers, "complexity") ?? (payload.experienceLevel ?? 5) * 10

    let budget = 50
    for (const record of answers) {
      const extracted = extractBudgetFromAnswer(record)
      if (extracted != null) {
        budget = extracted
        break
      }
    }
    budget = Math.max(1, Math.min(100, budget))

    const intakeMetadata = {
      answers,
      experienceLevel: payload.experienceLevel ?? 5
    }

    const createResult = await createProject({
      name: payload.projectName,
      description: payload.purpose,
      type: payload.projectType,
      budget,
      complexity: inferredComplexity,
      purpose: payload.purpose,
      customDescription: JSON.stringify(intakeMetadata)
    })

    if (!createResult.success || !createResult.project) {
      return new NextResponse(createResult.error || "Failed to create project", { status: 500 })
    }

    return NextResponse.json({
      status: "completed",
      projectId: createResult.project.id
    })
  } catch (error) {
    console.error("intake/complete error", error)
    const message = error instanceof Error ? error.message : "Internal Server Error"
    return new NextResponse(message, { status: 500 })
  }
}
