import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/app/_lib/supabase/server'
import { LoginButton } from './login-button'

export default async function LoginPage() {
  const supabase = await createServerSupabase()
  const { data } = await supabase.auth.getUser()
  if (data.user) redirect('/')

  return (
    <main className="flex min-h-dvh flex-col px-(--spacing-xl) pb-(--spacing-xxxl) pt-(--spacing-section)">
      <div className="flex-1 flex flex-col justify-center items-center gap-(--spacing-md)">
        <h1 className="text-[40px] leading-[1.16] font-medium tracking-[0] text-ink-deep" style={{ fontFeatureSettings: '"ss01","ss02"' }}>
          MBTI 데일리 운세
        </h1>
        <p className="text-[18px] leading-[1.44] text-ink text-center">
          내 MBTI에 맞춘 오늘의 다정한 한 줄.
        </p>
      </div>
      <LoginButton />
      <p className="mt-(--spacing-md) text-[12px] leading-[1.33] text-steel text-center">
        로그인 시 서비스 이용약관과 개인정보처리방침에 동의하게 돼요.
      </p>
    </main>
  )
}
