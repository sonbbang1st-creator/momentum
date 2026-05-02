# MBTI Daily Fortune — Design Spec

- **Date:** 2026-05-02
- **Status:** Approved by user (brainstorming phase). Pending Pencil mockup approval before implementation.
- **Scope:** MVP design for a mobile-only MBTI-based daily fortune service.

---

## 1. Overview

A mobile-only web service that delivers a personalized, AI-generated daily fortune based on the user's MBTI type. The fortune is reflective and gentle in tone (warm coaching), refreshes once per KST day, and accumulates as a personal history. Login is required.

### 1.1 Goals
- Each logged-in user can see one fortune per day, anchored to their MBTI.
- The fortune feels personal and worth returning to daily.
- Past fortunes can be revisited via a calendar/list view.
- Cost stays minimal (single small-model call per active user per day, cached in DB).

### 1.2 Non-goals (YAGNI)
- No tarot, saju, zodiac, dream interpretation, or name reading. MBTI only.
- No paid tier, credits, or in-app purchase.
- No social features (sharing, friends, leaderboards).
- No notification/reminder system.
- No MBTI quiz/diagnosis on-site — users who don't know their MBTI are sent off-platform.
- No multi-language. Korean only.
- No dark mode (DESIGN.md does not define dark tokens).
- No trend/statistics dashboard over historical fortunes.

---

## 2. Decisions Summary

| Topic | Decision |
|---|---|
| Service concept | MBTI-based daily fortune |
| Auth | Required, Google OAuth via Supabase Auth |
| Onboarding | First-entry MBTI selection from a 4×4 grid of 16 types |
| Fortune format | Highlight style — one-line headline + warm advice + lucky color/number/item |
| Frequency | One fortune per KST day, cached; same content on re-visit until midnight |
| History | Calendar + list views, with detail view per past day |
| Tone | Calm, warm, coaching (no mystical/divination phrasing) |
| AI provider/model | OpenRouter, `google/gemini-2.5-flash` (env-overridable) |
| Platform | Mobile web only (~375–414px) |
| Design system | DESIGN.md (Meta-style commerce tokens) |
| Design tool | Pencil (mockups produced before any implementation) |
| Stack | Next.js 16 App Router, React 19, Tailwind v4, Supabase, OpenRouter |

---

## 3. Architecture

```
[Mobile Browser]
     │
     ▼
[Next.js 16 App Router]
 ├─ Server Component: session + profile check → routes to /, /onboarding/mbti, or /login
 ├─ Server Action: getOrCreateTodayFortune()
 │       │
 │       ▼
 │   Supabase Postgres
 │     ├─ auth.users          (Supabase-managed)
 │     ├─ profiles            (user_id PK, mbti, display_name, avatar_url, …)
 │     └─ fortunes            (id, user_id FK, fortune_date, payload jsonb, model, …)
 │       RLS: row visible/writable only when user_id = auth.uid()
 │       │
 │   ┌───┴────────────┐
 │   │ today's row?   │
 │   └─yes──┬──no─────┘
 │     return│   call OpenRouter → validate → INSERT … ON CONFLICT DO NOTHING → SELECT → return
 │
 └─ OpenRouter API (google/gemini-2.5-flash, JSON mode)
```

### 3.1 Key Architectural Choices
- **Server Action only.** No separate API route. The Server Action is the single entry point for fortune fetch + generate. Simpler surface area, no client-side OpenRouter exposure.
- **Cached-by-key generation.** `(user_id, fortune_date)` is the unique key. The first request of the day triggers AI generation; all subsequent reads of the same day are pure DB reads.
- **Concurrency-safe.** Two-tab races resolve via `INSERT … ON CONFLICT DO NOTHING` then re-`SELECT`.
- **Profile row presence drives onboarding routing.** Absence of a `profiles` row = user has not chosen MBTI → redirect to `/onboarding/mbti`. Avoids a separate "is_onboarded" flag.
- **MBTI snapshotted per fortune.** `mbti_at_generation` is stored on `fortunes` so historical entries don't mutate when the user changes MBTI later.
- **Next.js 16 caveat.** Per `AGENTS.md`, Next.js 16 has breaking changes from training data. Before implementation, read the App Router and Server Action docs in `node_modules/next/dist/docs/` and follow the deprecation notices.

---

## 4. Screens (Mobile, ~375–414px)

All tokens reference DESIGN.md. CTA color follows the marketing-surface convention (black `button-primary`); cobalt `button-buy-cta` is intentionally not used because there is no commerce flow.

### 4.1 `/login` — Login
- Logo/wordmark top-center; one-line subtitle (`{typography.subtitle-md}`, `{colors.ink}`).
- Bottom safe-area-pinned CTA: **"Google로 시작하기"** — `button-primary`, full width.
- Microcopy below CTA: legal/privacy hint in `{typography.caption}` `{colors.steel}`.

### 4.2 `/onboarding/mbti` — MBTI Onboarding
- Heading "내 MBTI를 알려주세요" `{typography.heading-lg}`.
- 4×4 grid of MBTI tiles:
  - Tile: `{rounded.xl}` (16px), `{colors.surface-soft}` background, `1px solid {colors.hairline-soft}`.
  - Type code in `{typography.subtitle-lg}`; nickname (e.g., "활동가") in `{typography.body-sm}` `{colors.steel}`.
  - Selected: border switches to `2px solid {colors.ink-deep}` and surface deepens slightly.
- Sticky bottom CTA: **"시작하기"** `button-primary`; uses `button-primary-disabled` until a tile is selected.

### 4.3 `/` — Home / Today's Fortune
- Top bar: date left (`{typography.body-sm-bold}`); two `button-icon-circular` actions right (history, settings).
- **Main fortune card** — `{rounded.xxxl}` (32px), `{colors.surface-soft}` background, padding `{spacing.xxl}`:
  - Tiny header: "ENFP인 당신에게" `{typography.body-sm-bold}` `{colors.steel}`.
  - Headline: today's one-liner — `{typography.heading-md}` (300 weight) with `ss01, ss02`.
  - Body advice: `{typography.body-md}` `{colors.ink}`, 3–4 lines.
- **Lucky trio** — three mini-cards in a row below:
  - Color: `{rounded.circle}` 48px swatch + name.
  - Number: large numeral `{typography.display-lg}` (mobile-scaled to ~36–40px).
  - Item: short noun phrase + small label.
  - Each mini-card: `{rounded.xl}`, `{colors.canvas}`, `1px solid {colors.hairline-soft}`.
- Footer link: "내 기록 보기" `{typography.link-md}` `{colors.ink-deep}`.

### 4.4 `/history` — History
- Top bar: back + "내 운세 기록" `{typography.heading-sm}`.
- Segment toggle (calendar | list) using `button-pill-tab` pattern.
- **Calendar view:** monthly grid; days with a saved fortune carry a colored marker.
- **List view:** rows showing date, one-line headline, lucky-color dot.

### 4.5 `/history/[date]` — History Detail
- Reuses the home fortune-card layout exactly; only the data differs.
- Footer link to "오늘의 운세 보기".

### 4.6 `/settings` — Settings
- Profile block: avatar + name + email (sourced from Google profile).
- List rows:
  - "내 MBTI 변경" → opens MBTI selection sheet (re-uses 4×4 grid).
  - "로그아웃" → confirmation dialog → sign out.
- Footer microcopy: version, terms, privacy — `{typography.caption}` `{colors.stone}`.

### 4.7 Navigation Flow
```
unauthenticated  →  /login  ──Google OAuth──▶  session
                                                 │
                              no profile row ────┴──── profile row exists
                                  │                          │
                            /onboarding/mbti                 /
                                  │                          │
                                  └─────────────▶  /  (today's fortune)
                                                          │
                                                    ┌─────┴─────┐
                                                /history    /settings
                                                    │
                                              /history/[date]
```

---

## 5. Database Schema (Supabase Postgres)

### 5.1 `profiles`
| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `user_id` | `uuid` | PK, FK → `auth.users(id)` ON DELETE CASCADE | Supabase auth user |
| `mbti` | `text` | NOT NULL, CHECK in {16 enum values} | User's MBTI |
| `display_name` | `text` | nullable | From Google profile |
| `avatar_url` | `text` | nullable | From Google profile |
| `created_at` | `timestamptz` | DEFAULT `now()` | |
| `updated_at` | `timestamptz` | DEFAULT `now()`, trigger-updated | |

No additional indexes required (PK lookup only).

### 5.2 `fortunes`
| Column | Type | Constraints | Purpose |
|---|---|---|---|
| `id` | `uuid` | PK, DEFAULT `gen_random_uuid()` | |
| `user_id` | `uuid` | NOT NULL, FK → `profiles(user_id)` ON DELETE CASCADE | |
| `fortune_date` | `date` | NOT NULL | KST date |
| `mbti_at_generation` | `text` | NOT NULL | Snapshot to preserve history |
| `payload` | `jsonb` | NOT NULL | See 5.3 |
| `model` | `text` | NOT NULL | OpenRouter model id used |
| `created_at` | `timestamptz` | DEFAULT `now()` | |

Constraints / indexes:
- `UNIQUE (user_id, fortune_date)` — enforces one fortune per user per day.
- `INDEX (user_id, fortune_date DESC)` — drives history list/calendar queries.

### 5.3 `payload` jsonb shape
```json
{
  "headline": "오늘은 작은 결정 하나가 마음을 가볍게 해줄 거예요.",
  "advice": "익숙한 길보다 한 정거장 일찍 내려보세요. 평소엔 보이지 않던 신호가 눈에 들어올 거예요.",
  "lucky": {
    "color":  { "name": "soft mint", "hex": "#B8E6D2" },
    "number": 7,
    "item":   "따뜻한 차 한 잔"
  }
}
```

### 5.4 RLS Policies
- `profiles`: SELECT/INSERT/UPDATE allowed when `auth.uid() = user_id`. No DELETE policy (cascaded from auth.users only).
- `fortunes`: SELECT and INSERT allowed when `auth.uid() = user_id`. No UPDATE/DELETE policy — fortunes are immutable.
- Implementation must keep RLS policies in version-controlled migration files.

### 5.5 Triggers
- `BEFORE UPDATE` trigger on `profiles` to set `updated_at = now()`.
- **No** auto-creation trigger of `profiles` from `auth.users` insert. Profile row is created explicitly when the user finishes onboarding; absence is the onboarding flag.

### 5.6 Date Handling
- All `fortune_date` values are KST (Asia/Seoul) calendar dates.
- Server-side date arithmetic must explicitly convert to KST before comparing/inserting.
- Crossing midnight KST yields a new fortune on next visit — intentional.

---

## 6. AI Integration (OpenRouter)

### 6.1 Server Action contract
```ts
// src/app/_actions/fortune.ts
'use server'
export async function getOrCreateTodayFortune(): Promise<TodayFortune>
```
Behavior:
1. Verify session; if absent, throw → caller redirects to `/login`.
2. Read `profiles` row; if absent, throw → caller redirects to `/onboarding/mbti`.
3. Compute KST today.
4. `SELECT` from `fortunes` for `(user_id, today)`. If found, return.
5. Else call OpenRouter, validate response, then `INSERT … ON CONFLICT (user_id, fortune_date) DO NOTHING` and re-`SELECT` to return the canonical row (handles two-tab races).

### 6.2 OpenRouter call
- Endpoint: `POST https://openrouter.ai/api/v1/chat/completions`.
- Model: from `OPENROUTER_MODEL` env, default `google/gemini-2.5-flash`.
- API key: `OPENROUTER_API_KEY` (server-only env; never `NEXT_PUBLIC_*`).
- `response_format: { type: 'json_object' }`.
- Timeout: 8s. On network/5xx/timeout: one retry with 0.5s backoff.

### 6.3 Prompt design

**System prompt (fixed):**
```
You are a warm, calm life coach who writes a short daily reflection
for a Korean user, framed as a soft fortune based on their MBTI.

Constraints:
- Tone: calm, warm coaching in Korean. Avoid mystical/divination phrasing
  (no "별", "운명", "그대" archaic vocatives).
- Length: headline ~30 chars, advice 2–3 sentences ~120 chars total.
- Output language: Korean.
- Ground advice in something a person could actually do today.

Output JSON only, matching this schema exactly:
{
  "headline": string,
  "advice": string,
  "lucky": {
    "color":  { "name": string, "hex": string (#RRGGBB) },
    "number": integer (1..99),
    "item":   string
  }
}
```

**User prompt template (per request):**
```
MBTI: {{mbti}}
Date: {{kst_date_iso}}
Day-of-week: {{kst_weekday}}
Seed: {{user_id_hash}}-{{kst_date_iso}}

Generate one daily reflection.
```
- `Seed` provides weak diversification per (user, day).

### 6.4 Response validation
- Parse JSON. On parse error → one retry → if still failing, fallback path (6.5).
- Validate with a zod schema:
  - `headline`: non-empty string.
  - `advice`: non-empty string.
  - `lucky.color.name`: non-empty string.
  - `lucky.color.hex`: matches `/^#[0-9A-Fa-f]{6}$/`.
  - `lucky.number`: integer in `[1, 99]`.
  - `lucky.item`: non-empty string.
- On schema violation → one retry → if still failing, fallback.

### 6.5 Fallback fortune
- Static fallback `payload` per MBTI (16 entries) shipped in code.
- Returned to the UI but **not** inserted into `fortunes` — next visit retries generation.
- UI surfaces an unobtrusive inline notice (see 7.2).

### 6.6 Cost estimate
- ~150 input tokens + ~250 output tokens per call.
- Gemini 2.5 Flash pricing puts this at well under $0.001 per call.
- 1k DAU × 30 days ≈ $3/month maximum.

---

## 7. Error Handling

### 7.1 Routing-level errors
| Scenario | Where caught | Resolution |
|---|---|---|
| Unauthenticated request to protected route | Server Component | `redirect('/login')` |
| Authenticated, no `profiles` row | Server Component | `redirect('/onboarding/mbti')` |
| OAuth callback failure | `/auth/callback` route handler | Toast + `redirect('/login')` |

### 7.2 Generation-level errors
| Scenario | Resolution |
|---|---|
| OpenRouter timeout/network error | One retry; on continued failure → fallback fortune (not persisted) |
| OpenRouter JSON parse / schema violation | One retry; on continued failure → fallback |
| OpenRouter 401/403 | Fallback to user; log loudly server-side (key likely invalid) |
| OpenRouter 429 (rate limit) | Fallback to user; log; no auto-retry beyond the one |
| `fortunes` UNIQUE conflict (race) | `ON CONFLICT DO NOTHING` then `SELECT` — invisible to user |
| Supabase unreachable | `error.tsx` boundary with retry CTA |

UI behavior on fallback: a small `{typography.body-sm}` `{colors.attention}` line above the fortune card reading "다시 불러오는 중이에요. 새로고침해 보세요."

### 7.3 Loading + empty states
- **Today's fortune loading:** skeleton cards (headline block, advice block, lucky trio) for 1–2s.
- **History empty:** illustration + copy "아직 기록이 없어요. 오늘 운세를 보면 여기에 쌓여요." + CTA back to `/`.

### 7.4 MBTI change mid-day
- Today's `fortunes` row is unchanged (preserves `mbti_at_generation`).
- New MBTI takes effect for tomorrow's first generation.
- Settings screen surfaces this expectation in helper text near the MBTI control.

### 7.5 Security checklist
- `OPENROUTER_API_KEY` server-only; no `NEXT_PUBLIC_*` prefix.
- Supabase anon key in client; service-role key avoided where RLS suffices, kept server-only when needed.
- All protected routes check session in a Server Component; middleware as a coarse secondary gate.
- RLS policies committed as migration files for review.

---

## 8. Testing Strategy

### 8.1 Unit (Vitest)
- Prompt builder: given (MBTI, KST date) → exact user prompt string.
- zod response schema: hex regex, integer range, required fields.
- KST date computation: midnight boundary, DST-free behavior.
- Fallback registry: 16 MBTI keys all present and well-formed.

### 8.2 Integration
- `getOrCreateTodayFortune` with OpenRouter mocked:
  - First call inserts; subsequent calls same day read from DB without calling the model.
  - Model failure path: returns fallback, performs no insert.
  - UNIQUE conflict: second concurrent call returns the first call's row.
- Run against a Supabase **branch** (via Supabase MCP) seeded with test users.

### 8.3 E2E (Playwright, optional for MVP)
- Mobile viewports (Pixel 7, iPhone 14).
- Login → MBTI select → fortune visible → history list shows entry → re-entry same day shows identical fortune.

### 8.4 Observability
- Server logs: model id, latency, success/fail reason for each generation.
- No APM/Sentry in MVP scope.

---

## 9. Pre-Implementation Gate: Pencil Mockups

Per user requirement, no implementation begins until:
1. All six screens are mocked in Pencil following DESIGN.md tokens.
2. The mockups are reviewed and approved by the user.

The implementation plan (produced by the writing-plans skill following this spec) must place Pencil mockup creation and user sign-off as the first gated step before any code, schema, or auth wiring.

---

## 10. Known Gaps / Open Questions

- **Lucky color palette accessibility.** `lucky.color.hex` is generated by the model. Edge cases like very pale colors against white surface-soft are not yet constrained. If quality issues appear, restrict the hex to a curated palette and have the model pick a name from it.
- **Onboarding for MBTI-unknown users.** Spec sends them off-platform. If conversion data later shows drop-off, consider adding a lightweight 12-question diagnostic in a follow-up iteration.
- **Animation timings** are not defined here; use DESIGN.md's "Known Gaps" recommendation (150–250ms ease-out for primary surface transitions).
- **Notifications/reminders** intentionally out of scope; revisit only if retention metrics justify.
- **Internationalization** is out of scope; all copy ships in Korean.

---

## 11. Stack Reference

- Next.js 16.2.4 (App Router) — re-read `node_modules/next/dist/docs/` before coding; Next 16 has breaking changes from earlier versions.
- React 19.2.4.
- Tailwind CSS v4 with PostCSS.
- shadcn + `@base-ui/react` for primitives; `lucide-react` for icons.
- Supabase: Auth (Google OAuth) + Postgres + RLS. Branch via Supabase MCP for dev/test.
- OpenRouter: `google/gemini-2.5-flash` (env-overridable).
