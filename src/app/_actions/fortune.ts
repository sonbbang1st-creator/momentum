// src/app/_actions/fortune.ts
'use server'
import { createHash } from 'node:crypto'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/app/_lib/supabase/server'
import { todayKstIso } from '@/app/_lib/kst'
import { isMbti, type Mbti } from '@/app/_lib/mbti'
import { generateFortune } from '@/app/_lib/fortune/service'
import type { FortunePayload } from '@/app/_lib/fortune/schema'
import { FortunePayloadSchema } from '@/app/_lib/fortune/schema'

export interface TodayFortune {
  fortuneDate: string
  payload: FortunePayload
  mbti: Mbti
  source: 'db' | 'ai' | 'fallback'
}

export async function getOrCreateTodayFortune(): Promise<TodayFortune> {
  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('mbti')
    .eq('user_id', auth.user.id)
    .maybeSingle()
  if (!profile) redirect('/onboarding/mbti')
  if (!isMbti(profile.mbti)) throw new Error('Stored MBTI is invalid')

  const today = todayKstIso()

  // 1) Fast path: today's row already exists.
  {
    const { data: existing } = await supabase
      .from('fortunes')
      .select('fortune_date, payload, mbti_at_generation')
      .eq('user_id', auth.user.id)
      .eq('fortune_date', today)
      .maybeSingle()
    if (existing) {
      return {
        fortuneDate: existing.fortune_date,
        payload: FortunePayloadSchema.parse(existing.payload),
        mbti: existing.mbti_at_generation as Mbti,
        source: 'db',
      }
    }
  }

  // 2) Generate.
  const userIdHash = createHash('sha256').update(auth.user.id).digest('hex').slice(0, 16)
  const result = await generateFortune({ mbti: profile.mbti, userIdHash })

  if (result.kind === 'fallback') {
    // Don't persist fallback — let next visit retry.
    return {
      fortuneDate: today,
      payload: result.payload,
      mbti: profile.mbti,
      source: 'fallback',
    }
  }

  // 3) Insert; tolerate two-tab races via ON CONFLICT DO NOTHING semantics.
  const { error: insertError } = await supabase.from('fortunes').insert({
    user_id: auth.user.id,
    fortune_date: today,
    mbti_at_generation: profile.mbti,
    payload: result.payload as never,
    model: result.model,
  })
  if (insertError && insertError.code !== '23505') throw insertError

  // 4) Re-select to return the canonical row (handles the conflict case).
  const { data: row, error: selectError } = await supabase
    .from('fortunes')
    .select('fortune_date, payload, mbti_at_generation')
    .eq('user_id', auth.user.id)
    .eq('fortune_date', today)
    .single()
  if (selectError) throw selectError

  return {
    fortuneDate: row.fortune_date,
    payload: FortunePayloadSchema.parse(row.payload),
    mbti: row.mbti_at_generation as Mbti,
    source: 'ai',
  }
}

export async function getFortuneByDate(date: string) {
  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/login')

  const { data, error } = await supabase
    .from('fortunes')
    .select('fortune_date, payload, mbti_at_generation')
    .eq('user_id', auth.user.id)
    .eq('fortune_date', date)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  return {
    fortuneDate: data.fortune_date,
    payload: FortunePayloadSchema.parse(data.payload),
    mbti: data.mbti_at_generation as Mbti,
  }
}

export async function getFortuneHistory(limit = 60) {
  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/login')

  const { data, error } = await supabase
    .from('fortunes')
    .select('fortune_date, payload, mbti_at_generation')
    .eq('user_id', auth.user.id)
    .order('fortune_date', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data.map(row => ({
    fortuneDate: row.fortune_date,
    payload: FortunePayloadSchema.parse(row.payload),
    mbti: row.mbti_at_generation as Mbti,
  }))
}
