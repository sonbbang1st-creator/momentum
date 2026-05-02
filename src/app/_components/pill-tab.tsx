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
    <div className="inline-flex rounded-full p-1" style={{ background: '#F5F6F7' }}>
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
              'rounded-full px-4 py-1.5 text-[12px] leading-[1.33] font-bold',
              active ? 'bg-ink-deep text-canvas' : 'text-charcoal',
            ].join(' ')}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
