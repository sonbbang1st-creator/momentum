// tests/unit/fortune-fallback.test.ts
import { describe, it, expect } from 'vitest'
import { FALLBACK_FORTUNES } from '@/app/_lib/fortune/fallback'
import { MBTI_TYPES } from '@/app/_lib/mbti'
import { FortunePayloadSchema } from '@/app/_lib/fortune/schema'

describe('FALLBACK_FORTUNES', () => {
  it('has an entry for every MBTI type', () => {
    for (const t of MBTI_TYPES) {
      expect(FALLBACK_FORTUNES[t]).toBeDefined()
    }
  })

  it('every entry passes the FortunePayloadSchema', () => {
    for (const t of MBTI_TYPES) {
      expect(() => FortunePayloadSchema.parse(FALLBACK_FORTUNES[t])).not.toThrow()
    }
  })
})
