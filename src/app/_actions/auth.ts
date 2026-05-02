// src/app/_actions/auth.ts
'use server'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/app/_lib/supabase/server'

export async function signOut() {
  const supabase = await createServerSupabase()
  await supabase.auth.signOut()
  redirect('/login')
}
