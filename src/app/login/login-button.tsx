'use client'
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
      className="w-full rounded-full bg-ink-button text-on-ink-button px-[30px] py-[14px] text-[14px] font-bold tracking-[-0.14px]"
    >
      Google로 시작하기
    </button>
  )
}
