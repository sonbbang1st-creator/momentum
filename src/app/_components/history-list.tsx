import Link from 'next/link'
import type { FortunePayload } from '@/app/_lib/fortune/schema'

interface Item {
  fortuneDate: string
  payload: FortunePayload
}

const KST_WEEKDAYS = ['일','월','화','수','목','금','토']

function formatRowDate(iso: string): string {
  const [, m, d] = iso.split('-').map(Number)
  const date = new Date(`${iso}T00:00:00+09:00`)
  const wd = KST_WEEKDAYS[date.getUTCDay()]
  return `${String(m).padStart(2,'0')}.${String(d).padStart(2,'0')} · ${wd}`
}

export function HistoryList({ items }: { items: Item[] }) {
  if (items.length === 0) return <EmptyState />
  return (
    <ul className="flex flex-col">
      {items.map((it, idx) => (
        <li
          key={it.fortuneDate}
          className={idx === items.length - 1 ? '' : 'border-b border-hairline-soft'}
        >
          <Link
            href={`/history/${it.fortuneDate}`}
            className="flex items-center gap-3.5 py-[18px]"
          >
            <div className="flex flex-1 flex-col gap-1">
              <span className="text-[10px] leading-[1.33] font-bold tracking-[1.5px] text-steel">
                {formatRowDate(it.fortuneDate)}
              </span>
              <span className="line-clamp-1 text-[14px] leading-[1.5] tracking-[-0.1px] text-ink-deep">
                {it.payload.headline}
              </span>
            </div>
            <span
              className="block h-2.5 w-2.5 shrink-0 rounded-full"
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
    <div className="py-16 text-center">
      <p className="text-[16px] leading-[1.5] text-ink">아직 기록이 없어요.</p>
      <p className="mt-2 text-[14px] leading-[1.43] text-steel">오늘 운세를 보면 여기에 쌓여요.</p>
      <Link
        href="/"
        className="mt-4 inline-block text-[16px] leading-[1.5] font-bold text-ink-deep underline-offset-4 hover:underline"
      >
        오늘의 운세 보기
      </Link>
    </div>
  )
}
