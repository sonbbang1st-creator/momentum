'use client'

import { useActionState, useEffect, useState } from 'react'
import { Loader2, MailCheck, RefreshCw } from 'lucide-react'
import { requestMagicLink, type RequestMagicLinkResult } from './actions'

export function EmailForm() {
  const [state, formAction, isPending] = useActionState<
    RequestMagicLinkResult | null,
    FormData
  >(requestMagicLink, null)

  const [view, setView] = useState<'form' | 'sent'>('form')
  const [sentEmail, setSentEmail] = useState('')

  useEffect(() => {
    if (state?.ok) {
      setSentEmail(state.email)
      setView('sent')
    }
  }, [state])

  if (view === 'sent') {
    return (
      <div className="flex w-full flex-col items-center gap-[18px]">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-soft">
          <MailCheck size={28} className="text-ink-deep" />
        </div>
        <h2 className="text-[24px] font-medium leading-[1.25] text-ink-deep">
          메일을 보냈어요
        </h2>
        <p className="text-[14px] font-bold tracking-[-0.14px] text-primary">
          {sentEmail}
        </p>
        <p className="text-center text-[14px] leading-[1.43] tracking-[-0.14px] text-charcoal">
          도착한 링크를 눌러 5분 안에 로그인하세요.
        </p>
        <span aria-hidden className="h-px w-10 bg-hairline-soft" />
        <button
          type="button"
          onClick={() => setView('form')}
          className="inline-flex items-center gap-1.5 text-[14px] font-bold tracking-[-0.14px] text-ink-deep underline"
        >
          <RefreshCw size={14} /> 다시 보내기
        </button>
        <button
          type="button"
          onClick={() => setView('form')}
          className="text-[13px] text-steel underline"
        >
          다른 이메일로
        </button>
      </div>
    )
  }

  const errorMessage =
    state && !state.ok
      ? state.reason === 'format'
        ? '이메일 형식을 확인해주세요'
        : '회사 이메일로 가입할 수 있어요'
      : null

  return (
    <form action={formAction} className="flex w-full flex-col gap-3">
      <input
        type="email"
        name="email"
        required
        autoComplete="email"
        placeholder="company@example.com"
        aria-invalid={errorMessage ? 'true' : undefined}
        className={`h-11 w-full rounded-lg border bg-canvas px-4 text-[15px] text-ink-deep placeholder:text-stone outline-none ${
          errorMessage
            ? 'border-critical-strong'
            : 'border-hairline focus:border-primary'
        }`}
      />
      {errorMessage && (
        <p className="text-[13px] text-critical-strong">{errorMessage}</p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-ink-deep bg-canvas px-[30px] py-[14px] text-[15px] font-bold tracking-[-0.2px] text-ink-deep disabled:opacity-60"
      >
        {isPending && <Loader2 size={16} className="animate-spin" />}
        이메일로 링크 받기
      </button>
    </form>
  )
}
