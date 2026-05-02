import { redirect } from 'next/navigation'
import { createServerSupabase } from '../supabase/server'

export async function requireSession() {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) redirect('/login')
  return { supabase, user: data.user }
}

export async function requireProfile() {
  const { supabase, user } = await requireSession()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile) redirect('/onboarding/mbti')

  return {
    supabase,
    user: { id: user.id, email: user.email ?? undefined },
    profile,
  }
}
