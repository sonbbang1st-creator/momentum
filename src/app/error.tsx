// src/app/error.tsx
'use client'
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-(--spacing-xl) text-center">
      <h1 className="text-[24px] leading-[1.25] font-medium text-ink-deep">잠시 문제가 생겼어요</h1>
      <p className="mt-(--spacing-base) text-[16px] leading-[1.5] text-ink">새로고침 한 번이면 보통 해결돼요.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-(--spacing-xl) rounded-full bg-ink-button text-on-ink-button px-[30px] py-[14px] text-[14px] font-bold tracking-[-0.14px]"
      >
        다시 시도
      </button>
    </main>
  )
}
