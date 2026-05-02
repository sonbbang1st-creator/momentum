'use client'
import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import type { Mbti } from '@/app/_lib/mbti'
import { MBTI_NICKNAMES } from '@/app/_lib/mbti'
import { MbtiGrid } from '@/app/_components/mbti-grid'
import { createProfile } from '@/app/_actions/profile'

export function OnboardingForm() {
  const [value, setValue] = useState<Mbti | undefined>(undefined)
  return (
    <form action={createProfile} className="flex flex-1 flex-col">
      <MbtiGrid name="mbti" initialValue={value} onChange={setValue} />
      <div className="mt-auto flex flex-col items-center gap-3 pt-6">
        {value && (
          <div className="flex items-center gap-1.5">
            <span className="block h-1.5 w-1.5 rounded-full" style={{ background: '#9DD6B0' }} aria-hidden />
            <span className="text-[12px] leading-[1.33] font-bold tracking-[0.2px] text-charcoal">
              {value} — {MBTI_NICKNAMES[value]} 선택됨
            </span>
          </div>
        )}
        <button
          type="submit"
          disabled={!value}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-ink-button px-[30px] py-4 text-[15px] font-bold tracking-[-0.2px] text-on-ink-button disabled:bg-stone disabled:text-canvas"
        >
          시작하기
          <ArrowRight size={16} />
        </button>
      </div>
    </form>
  )
}
