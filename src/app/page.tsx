import Link from 'next/link'
import { Suspense } from 'react'
import { ArrowRight } from 'lucide-react'
import { requireProfile } from '@/app/_lib/auth/guards'
import { TopBar } from '@/app/_components/top-bar'
import { FortuneCard } from '@/app/_components/fortune-card'
import { FortuneSkeleton } from '@/app/_components/fortune-skeleton'
import { LuckyTrio } from '@/app/_components/lucky-trio'
import { getOrCreateTodayFortune } from '@/app/_actions/fortune'
import { todayKstIso, kstWeekday } from '@/app/_lib/kst'

function formatIso(iso: string): string {
  return iso.replace(/-/g, '.')
}

export default async function HomePage() {
  await requireProfile()
  const iso = todayKstIso()
  const weekday = kstWeekday()
  return (
    <main className="relative min-h-dvh overflow-hidden bg-canvas px-6 pb-10">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-20 h-[420px] w-[420px] rounded-full opacity-40 blur-[60px]"
        style={{ background: '#B8E6D2' }}
      />
      <div className="relative">
        <TopBar isoDate={formatIso(iso)} weekdayLabel={weekday} />
        <Suspense fallback={<FortuneSkeleton />}>
          <TodayFortune />
        </Suspense>
        <div className="mt-8 flex justify-center">
          <Link
            href="/history"
            className="inline-flex items-center gap-1.5 text-[13px] leading-[1.43] font-bold tracking-[-0.1px] text-ink-deep"
          >
            지난 운세 다시 보기
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </main>
  )
}

async function TodayFortune() {
  const { payload, mbti, source } = await getOrCreateTodayFortune()
  return (
    <>
      <FortuneCard mbti={mbti} payload={payload} fallbackNotice={source === 'fallback'} />
      <LuckyTrio lucky={payload.lucky} />
    </>
  )
}
