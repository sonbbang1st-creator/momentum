// src/app/page.tsx
import Link from 'next/link'
import { Suspense } from 'react'
import { requireProfile } from '@/app/_lib/auth/guards'
import { TopBar } from '@/app/_components/top-bar'
import { FortuneCard } from '@/app/_components/fortune-card'
import { FortuneSkeleton } from '@/app/_components/fortune-skeleton'
import { getOrCreateTodayFortune } from '@/app/_actions/fortune'
import { todayKstIso } from '@/app/_lib/kst'

function formatDateKo(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${y}년 ${m}월 ${d}일`
}

export default async function HomePage() {
  await requireProfile() // route guard
  return (
    <main className="flex min-h-dvh flex-col px-(--spacing-xl) pb-(--spacing-xxxl)">
      <TopBar dateLabel={formatDateKo(todayKstIso())} />
      <Suspense fallback={<FortuneSkeleton />}>
        <TodayFortune />
      </Suspense>
      <div className="mt-(--spacing-xxl) text-center">
        <Link href="/history" className="text-[16px] leading-[1.5] font-bold text-ink-deep underline-offset-4 hover:underline">
          내 기록 보기
        </Link>
      </div>
    </main>
  )
}

async function TodayFortune() {
  const { payload, mbti, source } = await getOrCreateTodayFortune()
  return <FortuneCard mbti={mbti} payload={payload} fallbackNotice={source === 'fallback'} />
}
