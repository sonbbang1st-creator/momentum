import Link from 'next/link'
import type { FortunePayload } from '@/app/_lib/fortune/schema'

interface Item {
  fortuneDate: string
  payload: FortunePayload
}

const WEEKDAYS = ['일','월','화','수','목','금','토']

export function HistoryCalendar({ items, todayIso }: { items: Item[]; todayIso: string }) {
  const byDate = new Map(items.map(it => [it.fortuneDate, it]))
  const [y, m] = todayIso.split('-').map(Number)
  const firstDay = new Date(Date.UTC(y, m - 1, 1))
  const startWeekday = firstDay.getUTCDay()
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate()

  const cells: ({ iso: string; item: Item | undefined } | null)[] = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    cells.push({ iso, item: byDate.get(iso) })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end justify-between">
        <h2 className="text-[20px] leading-[1.21] font-medium tracking-[-0.4px] text-ink-deep">
          {y}년 {m}월
        </h2>
        <div className="flex items-center gap-1.5">
          <span className="block h-1.5 w-1.5 rounded-full" style={{ background: '#9DD6B0' }} aria-hidden />
          <span className="text-[11px] leading-[1.33] font-bold tracking-[0.2px] text-charcoal">
            {items.length}개의 기록
          </span>
        </div>
      </div>
      <div className="grid grid-cols-7">
        {WEEKDAYS.map((d) => (
          <span key={d} className="py-1.5 text-center text-[10px] leading-[1.33] font-bold tracking-[1.5px] text-stone">
            {d}
          </span>
        ))}
        {cells.map((c, idx) => {
          if (!c) return <span key={`b-${idx}`} className="aspect-square" />
          const isToday = c.iso === todayIso
          const day = Number(c.iso.slice(8, 10))
          const inner = (
            <span className="flex h-full w-full flex-col items-center justify-center gap-0.5">
              {isToday ? (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-deep text-[14px] font-bold text-canvas">
                  {day}
                </span>
              ) : (
                <span className="text-[14px] leading-[1.2] text-ink">{day}</span>
              )}
              {c.item ? (
                <span
                  className="block h-1.5 w-1.5 rounded-full"
                  style={{ background: c.item.payload.lucky.color.hex }}
                  aria-hidden
                />
              ) : (
                <span className="block h-1.5 w-1.5" />
              )}
            </span>
          )
          return c.item ? (
            <Link key={c.iso} href={`/history/${c.iso}`} className="aspect-square">{inner}</Link>
          ) : (
            <span key={c.iso} className="aspect-square">{inner}</span>
          )
        })}
      </div>
    </div>
  )
}
