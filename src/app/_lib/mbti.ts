// src/app/_lib/mbti.ts
export const MBTI_TYPES = [
  'INTJ','INTP','ENTJ','ENTP',
  'INFJ','INFP','ENFJ','ENFP',
  'ISTJ','ISFJ','ESTJ','ESFJ',
  'ISTP','ISFP','ESTP','ESFP',
] as const

export type Mbti = (typeof MBTI_TYPES)[number]

export const MBTI_NICKNAMES: Record<Mbti, string> = {
  INTJ: '전략가',  INTP: '논리술사',
  ENTJ: '통솔자',  ENTP: '변론가',
  INFJ: '옹호자',  INFP: '중재자',
  ENFJ: '선도자',  ENFP: '활동가',
  ISTJ: '현실주의자', ISFJ: '수호자',
  ESTJ: '경영자', ESFJ: '집정관',
  ISTP: '장인',  ISFP: '모험가',
  ESTP: '사업가', ESFP: '연예인',
}

export function isMbti(value: unknown): value is Mbti {
  return typeof value === 'string' && (MBTI_TYPES as readonly string[]).includes(value)
}
