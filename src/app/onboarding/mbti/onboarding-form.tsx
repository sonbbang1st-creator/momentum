// src/app/onboarding/mbti/onboarding-form.tsx
'use client'
import { useState } from 'react'
import type { Mbti } from '@/app/_lib/mbti'
import { MbtiGrid } from '@/app/_components/mbti-grid'
import { createProfile } from '@/app/_actions/profile'

export function OnboardingForm() {
  const [value, setValue] = useState<Mbti | undefined>(undefined)
  return (
    <form action={createProfile} className="mt-(--spacing-xxl) flex-1 flex flex-col">
      <MbtiGrid name="mbti" initialValue={value} onChange={setValue} />
      <div className="mt-auto pt-(--spacing-xl)">
        <button
          type="submit"
          disabled={!value}
          className="w-full rounded-full bg-ink-button text-on-ink-button px-[30px] py-[14px] text-[14px] font-bold tracking-[-0.14px] disabled:bg-stone disabled:text-canvas"
        >
          시작하기
        </button>
      </div>
    </form>
  )
}
