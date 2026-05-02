// src/app/_lib/kst.ts
const KST_OFFSET_MS = 9 * 60 * 60 * 1000

export function todayKstIso(now: Date = new Date()): string {
  const kst = new Date(now.getTime() + KST_OFFSET_MS)
  return kst.toISOString().slice(0, 10)
}

const WEEKDAYS = ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'] as const

export function kstWeekday(now: Date = new Date()): string {
  const kst = new Date(now.getTime() + KST_OFFSET_MS)
  return WEEKDAYS[kst.getUTCDay()]
}
