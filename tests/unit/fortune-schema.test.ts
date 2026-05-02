// tests/unit/fortune-schema.test.ts
import { describe, it, expect } from 'vitest'
import { FortunePayloadSchema } from '@/app/_lib/fortune/schema'

const valid = {
  headline: '오늘은 한 정거장 일찍 내려보세요.',
  advice: '익숙한 길보다 한 정거장 일찍 내려보세요. 평소엔 보이지 않던 신호가 눈에 들어올 거예요.',
  lucky: {
    color:  { name: 'soft mint', hex: '#B8E6D2' },
    number: 7,
    item:   '따뜻한 차 한 잔',
  },
}

describe('FortunePayloadSchema', () => {
  it('accepts a well-formed payload', () => {
    expect(() => FortunePayloadSchema.parse(valid)).not.toThrow()
  })

  it('rejects 3-digit hex', () => {
    expect(() => FortunePayloadSchema.parse({
      ...valid,
      lucky: { ...valid.lucky, color: { name: 'red', hex: '#F00' } },
    })).toThrow()
  })

  it('rejects number out of range', () => {
    expect(() => FortunePayloadSchema.parse({ ...valid, lucky: { ...valid.lucky, number: 100 } })).toThrow()
    expect(() => FortunePayloadSchema.parse({ ...valid, lucky: { ...valid.lucky, number: 0 } })).toThrow()
    expect(() => FortunePayloadSchema.parse({ ...valid, lucky: { ...valid.lucky, number: 1.5 } })).toThrow()
  })

  it('rejects empty strings', () => {
    expect(() => FortunePayloadSchema.parse({ ...valid, headline: '' })).toThrow()
  })
})
