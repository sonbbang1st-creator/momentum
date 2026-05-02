// tests/unit/kst.test.ts
import { describe, it, expect } from 'vitest'
import { todayKstIso, kstWeekday } from '@/app/_lib/kst'

describe('todayKstIso', () => {
  it('returns YYYY-MM-DD for the KST calendar day at given UTC instant', () => {
    // 2026-05-02 14:30 UTC === 2026-05-02 23:30 KST → '2026-05-02'
    expect(todayKstIso(new Date('2026-05-02T14:30:00Z'))).toBe('2026-05-02')
  })

  it('rolls over to next day after KST midnight', () => {
    // 2026-05-02 15:30 UTC === 2026-05-03 00:30 KST → '2026-05-03'
    expect(todayKstIso(new Date('2026-05-02T15:30:00Z'))).toBe('2026-05-03')
  })

  it('rolls back to previous day before KST midnight', () => {
    // 2026-05-02 14:59 UTC === 2026-05-02 23:59 KST → '2026-05-02'
    expect(todayKstIso(new Date('2026-05-02T14:59:00Z'))).toBe('2026-05-02')
  })
})

describe('kstWeekday', () => {
  it('returns Korean weekday name', () => {
    // 2026-05-02 is a Saturday in KST
    expect(kstWeekday(new Date('2026-05-02T05:00:00Z'))).toBe('토요일')
  })
})
