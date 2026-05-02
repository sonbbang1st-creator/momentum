// src/app/_components/history-list.tsx
import Link from 'next/link'
import type { FortunePayload } from '@/app/_lib/fortune/schema'

interface Item {
  fortuneDate: string
  payload: FortunePayload
}

export function HistoryList({ items }: { items: Item[] }) {
  if (items.length === 0) return <EmptyState />
  return (
    <ul className="divide-y divide-hairline-soft">
      {items.map((it) => (
        <li key={it.fortuneDate}>
          <Link href={`/history/${it.fortuneDate}`} className="flex items-center gap-(--spacing-md) py-(--spacing-base)">
            <span className="text-[14px] leading-[1.43] font-bold text-ink w-20 shrink-0">{formatShortDate(it.fortuneDate)}</span>
            <span className="text-[16px] leading-[1.5] text-ink flex-1 line-clamp-1">{it.payload.headline}</span>
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ background: it.payload.lucky.color.hex }}
              aria-hidden
            />
          </Link>
        </li>
      ))}
    </ul>
  )
}

function EmptyState() {
  return (
    <div className="py-(--spacing-section) text-center">
      <p className="text-[16px] leading-[1.5] text-ink">아직 기록이 없어요.</p>
      <p className="mt-(--spacing-xs) text-[14px] leading-[1.43] text-steel">오늘 운세를 보면 여기에 쌓여요.</p>
      <Link href="/" className="mt-(--spacing-base) inline-block text-[16px] leading-[1.5] font-bold text-ink-deep underline-offset-4 hover:underline">
        오늘의 운세 보기
      </Link>
    </div>
  )
}

function formatShortDate(iso: string): string {
  const [, m, d] = iso.split('-').map(Number)
  return `${m}/${d}`
}
