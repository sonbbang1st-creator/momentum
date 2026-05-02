'use client'
import { Sparkles } from 'lucide-react'
import { createBrowserSupabase } from '@/app/_lib/supabase/browser'

export function LoginButton() {
  async function onClick() {
    const supabase = createBrowserSupabase()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2.5 rounded-full bg-ink-button px-[30px] py-4 text-[15px] font-bold tracking-[-0.2px] text-on-ink-button"
    >
      <Sparkles size={16} />
      Google로 시작하기
    </button>
  )
}
