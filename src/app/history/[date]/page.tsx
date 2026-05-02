// src/app/history/[date]/page.tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { requireProfile } from '@/app/_lib/auth/guards'
import { getFortuneByDate } from '@/app/_actions/fortune'
import { FortuneCard } from '@/app/_components/fortune-card'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export default async function HistoryDetailPage({
  params,
}: {
  params: Promise<{ date: string }>
}) {
  await requireProfile()
  const { date } = await params
  if (!DATE_RE.test(date)) notFound()

  const data = await getFortuneByDate(date)
  if (!data) notFound()

  return (
    <main className="flex min-h-dvh flex-col px-(--spacing-xl) pb-(--spacing-xxxl)">
      <header className="flex items-center gap-(--spacing-base) py-(--spacing-md)">
        <Link href="/history" aria-label="뒤로" className="w-10 h-10 rounded-full flex items-center justify-center">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-[18px] leading-[1.44] font-bold text-ink-deep">{date}</h1>
      </header>
      <FortuneCard mbti={data.mbti} payload={data.payload} />
      <div className="mt-(--spacing-xxl) text-center">
        <Link href="/" className="text-[16px] leading-[1.5] font-bold text-ink-deep underline-offset-4 hover:underline">
          오늘의 운세 보기
        </Link>
      </div>
    </main>
  )
}
