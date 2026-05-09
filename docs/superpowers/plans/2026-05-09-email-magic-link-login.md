# 이메일 매직 링크 로그인 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Google OAuth 단일 진입점에 사내 이메일 매직 링크 로그인을 추가하여, 환경변수로 관리되는 도메인 화이트리스트로 가입 가능 이메일을 제한한다.

**Architecture:** Supabase `signInWithOtp` 매직 링크를 Server Action으로 호출. 클라이언트는 폼 ↔ "메일 보냈어요" 두 상태를 `useActionState` 결과로 토글. 도메인 검증은 환경변수 한 곳(`ALLOWED_EMAIL_DOMAINS`)에 두고 서버에서만 수행하여 클라이언트 번들에 노출하지 않는다. 콜백은 기존 `/auth/callback`(PKCE `exchangeCodeForSession`)을 재사용한다.

**Tech Stack:** Next.js 16 App Router (React 19), `@supabase/ssr`, zod 4, Vitest 4 + happy-dom, Tailwind v4, lucide-react.

**Spec:** `docs/superpowers/specs/2026-05-09-email-login-design.md`

**Pencil mockups (untitled.pen):**
- `Login — Form` (id `f8Vhr`, x=80, y=1964)
- `Login — Email Sent` (id `F0V9f`, x=520, y=1964)

---

## Task 1: 도메인 화이트리스트 유틸 + 단위 테스트 (TDD)

**Files:**
- Create: `tests/unit/email-domains.test.ts`
- Create: `src/app/_lib/auth/email-domains.ts`

- [ ] **Step 1.1: 실패 테스트 작성**

`tests/unit/email-domains.test.ts`:

```ts
import { afterEach, describe, expect, test } from 'vitest'
import { isAllowedDomain } from '@/app/_lib/auth/email-domains'

const ENV_KEY = 'ALLOWED_EMAIL_DOMAINS'

afterEach(() => {
  delete process.env[ENV_KEY]
})

describe('isAllowedDomain', () => {
  test('환경변수가 비어있으면 모든 도메인을 허용한다', () => {
    expect(isAllowedDomain('foo@gmail.com')).toBe(true)
    expect(isAllowedDomain('bar@anywhere.io')).toBe(true)
  })

  test('환경변수가 미정의면 모든 도메인을 허용한다', () => {
    delete process.env[ENV_KEY]
    expect(isAllowedDomain('foo@gmail.com')).toBe(true)
  })

  test('단일 도메인이 등록되면 그 도메인만 허용한다', () => {
    process.env[ENV_KEY] = 'company.com'
    expect(isAllowedDomain('alice@company.com')).toBe(true)
    expect(isAllowedDomain('alice@gmail.com')).toBe(false)
  })

  test('콤마로 여러 도메인을 등록할 수 있다', () => {
    process.env[ENV_KEY] = 'company.com,subsidiary.co.kr'
    expect(isAllowedDomain('alice@company.com')).toBe(true)
    expect(isAllowedDomain('bob@subsidiary.co.kr')).toBe(true)
    expect(isAllowedDomain('charlie@gmail.com')).toBe(false)
  })

  test('대소문자를 가리지 않는다', () => {
    process.env[ENV_KEY] = 'Company.COM'
    expect(isAllowedDomain('alice@COMPANY.com')).toBe(true)
    expect(isAllowedDomain('alice@company.com')).toBe(true)
  })

  test('도메인 양쪽 공백을 트림한다', () => {
    process.env[ENV_KEY] = '  company.com ,  other.com  '
    expect(isAllowedDomain('alice@company.com')).toBe(true)
    expect(isAllowedDomain('bob@other.com')).toBe(true)
  })

  test('@ 기호가 없는 입력은 거절한다', () => {
    process.env[ENV_KEY] = 'company.com'
    expect(isAllowedDomain('not-an-email')).toBe(false)
  })

  test('@ 뒤 도메인이 비어있는 입력은 거절한다', () => {
    process.env[ENV_KEY] = 'company.com'
    expect(isAllowedDomain('alice@')).toBe(false)
  })
})
```

- [ ] **Step 1.2: 테스트 실행해 실패 확인**

Run: `npm test -- tests/unit/email-domains.test.ts`
Expected: 실패 — `Failed to resolve import "@/app/_lib/auth/email-domains"` 또는 모듈 없음 에러.

- [ ] **Step 1.3: 최소 구현 작성**

`src/app/_lib/auth/email-domains.ts`:

```ts
export function getAllowedDomains(): string[] {
  const raw = process.env.ALLOWED_EMAIL_DOMAINS ?? ''
  return raw
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean)
}

export function isAllowedDomain(email: string): boolean {
  const allowed = getAllowedDomains()
  if (allowed.length === 0) return true

  const at = email.lastIndexOf('@')
  if (at === -1) return false
  const domain = email.slice(at + 1).trim().toLowerCase()
  if (!domain) return false

  return allowed.includes(domain)
}
```

- [ ] **Step 1.4: 테스트가 통과하는지 확인**

Run: `npm test -- tests/unit/email-domains.test.ts`
Expected: 8 tests passed.

- [ ] **Step 1.5: 커밋**

```bash
git add src/app/_lib/auth/email-domains.ts tests/unit/email-domains.test.ts
git commit -m "feat(auth): add ALLOWED_EMAIL_DOMAINS whitelist utility"
```

---

## Task 2: Server Action `requestMagicLink`

**Files:**
- Create: `src/app/login/actions.ts`

- [ ] **Step 2.1: Server Action 작성**

`src/app/login/actions.ts`:

```ts
'use server'

import { z } from 'zod'
import { headers } from 'next/headers'
import { createServerSupabase } from '@/app/_lib/supabase/server'
import { isAllowedDomain } from '@/app/_lib/auth/email-domains'

const Schema = z.object({
  email: z.string().trim().toLowerCase().email(),
})

export type RequestMagicLinkResult =
  | { ok: true; email: string }
  | { ok: false; reason: 'format' | 'domain' }

export async function requestMagicLink(
  _prev: RequestMagicLinkResult | null,
  formData: FormData,
): Promise<RequestMagicLinkResult> {
  const parsed = Schema.safeParse({ email: formData.get('email') })
  if (!parsed.success) return { ok: false, reason: 'format' }

  const email = parsed.data.email
  if (!isAllowedDomain(email)) return { ok: false, reason: 'domain' }

  const h = await headers()
  const proto = h.get('x-forwarded-proto') ?? 'https'
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? ''
  const origin = h.get('origin') ?? (host ? `${proto}://${host}` : '')

  const supabase = await createServerSupabase()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      shouldCreateUser: true,
    },
  })

  if (error) {
    console.error('[requestMagicLink] supabase error:', error.message)
  }
  return { ok: true, email }
}
```

> **메모:** Supabase 에러(rate limit 포함)는 사용자에게 노출하지 않고 서버 로그로만 남긴다(이메일 열거 방지). 형식·도메인 위반만 인라인 에러로 보여준다.

- [ ] **Step 2.2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 새 파일 관련 에러 없음.

- [ ] **Step 2.3: 커밋**

```bash
git add src/app/login/actions.ts
git commit -m "feat(auth): add requestMagicLink server action"
```

---

## Task 3: 클라이언트 EmailForm 컴포넌트

**Files:**
- Create: `src/app/login/email-form.tsx`

- [ ] **Step 3.1: 클라이언트 컴포넌트 작성**

`src/app/login/email-form.tsx`:

```tsx
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
```

> **메모:** `useActionState`는 React 19의 폼 상태 훅이다. `formAction`을 `<form action={...}>`에 직접 넘기면 자동으로 `_prev` + `FormData`로 호출된다. `useEffect`로 성공 결과를 감지해 `view`를 토글한다.

- [ ] **Step 3.2: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음. (Tailwind 토큰 클래스 — `bg-canvas`, `text-ink-deep`, `bg-surface-soft`, `text-primary`, `bg-hairline-soft`, `border-hairline`, `border-critical-strong`, `text-critical-strong`, `text-stone`, `text-charcoal`, `text-steel` — 은 기존 페이지에서 이미 쓰이고 있어 Tailwind 빌드에 등록돼있음.)

- [ ] **Step 3.3: 커밋**

```bash
git add src/app/login/email-form.tsx
git commit -m "feat(auth): add email magic-link form with sent confirmation view"
```

---

## Task 4: 로그인 페이지 통합 + 환경변수 example 갱신

**Files:**
- Modify: `src/app/login/page.tsx`
- Modify: `.env.local.example`

- [ ] **Step 4.1: `login/page.tsx`를 다음 내용으로 교체**

`src/app/login/page.tsx`:

```tsx
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/app/_lib/supabase/server'
import { LoginButton } from './login-button'
import { EmailForm } from './email-form'

export default async function LoginPage() {
  const supabase = await createServerSupabase()
  const { data } = await supabase.auth.getUser()
  if (data.user) redirect('/')

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-canvas px-8 pb-10 pt-[88px]">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 h-[300px] w-[300px] rounded-full opacity-60 blur-[60px]"
        style={{ background: '#B8E6D2' }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-16 h-[280px] w-[280px] rounded-full opacity-50 blur-[60px]"
        style={{ background: '#FBE5DD' }}
      />

      <div className="relative flex flex-1 flex-col gap-5">
        <p className="text-[12px] font-bold tracking-[2.5px] text-steel">MBTI</p>
        <h1
          className="text-[56px] leading-[1.05] font-medium tracking-[-1.5px] text-ink-deep"
          style={{ fontFeatureSettings: '"ss01","ss02"' }}
        >
          데일리 운세
        </h1>
        <p className="text-[22px] leading-[1.36] font-light tracking-[-0.4px] text-charcoal whitespace-pre-line">
          {'내 MBTI에 맞춘\n오늘의 다정한 한 줄.'}
        </p>
      </div>

      <div className="relative flex flex-col items-center gap-3.5">
        <LoginButton />
        <div className="flex w-full items-center gap-3">
          <span className="h-px flex-1 bg-hairline-soft" />
          <span className="text-[12px] font-bold tracking-[2px] text-steel">또는</span>
          <span className="h-px flex-1 bg-hairline-soft" />
        </div>
        <EmailForm />
        <p className="text-center text-[11px] leading-[1.45] text-steel">
          로그인 시 서비스 이용약관과 개인정보처리방침에 동의하게 돼요.
        </p>
      </div>
    </main>
  )
}
```

- [ ] **Step 4.2: `.env.local.example`에 환경변수 추가**

`.env.local.example`을 다음으로 교체:

```env
# --- Supabase (required) ---
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# --- OpenRouter (required, server-only) ---
OPENROUTER_API_KEY=
OPENROUTER_MODEL=google/gemini-2.5-flash
OPENROUTER_REFERER=http://localhost:3000
OPENROUTER_TITLE=MBTI Daily Fortune

# --- Auth (optional) ---
# 이메일 매직 링크 로그인 시 가입 허용 도메인 (콤마 구분, 소문자, 양쪽 공백 허용).
# 비워두거나 미정의이면 모든 도메인 허용 (개발/스테이징 편의).
# 예: ALLOWED_EMAIL_DOMAINS=company.com,subsidiary.co.kr
ALLOWED_EMAIL_DOMAINS=
```

- [ ] **Step 4.3: 빌드/타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

Run: `npm run build`
Expected: `✓ Compiled successfully`. `/login`이 정적/동적으로 빌드돼야 한다.

- [ ] **Step 4.4: 커밋**

```bash
git add src/app/login/page.tsx .env.local.example
git commit -m "feat(login): wire email form into /login page with divider"
```

---

## Task 5: Supabase URL 등록 + 수동 검증

> **메모:** 이 단계는 Supabase 대시보드 + 로컬 dev 서버 테스트라 자동화 불가. 사람이 직접 확인.

- [ ] **Step 5.1: Supabase 대시보드 → Authentication → URL Configuration 확인**

다음 URL이 Redirect URLs에 등록돼 있어야 한다:

- `http://localhost:3000/auth/callback`
- 프로덕션 콜백 URL (예: `https://<production-host>/auth/callback`)
- Vercel 프리뷰: `https://*-<vercel-team>.vercel.app/auth/callback` 와일드카드 (Supabase는 `*` 와일드카드 지원)

빠진 항목이 있으면 추가하고 저장한다.

- [ ] **Step 5.2: Authentication → Providers → Email 활성화 확인**

Email provider가 Enabled 상태이고, "Confirm email" 옵션은 환경에 따라 결정 (이번 흐름은 매직 링크 자체가 인증 역할이라 별도 확인 메일 불필요).

- [ ] **Step 5.3: 로컬 환경변수 설정**

`.env.local`에 다음 한 줄 추가 (테스트용 화이트리스트):

```env
ALLOWED_EMAIL_DOMAINS=gmail.com
```

> 테스트 후 실제 사내 도메인으로 변경.

- [ ] **Step 5.4: dev 서버 켜고 4가지 케이스 수동 검증**

Run: `npm run dev`

`http://localhost:3000/login`에서 다음을 확인:

| 케이스 | 입력 | 기대 결과 |
|---|---|---|
| 잘못된 형식 | `not-an-email` | 폼 그대로, 인라인 빨간 에러 "이메일 형식을 확인해주세요" |
| 허용 안 된 도메인 | `foo@notallowed.com` | 폼 그대로, 인라인 빨간 에러 "회사 이메일로 가입할 수 있어요" |
| 허용된 도메인 | `<your>@gmail.com` | "메일을 보냈어요" 화면으로 전환, 코발트 강조 이메일 표시 |
| Google 버튼 | Google 클릭 | 기존과 동일하게 OAuth 흐름 시작 |

- [ ] **Step 5.5: 메일 링크 클릭 → 콜백 → 온보딩/홈 진입 검증**

Step 5.4의 세 번째 케이스에서 받은 메일의 매직 링크를 클릭한다.

- 신규 사용자: `/onboarding/mbti`로 리다이렉트되어야 함 (`requireProfile` 동작).
- 기존 사용자: `/`로 리다이렉트되어야 함.
- 만약 `/login?error=oauth`로 오면 `/auth/callback/route.ts`의 코드 교환 단계에서 실패한 것 — Supabase Project Settings의 Site URL과 Redirect URLs을 다시 확인.

- [ ] **Step 5.6: "다른 이메일로" 동작 검증**

Sent 화면에서 "다른 이메일로"를 누르면 폼으로 돌아오고, 이전 입력은 비워져 있어야 한다.

- [ ] **Step 5.7: 검증 결과 기록 후 마무리 커밋 (필요 시)**

수동 검증 중 보정한 마이크로 텍스트 / 스타일 / 토스트가 있다면:

```bash
git add -A
git commit -m "chore(login): polish email magic-link flow after manual QA"
```

수정 없이 검증만 통과했다면 추가 커밋 불필요.

---

## Task 6: 배포 설정 (Vercel 환경변수)

> **메모:** 이 단계는 사용자가 사내 도메인을 결정한 뒤 진행. 배포 직전에 한 번만 하면 된다.

- [ ] **Step 6.1: Vercel 프로젝트 환경변수에 `ALLOWED_EMAIL_DOMAINS` 추가**

Vercel Dashboard → Project → Settings → Environment Variables:

- Name: `ALLOWED_EMAIL_DOMAINS`
- Value: 실제 사내 도메인 (예: `company.com,subsidiary.co.kr`)
- Environments: Production, Preview, Development 모두 체크

또는 CLI:

```bash
echo "company.com,subsidiary.co.kr" | vercel env add ALLOWED_EMAIL_DOMAINS production
echo "company.com,subsidiary.co.kr" | vercel env add ALLOWED_EMAIL_DOMAINS preview
echo "company.com,subsidiary.co.kr" | vercel env add ALLOWED_EMAIL_DOMAINS development
```

> ⚠️ Vercel CLI의 env pull은 `.env.local`을 덮어쓸 수 있다. 작업 중인 로컬 값이 있으면 백업 후 진행.

- [ ] **Step 6.2: 프로덕션 재배포**

기존 배포가 있으면 환경변수만 변경해도 새 배포가 트리거되지 않는다. 다음 푸시에 적용되거나, 즉시 적용하려면 redeploy 필요.

- [ ] **Step 6.3: 프로덕션 매직 링크 한 번 직접 테스트**

프로덕션 도메인의 `/login`에서 사내 이메일로 한 번 매직 링크 받기 → 메일 클릭 → 로그인까지 체크.

---

## 정리

- 추가 코드: 3개 신규 파일(util, action, form), 2개 수정 파일(page, env example), 1개 신규 테스트 파일.
- 자동 테스트는 도메인 유틸 단위 테스트 8개. Server Action·UI는 수동 검증.
- 콜백 라우트(`/auth/callback`)와 미들웨어는 무변경.
- 프로덕션에 환경변수만 추가하면 배포 끝.
