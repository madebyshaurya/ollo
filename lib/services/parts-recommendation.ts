import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

import { SAMPLE_PARTS } from "@/data/sample-parts"

type ProjectContext = {
  type: "breadboard" | "pcb" | "custom"
  summary: string
  description: string
  complexity: number
  budget: number | null
  preferredCurrency: string
}

export interface RecommendedPart {
  id: string
  category: string
  supplier: string
  supplierUrl: string
  image: string
  manufacturer: string
  mpn: string
  price: number
  currency: string
  moq: number
  stock: number
  leadTime: string
  description: string
  confidence: "sample" | "live"
  source: string
}

interface PlannerCategory {
  name: string
  description: string
  targetBudget?: number | null
  searchTerms: string[]
}

interface PlannerResponse {
  categories: PlannerCategory[]
}

const SUPPLIER_TIMEOUT = 8000

function normalizeCurrency(input: string | undefined) {
  return (input || "USD").toUpperCase()
}

export async function planCategories(context: ProjectContext): Promise<PlannerCategory[]> {
  try {
    const result = await generateText({
      model: openai("gpt-5-nano"),
      temperature: 0.3,
      maxOutputTokens: 512,
      prompt: `You are a hardware component planner. Suggest 3 to 5 part categories that would help the user progress based on the project info. Respond with strict JSON matching:
{
  "categories": [
    {
      "name": string,
      "description": string,
      "targetBudget": number|null,
      "searchTerms": string[]
    }
  ]
}

Guidelines:
- Use budget if provided; otherwise set targetBudget null.
- searchTerms should be concise supplier-friendly keywords.
- Tailor to project type (${context.type}) and complexity (${context.complexity}). If complexity >=4, suggest production-grade components.
- Include at least one category addressing validation or testing if summary mentions it.

Project summary: ${context.summary}
Project description: ${context.description}
Budget (currency ${context.preferredCurrency}): ${context.budget ?? "unknown"}`
    })

    const parsed = JSON.parse(result.text) as PlannerResponse
    if (Array.isArray(parsed.categories) && parsed.categories.length) {
      return parsed.categories.slice(0, 5)
    }
  } catch (error) {
    console.warn("Planner fallback due to error:", error)
  }

  const defaultCategories: Record<ProjectContext["type"], PlannerCategory[]> = {
    breadboard: [
      {
        name: "Microcontroller breakout",
        description: "Boards with built-in USB for rapid prototyping.",
        targetBudget: 15,
        searchTerms: ["development board", "USB microcontroller breakout"],
      },
      {
        name: "Power regulation",
        description: "Stable regulators to power sensors and MCUs from USB or LiPo.",
        targetBudget: 8,
        searchTerms: ["5V regulator", "buck converter breakout"],
      },
      {
        name: "Sensor suite",
        description: "Environmental or motion sensors to validate data pipelines.",
        targetBudget: 12,
        searchTerms: ["combo sensor module", "I2C sensor breakout"],
      },
    ],
    pcb: [
      {
        name: "Core MCU / SoC",
        description: "High-integration controller suited for custom PCB production.",
        targetBudget: 8,
        searchTerms: ["ARM microcontroller", "MCU QFN"],
      },
      {
        name: "Power stage",
        description: "Efficient regulators or MOSFETs for on-board power conversion.",
        targetBudget: 5,
        searchTerms: ["power mosfet", "buck regulator"],
      },
      {
        name: "Connectivity",
        description: "Modules for Wi-Fi, BLE, or wired interfaces.",
        targetBudget: 6,
        searchTerms: ["wifi module", "ble module", "ethernet phy"],
      },
    ],
    custom: [
      {
        name: "Edge compute",
        description: "Robust MCU or SoC with ample peripherals for advanced builds.",
        targetBudget: 12,
        searchTerms: ["stm32", "esp32 module"],
      },
      {
        name: "Power management",
        description: "Switching regulators and MOSFETs sized for production rigs.",
        targetBudget: 10,
        searchTerms: ["ldo regulator", "dc-dc converter", "mosfet low rds"],
      },
      {
        name: "Sensors & telemetry",
        description: "Environmental or motion sensors for situational awareness.",
        targetBudget: 9,
        searchTerms: ["imu sensor", "environment sensor", "current sensor"],
      },
    ],
  }

  return defaultCategories[context.type]
}

async function fetchWithTimeout(url: string, options: RequestInit = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), SUPPLIER_TIMEOUT)

  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    return response
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchFromFirecrawl(
  query: string,
  currency: string
): Promise<RecommendedPart[]> {
  const apiKey = process.env.FIRECRAWL_API_KEY
  if (!apiKey) return []

  try {
    const response = await fetchWithTimeout("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        query,
        limit: 5,
        format: "markdown",
      }),
    })

    if (!response.ok) {
      console.warn("Firecrawl search failed:", await response.text())
      return []
    }

    const data = (await response.json()) as {
      results?: Array<{
        title: string
        url: string
        markdown: string
      }>
    }

    if (!data.results?.length) return []

    return data.results
      .map((result, index) => {
        const priceMatch = result.markdown.match(/[$€£¥₹]\s?([\d.]+)/)
        const stockMatch = result.markdown.match(/stock[:\s]+(\d+)/i)
        const supplierMatch = result.url.match(/https?:\/\/(?:www\.)?([^/]+)/i)

        const parsedPrice = priceMatch ? Number(priceMatch[1]) : undefined
        const parsedStock = stockMatch ? Number(stockMatch[1]) : undefined
        const supplier = supplierMatch ? supplierMatch[1] : "Supplier"

        return {
          id: `${supplier}-${index}`,
          category: "Auto-discovered",
          supplier,
          supplierUrl: result.url,
          image: "",
          manufacturer: supplier.toUpperCase(),
          mpn: result.title.trim(),
          price: parsedPrice ?? 0,
          currency,
          moq: 1,
          stock: parsedStock ?? 0,
          leadTime: "Check supplier",
          description: result.markdown.slice(0, 180),
          confidence: "live" as const,
          source: "firecrawl",
        }
      })
      .filter((part) => part.price > 0)
  } catch (error) {
    console.warn("Firecrawl integration error:", error)
    return []
  }
}

export function pickSampleParts(projectType: ProjectContext["type"], currency: string): RecommendedPart[] {
  return SAMPLE_PARTS.filter((part) => part.projectTypes.includes(projectType)).map((part) => ({
    ...part,
    confidence: "sample" as const,
    source: "sample-dataset",
    currency,
  }))
}

export async function getCategorySuggestions(
  projectType: ProjectContext["type"],
  category: { name: string; searchTerms: string[] },
  currency: string
): Promise<RecommendedPart[]> {
  const query = `${category.name} ${category.searchTerms.join(" ")} ${currency}`
  const liveResults = await fetchFromFirecrawl(query, currency)

  if (liveResults.length) {
    return liveResults.map((part) => ({
      ...part,
      category: category.name,
    }))
  }

  const samples = pickSampleParts(projectType, currency)
    .filter((part) => part.category.toLowerCase().includes(category.name.toLowerCase()))
    .slice(0, 3)

  if (samples.length) {
    return samples.map((part) => ({ ...part, category: category.name }))
  }

  return pickSampleParts(projectType, currency)
    .slice(0, 2)
    .map((part) => ({ ...part, category: category.name }))
}

export async function getRecommendedParts(context: ProjectContext): Promise<RecommendedPart[]> {
  const currency = normalizeCurrency(context.preferredCurrency)
  const categories = await planCategories(context)

  const results: RecommendedPart[] = []

  for (const category of categories) {
    const query = `${category.name} ${category.searchTerms.join(" ")} ${currency}`
    const liveResults = await fetchFromFirecrawl(query, currency)

    if (liveResults.length) {
      results.push(
        ...liveResults.map((part) => ({
          ...part,
          category: category.name,
          description: part.description || category.description,
        }))
      )
      continue
    }

    const samples = pickSampleParts(context.type, currency)
      .filter((part) => part.category.toLowerCase().includes(category.name.toLowerCase()))
      .slice(0, 3)

    results.push(
      ...(samples.length
        ? samples
        : pickSampleParts(context.type, currency).slice(0, 2).map((part) => ({
            ...part,
            category: category.name,
          })))
    )
  }

  const uniqueMap = new Map<string, RecommendedPart>()
  results.forEach((part) => {
    if (!uniqueMap.has(part.id)) {
      uniqueMap.set(part.id, part)
    }
  })

  return Array.from(uniqueMap.values())
}
