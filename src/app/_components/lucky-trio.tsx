import { Coffee } from 'lucide-react'
import type { FortunePayload } from '@/app/_lib/fortune/schema'

export function LuckyTrio({ lucky }: { lucky: FortunePayload['lucky'] }) {
  return (
    <ul className="mt-3 grid grid-cols-3 gap-2.5">
      <li
        className="flex flex-col items-center justify-center gap-2.5 rounded-[24px] px-3 py-[18px]"
        style={{ background: '#E8F4EC' }}
      >
        <span
          className="block h-12 w-12 rounded-full"
          style={{ background: lucky.color.hex, boxShadow: '0 0 0 6px #FFFFFF' }}
          aria-hidden
        />
        <span className="text-[10px] leading-[1.33] font-bold tracking-[1.2px] text-charcoal">행운의 색</span>
        <span className="text-[11px] leading-[1.33] text-ink-deep">{lucky.color.name}</span>
      </li>
      <li
        className="flex flex-col items-center justify-center gap-1.5 rounded-[24px] px-3 py-[18px]"
        style={{ background: '#EAF1F9' }}
      >
        <span
          className="text-[56px] leading-[1] font-light tracking-[-2px] text-ink-deep"
          style={{ fontFeatureSettings: '"ss01","ss02"' }}
        >
          {lucky.number}
        </span>
        <span className="text-[10px] leading-[1.33] font-bold tracking-[1.2px] text-charcoal">행운의 숫자</span>
      </li>
      <li
        className="flex flex-col items-center justify-center gap-2 rounded-[24px] px-3 py-[18px] text-center"
        style={{ background: '#FBEDE2' }}
      >
        <Coffee size={28} className="text-ink-deep" />
        <span className="text-[12px] leading-[1.33] font-bold tracking-[-0.1px] text-ink-deep">
          {lucky.item}
        </span>
        <span className="text-[10px] leading-[1.33] font-bold tracking-[1.2px] text-charcoal">행운의 아이템</span>
      </li>
    </ul>
  )
}
