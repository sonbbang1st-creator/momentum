// src/app/onboarding/mbti/page.tsx
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/app/_lib/supabase/server'
import { OnboardingForm } from './onboarding-form'

export default async function OnboardingMbtiPage() {
  const supabase = await createServerSupabase()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect('/login')

  const { data: existing } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('user_id', data.user.id)
    .maybeSingle()
  if (existing) redirect('/')

  return (
    <main className="flex min-h-dvh flex-col px-(--spacing-xl) pb-(--spacing-xxxl) pt-(--spacing-xxl)">
      <h1 className="text-[36px] leading-[1.28] font-medium text-ink-deep" style={{ fontFeatureSettings: '"ss01","ss02"' }}>
        내 MBTI를 알려주세요
      </h1>
      <p className="mt-(--spacing-xs) text-[16px] leading-[1.5] text-charcoal">
        선택한 MBTI를 기준으로 매일 한 편의 운세를 만들어드려요.
      </p>

      <OnboardingForm />
    </main>
  )
}
