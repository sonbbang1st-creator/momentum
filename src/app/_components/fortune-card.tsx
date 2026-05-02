// src/app/_components/fortune-card.tsx
import type { FortunePayload } from '@/app/_lib/fortune/schema'
import { MBTI_NICKNAMES, type Mbti } from '@/app/_lib/mbti'
import { LuckyTrio } from './lucky-trio'

export function FortuneCard(props: {
  mbti: Mbti
  payload: FortunePayload
  fallbackNotice?: boolean
}) {
  return (
    <section>
      {props.fallbackNotice && (
        <p className="mb-(--spacing-md) text-[14px] leading-[1.43] text-attention">
          다시 불러오는 중이에요. 새로고침해 보세요.
        </p>
      )}
      <article className="rounded-[32px] bg-surface-soft px-(--spacing-xxl) py-(--spacing-xxl)">
        <p className="text-[14px] leading-[1.43] font-bold text-steel">
          {props.mbti}({MBTI_NICKNAMES[props.mbti]})인 당신에게
        </p>
        <h2
          className="mt-(--spacing-md) text-[28px] leading-[1.21] font-light text-ink-deep"
          style={{ fontFeatureSettings: '"ss01","ss02"' }}
        >
          {props.payload.headline}
        </h2>
        <p className="mt-(--spacing-base) text-[16px] leading-[1.5] text-ink tracking-[-0.16px]">
          {props.payload.advice}
        </p>
      </article>
      <LuckyTrio lucky={props.payload.lucky} />
    </section>
  )
}
