"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { TextureButton } from "@/components/ui/texture-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle2, ArrowLeft, ArrowRight } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  IntakeAnswerRecord,
  IntakeQuestionConfig,
  MAX_DYNAMIC_QUESTIONS,
  MIN_DYNAMIC_QUESTIONS,
  MultipleChoiceQuestionConfig,
  SliderQuestionConfig,
  TextQuestionConfig,
  ProjectType,
  getDefaultSliderValue
} from "@/lib/intake"

interface ProjectCreationModalProps {
  children: React.ReactNode
}

type WizardStep = "type" | "name" | "purpose" | "experience" | "ai"

const MAX_PURPOSE_WORDS = 50

const TYPE_OPTIONS: Array<{ type: ProjectType; title: string; subtitle: string; image: string }> = [
  { type: "breadboard", title: "Breadboard", subtitle: "Prototyping", image: "/illustrations/breadboard.png" },
  { type: "pcb", title: "PCB Design", subtitle: "Production", image: "/illustrations/pcb.png" },
  { type: "custom", title: "Custom", subtitle: "Other", image: "/illustrations/custom.png" }
]


function getExperienceLabel(level: number): string {
  if (level <= 2) return "Beginner"
  if (level <= 4) return "Novice"
  if (level <= 6) return "Intermediate"
  if (level <= 8) return "Advanced"
  return "Expert"
}

function countWords(value: string) {
  if (!value.trim()) return 0
  return value.trim().split(/\s+/).filter(Boolean).length
}

function formatSliderValue(slider: SliderQuestionConfig["slider"], rawValue: number | null) {
  const value = rawValue != null && Number.isFinite(rawValue) ? Math.round(rawValue) : Math.round(slider.suggested ?? slider.min)

  // Handle pluralization for common units
  if (slider.unit) {
    const unit = slider.unit.toLowerCase()
    // Check if the unit needs pluralization
    const needsPlural = value !== 1
    const pluralMap: Record<string, string> = {
      'month': needsPlural ? 'months' : 'month',
      'week': needsPlural ? 'weeks' : 'week',
      'day': needsPlural ? 'days' : 'day',
      'year': needsPlural ? 'years' : 'year',
      '$': '$' // No pluralization for currency
    }

    const displayUnit = pluralMap[unit] || unit

    // For currency, show after value. For time units, show after value.
    if (unit === '$') {
      return `${displayUnit}${value}`
    } else {
      return `${value} ${displayUnit}`
    }
  }

  return `${value}`
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong. Please try again."
}

export function ProjectCreationModal({ children }: ProjectCreationModalProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [step, setStep] = React.useState<WizardStep>("type")
  const [projectType, setProjectType] = React.useState<ProjectType | null>(null)
  const [projectName, setProjectName] = React.useState("")
  const [purpose, setPurpose] = React.useState("")

  const [experienceLevel, setExperienceLevel] = React.useState(5)
  const [showStartOverConfirm, setShowStartOverConfirm] = React.useState(false)

  const [currentQuestion, setCurrentQuestion] = React.useState<IntakeQuestionConfig | null>(null)
  const [currentSequence, setCurrentSequence] = React.useState<number | null>(null)
  const [currentAnswer, setCurrentAnswer] = React.useState<string | number | null>(null)
  const [dynamicAnswers, setDynamicAnswers] = React.useState<IntakeAnswerRecord[]>([])

  const [remainingQuestions, setRemainingQuestions] = React.useState<number | null>(null)
  const [questionLimitReached, setQuestionLimitReached] = React.useState(false)
  const [budgetCurrency, setBudgetCurrency] = React.useState("USD")
  const [budgetValue, setBudgetValue] = React.useState("")

  const [isInitializing, setIsInitializing] = React.useState(false)
  const [isLoadingQuestion, setIsLoadingQuestion] = React.useState(false)
  const [isSubmittingAnswer, setIsSubmittingAnswer] = React.useState(false)
  const [isCompleting, setIsCompleting] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  const purposeWordCount = React.useMemo(() => countWords(purpose), [purpose])
  const purposeExceeded = purposeWordCount > MAX_PURPOSE_WORDS
  const answeredCount = dynamicAnswers.length

  const projectNameSample = React.useMemo(() => {
    if (projectType === "breadboard") return "Arduino Weather Station"
    if (projectType === "pcb") return "Custom Keyboard PCB"
    if (projectType === "custom") return "Wearable Health Monitor"
    return "Give your project a name"
  }, [projectType])

  const purposeSample = React.useMemo(() => {
    if (projectType === "breadboard") return "A weather station that displays the current weather conditions on a LCD display."
    if (projectType === "pcb")
      return "A 9 key minimalistic, clean keyboard with a OLED display and a rotary encoder. Easy to use and customizable software, purpose is to help out with quick mini tasks."
    if (projectType === "custom") return "A e-scooter with a motor controller and a battery management system."
    return "In one sentence, what does your project do?"
  }, [projectType])

  const handleProjectNameTabFill = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key !== "Tab" || event.shiftKey) return
      if (projectName.trim()) return
      if (!projectNameSample) return

      event.preventDefault()
      const target = event.currentTarget
      const sampleText = projectNameSample
      setProjectName(sampleText)
      requestAnimationFrame(() => {
        target.focus()
        target.setSelectionRange(sampleText.length, sampleText.length)
      })
    },
    [projectName, projectNameSample]
  )

  const handlePurposeTabFill = React.useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key !== "Tab" || event.shiftKey) return
      if (purpose.trim()) return
      if (!purposeSample) return

      event.preventDefault()
      const target = event.currentTarget
      const sampleText = purposeSample
      setPurpose(sampleText)
      requestAnimationFrame(() => {
        target.focus()
        target.setSelectionRange(sampleText.length, sampleText.length)
      })
    },
    [purpose, purposeSample]
  )

  const resetWizard = React.useCallback(() => {
    setStep("type")
    setProjectType(null)
    setProjectName("")
    setPurpose("")
    setExperienceLevel(5)
    setCurrentQuestion(null)
    setCurrentSequence(null)
    setCurrentAnswer(null)
    setDynamicAnswers([])
    setRemainingQuestions(null)
    setQuestionLimitReached(false)
    setIsInitializing(false)
    setIsLoadingQuestion(false)
    setIsSubmittingAnswer(false)
    setIsCompleting(false)
    setErrorMessage(null)
  }, [])

  const handleOpenChange = React.useCallback(
    (value: boolean) => {
      setOpen(value)
      if (!value) {
        resetWizard()
      }
    },
    [resetWizard]
  )

  const canAdvanceFromType = Boolean(projectType)
  const canAdvanceFromName = projectName.trim().length >= 3
  const canAdvanceFromPurpose = purpose.trim().length > 0 && !purposeExceeded
  const canAdvanceFromExperience = experienceLevel >= 1 && experienceLevel <= 10

  const progressValue = React.useMemo(() => {
    if (isCompleting) return 100
    const baseCompleted =
      step === "type"
        ? 0
        : step === "name"
          ? 1
          : step === "purpose"
            ? 2
            : step === "experience"
              ? 3
              : 4
    const totalIntakeTarget = Math.max(MIN_DYNAMIC_QUESTIONS, answeredCount + (currentQuestion ? 1 : 0))
    const denominator = Math.max(4 + totalIntakeTarget, 1)
    const numerator = baseCompleted + answeredCount
    return Math.min(Math.round((numerator / denominator) * 100), 99)
  }, [isCompleting, step, answeredCount, currentQuestion])

  const answerIsValid = React.useMemo(() => {
    if (!currentQuestion) return false
    if (currentQuestion.type === "text") {
      if (typeof currentAnswer !== "string") return false
      const trimmed = currentAnswer.trim()
      if (!trimmed) return false
      if (typeof currentQuestion.charLimit === "number" && trimmed.length > currentQuestion.charLimit) return false
      return true
    }
    if (currentQuestion.type === "multiple_choice") {
      if (typeof currentAnswer !== "string" || !currentAnswer) return false
      const multi = currentQuestion as MultipleChoiceQuestionConfig
      return multi.options.some(option => option.value === currentAnswer)
    }
    if (currentQuestion.type === "slider") {
      // Special handling for budget questions
      const prompt = currentQuestion.prompt.toLowerCase()
      if (/budget|cost|price|spend|expense/.test(prompt)) {
        // For budget, check if we have a valid number
        if (!budgetValue.trim()) return false
        const num = Number.parseFloat(budgetValue)
        return !isNaN(num) && isFinite(num) && num > 0
      }
      return typeof currentAnswer === "number" && Number.isFinite(currentAnswer)
    }
    return false
  }, [currentQuestion, currentAnswer, budgetValue])

  const isBudgetQuestion = React.useMemo(() => {
    if (!currentQuestion || currentQuestion.type !== "slider") return false
    const prompt = currentQuestion.prompt.toLowerCase()
    return /budget|cost|price|spend|expense/.test(prompt)
  }, [currentQuestion])

  const canFinish = answeredCount >= MIN_DYNAMIC_QUESTIONS && !currentQuestion && !isInitializing && !isLoadingQuestion && !isSubmittingAnswer

  const parseResponse = React.useCallback(async <T,>(response: Response): Promise<T> => {
    const text = await response.text()
    let data: unknown = {}

    if (text) {
      try {
        data = JSON.parse(text)
      } catch {
        data = { message: text }
      }
    }

    if (!response.ok) {
      const extractMessage = (payload: unknown): string | null => {
        if (payload && typeof payload === "object") {
          const record = payload as Record<string, unknown>
          if (typeof record.message === "string") return record.message
          if (typeof record.error === "string") return record.error
        }
        return null
      }

      const fallbackMessage = text || response.statusText || "Request failed"
      throw new Error(extractMessage(data) ?? fallbackMessage)
    }

    return data as T
  }, [])


  const fetchQuestion = React.useCallback(
    async (mode: "initial" | "follow-up" = "follow-up", answersOverride?: IntakeAnswerRecord[]) => {
      if (!projectType || !projectName.trim() || !purpose.trim()) {
        setErrorMessage("Project details are incomplete.")
        return
      }
      if (mode === "follow-up" && questionLimitReached) {
        return
      }

      if (mode === "initial") {
        setIsInitializing(true)
      } else {
        setIsLoadingQuestion(true)
      }
      setErrorMessage(null)

      try {
        const answersToSend = answersOverride ?? dynamicAnswers
        const body: Record<string, unknown> = {
          projectType,
          projectName: projectName.trim(),
          purpose: purpose.trim(),
          experienceLevel,
          maxQuestions: MAX_DYNAMIC_QUESTIONS,
          answers: answersToSend
        }

        const response = await fetch("/api/intake/generate-question", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        })

        const data = await parseResponse<{
          sequence?: number
          question?: IntakeQuestionConfig
          remaining?: number
          canComplete?: boolean
          status?: string
        }>(response)

        if (!data.question || typeof data.sequence !== "number") {
          setCurrentQuestion(null)
          setCurrentSequence(null)
          setRemainingQuestions(0)
          setQuestionLimitReached(true)
          return
        }

        setCurrentQuestion(data.question)
        setCurrentSequence(data.sequence)
        setRemainingQuestions(typeof data.remaining === "number" ? data.remaining : null)
        setQuestionLimitReached(data.status === "question_limit_reached" || (typeof data.remaining === "number" && data.remaining <= 0))

        if (data.question.type === "slider") {
          // Check if it's a budget question
          const prompt = data.question.prompt.toLowerCase()
          if (/budget|cost|price|spend|expense/.test(prompt)) {
            setCurrentAnswer(null)
            setBudgetValue("")
            setBudgetCurrency("USD")
          } else {
            setCurrentAnswer(getDefaultSliderValue(data.question as SliderQuestionConfig))
          }
        } else if (data.question.type === "text") {
          setCurrentAnswer("")
        } else {
          setCurrentAnswer(null)
        }
      } catch (error) {
        setErrorMessage(getErrorMessage(error))
      } finally {
        if (mode === "initial") {
          setIsInitializing(false)
        } else {
          setIsLoadingQuestion(false)
        }
      }
    },
    [projectType, projectName, purpose, experienceLevel, dynamicAnswers, questionLimitReached, parseResponse]
  )

  React.useEffect(() => {
    if (!open) return
    if (step === "ai" && !currentQuestion && dynamicAnswers.length === 0 && !isInitializing && !isLoadingQuestion) {
      void fetchQuestion("initial")
    }
  }, [open, step, currentQuestion, dynamicAnswers.length, isInitializing, isLoadingQuestion, fetchQuestion])


  const handleCancel = React.useCallback(() => {
    setOpen(false)
  }, [])

  const handleBack = React.useCallback(() => {
    if (step === "ai") {
      setShowStartOverConfirm(true)
      return
    }
    if (step === "type") {
      handleCancel()
      return
    }
    if (step === "name") {
      setStep("type")
      return
    }
    if (step === "purpose") {
      setStep("name")
      return
    }
    if (step === "experience") {
      setStep("purpose")
      return
    }
  }, [step, handleCancel])

  const handleStartOverConfirm = React.useCallback(() => {
    setShowStartOverConfirm(false)
    resetWizard()
  }, [resetWizard])

  const handleStartOverCancel = React.useCallback(() => {
    setShowStartOverConfirm(false)
  }, [])

  const handleNext = React.useCallback(async () => {
    if (step === "type") {
      setStep("name")
      return
    }
    if (step === "name") {
      setStep("purpose")
      return
    }
    if (step === "purpose") {
      setStep("experience")
      return
    }
    if (step === "experience") {
      setStep("ai")
    }
  }, [step])

  const handleSubmitAnswer = React.useCallback(async () => {
    if (!currentQuestion || currentSequence == null) return
    if (!answerIsValid) return

    let cleanedAnswer: unknown = currentAnswer
    if (currentQuestion.type === "text") {
      cleanedAnswer = typeof currentAnswer === "string" ? currentAnswer.trim() : ""
    } else if (currentQuestion.type === "multiple_choice") {
      cleanedAnswer = currentAnswer
    } else if (currentQuestion.type === "slider") {
      // Special handling for budget questions
      const prompt = currentQuestion.prompt.toLowerCase()
      if (/budget|cost|price|spend|expense/.test(prompt)) {
        // For budget, combine value and currency
        const num = Number.parseFloat(budgetValue)
        cleanedAnswer = `${budgetCurrency} ${num}`
      } else {
        cleanedAnswer = typeof currentAnswer === "number" ? currentAnswer : Number(currentAnswer)
      }
    }

    setIsSubmittingAnswer(true)
    setErrorMessage(null)

    try {
      const nextRecord: IntakeAnswerRecord = { sequence: currentSequence, question: currentQuestion, answer: cleanedAnswer }
      const nextAnswers = [...dynamicAnswers, nextRecord]
      setDynamicAnswers(nextAnswers)

      const nextRemaining =
        remainingQuestions != null
          ? Math.max(remainingQuestions - 1, 0)
          : Math.max(MAX_DYNAMIC_QUESTIONS - nextAnswers.length, 0)

      setCurrentQuestion(null)
      setCurrentSequence(null)
      setCurrentAnswer(null)
      setRemainingQuestions(nextRemaining)
      setQuestionLimitReached(nextRemaining <= 0)

      if (nextRemaining > 0) {
        await fetchQuestion("follow-up", nextAnswers)
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsSubmittingAnswer(false)
    }
  }, [currentQuestion, currentSequence, currentAnswer, dynamicAnswers, remainingQuestions, fetchQuestion, answerIsValid, budgetCurrency, budgetValue])

  const handleComplete = React.useCallback(async () => {
    if (!canFinish) return
    setIsCompleting(true)
    setErrorMessage(null)
    try {
      const response = await fetch("/api/intake/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectType,
          projectName: projectName.trim(),
          purpose: purpose.trim(),
          experienceLevel,
          answers: dynamicAnswers
        })
      })
      const data = await parseResponse<{ projectId: string }>(response)
      setOpen(false)
      router.push(`/dashboard/${data.projectId}`)
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsCompleting(false)
    }
  }, [canFinish, projectType, projectName, purpose, experienceLevel, dynamicAnswers, parseResponse, router])

  const typeStep = (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground">Choose Project Type</Label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {TYPE_OPTIONS.map(option => (
            <Card
              key={option.type}
              className={cn(
                "cursor-pointer border border-border bg-card transition-all hover:bg-accent",
                projectType === option.type && "ring-2 ring-ring bg-accent"
              )}
              onClick={() => setProjectType(option.type)}
            >
              <CardHeader className="pb-3">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex h-24 w-24 items-center justify-center">
                    <Image
                      src={option.image}
                      alt={`${option.title} illustration`}
                      width={128}
                      height={128}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="text-center">
                    <CardTitle className="text-sm font-sans text-card-foreground">{option.title}</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground">{option.subtitle}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <TextureButton variant="destructive" onClick={handleCancel} className="sm:flex-none sm:w-auto">
          Cancel
        </TextureButton>
        <TextureButton
          variant={canAdvanceFromType ? "accent" : "minimal"}
          onClick={() => void handleNext()}
          disabled={!canAdvanceFromType}
          className="sm:flex-none sm:w-auto"
        >
          <ArrowRight className="mr-2 h-4 w-4" />
          Next
        </TextureButton>
      </div>
    </div>
  )

  const nameStep = (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="project-name" className="text-sm font-medium text-foreground">
          Project Name
        </Label>
        <div className="relative">
          <Input
            id="project-name"
            placeholder=" "
            aria-placeholder={projectNameSample}
            value={projectName}
            onChange={event => setProjectName(event.target.value)}
            onKeyDown={handleProjectNameTabFill}
            className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-ring"
          />
          {!projectName ? (
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center gap-2 text-sm text-muted-foreground">
              <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground opacity-60">
                Tab
              </kbd>
              <span>{projectNameSample}</span>
            </div>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">A memorable name helps you reference it later.</p>
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <TextureButton variant="minimal" onClick={handleBack} className="sm:flex-none sm:w-auto">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </TextureButton>
        <TextureButton
          variant={canAdvanceFromName ? "accent" : "minimal"}
          onClick={() => void handleNext()}
          disabled={!canAdvanceFromName}
          className="sm:flex-none sm:w-auto"
        >
          <ArrowRight className="mr-2 h-4 w-4" />
          Next
        </TextureButton>
      </div>
    </div>
  )

  const purposeStep = (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="project-purpose" className="text-sm font-medium text-foreground">
          In one sentence, what does this project do?
        </Label>
        <div className="relative">
          <Textarea
            id="project-purpose"
            placeholder=" "
            aria-placeholder={purposeSample}
            value={purpose}
            onChange={event => setPurpose(event.target.value)}
            onKeyDown={handlePurposeTabFill}
            className={cn(
              "bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-ring min-h-[110px] resize-none",
              purposeExceeded && "border-destructive focus:border-destructive"
            )}
          />
          {!purpose ? (
            <div className="pointer-events-none absolute left-3 right-3 top-2 flex items-start gap-2 text-sm text-muted-foreground">
              <kbd className="mt-0.5 rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground opacity-60">
                Tab
              </kbd>
              <span className="flex-1 leading-relaxed">{purposeSample}</span>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className={purposeExceeded ? "text-destructive" : "text-muted-foreground"}>
            {purposeWordCount}/{MAX_PURPOSE_WORDS} words
          </span>
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
            <span>Keep it concise (≤ {MAX_PURPOSE_WORDS} words).</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <TextureButton variant="minimal" onClick={handleBack} className="sm:flex-none sm:w-auto">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </TextureButton>
        <TextureButton
          variant={canAdvanceFromPurpose ? "accent" : "minimal"}
          onClick={() => void handleNext()}
          disabled={!canAdvanceFromPurpose}
          className="sm:flex-none sm:w-auto"
        >
          <ArrowRight className="mr-2 h-4 w-4" />
          Next
        </TextureButton>
      </div>
    </div>
  )

  const experienceStep = (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">
            How experienced are you with this type of project?
          </Label>
          <p className="text-xs text-muted-foreground">
            This helps us tailor our questions and suggestions to your skill level.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Beginner</span>
            <span className="text-sm text-muted-foreground">Expert</span>
          </div>

          <Slider
            value={[experienceLevel]}
            onValueChange={(value) => setExperienceLevel(value[0])}
            min={1}
            max={10}
            step={1}
            className="w-full"
          />

          <div className="flex items-center justify-center">
            <div className="rounded-lg bg-accent/20 px-4 py-2">
              <span className="text-lg font-semibold text-foreground">
                {experienceLevel}/10 - {getExperienceLabel(experienceLevel)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <TextureButton variant="minimal" onClick={handleBack} className="sm:flex-none sm:w-auto">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </TextureButton>
        <TextureButton
          variant={canAdvanceFromExperience ? "accent" : "minimal"}
          onClick={() => void handleNext()}
          disabled={!canAdvanceFromExperience}
          className="sm:flex-none sm:w-auto"
        >
          <ArrowRight className="mr-2 h-4 w-4" />
          Next
        </TextureButton>
      </div>
    </div>
  )

  const aiStep = (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card/40 p-5">
        {isInitializing || isLoadingQuestion ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-24" />
          </div>
        ) : currentQuestion ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Q{currentSequence}: {currentQuestion.prompt}</p>
              {"helperText" in currentQuestion && currentQuestion.helperText ? (
                <p className="text-xs text-muted-foreground">{currentQuestion.helperText}</p>
              ) : null}
            </div>
            {currentQuestion.type === "text" && (
              <div className="space-y-2">
                <Textarea
                  value={typeof currentAnswer === "string" ? currentAnswer : ""}
                  onChange={event => setCurrentAnswer(event.target.value)}
                  maxLength={(currentQuestion as TextQuestionConfig).charLimit ?? undefined}
                  className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-ring min-h-[120px] resize-none"
                  placeholder="Type your answer..."
                />
                {(currentQuestion as TextQuestionConfig).charLimit ? (
                  <p className="text-right text-xs text-muted-foreground">
                    {(typeof currentAnswer === "string" ? currentAnswer.trim().length : 0)} / {(currentQuestion as TextQuestionConfig).charLimit} characters
                  </p>
                ) : null}
              </div>
            )}
            {currentQuestion.type === "multiple_choice" && (
              <div className="grid gap-2 sm:grid-cols-2">
                {(currentQuestion as MultipleChoiceQuestionConfig).options.map(option => {
                  const isActive = currentAnswer === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setCurrentAnswer(option.value)}
                      className={cn(
                        "rounded-xl border border-border bg-background/60 p-3 text-left transition",
                        isActive && "border-ring bg-accent text-foreground shadow-sm"
                      )}
                    >
                      <p className="text-sm font-medium">{option.label}</p>
                      {option.helperText ? (
                        <p className="text-xs text-muted-foreground mt-1">{option.helperText}</p>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            )}
            {currentQuestion.type === "slider" && isBudgetQuestion ? (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Select value={budgetCurrency} onValueChange={setBudgetCurrency}>
                    <SelectTrigger className="w-32 bg-background border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="CAD">CAD</SelectItem>
                      <SelectItem value="AUD">AUD</SelectItem>
                      <SelectItem value="JPY">JPY</SelectItem>
                      <SelectItem value="CNY">CNY</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={budgetValue}
                    onChange={(e) => {
                      const val = e.target.value
                      // Allow empty string, numbers, and one decimal point
                      if (val === "" || /^\d*\.?\d*$/.test(val)) {
                        setBudgetValue(val)
                      }
                    }}
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-ring"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            ) : currentQuestion.type === "slider" ? (
              <div className="space-y-4">
                {(() => {
                  const sliderQuestion = currentQuestion as SliderQuestionConfig
                  const value =
                    typeof currentAnswer === "number"
                      ? currentAnswer
                      : getDefaultSliderValue(sliderQuestion)
                  return (
                    <>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatSliderValue(sliderQuestion.slider, sliderQuestion.slider.min)}</span>
                        <span>{formatSliderValue(sliderQuestion.slider, value)}</span>
                        <span>{formatSliderValue(sliderQuestion.slider, sliderQuestion.slider.max)}</span>
                      </div>
                      <Slider
                        value={[value]}
                        onValueChange={(newValue) => setCurrentAnswer(newValue[0])}
                        min={sliderQuestion.slider.min}
                        max={sliderQuestion.slider.max}
                        step={sliderQuestion.slider.step ?? 1}
                        className="w-full"
                      />
                      {sliderQuestion.slider.explanation ? (
                        <p className="text-xs text-muted-foreground">{sliderQuestion.slider.explanation}</p>
                      ) : null}
                    </>
                  )
                })()}
              </div>
            ) : null}
            <TextureButton
              variant={answerIsValid ? "accent" : "minimal"}
              onClick={handleSubmitAnswer}
              disabled={!answerIsValid || isSubmittingAnswer}
              className="w-full sm:w-auto"
            >
              {isSubmittingAnswer ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Next
                </>
              ) : (
                <>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Next
                </>
              )}
            </TextureButton>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-sm font-medium text-foreground">All set for now.</p>
              <p className="text-xs text-muted-foreground">
                {questionLimitReached
                  ? "You’ve covered everything this project needs."
                  : "You can wrap up whenever you’re ready."}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <TextureButton
          variant="minimal"
          onClick={handleBack}
          className="sm:flex-none sm:w-auto"
          disabled={isInitializing || isLoadingQuestion || isSubmittingAnswer || isCompleting}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Start over
        </TextureButton>
        <TextureButton
          variant={canFinish ? "accent" : "minimal"}
          onClick={handleComplete}
          disabled={!canFinish}
          className="sm:flex-none sm:w-auto"
        >
          {isCompleting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Finish & Create Project
            </>
          )}
        </TextureButton>
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[640px] w-[95vw] max-h-[90vh] overflow-y-auto bg-background border-border backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-editorial-new font-light text-foreground">
            Create New Project
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6">
          <Progress value={progressValue} />
          {errorMessage && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          )}
          {step === "type" && typeStep}
          {step === "name" && nameStep}
          {step === "purpose" && purposeStep}
          {step === "experience" && experienceStep}
          {step === "ai" && aiStep}
        </div>
      </DialogContent>

      {/* Start Over Confirmation Dialog */}
      <Dialog open={showStartOverConfirm} onOpenChange={setShowStartOverConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start Over?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to start over? This will clear all your current progress and you&apos;ll lose all the information you&apos;ve entered.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <TextureButton
                variant="minimal"
                onClick={handleStartOverCancel}
                className="sm:flex-none sm:w-auto"
              >
                Cancel
              </TextureButton>
              <TextureButton
                variant="accent"
                onClick={handleStartOverConfirm}
                className="sm:flex-none sm:w-auto"
              >
                Yes, Start Over
              </TextureButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
