// src/app/_lib/fortune/service.ts
import { todayKstIso, kstWeekday } from '../kst'
import type { Mbti } from '../mbti'
import { FALLBACK_FORTUNES } from './fallback'
import { callOpenRouter } from './openrouter'
import { buildSystemPrompt, buildUserPrompt } from './prompt'
import { FortunePayloadSchema, type FortunePayload } from './schema'

export type GenerateResult =
  | { kind: 'ai'; payload: FortunePayload; model: string }
  | { kind: 'fallback'; payload: FortunePayload; model: null }

export async function generateFortune(args: {
  mbti: Mbti
  userIdHash: string
  now?: Date
}): Promise<GenerateResult> {
  const now = args.now ?? new Date()
  const system = buildSystemPrompt()
  const user = buildUserPrompt({
    mbti: args.mbti,
    kstDateIso: todayKstIso(now),
    kstWeekday: kstWeekday(now),
    userIdHash: args.userIdHash,
  })

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { content, model } = await callOpenRouter({ system, user })
      const parsed = JSON.parse(content)
      const payload = FortunePayloadSchema.parse(parsed)
      return { kind: 'ai', payload, model }
    } catch (err) {
      if (attempt === 0) {
        await sleep(500)
        continue
      }
      console.error('[fortune] generation failed, falling back:', err)
    }
  }

  return {
    kind: 'fallback',
    payload: FALLBACK_FORTUNES[args.mbti],
    model: null,
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
