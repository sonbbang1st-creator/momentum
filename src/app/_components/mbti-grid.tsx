// src/app/_components/mbti-grid.tsx
'use client'
import { useState } from 'react'
import { MBTI_TYPES, MBTI_NICKNAMES, type Mbti } from '@/app/_lib/mbti'

interface Props {
  name: string                 // hidden input name (used inside <form>)
  initialValue?: Mbti
  onChange?: (value: Mbti) => void
}

export function MbtiGrid({ name, initialValue, onChange }: Props) {
  const [selected, setSelected] = useState<Mbti | undefined>(initialValue)

  return (
    <>
      <input type="hidden" name={name} value={selected ?? ''} />
      <div className="grid grid-cols-4 gap-(--spacing-md)">
        {MBTI_TYPES.map((t) => {
          const isSelected = t === selected
          return (
            <button
              type="button"
              key={t}
              onClick={() => { setSelected(t); onChange?.(t) }}
              className={[
                'flex flex-col items-center justify-center gap-1',
                'rounded-xl bg-surface-soft px-2 py-3',
                'border',
                isSelected
                  ? 'border-2 border-ink-deep'
                  : 'border-hairline-soft',
              ].join(' ')}
            >
              <span className="text-[18px] leading-[1.44] font-bold text-ink-deep">{t}</span>
              <span className="text-[14px] leading-[1.43] text-steel">{MBTI_NICKNAMES[t]}</span>
            </button>
          )
        })}
      </div>
    </>
  )
}
