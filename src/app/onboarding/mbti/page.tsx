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
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-canvas px-6 pb-10 pt-16">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-32 right-0 h-[300px] w-[300px] rounded-full opacity-70 blur-[50px]"
        style={{ background: '#EAF1F9' }}
      />
      <div className="relative flex flex-col gap-3.5">
        <p className="text-[11px] leading-[1.33] font-bold tracking-[2.5px] text-steel">STEP 01</p>
        <h1
          className="text-[42px] leading-[1.12] font-medium tracking-[-1px] text-ink-deep whitespace-pre-line"
          style={{ fontFeatureSettings: '"ss01","ss02"' }}
        >
          {'내 MBTI를\n알려주세요'}
        </h1>
        <p className="text-[14px] leading-[1.5] font-light tracking-[-0.1px] text-charcoal">
          선택한 MBTI를 기준으로 매일 한 편의 다정한 운세를 만들어 드릴게요.
        </p>
      </div>
      <div className="relative mt-10 flex flex-1 flex-col">
        <OnboardingForm />
      </div>
    </main>
  )
}
