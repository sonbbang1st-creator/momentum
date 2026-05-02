// tests/unit/mbti.test.ts
import { describe, it, expect } from 'vitest'
import { MBTI_TYPES, MBTI_NICKNAMES, isMbti } from '@/app/_lib/mbti'

describe('MBTI_TYPES', () => {
  it('contains exactly 16 types', () => {
    expect(MBTI_TYPES).toHaveLength(16)
    expect(new Set(MBTI_TYPES).size).toBe(16)
  })
})

describe('MBTI_NICKNAMES', () => {
  it('has a Korean nickname for every MBTI type', () => {
    for (const t of MBTI_TYPES) {
      expect(MBTI_NICKNAMES[t]).toBeTruthy()
    }
  })
})

describe('isMbti', () => {
  it('accepts valid types', () => {
    expect(isMbti('ENFP')).toBe(true)
  })
  it('rejects invalid types', () => {
    expect(isMbti('XXXX')).toBe(false)
    expect(isMbti('')).toBe(false)
    expect(isMbti(undefined)).toBe(false)
  })
})
