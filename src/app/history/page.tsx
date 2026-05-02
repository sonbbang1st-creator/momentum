// src/app/history/page.tsx
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

  return (
    <main className="flex min-h-dvh flex-col px-(--spacing-xl) pb-(--spacing-xxxl)">
      <header className="flex items-center gap-(--spacing-base) py-(--spacing-md)">
        <Link href="/" aria-label="뒤로" className="w-10 h-10 rounded-full flex items-center justify-center">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-[24px] leading-[1.25] font-medium text-ink-deep" style={{ fontFeatureSettings: '"ss01","ss02"' }}>
          내 운세 기록
        </h1>
      </header>

      <div className="mt-(--spacing-md)">
        <PillTab
          paramName="view"
          current={view}
          options={[
            { value: 'calendar', label: '캘린더' },
            { value: 'list',     label: '리스트' },
          ]}
        />
      </div>

      <section className="mt-(--spacing-xl)">
        {view === 'list'
          ? <HistoryList items={items} />
          : <HistoryCalendar items={items} todayIso={todayKstIso()} />}
      </section>
    </main>
  )
}
