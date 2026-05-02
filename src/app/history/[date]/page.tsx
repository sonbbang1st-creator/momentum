import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Sun } from 'lucide-react'
import { requireProfile } from '@/app/_lib/auth/guards'
import { getFortuneByDate } from '@/app/_actions/fortune'
import { FortuneCard } from '@/app/_components/fortune-card'
import { LuckyTrio } from '@/app/_components/lucky-trio'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const KST_WEEKDAYS = ['일','월','화','수','목','금','토']

function formatHero(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  const wd = KST_WEEKDAYS[new Date(`${iso}T00:00:00+09:00`).getUTCDay()]
  return {
    kicker: `기록 · ${iso.replace(/-/g,'.')} · ${wd}요일`,
    display: `${m}월 ${d}일`,
  }
}

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
  const hero = formatHero(date)

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-canvas px-6 pb-10 pt-5">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-16 h-[340px] w-[340px] rounded-full opacity-55 blur-[55px]"
        style={{ background: '#F1E4FA' }}
      />
      <div className="relative flex flex-col gap-6">
        <Link
          href="/history"
          aria-label="뒤로"
          className="flex h-10 w-10 items-center justify-center rounded-full text-ink"
        >
          <ChevronLeft size={20} />
        </Link>
        <div className="flex flex-col gap-1">
          <p className="text-[11px] leading-[1.33] font-bold tracking-[2.5px] text-steel">{hero.kicker}</p>
          <h1
            className="text-[30px] leading-[1.16] font-medium tracking-[-0.7px] text-ink-deep"
            style={{ fontFeatureSettings: '"ss01","ss02"' }}
          >
            {hero.display}
          </h1>
        </div>
        <FortuneCard mbti={data.mbti} payload={data.payload} />
        <LuckyTrio lucky={data.payload.lucky} />
        <div className="mt-2 flex justify-center">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ink-deep">
            <Sun size={14} />
            오늘의 운세 보기
          </Link>
        </div>
      </div>
    </main>
  )
}
