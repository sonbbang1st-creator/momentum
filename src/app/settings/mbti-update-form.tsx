// src/app/settings/mbti-update-form.tsx
'use client'
import { useState } from 'react'
import type { Mbti } from '@/app/_lib/mbti'
import { MbtiGrid } from '@/app/_components/mbti-grid'
import { updateMbti } from '@/app/_actions/profile'

export function MbtiUpdateForm({ initial }: { initial: Mbti }) {
  const [value, setValue] = useState<Mbti>(initial)
  return (
    <form action={updateMbti}>
      <MbtiGrid name="mbti" initialValue={initial} onChange={setValue} />
      <button
        type="submit"
        disabled={value === initial}
        className="mt-(--spacing-base) w-full rounded-full bg-ink-button text-on-ink-button px-[30px] py-[14px] text-[14px] font-bold tracking-[-0.14px] disabled:bg-stone disabled:text-canvas"
      >
        변경 저장
      </button>
    </form>
  )
}
