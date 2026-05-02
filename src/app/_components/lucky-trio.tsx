// src/app/_components/lucky-trio.tsx
import type { FortunePayload } from '@/app/_lib/fortune/schema'

export function LuckyTrio({ lucky }: { lucky: FortunePayload['lucky'] }) {
  return (
    <ul className="mt-(--spacing-md) grid grid-cols-3 gap-(--spacing-md)">
      <li className="rounded-xl border border-hairline-soft bg-canvas px-(--spacing-md) py-(--spacing-base) flex flex-col items-center gap-(--spacing-xs)">
        <span
          className="block w-12 h-12 rounded-full"
          style={{ background: lucky.color.hex }}
          aria-hidden
        />
        <span className="text-[12px] leading-[1.33] font-bold text-ink">행운의 색</span>
        <span className="text-[12px] leading-[1.33] text-steel">{lucky.color.name}</span>
      </li>
      <li className="rounded-xl border border-hairline-soft bg-canvas px-(--spacing-md) py-(--spacing-base) flex flex-col items-center gap-(--spacing-xs)">
        <span className="text-[36px] leading-[1.17] font-medium text-ink-deep" style={{ fontFeatureSettings: '"ss01","ss02"' }}>
          {lucky.number}
        </span>
        <span className="text-[12px] leading-[1.33] font-bold text-ink">행운의 숫자</span>
      </li>
      <li className="rounded-xl border border-hairline-soft bg-canvas px-(--spacing-md) py-(--spacing-base) flex flex-col items-center gap-(--spacing-xs)">
        <span className="text-[14px] leading-[1.43] font-bold text-ink-deep text-center">{lucky.item}</span>
        <span className="text-[12px] leading-[1.33] font-bold text-ink">행운의 아이템</span>
      </li>
    </ul>
  )
}
