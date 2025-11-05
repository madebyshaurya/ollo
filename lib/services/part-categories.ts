import { nanoid } from "nanoid"

import {
  planCategories,
  getCategorySuggestions,
  type RecommendedPart,
} from "@/lib/services/parts-recommendation"
import type {
  ProjectPartCategoryRecord,
  ProjectPartSuggestionRecord,
} from "@/lib/actions/projects"

interface GenerateCategoriesOptions {
  projectId: string
  projectType: "breadboard" | "pcb" | "custom"
  summary: string
  description: string
  complexity: number
  budget: number | null
  currency: string
}

export async function generatePartCategories({
  projectType,
  summary,
  description,
  complexity,
  budget,
  currency,
}: GenerateCategoriesOptions): Promise<ProjectPartCategoryRecord[]> {
  const context = {
    type: projectType,
    summary,
    description,
    complexity,
    budget,
    preferredCurrency: currency,
  }

  const plans = await planCategories(context)
  const now = new Date().toISOString()

  const categories: ProjectPartCategoryRecord[] = []

  for (const plan of plans) {
    const suggestions = await getCategorySuggestions(projectType, plan, currency)
    categories.push({
      id: nanoid(),
      name: plan.name,
      description: plan.description,
      aiGenerated: true,
      searchTerms: plan.searchTerms,
      suggestions: normalizeSuggestions(suggestions),
      userItems: [],
      createdAt: now,
      updatedAt: now,
    })
  }

  return categories
}

function normalizeSuggestions(suggestions: RecommendedPart[]): ProjectPartSuggestionRecord[] {
  return suggestions.map((part) => ({
    id: part.id,
    title: part.mpn || part.category,
    description: part.description,
    supplier: part.supplier,
    supplierUrl: part.supplierUrl,
    image: part.image || null,
    manufacturer: part.manufacturer || null,
    mpn: part.mpn || null,
    price: typeof part.price === "number" ? part.price : null,
    currency: part.currency || null,
    moq: part.moq ?? null,
    stock: part.stock ?? null,
    leadTime: part.leadTime || null,
    owned: false,
    status: "pending",
    confidence: part.confidence,
    source: part.source,
  }))
}
