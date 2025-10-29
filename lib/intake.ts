export const MAX_DYNAMIC_QUESTIONS = 5
export const MIN_DYNAMIC_QUESTIONS = 3

export type ProjectType = 'breadboard' | 'pcb' | 'custom'

export type IntakeQuestionType = 'text' | 'multiple_choice' | 'slider'

export interface TextQuestionConfig {
    type: 'text'
    prompt: string
    helperText?: string | null
    charLimit?: number | null
}

export interface MultipleChoiceQuestionConfig {
    type: 'multiple_choice'
    prompt: string
    helperText?: string | null
    options: Array<{
        value: string
        label: string
        helperText?: string | null
    }>
}

export interface SliderQuestionConfig {
    type: 'slider'
    prompt: string
    helperText?: string | null
    slider: {
        min: number
        max: number
        step?: number | null
        suggested?: number | null
        unit?: string | null
        explanation?: string | null
    }
}

export type IntakeQuestionConfig =
    | TextQuestionConfig
    | MultipleChoiceQuestionConfig
    | SliderQuestionConfig

export interface IntakeAnswerRecord {
    sequence: number
    question: IntakeQuestionConfig
    answer: unknown
}

interface SliderDefaults {
    min: number
    max: number
    suggested: number
    step: number
    unit?: string
    explanation?: string
}

const clampNumber = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const BUDGET_DEFAULTS: Record<ProjectType, SliderDefaults> = {
    breadboard: { min: 25, max: 400, suggested: 120, step: 5, unit: '$', explanation: 'Suggested prototype budget.' },
    pcb: { min: 100, max: 2500, suggested: 650, step: 10, unit: '$', explanation: 'Typical fabrication + assembly budget.' },
    custom: { min: 50, max: 1500, suggested: 450, step: 10, unit: '$', explanation: 'Estimated budget range for custom hardware.' }
}

const TIMELINE_DEFAULTS: Record<ProjectType, SliderDefaults> = {
    breadboard: { min: 1, max: 8, suggested: 4, step: 1, unit: 'weeks', explanation: 'Prototype build timeline.' },
    pcb: { min: 2, max: 26, suggested: 12, step: 1, unit: 'weeks', explanation: 'Design → fab → bring-up timeline.' },
    custom: { min: 2, max: 24, suggested: 10, step: 1, unit: 'weeks', explanation: 'Delivery timeline estimate.' }
}

const mergeSliderDefaults = (slider: SliderQuestionConfig['slider'], defaults: SliderDefaults): SliderQuestionConfig['slider'] => {
    const next: SliderQuestionConfig['slider'] = { ...slider }

    if (!Number.isFinite(next.min) || !Number.isFinite(next.max) || next.min >= next.max) {
        next.min = defaults.min
        next.max = defaults.max
    } else {
        next.min = Math.min(next.min, defaults.min)
        next.max = Math.max(next.max, defaults.max)
        if (next.min >= next.max) {
            next.min = defaults.min
            next.max = defaults.max
        }
    }

    next.step = next.step && next.step > 0 ? next.step : defaults.step
    next.unit = next.unit ?? defaults.unit ?? null
    next.suggested = next.suggested != null && Number.isFinite(next.suggested)
        ? clampNumber(next.suggested, next.min, next.max)
        : defaults.suggested
    next.explanation = next.explanation ?? defaults.explanation ?? null

    return next
}

export function isIntakeQuestionConfig(value: unknown): value is IntakeQuestionConfig {
    if (!value || typeof value !== 'object') return false
    const obj = value as Record<string, unknown>
    const type = obj.type

    if (type === 'text') {
        return typeof obj.prompt === 'string' && obj.prompt.length > 0
    }

    if (type === 'multiple_choice') {
        if (typeof obj.prompt !== 'string' || obj.prompt.length === 0) return false
        const options = obj.options
        if (!Array.isArray(options) || options.length < 2) return false
        return options.every(option => {
            return (
                option &&
                typeof option === 'object' &&
                typeof (option as Record<string, unknown>).value === 'string' &&
                typeof (option as Record<string, unknown>).label === 'string'
            )
        })
    }

    if (type === 'slider') {
        if (typeof obj.prompt !== 'string' || obj.prompt.length === 0) return false
        const slider = obj.slider as Record<string, unknown> | undefined
        if (!slider) return false
        const min = slider.min
        const max = slider.max
        if (typeof min !== 'number' || typeof max !== 'number') return false
        if (!Number.isFinite(min) || !Number.isFinite(max)) return false
        if (min >= max) return false
        if (slider.step != null && typeof slider.step !== 'number') return false
        if (slider.suggested != null && typeof slider.suggested !== 'number') return false
        if (slider.unit != null && typeof slider.unit !== 'string') return false
        return true
    }

    return false
}

export function serializeAnswersForPrompt(records: IntakeAnswerRecord[]): string {
    if (records.length === 0) {
        return 'No follow-up questions have been asked yet.'
    }

    const parts = records.map(record => {
        const prefix = `Q${record.sequence}: ${record.question.prompt}`
        let answerSummary = ''
        if (record.question.type === 'text') {
            answerSummary = String(record.answer ?? '').slice(0, 280)
        } else if (record.question.type === 'multiple_choice') {
            answerSummary = Array.isArray(record.answer)
                ? (record.answer as string[]).join(', ')
                : String(record.answer ?? '')
        } else if (record.question.type === 'slider') {
            answerSummary = String(record.answer ?? '')
        }

        return `${prefix}\nAnswer: ${answerSummary}`
    })

    return parts.join('\n\n')
}

export function getDefaultSliderValue(question: SliderQuestionConfig): number {
    const { min, max, suggested } = question.slider
    if (suggested != null && Number.isFinite(suggested)) {
        return clampNumber(suggested, min, max)
    }
    return clampNumber(Math.round((min + max) / 2), min, max)
}

export function applyQuestionHeuristics(question: IntakeQuestionConfig, projectType: ProjectType): IntakeQuestionConfig {
    if (question.type !== 'slider') {
        return question
    }

    const prompt = question.prompt.toLowerCase()
    let slider = { ...question.slider }
    let adjusted = false

    if (/budget|cost|price|spend|expense|bom/.test(prompt)) {
        slider = mergeSliderDefaults(slider, BUDGET_DEFAULTS[projectType])
        adjusted = true
    }

    if (/timeline|deadline|timeframe|schedule|delivery|finish|ship|complete/.test(prompt)) {
        slider = mergeSliderDefaults(slider, TIMELINE_DEFAULTS[projectType])
        adjusted = true
    }

    if (!adjusted) {
        slider.suggested = clampNumber(
            slider.suggested != null && Number.isFinite(slider.suggested)
                ? slider.suggested
                : Math.round((slider.min + slider.max) / 2),
            slider.min,
            slider.max
        )
        slider.step = slider.step && slider.step > 0 ? slider.step : Math.max(Math.round((slider.max - slider.min) / 20), 1)
        return { ...question, slider }
    }

    slider.suggested = clampNumber(slider.suggested ?? Math.round((slider.min + slider.max) / 2), slider.min, slider.max)

    return { ...question, slider }
}

