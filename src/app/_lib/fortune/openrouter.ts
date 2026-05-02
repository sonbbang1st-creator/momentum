// src/app/_lib/fortune/openrouter.ts

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions'

export interface CallArgs {
  system: string
  user: string
  timeoutMs?: number
}

export interface CallResult {
  content: string
  model: string
}

export async function callOpenRouter(args: CallArgs): Promise<CallResult> {
  const apiKey = requireEnv('OPENROUTER_API_KEY')
  const model = requireEnv('OPENROUTER_MODEL')
  const referer = process.env.OPENROUTER_REFERER ?? ''
  const title = process.env.OPENROUTER_TITLE ?? 'MBTI Daily Fortune'

  const ctrl = new AbortController()
  const timeout = setTimeout(() => ctrl.abort(), args.timeoutMs ?? 8000)

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
        'HTTP-Referer':  referer,
        'X-Title':       title,
      },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: args.system },
          { role: 'user',   content: args.user   },
        ],
        temperature: 0.7,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`OpenRouter ${res.status}: ${body.slice(0, 300)}`)
    }

    const data = await res.json() as {
      choices?: { message?: { content?: string } }[]
    }
    const content = data.choices?.[0]?.message?.content
    if (!content) throw new Error('OpenRouter returned no content')

    return { content, model }
  } finally {
    clearTimeout(timeout)
  }
}

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}
