// src/app/settings/page.tsx
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { requireProfile } from '@/app/_lib/auth/guards'
import { signOut } from '@/app/_actions/auth'
import { MbtiUpdateForm } from './mbti-update-form'
import { MBTI_NICKNAMES, type Mbti } from '@/app/_lib/mbti'

export default async function SettingsPage() {
  const { profile, user } = await requireProfile()
  const mbti = profile.mbti as Mbti

  return (
    <main className="flex min-h-dvh flex-col px-(--spacing-xl) pb-(--spacing-xxxl)">
      <header className="flex items-center gap-(--spacing-base) py-(--spacing-md)">
        <Link href="/" aria-label="뒤로" className="w-10 h-10 rounded-full flex items-center justify-center">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-[24px] leading-[1.25] font-medium text-ink-deep" style={{ fontFeatureSettings: '"ss01","ss02"' }}>설정</h1>
      </header>

      <section className="mt-(--spacing-xl) flex items-center gap-(--spacing-md)">
        {profile.avatar_url && (
          <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full" />
        )}
        <div>
          <p className="text-[18px] leading-[1.44] font-bold text-ink-deep">{profile.display_name ?? '이름 없음'}</p>
          <p className="text-[14px] leading-[1.43] text-steel">{user.email}</p>
        </div>
      </section>

      <section className="mt-(--spacing-xxl)">
        <h2 className="text-[14px] leading-[1.43] font-bold text-ink">내 MBTI</h2>
        <p className="mt-(--spacing-xs) text-[14px] leading-[1.43] text-steel">
          오늘 운세는 변경 전 MBTI 기준으로 유지돼요. 새 MBTI는 내일부터 반영됩니다.
        </p>
        <p className="mt-(--spacing-base) text-[16px] leading-[1.5] text-ink">
          현재: <span className="font-bold">{mbti}</span> ({MBTI_NICKNAMES[mbti]})
        </p>
        <div className="mt-(--spacing-base)">
          <MbtiUpdateForm initial={mbti} />
        </div>
      </section>

      <form action={signOut} className="mt-auto pt-(--spacing-xxl)">
        <button
          type="submit"
          className="w-full rounded-full border-2 border-critical text-critical px-[28px] py-[12px] text-[14px] font-bold tracking-[-0.14px]"
        >
          로그아웃
        </button>
      </form>
    </main>
  )
}
