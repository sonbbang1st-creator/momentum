import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/app/_lib/supabase/server'
import { LoginButton } from './login-button'
import { EmailForm } from './email-form'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createServerSupabase()
  const { data } = await supabase.auth.getUser()
  if (data.user) redirect('/')

  const { error } = await searchParams
  const showOauthError = error === 'oauth'

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-canvas px-8 pb-10 pt-[88px]">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 h-[300px] w-[300px] rounded-full opacity-60 blur-[60px]"
        style={{ background: '#B8E6D2' }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-16 h-[280px] w-[280px] rounded-full opacity-50 blur-[60px]"
        style={{ background: '#FBE5DD' }}
      />

      <div className="relative flex flex-1 flex-col gap-5">
        <p className="text-[12px] font-bold tracking-[2.5px] text-steel">MBTI</p>
        <h1
          className="text-[56px] leading-[1.05] font-medium tracking-[-1.5px] text-ink-deep"
          style={{ fontFeatureSettings: '"ss01","ss02"' }}
        >
          데일리 운세
        </h1>
        <p className="text-[22px] leading-[1.36] font-light tracking-[-0.4px] text-charcoal whitespace-pre-line">
          {'내 MBTI에 맞춘\n오늘의 다정한 한 줄.'}
        </p>
      </div>

      <div className="relative flex flex-col items-center gap-3.5">
        {showOauthError && (
          <div
            role="alert"
            className="w-full rounded-lg border border-critical-strong px-4 py-3 text-[13px] text-critical-strong"
          >
            로그인에 실패했어요. 잠시 후 다시 시도해주세요.
          </div>
        )}
        <LoginButton />
        <div role="separator" aria-orientation="horizontal" className="flex w-full items-center gap-3">
          <span aria-hidden className="h-px flex-1 bg-hairline-soft" />
          <span className="text-[12px] font-bold tracking-[2px] text-steel">또는</span>
          <span aria-hidden className="h-px flex-1 bg-hairline-soft" />
        </div>
        <EmailForm />
        <p className="text-center text-[11px] leading-[1.45] text-steel">
          로그인 시 서비스 이용약관과 개인정보처리방침에 동의하게 돼요.
        </p>
      </div>
    </main>
  )
}
