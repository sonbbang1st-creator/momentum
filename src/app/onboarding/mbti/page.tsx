// src/app/onboarding/mbti/page.tsx
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/app/_lib/supabase/server'
import { MbtiGrid } from '@/app/_components/mbti-grid'
import { createProfile } from '@/app/_actions/profile'

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

      <form action={createProfile} className="mt-(--spacing-xxl) flex-1 flex flex-col">
        <MbtiGrid name="mbti" />
        <div className="mt-auto pt-(--spacing-xl)">
          <button
            type="submit"
            className="w-full rounded-full bg-ink-button text-on-ink-button px-[30px] py-[14px] text-[14px] font-bold tracking-[-0.14px] disabled:bg-stone disabled:text-canvas"
          >
            시작하기
          </button>
        </div>
      </form>
    </main>
  )
}
