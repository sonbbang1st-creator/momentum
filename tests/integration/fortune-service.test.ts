// tests/integration/fortune-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateFortune } from '@/app/_lib/fortune/service'
import * as openrouter from '@/app/_lib/fortune/openrouter'
import { FALLBACK_FORTUNES } from '@/app/_lib/fortune/fallback'

const VALID = JSON.stringify({
  headline: 'h', advice: 'a',
  lucky: { color: { name: 'soft mint', hex: '#B8E6D2' }, number: 7, item: 'tea' },
})
const INVALID = '{ not json'

beforeEach(() => vi.restoreAllMocks())

describe('generateFortune', () => {
  it('returns parsed payload on first valid response', async () => {
    vi.spyOn(openrouter, 'callOpenRouter').mockResolvedValue({ content: VALID, model: 'm' })
    const out = await generateFortune({ mbti: 'ENFP', userIdHash: 'h', now: new Date('2026-05-02T10:00:00Z') })
    expect(out.kind).toBe('ai')
    if (out.kind !== 'ai') return
    expect(out.payload.headline).toBe('h')
    expect(out.model).toBe('m')
  })

  it('retries once on invalid JSON, succeeds on retry', async () => {
    const spy = vi.spyOn(openrouter, 'callOpenRouter')
      .mockResolvedValueOnce({ content: INVALID, model: 'm' })
      .mockResolvedValueOnce({ content: VALID, model: 'm' })
    const out = await generateFortune({ mbti: 'ENFP', userIdHash: 'h', now: new Date('2026-05-02T10:00:00Z') })
    expect(spy).toHaveBeenCalledTimes(2)
    expect(out.kind).toBe('ai')
  })

  it('returns fallback after both attempts fail', async () => {
    vi.spyOn(openrouter, 'callOpenRouter').mockRejectedValue(new Error('boom'))
    const out = await generateFortune({ mbti: 'ENFP', userIdHash: 'h', now: new Date('2026-05-02T10:00:00Z') })
    expect(out.kind).toBe('fallback')
    if (out.kind !== 'fallback') return
    expect(out.payload).toEqual(FALLBACK_FORTUNES.ENFP)
  })
})
