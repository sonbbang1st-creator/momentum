// tests/unit/fortune-prompt.test.ts
import { describe, it, expect } from 'vitest'
import { buildSystemPrompt, buildUserPrompt } from '@/app/_lib/fortune/prompt'

describe('buildSystemPrompt', () => {
  it('contains tone constraints and JSON schema reference', () => {
    const sys = buildSystemPrompt()
    expect(sys).toContain('coaching')
    expect(sys).toContain('headline')
    expect(sys).toContain('lucky')
    expect(sys).toContain('JSON only')
  })
})

describe('buildUserPrompt', () => {
  it('includes mbti, date, weekday, and a deterministic seed', () => {
    const out = buildUserPrompt({
      mbti: 'ENFP',
      kstDateIso: '2026-05-02',
      kstWeekday: '토요일',
      userIdHash: 'abc123',
    })
    expect(out).toContain('MBTI: ENFP')
    expect(out).toContain('Date: 2026-05-02')
    expect(out).toContain('Day-of-week: 토요일')
    expect(out).toContain('Seed: abc123-2026-05-02')
  })
})
