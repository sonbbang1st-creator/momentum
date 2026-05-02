// src/app/not-found.tsx
import Link from 'next/link'
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-(--spacing-xl) text-center">
      <h1 className="text-[24px] leading-[1.25] font-medium text-ink-deep">찾을 수 없는 화면이에요</h1>
      <p className="mt-(--spacing-base) text-[16px] leading-[1.5] text-ink">아직 운세가 기록되지 않은 날일 수 있어요.</p>
      <Link href="/" className="mt-(--spacing-xl) rounded-full bg-ink-button text-on-ink-button px-[30px] py-[14px] text-[14px] font-bold tracking-[-0.14px]">
        오늘의 운세로 가기
      </Link>
    </main>
  )
}
