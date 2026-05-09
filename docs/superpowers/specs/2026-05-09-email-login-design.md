# 이메일 매직 링크 로그인 — 설계 스펙

- 작성일: 2026-05-09
- 상태: 사용자 승인 완료, 구현 플랜 작성 직전

## 1. 목적

기존 Google OAuth 단일 진입점을 보강해, 사용자가 사내 이메일 등으로 직접 로그인/등록할 수 있게 한다. Supabase 매직 링크(`signInWithOtp`)를 사용하고, 환경변수로 관리되는 도메인 화이트리스트로 가입 가능 이메일을 제한한다.

## 2. 사용자 흐름

```
[/login]  로그인 폼 상태
  ┌─ Google로 시작하기 (기존)
  ├─ ──── 또는 ────
  └─ 이메일 입력 → "이메일로 링크 받기"

  ↓ 폼 제출, Server Action 호출

[/login]  이메일 발송 후 상태 (같은 라우트, 클라이언트 인라인 전환)
  - 메일체크 아이콘
  - "메일을 보냈어요"
  - 입력한 이메일을 코발트 강조로 표시
  - "5분 안에 로그인하세요" 안내
  - "다시 보내기" / "다른 이메일로" 텍스트 링크

  ↓ 사용자가 메일의 링크 클릭

GET /auth/callback?code=...
  - exchangeCodeForSession (기존 라우트 재사용)
  - 신규 사용자: requireProfile에서 /onboarding/mbti 로 자동 리다이렉트
  - 기존 사용자: /
```

도메인 위반·형식 오류는 같은 폼 상태의 인라인 에러로 표시한다. 발송 성공/실패는 사용자 입장에서 동일하게 "메일을 보냈어요"로 끝난다(이메일 열거 공격 방지).

## 3. 컴포넌트/파일 변경

| 변경 | 경로 | 역할 |
|---|---|---|
| 신규 | `src/app/_lib/auth/email-domains.ts` | `isAllowedDomain(email)` 유틸. `ALLOWED_EMAIL_DOMAINS` env를 콤마 분리, 소문자 비교. 빈 값이면 모두 허용. |
| 신규 | `src/app/login/actions.ts` | `requestMagicLink(formData)` Server Action. 입력 정규화 → zod 형식 검증 → 도메인 검증 → `supabase.auth.signInWithOtp` 호출. |
| 신규 | `src/app/login/email-form.tsx` | Client Component. 입력 폼 ↔ "메일을 보냈어요" 두 상태를 `useState`로 토글. Server Action 결과로 인라인 에러 표시. |
| 수정 | `src/app/login/page.tsx` | 기존 `LoginButton` 아래에 구분선 + `EmailForm` 추가. 페이지 컨테이너 골격(파스텔 데코, 헤딩)은 그대로 유지. |
| 수정 | `.env.local.example` | `ALLOWED_EMAIL_DOMAINS=` 항목 추가, 주석으로 사용법 설명. |
| 무변경 | `src/app/auth/callback/route.ts` | 매직 링크도 동일한 `exchangeCodeForSession` 흐름을 타므로 수정 불필요. |
| 무변경 | `src/middleware.ts`, `src/app/_lib/auth/guards.ts` | 세션 갱신·가드 로직 그대로. |

## 4. Server Action 동작 (`requestMagicLink`)

1. `email`을 `trim()` + `toLowerCase()`로 정규화.
2. zod 스키마(`z.string().email()`)로 형식 검증. 실패 시 `{ ok: false, reason: 'format' }`.
3. `isAllowedDomain(email)`로 도메인 검증. 실패 시 `{ ok: false, reason: 'domain' }`.
4. `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: ${origin}/auth/callback, shouldCreateUser: true } })` 호출. `origin`은 요청 헤더에서 추출.
5. Supabase 호출 결과(성공·실패 무관) → `{ ok: true }`. 사용자에겐 항상 동일한 "메일을 보냈어요" 화면이 표시된다. 실제 에러는 서버 로그로만 남긴다.
6. rate limit 상태도 동일 처리. 클라이언트는 재시도 시 1회 토스트 또는 인라인 안내만 짧게 표시.

## 5. 도메인 화이트리스트 검증

- 환경변수: `ALLOWED_EMAIL_DOMAINS=company.com,subsidiary.co.kr`
  - 콤마 구분, 좌우 공백 제거, 소문자 비교
  - 값이 비어있거나 미정의면 모든 도메인 허용 (개발/스테이징 편의)
  - 와일드카드(`*.example.com`)는 이번 스코프 외
- 검증은 서버 Server Action(`actions.ts`)에서만 수행한다.
  - 클라이언트는 형식(`type=email`, zod) 검증만 담당. 도메인 검증은 서버 응답을 받아 인라인 에러로 표시.
  - 환경변수를 한 곳(`ALLOWED_EMAIL_DOMAINS`)에 두기 위함이며, 도메인 목록을 클라이언트 번들에 노출하지 않는 부수효과도 있다.
  - 사용자 입장에서 폼 제출 → 인라인 에러까지의 지연은 1 RTT 정도라 충분히 빠르다.

## 6. 에러·예외 처리

| 상황 | 사용자에게 보이는 결과 |
|---|---|
| 빈 입력 | 폼 제출 비활성화 또는 인라인 안내 |
| 잘못된 이메일 형식 | 인라인 에러: "이메일 형식을 확인해주세요" — `critical-strong` |
| 허용 안 된 도메인 | 인라인 에러: "회사 이메일로 가입할 수 있어요" — `critical-strong` |
| Supabase rate limit / 일시 장애 | "메일을 보냈어요" 화면 표시 (열거 공격 방지). 서버 로그에 기록. |
| 콜백 코드 교환 실패 | 기존 동작: `/login?error=oauth` 리다이렉트. 이 쿼리 파라미터에 한해 폼 상단에 빨간 배너 표시. |
| 매직 링크 만료 후 클릭 | Supabase가 에러 페이지로 보내거나 콜백에서 실패 → 위와 동일하게 `?error=oauth` 처리. |

## 7. Supabase 설정 (배포 전 체크)

- Authentication → Providers → Email 활성화 확인
- Authentication → URL Configuration → Site URL과 Redirect URLs에 다음 등록:
  - `http://localhost:3000/auth/callback`
  - 프리뷰: `https://*-<vercel-team>.vercel.app/auth/callback` 와일드카드 등록 (Supabase URL Configuration에서 와일드카드 지원)
  - 프로덕션 도메인 `https://<production-host>/auth/callback`
- Email Templates → Magic Link 한국어화는 후속 작업으로 분리 (이번 스펙 외)

## 8. 시각 디자인 (Pencil 참조)

`untitled.pen` 셋째 줄에 두 상태 목업이 있다.

- 로그인 폼 상태: `Login — Form` (id: `f8Vhr`, x=80, y=1964)
- 이메일 발송 후 상태: `Login — Email Sent` (id: `F0V9f`, x=520, y=1964)

토큰 적용 원칙:

- 페이지 캔버스: `app/canvas` + 상단 파스텔 블러 데코(민트 `#B8E6D2` 60% / 살구 `#FBE5DD` 50%, blur 60px) — 기존 페이지의 데코 톤 그대로 유지.
- Google CTA: `app/ink-button` 알약, `r-full`, `font-body 700 / 15px`. 마케팅 톤 일관성을 위해 코발트가 아닌 검정.
- 매직 링크 CTA: `button-secondary` 패턴 — `app/canvas` 배경 + `app/ink-deep` 2px 외곽선 + `r-full` 알약. Google과 동등한 비중.
- 구분선: `app/hairline-soft` 1px + 가운데 "또는" 캡션(12/700/steel, letter-spacing 2).
- 이메일 입력: `r-lg`(8px), `app/hairline` 1px, placeholder `app/stone`. focus 시 `app/primary` 2px (구현 단계).
- 이메일 발송 후 아이콘: `surface-soft` 원형 64px + lucide `mail-check` 28px / `ink-deep`.
- 이메일 강조 표시: `app/primary` 코발트 — 입력값임을 즉시 인지하게 한다.
- 인라인 에러 색: `app/critical-strong`.

## 9. 테스트 방향

수동:
- 빈 폼 / 잘못된 형식 / 허용되지 않은 도메인 / 허용된 도메인 4가지 입력 케이스 폼 동작 확인.
- 발송 후 화면 → 메일 링크 클릭 → 신규 사용자: 온보딩 진입, 기존 사용자: 홈 진입.
- 메일 링크 만료 / 잘못된 코드 → `/login?error=oauth` 안내 표시.

자동(있으면 좋음, 필수 아님):
- `email-domains.ts` 단위 테스트: 빈 env, 단일 도메인, 멀티 도메인, 대소문자 혼합, 공백 케이스.
- `actions.ts`는 Supabase mocking이 필요해 비용 대비 효용 낮음 — 스킵.

## 10. 범위 외 (Out of Scope)

- 비밀번호 로그인 / OTP 코드 입력 방식
- Magic Link 이메일 템플릿 한국어 커스터마이즈 (별도 후속)
- 와일드카드 도메인(`*.example.com`)
- 관리자 화면에서 화이트리스트 편집
- 이메일/Google 외 추가 OAuth 공급자 (Apple, Microsoft 등)
- 가입 직후 환영 이메일 / 이메일 변경 / 계정 통합

## 11. 의사결정 요약

| 결정 사항 | 선택 | 근거 |
|---|---|---|
| 로그인 방식 | 매직 링크 | 비밀번호 관리·재설정·해킹 위험 없음. 사내 이메일 등록 자연스러움. Supabase 기본 지원. |
| 도메인 제약 | 화이트리스트 | 사내 툴 성격. 외부 가입 차단. |
| 화이트리스트 관리 | 환경변수 | Vercel에서 코드 변경 없이 수정 가능. 도메인 변경 빈도 낮은 현재 단계에 적합. |
| 화면 구성 | 구분선 + 이메일 입력 | Google과 동등 비중. 사내 사용자 접근성. 한 페이지 끝남. |
| 발송 후 처리 | 같은 라우트 인라인 전환 | URL 추가 없이 가벼운 흐름. |
| 신규 가입자 흐름 | `requireProfile`의 기존 redirect 재사용 | 기존 Google 가입과 동일하게 `/onboarding/mbti` 진입. |
