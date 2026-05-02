// src/app/_components/pill-tab.tsx
'use client'
import { useRouter, useSearchParams } from 'next/navigation'

export function PillTab({
  options,
  current,
  paramName,
}: {
  options: { value: string; label: string }[]
  current: string
  paramName: string
}) {
  const router = useRouter()
  const params = useSearchParams()
  return (
    <div className="inline-flex rounded-full bg-canvas border border-hairline p-1">
      {options.map((o) => {
        const active = o.value === current
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => {
              const next = new URLSearchParams(params)
              next.set(paramName, o.value)
              router.replace(`?${next.toString()}`, { scroll: false })
            }}
            className={[
              'px-(--spacing-base) py-(--spacing-xs) text-[14px] leading-[1.43] font-bold rounded-full',
              active ? 'bg-ink-deep text-canvas' : 'text-ink',
            ].join(' ')}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
