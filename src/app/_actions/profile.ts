// src/app/_actions/profile.ts
'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/app/_lib/supabase/server'
import { isMbti } from '@/app/_lib/mbti'

export async function createProfile(formData: FormData) {
  const mbti = formData.get('mbti')
  if (!isMbti(mbti)) throw new Error('Invalid MBTI')

  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/login')

  const { error } = await supabase.from('profiles').insert({
    user_id: auth.user.id,
    mbti,
    display_name:
      (auth.user.user_metadata?.full_name as string | undefined) ??
      (auth.user.user_metadata?.name as string | undefined) ??
      null,
    avatar_url:
      (auth.user.user_metadata?.avatar_url as string | undefined) ?? null,
  })
  if (error && error.code !== '23505') throw error  // ignore unique-violation race

  revalidatePath('/')
  redirect('/')
}

export async function updateMbti(formData: FormData) {
  const mbti = formData.get('mbti')
  if (!isMbti(mbti)) throw new Error('Invalid MBTI')

  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/login')

  const { error } = await supabase
    .from('profiles')
    .update({ mbti })
    .eq('user_id', auth.user.id)
  if (error) throw error

  revalidatePath('/settings')
  redirect('/settings')
}
