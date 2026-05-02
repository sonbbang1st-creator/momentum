// src/app/_components/history-calendar.tsx
import Link from 'next/link'
import type { FortunePayload } from '@/app/_lib/fortune/schema'

interface Item {
  fortuneDate: string
  payload: FortunePayload
}

export function HistoryCalendar({ items, todayIso }: { items: Item[]; todayIso: string }) {
  const byDate = new Map(items.map(it => [it.fortuneDate, it]))
  const [y, m] = todayIso.split('-').map(Number)
  const firstDay = new Date(Date.UTC(y, m - 1, 1))
  const startWeekday = firstDay.getUTCDay()
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate()

  const cells: ({ iso: string; item: Item | undefined } | null)[] = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ iso, item: byDate.get(iso) })
  }

  return (
    <div>
      <h2 className="text-[18px] leading-[1.44] font-bold text-ink-deep">{y}년 {m}월</h2>
      <div className="mt-(--spacing-md) grid grid-cols-7 gap-1 text-center">
        {['일','월','화','수','목','금','토'].map(d => (
          <span key={d} className="text-[12px] leading-[1.33] text-steel py-1">{d}</span>
        ))}
        {cells.map((c, idx) => {
          if (!c) return <span key={`b-${idx}`} />
          const isToday = c.iso === todayIso
          const day = Number(c.iso.slice(8, 10))
          const cell = (
            <span
              className={[
                'flex flex-col items-center justify-center h-12 rounded-lg',
                isToday ? 'border-2 border-ink-deep' : '',
              ].join(' ')}
            >
              <span className="text-[14px] leading-[1.43] text-ink">{day}</span>
              {c.item && (
                <span
                  className="mt-1 w-2 h-2 rounded-full"
                  style={{ background: c.item.payload.lucky.color.hex }}
                  aria-hidden
                />
              )}
            </span>
          )
          return c.item ? (
            <Link key={c.iso} href={`/history/${c.iso}`}>{cell}</Link>
          ) : (
            <span key={c.iso}>{cell}</span>
          )
        })}
      </div>
    </div>
  )
}
