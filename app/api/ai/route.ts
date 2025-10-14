const HACK_CLUB_AI_URL = 'https://ai.hackclub.com/chat/completions'
const MODEL_ID = 'openai/gpt-oss-120b'

type AiTask = 'summary' | 'emoji' | 'chat'
type PresetKey = 'concise_summary' | 'emoji_only' | 'title_suggestion' | 'bullet_summary' | 'keywords'

type PostBody = {
  // Legacy task support
  task?: AiTask
  input?: unknown
  messages?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  // New preset/custom support
  preset?: PresetKey | string
  system?: string
  prompt?: string
  temperature?: number
  max_tokens?: number
}

const PRESETS: Record<PresetKey, { system: string; user: string }> = {
  concise_summary: {
    system:
      'You write ultra-concise 1-2 sentence summaries for internal dashboards. No headers, no fluff.',
    user: 'Summarize this project for a dashboard tooltip. Text:\n\n{{input}}'
  },
  emoji_only: {
    system: 'Return only a single Unicode emoji that best represents the content. No extra text.',
    user: 'Pick one emoji for this description:\n\n{{input}}'
  },
  title_suggestion: {
    system:
      'Suggest a short, catchy project title. 3-5 words. Avoid punctuation and quotes. Return only the title.',
    user: 'Suggest a title for this project:\n\n{{input}}'
  },
  bullet_summary: {
    system: 'Summarize into 3-5 concise bullets. Keep each bullet under 12 words.',
    user: 'Summarize the following:\n\n{{input}}'
  },
  keywords: {
    system: 'Extract 3-6 short, high-signal keywords (1-3 words each). Return a comma-separated list only.',
    user: 'Extract keywords from the following project description:\n\n{{input}}'
  }
}

function renderTemplate(template: string, input: unknown) {
  const text = typeof input === 'string' ? input : JSON.stringify(input)
  return template.replace('{{input}}', text)
}

function buildMessages(body: PostBody) {
  // Preset/custom prompt handling takes priority
  if (body.preset || body.system || body.prompt) {
    const preset = (PRESETS as Record<string, { system: string; user: string }>)[
      String(body.preset || '')
    ]
    const system = body.system || preset?.system
    const userTemplate = body.prompt || preset?.user
    if (system || userTemplate) {
      const user = renderTemplate(userTemplate || '{{input}}', body.input)
      return [
        { role: 'system' as const, content: system || 'Helpful assistant.' },
        { role: 'user' as const, content: user }
      ]
    }
  }

  // Legacy: task-based handling
  const task: AiTask = body.task || 'chat'

  if (task === 'summary') {
    const text = typeof body.input === 'string' ? body.input : JSON.stringify(body.input)
    return [
      {
        role: 'system' as const,
        content:
          'You are a concise assistant. Return a terse 1-2 sentence project summary. Avoid fluff. Do not include headers.'
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
        content:
          'Return only a single Unicode emoji that best represents the project. No extra text.'
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

async function callHackClubAI(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  opts?: { temperature?: number; max_tokens?: number }
) {
  const res = await fetch(HACK_CLUB_AI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL_ID,
      messages,
      ...(typeof opts?.temperature === 'number' ? { temperature: opts.temperature } : {}),
      ...(typeof opts?.max_tokens === 'number' ? { max_tokens: opts.max_tokens } : {})
    })
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Hack Club AI error ${res.status}: ${text}`)
  }

  const data = await res.json()
  // Best-effort OpenAI-compatible response shape
  const content = data?.choices?.[0]?.message?.content
  if (typeof content !== 'string') {
    return { raw: data }
  }
  return { text: content, raw: data }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as PostBody
    const messages = buildMessages(body)
    const result = await callHackClubAI(messages, {
      temperature: body.temperature,
      max_tokens: body.max_tokens
    })

    // Normalize response by preset or task for simpler client usage
    const preset = body.preset as PresetKey | undefined
    const task: AiTask = body.task || 'chat'
    if (preset === 'concise_summary' || task === 'summary') {
      return Response.json({ summary: result.text ?? null })
    }
    if (preset === 'emoji_only' || task === 'emoji') {
      const emoji = (result.text || '').trim()
      const first = emoji.split(/\s+/)[0] || ''
      return Response.json({ emoji: first })
    }
    if (preset === 'title_suggestion') {
      return Response.json({ title: (result.text || '').trim() })
    }
    if (preset === 'bullet_summary') {
      return Response.json({ bullets: (result.text || '').trim() })
    }
    if (preset === 'keywords') {
      const cleaned = (result.text || '').replace(/\n/g, ' ').trim()
      return Response.json({ keywords: cleaned })
    }
    return Response.json({ output: result.text ?? null })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(message, { status: 500 })
  }
}


