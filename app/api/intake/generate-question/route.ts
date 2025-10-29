import { NextResponse } from "next/server"
import { generateObject } from "ai"
import { google } from "@ai-sdk/google"
import { getCurrentUserId } from "@/lib/supabase-server"
import {
  IntakeAnswerRecord,
  IntakeQuestionConfig,
  MAX_DYNAMIC_QUESTIONS,
  MIN_DYNAMIC_QUESTIONS,
  ProjectType,
  applyQuestionHeuristics,
  isIntakeQuestionConfig,
  serializeAnswersForPrompt
} from "@/lib/intake"
import { z } from "zod"

interface GenerateQuestionRequest {
  projectType: ProjectType
  projectName: string
  purpose: string
  experienceLevel?: number
  answers?: IntakeAnswerRecord[]
  maxQuestions?: number
  temperature?: number
}

const BASE_SYSTEM_PROMPT = `You are a beginner-friendly, idea-first hardware project intake assistant.
- Ask one thoughtful, non-technical question at a time.
- Focus on the idea, goals, constraints, budget, and timeline rather than implementation or component selection.
- Prefer simple language. Avoid deep technical terms, part numbers, or brand/model suggestions unless the user explicitly asked.
- Choose the best input type:
  1. "text": short open-ended answers. Include a recommended character limit.
  2. "multiple_choice": 3-5 clear options (value+label) for preferences, experience, or scope.
     IMPORTANT: Each option label MUST be under 60 characters. Keep labels SHORT and CONCISE.
  3. "slider": numeric ranges for budget or timeline (sensible min/max, suggested value, unit).
- Ask budget and/or timeline within the first 3 questions when relevant.
- Always respond as JSON matching the provided schema, with no extra commentary.
- For multiple choice options, keep labels under 60 characters or they will fail validation.`

const QuestionSchema = z
  .object({
    type: z.enum(["text", "multiple_choice", "slider"]),
    prompt: z.string().min(4).max(240),
    helperText: z.string().min(2).max(280).optional(),
    charLimit: z.number().int().min(0).max(500).optional(),
    options: z
      .array(
        z.object({
          value: z.string().min(1).max(60),
          label: z.string().min(1).max(60),
          helperText: z.string().min(2).max(160).optional()
        })
      )
      .max(6)
      .optional(),
    slider: z
      .object({
        min: z.number(),
        max: z.number(),
        step: z.number().positive().optional(),
        suggested: z.number().optional(),
        unit: z.string().max(16).optional(),
        explanation: z.string().min(2).max(200).optional()
      })
      .optional()
  })
  .refine(val => (val.type === "slider" ? !!val.slider : true), {
    message: "Slider questions must include slider config"
  })
  .refine(val => (val.type === "multiple_choice" ? Array.isArray(val.options) : true), {
    message: "Multiple choice questions must include options"
  })
  .refine(val => (val.type !== "multiple_choice" ? (!val.options || val.options.length === 0) : true), {
    message: "Options should only be provided for multiple choice questions"
  })
  .refine(val => (val.type !== "slider" ? !val.slider : true), {
    message: "Slider config should only be provided for slider questions"
  })
  .refine(val => {
    if (!val.slider) return true
    return Number.isFinite(val.slider.min) && Number.isFinite(val.slider.max) && val.slider.min < val.slider.max
  }, {
    message: "Slider min/max must be finite numbers and min < max"
  })

const FALLBACK_QUESTION: IntakeQuestionConfig = {
  type: "text",
  prompt: "What is one key component or dependency you already have in mind for this build?",
  helperText: "Share 1-2 sentences so we can tailor sourcing and planning.",
  charLimit: 160
}

function buildUserPrompt(
  projectType: ProjectType,
  projectName: string,
  purpose: string,
  answers: IntakeAnswerRecord[],
  questionCount: number,
  experienceLevel: number
) {
  const formattedAnswers = serializeAnswersForPrompt(answers)
  const guidance =
    questionCount === 0
      ? `Next-question guidance: Ask about specific goals, constraints, or preferences for this project. Keep it friendly and relevant to their experience level.`
      : questionCount <= 2
        ? `Next-question guidance: Consider asking about timeline, specific features, or technical requirements based on their experience level.`
        : `Next-question guidance: Continue exploring high-level goals, constraints, or user preferences. Avoid technical implementation details.`

  const experienceLabel =
    experienceLevel <= 2
      ? "Beginner"
      : experienceLevel <= 4
        ? "Novice"
        : experienceLevel <= 6
          ? "Intermediate"
          : experienceLevel <= 8
            ? "Advanced"
            : "Expert"

  return `Project Overview:
- Type: ${projectType}
- Name: ${projectName}
- One-line purpose: ${purpose}
- Experience level: ${experienceLevel}/10 (${experienceLabel})

Questions asked so far (${questionCount}):
${formattedAnswers}

Instruction: Provide the next best follow-up question as JSON.
${guidance}
Tailor the question complexity to their experience level (${experienceLabel}). Avoid technical component/schematic questions. Prefer idea-level discovery.`
}

function normalizeAnswers(raw: unknown): IntakeAnswerRecord[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map(item => {
      const value = item as IntakeAnswerRecord
      if (typeof value !== "object" || value === null) return null
      if (typeof value.sequence !== "number") return null
      if (!value.question || typeof value.question !== "object") return null
      return {
        sequence: value.sequence,
        question: value.question,
        answer: Object.prototype.hasOwnProperty.call(value, "answer") ? value.answer : null
      } satisfies IntakeAnswerRecord
    })
    .filter((record): record is IntakeAnswerRecord => record != null)
    .slice(0, MAX_DYNAMIC_QUESTIONS)
}

function validateRequest(body: unknown): GenerateQuestionRequest {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid request payload")
  }
  const data = body as Record<string, unknown>

  const projectType = data.projectType
  if (projectType !== "breadboard" && projectType !== "pcb" && projectType !== "custom") {
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

  const experienceLevelRaw = (data as Record<string, unknown>).experienceLevel
  const experienceLevel =
    typeof experienceLevelRaw === "number" && Number.isFinite(experienceLevelRaw) && experienceLevelRaw >= 1 && experienceLevelRaw <= 10
      ? Math.round(experienceLevelRaw)
      : 5

  const maxQuestions = typeof data.maxQuestions === "number" ? Math.max(1, Math.min(10, data.maxQuestions)) : MAX_DYNAMIC_QUESTIONS
  const temperature = typeof data.temperature === "number" ? Math.min(Math.max(data.temperature, 0), 1) : 0.4
  const answers = normalizeAnswers((data as Record<string, unknown>).answers)

  return {
    projectType,
    projectName,
    purpose,
    experienceLevel,
    answers,
    maxQuestions,
    temperature
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const payload = validateRequest(await request.json())

    const dynamicQuestions = payload.answers ?? []

    if (dynamicQuestions.length >= (payload.maxQuestions ?? MAX_DYNAMIC_QUESTIONS)) {
      return NextResponse.json({
        status: "question_limit_reached",
        canComplete: dynamicQuestions.length >= MIN_DYNAMIC_QUESTIONS,
        remaining: 0
      })
    }

    const nextSequence = dynamicQuestions.length + 1
    const startTime = Date.now()

    const userPrompt = buildUserPrompt(
      payload.projectType,
      payload.projectName,
      payload.purpose,
      dynamicQuestions,
      dynamicQuestions.length,
      payload.experienceLevel ?? 5
    )

    let parsedQuestion: IntakeQuestionConfig | null = null
    let usage: { promptTokens?: number; completionTokens?: number; totalTokens?: number } | undefined
    let generationError: unknown = null

    try {
      const result = await generateObject({
        model: google("gemini-2.5-flash"),
        schema: QuestionSchema,
        messages: [
          { role: "system", content: BASE_SYSTEM_PROMPT },
          { role: "user", content: userPrompt }
        ]
      })
      usage = result.usage
      parsedQuestion = result.object as IntakeQuestionConfig
    } catch (error) {
      generationError = error
      console.error("AI question generation failed", error)
    }

    const latencyMs = Date.now() - startTime

    if (!parsedQuestion || !isIntakeQuestionConfig(parsedQuestion)) {
      console.warn("Falling back to default intake question", generationError)
      const adjustedFallback = applyQuestionHeuristics(FALLBACK_QUESTION, payload.projectType)

      const remainingFallback = (payload.maxQuestions ?? MAX_DYNAMIC_QUESTIONS) - nextSequence

      return NextResponse.json({
        sequence: nextSequence,
        question: adjustedFallback,
        remaining: remainingFallback > 0 ? remainingFallback : 0,
        canComplete: nextSequence >= MIN_DYNAMIC_QUESTIONS - 1,
        usage,
        latencyMs,
        model: "fallback"
      })
    }

    const adjustedQuestion = applyQuestionHeuristics(parsedQuestion, payload.projectType)
    const remaining = (payload.maxQuestions ?? MAX_DYNAMIC_QUESTIONS) - nextSequence

    return NextResponse.json({
      sequence: nextSequence,
      question: adjustedQuestion,
      remaining: remaining > 0 ? remaining : 0,
      canComplete: nextSequence >= MIN_DYNAMIC_QUESTIONS - 1,
      usage,
      latencyMs,
      model: "gemini-2.5-flash"
    })
  } catch (error) {
    console.error("generate-question error", error)
    const message = error instanceof Error ? error.message : "Internal Server Error"
    return new NextResponse(message, { status: 500 })
  }
}
