// src/app/_components/top-bar.tsx
import Link from 'next/link'
import { History, Settings } from 'lucide-react'

export function TopBar({ dateLabel }: { dateLabel: string }) {
  return (
    <header className="flex items-center justify-between py-(--spacing-md)">
      <span className="text-[14px] leading-[1.43] font-bold tracking-[-0.14px] text-ink">{dateLabel}</span>
      <nav className="flex items-center gap-(--spacing-xs)">
        <Link
          href="/history"
          aria-label="내 기록"
          className="w-10 h-10 rounded-full bg-canvas border border-hairline-soft flex items-center justify-center"
        >
          <History size={20} />
        </Link>
        <Link
          href="/settings"
          aria-label="설정"
          className="w-10 h-10 rounded-full bg-canvas border border-hairline-soft flex items-center justify-center"
        >
          <Settings size={20} />
        </Link>
      </nav>
    </header>
  )
}
