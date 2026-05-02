import type { FortunePayload } from '@/app/_lib/fortune/schema'
import { MBTI_NICKNAMES, type Mbti } from '@/app/_lib/mbti'

export function FortuneCard(props: {
  mbti: Mbti
  payload: FortunePayload
  fallbackNotice?: boolean
}) {
  return (
    <section>
      {props.fallbackNotice && (
        <p className="mb-3 text-[14px] leading-[1.43] text-attention">
          다시 불러오는 중이에요. 새로고침해 보세요.
        </p>
      )}
      <article
        className="flex flex-col justify-between gap-3.5 rounded-[32px] p-7"
        style={{
          background:
            'linear-gradient(135deg, #D6F0DD 0%, #FFE5D5 100%), #F2F8F4',
          backgroundBlendMode: 'multiply',
        }}
      >
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] leading-[1.33] font-bold tracking-[2px] text-charcoal">
            오늘의 한 줄
          </p>
          <p className="text-[13px] leading-[1.43] font-bold text-ink-deep">
            {props.mbti} — {MBTI_NICKNAMES[props.mbti]}
          </p>
        </div>

        <div className="flex flex-col gap-[18px]">
          <h2
            className="text-[30px] leading-[1.22] font-medium tracking-[-0.6px] text-ink-deep"
            style={{ fontFeatureSettings: '"ss01","ss02"' }}
          >
            {props.payload.headline}
          </h2>
          <p className="text-[15px] leading-[1.6] font-light tracking-[-0.15px] text-ink">
            {props.payload.advice}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="block h-1.5 w-1.5 rounded-full bg-ink-deep" aria-hidden />
          <span className="text-[11px] leading-[1.33] font-bold tracking-[1px] text-charcoal">
            momentum
          </span>
        </div>
      </article>
    </section>
  )
}
