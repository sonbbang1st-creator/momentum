'use client'
import { useState } from 'react'
import { MBTI_TYPES, MBTI_NICKNAMES, type Mbti } from '@/app/_lib/mbti'

interface Props {
  name: string
  initialValue?: Mbti
  onChange?: (value: Mbti) => void
}

export function MbtiGrid({ name, initialValue, onChange }: Props) {
  const [selected, setSelected] = useState<Mbti | undefined>(initialValue)

  return (
    <>
      <input type="hidden" name={name} value={selected ?? ''} />
      <div className="grid grid-cols-4 gap-2">
        {MBTI_TYPES.map((t) => {
          const isSelected = t === selected
          return (
            <button
              type="button"
              key={t}
              onClick={() => { setSelected(t); onChange?.(t) }}
              className={[
                'flex aspect-[1/1.05] flex-col items-center justify-center gap-0.5 rounded-[14px] px-1 py-2.5 transition-colors',
                isSelected
                  ? 'border-2 border-ink-deep'
                  : 'border border-hairline-soft bg-canvas',
              ].join(' ')}
              style={isSelected ? { background: '#FBEDE2' } : undefined}
            >
              <span className="text-[15px] leading-[1.2] font-bold tracking-[-0.2px] text-ink-deep">{t}</span>
              <span className={[
                'text-[10px] leading-[1.33]',
                isSelected ? 'text-charcoal' : 'text-steel',
              ].join(' ')}>
                {MBTI_NICKNAMES[t]}
              </span>
            </button>
          )
        })}
      </div>
    </>
  )
}
