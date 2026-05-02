import Link from 'next/link'
import { CalendarClock, Settings } from 'lucide-react'

interface TopBarProps {
  isoDate: string  // e.g. "2026.05.02"
  weekdayLabel: string  // e.g. "토요일"
}

export function TopBar({ isoDate, weekdayLabel }: TopBarProps) {
  return (
    <header className="flex items-center justify-between py-3">
      <div className="flex flex-col">
        <span className="text-[11px] leading-[1.33] font-bold tracking-[1.5px] text-steel">{isoDate}</span>
        <span className="text-[14px] leading-[1.43] font-bold text-ink">{weekdayLabel}</span>
      </div>
      <nav className="flex items-center gap-1.5">
        <Link
          href="/history"
          aria-label="내 기록"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-hairline-soft bg-canvas text-ink"
        >
          <CalendarClock size={18} />
        </Link>
        <Link
          href="/settings"
          aria-label="설정"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-hairline-soft bg-canvas text-ink"
        >
          <Settings size={18} />
        </Link>
      </nav>
    </header>
  )
}
