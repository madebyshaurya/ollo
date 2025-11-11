import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

type AiTask = 'summary' | 'emoji' | 'chat'
type PresetKey = 'concise_summary' | 'emoji_only' | 'title_suggestion' | 'bullet_summary' | 'keywords' | 'complete_summary' | 'dynamic_greeting'

type PostBody = {
  task?: AiTask
  input?: unknown
  messages?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  preset?: PresetKey | string
  system?: string
  prompt?: string
  temperature?: number
  max_tokens?: number
  userName?: string
  userId?: string
}

const PRESETS: Record<PresetKey, { system: string; user: string }> = {
  concise_summary: {
    system: 'You write ultra-concise 1-2 sentence summaries for internal dashboards. No headers, no fluff.',
    user: 'Summarize this project for a dashboard tooltip. Text:\n\n{{input}}'
  },
  emoji_only: {
    system: 'Return only a single Unicode emoji that best represents the content. No extra text.',
    user: 'Pick one emoji for this description:\n\n{{input}}'
  },
  title_suggestion: {
    system: 'Suggest a short, catchy project title. 3-5 words. Avoid punctuation and quotes. Return only the title.',
    user: 'Suggest a title for this project:\n\n{{input}}'
  },
  bullet_summary: {
    system: 'Summarize into 3-5 concise bullets. Keep each bullet under 12 words.',
    user: 'Summarize the following:\n\n{{input}}'
  },
  keywords: {
    system: 'Extract 3-6 short, high-signal keywords (1-3 words each). Return a comma-separated list only.',
    user: 'Extract keywords from the following project description:\n\n{{input}}'
  },
  complete_summary: {
    system: 'Write a friendly 2-3 sentence project summary tailored to the named user. Start directly with the content. No headings, no greetings, no phrases like "Summary for...". Use light Markdown emphasis sparingly where it adds clarity.',
    user: 'Project details:\nUser: {{userName}}\nDescription: {{input}}'
  },
  dynamic_greeting: {
    system: 'Create greetings based on the time context provided. Use the time of day (morning/afternoon/evening/night) to create appropriate greetings like "Good morning, [name]!" or "Hey [name]!" for evening. Use *asterisks* around ONE word only. Keep it under 5 words total.',
    user: 'Create a greeting for {{userName}} for {{input}}'
  }
}

function renderTemplate(template: string, input: unknown, userName?: string) {
  const text = typeof input === 'string' ? input : JSON.stringify(input)
  let result = template.replace('{{input}}', text)
  if (userName) {
    result = result.replace('{{userName}}', userName)
  }
  return result
}

function buildMessages(body: PostBody) {
  if (body.preset || body.system || body.prompt) {
    const preset = (PRESETS as Record<string, { system: string; user: string }>)[
      String(body.preset || '')
    ]
    const system = body.system || preset?.system
    const userTemplate = body.prompt || preset?.user
    if (system || userTemplate) {
      const user = renderTemplate(userTemplate || '{{input}}', body.input, body.userName)
      return [
        { role: 'system' as const, content: system || 'Helpful assistant.' },
        { role: 'user' as const, content: user }
      ]
    }
  }

  const task: AiTask = body.task || 'chat'

  if (task === 'summary') {
    const text = typeof body.input === 'string' ? body.input : JSON.stringify(body.input)
    return [
      {
        role: 'system' as const,
        content: 'You are a concise assistant. Return a terse 1-2 sentence project summary. Avoid fluff. Do not include headers.'
      },
      {
        role: 'user' as const,
        content: `Summarize this project for a dashboard tooltip:\n\n${text}`
      }
    ]
  }

  if (task === 'emoji') {
    const description = typeof body.input === 'string' ? body.input : JSON.stringify(body.input)
    return [
      {
        role: 'system' as const,
        content: 'Return only a single Unicode emoji that best represents the project. No extra text.'
      },
      {
        role: 'user' as const,
        content: `Choose one emoji for this project description:\n\n${description}`
      }
    ]
  }

  const fallback = Array.isArray(body.messages) ? body.messages : []
  if (fallback.length === 0) {
    return [
      { role: 'system' as const, content: 'Helpful assistant.' },
      { role: 'user' as const, content: typeof body.input === 'string' ? body.input : 'Hello' }
    ]
  }
  return fallback
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as PostBody
    const messages = buildMessages(body)

    const prompt = messages.map(msg => {
      if (msg.role === 'system') {
        return { role: 'system' as const, content: msg.content }
      } else if (msg.role === 'user') {
        return { role: 'user' as const, content: msg.content }
      } else {
        return { role: 'assistant' as const, content: msg.content }
      }
    })

    const result = await generateText({
      model: openai('gpt-5-nano'),
      messages: prompt,
      temperature: body.temperature || 0.7
    })

    const preset = body.preset as PresetKey | undefined
    const task: AiTask = body.task || 'chat'

    if (preset === 'concise_summary' || task === 'summary') {
      return Response.json({ summary: result.text })
    }
    if (preset === 'emoji_only' || task === 'emoji') {
      const emoji = result.text.trim()
      const first = emoji.split(/\s+/)[0] || ''
      return Response.json({ emoji: first })
    }
    if (preset === 'title_suggestion') {
      return Response.json({ title: result.text.trim() })
    }
    if (preset === 'bullet_summary') {
      return Response.json({ bullets: result.text.trim() })
    }
    if (preset === 'keywords') {
      const cleaned = result.text.replace(/\n/g, ' ').trim()
      return Response.json({ keywords: cleaned })
    }
    if (preset === 'complete_summary') {
      return Response.json({ summary: result.text })
    }
    if (preset === 'dynamic_greeting') {
      return Response.json({ greeting: result.text })
    }

    return Response.json({ output: result.text })
  } catch (err: unknown) {
    console.error('AI API error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(message, { status: 500 })
  }
}
