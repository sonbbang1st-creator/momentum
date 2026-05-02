'use client'
import { useState } from 'react'
import type { Mbti } from '@/app/_lib/mbti'
import { MbtiGrid } from '@/app/_components/mbti-grid'
import { updateMbti } from '@/app/_actions/profile'

export function MbtiUpdateForm({ initial }: { initial: Mbti }) {
  const [value, setValue] = useState<Mbti>(initial)
  return (
    <form action={updateMbti} className="flex flex-col gap-4">
      <MbtiGrid name="mbti" initialValue={initial} onChange={setValue} />
      <button
        type="submit"
        disabled={value === initial}
        className="w-full rounded-full bg-ink-button px-[30px] py-4 text-[15px] font-bold tracking-[-0.2px] text-on-ink-button disabled:bg-stone disabled:text-canvas"
      >
        변경 저장
      </button>
    </form>
  )
}
