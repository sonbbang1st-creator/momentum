import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { requireProfile } from '@/app/_lib/auth/guards'
import { getFortuneHistory } from '@/app/_actions/fortune'
import { todayKstIso } from '@/app/_lib/kst'
import { PillTab } from '@/app/_components/pill-tab'
import { HistoryList } from '@/app/_components/history-list'
import { HistoryCalendar } from '@/app/_components/history-calendar'

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  await requireProfile()
  const { view = 'calendar' } = await searchParams
  const items = await getFortuneHistory(60)
  const decoColor = view === 'list' ? '#EAF1F9' : '#FBEDE2'

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-canvas px-6 pb-10 pt-5">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 h-[280px] w-[280px] rounded-full opacity-60 blur-[50px]"
        style={{ background: decoColor }}
      />
      <div className="relative flex flex-col gap-6">
        <Link
          href="/"
          aria-label="뒤로"
          className="flex h-10 w-10 items-center justify-center rounded-full text-ink"
        >
          <ChevronLeft size={20} />
        </Link>
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] leading-[1.33] font-bold tracking-[2.5px] text-steel">기록 · ARCHIVE</p>
          <h1
            className="text-[34px] leading-[1.16] font-medium tracking-[-0.8px] text-ink-deep"
            style={{ fontFeatureSettings: '"ss01","ss02"' }}
          >
            내 운세
          </h1>
        </div>
        <PillTab
          paramName="view"
          current={view}
          options={[
            { value: 'calendar', label: '캘린더' },
            { value: 'list',     label: '리스트' },
          ]}
        />
        <section>
          {view === 'list'
            ? <HistoryList items={items} />
            : <HistoryCalendar items={items} todayIso={todayKstIso()} />}
        </section>
      </div>
    </main>
  )
}
