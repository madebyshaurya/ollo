"use server"

import { createServerSupabaseClient, getCurrentUserId } from "@/lib/supabase-server"
import { revalidatePath } from "next/cache"
import type { IntakeAnswerRecord } from "@/lib/intake"

export interface ProjectContextRecord {
    id: string
    type: "intake_question" | "project_field"
    label: string
    content: string
    editable: boolean
}

export async function getProjectContext(projectId: string): Promise<ProjectContextRecord[]> {
    try {
        const userId = await getCurrentUserId()
        if (!userId) {
            throw new Error("User not authenticated")
        }

        const supabase = await createServerSupabaseClient()
        const { data: project, error } = await supabase
            .from("projects")
            .select("*")
            .eq("id", projectId)
            .eq("user_id", userId)
            .single()

        if (error) {
            throw new Error(`Failed to fetch project: ${error.message}`)
        }

        if (!project) {
            return []
        }

        const contexts: ProjectContextRecord[] = []

        if (project.custom_description) {
            try {
                const parsed = JSON.parse(project.custom_description)
                if (parsed.answers && Array.isArray(parsed.answers)) {
                    parsed.answers.forEach((answer: IntakeAnswerRecord, index: number) => {
                        const question = answer.question
                        let answerText = ""

                        if (question.type === "multiple_choice" && Array.isArray(answer.answer)) {
                            answerText = answer.answer.join(", ")
                        } else if (question.type === "slider" && typeof answer.answer === "number") {
                            answerText = `${answer.answer}${question.slider?.unit || ""}`
                        } else {
                            answerText = String(answer.answer || "")
                        }

                        if (answerText) {
                            contexts.push({
                                id: `intake-${index}`,
                                type: "intake_question",
                                label: question.prompt,
                                content: answerText,
                                editable: false
                            })
                        }
                    })
                }
            } catch (e) {
                console.error("Failed to parse custom_description:", e)
            }
        }

        if (project.purpose) {
            contexts.push({
                id: "purpose",
                type: "project_field",
                label: "Purpose",
                content: project.purpose,
                editable: true
            })
        }

        if (project.summary) {
            contexts.push({
                id: "summary",
                type: "project_field",
                label: "Summary",
                content: project.summary,
                editable: true
            })
        }

        if (project.target_audience) {
            contexts.push({
                id: "target_audience",
                type: "project_field",
                label: "Target Audience",
                content: project.target_audience,
                editable: true
            })
        }

        if (project.timeline) {
            contexts.push({
                id: "timeline",
                type: "project_field",
                label: "Timeline",
                content: project.timeline,
                editable: true
            })
        }

        if (project.microcontroller) {
            contexts.push({
                id: "microcontroller",
                type: "project_field",
                label: "Microcontroller",
                content: project.microcontroller_other || project.microcontroller,
                editable: false
            })
        }

        if (project.keywords && Array.isArray(project.keywords)) {
            contexts.push({
                id: "keywords",
                type: "project_field",
                label: "Keywords",
                content: project.keywords.join(", "),
                editable: false
            })
        }

        return contexts
    } catch (error) {
        console.error("Error fetching project context:", error)
        throw error
    }
}

export async function updateProjectContextField(
    projectId: string,
    fieldId: string,
    content: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const userId = await getCurrentUserId()
        if (!userId) {
            return { success: false, error: "User not authenticated" }
        }

        if (!content.trim()) {
            return { success: false, error: "Content cannot be empty" }
        }

        const supabase = await createServerSupabaseClient()

        const fieldMapping: Record<string, string> = {
            purpose: "purpose",
            description: "description",
            summary: "summary",
            target_audience: "target_audience",
            timeline: "timeline"
        }

        const dbColumn = fieldMapping[fieldId]
        if (!dbColumn) {
            return { success: false, error: "Field not editable" }
        }

        const { error } = await supabase
            .from("projects")
            .update({ [dbColumn]: content.trim() })
            .eq("id", projectId)
            .eq("user_id", userId)

        if (error) {
            return { success: false, error: error.message }
        }

        revalidatePath(`/dashboard/${projectId}`)
        revalidatePath(`/dashboard/${projectId}/settings`)
        return { success: true }
    } catch (error) {
        const message = error instanceof Error ? error.message : "An unexpected error occurred"
        return { success: false, error: message }
    }
}
