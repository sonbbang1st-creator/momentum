# MBTI Daily Fortune Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a mobile web service that delivers a personalized daily fortune for a Korean user based on their MBTI, generated once per KST day via OpenRouter and persisted to Supabase, behind Google OAuth login.

**Architecture:** Next.js 16 App Router, single Server Action (`getOrCreateTodayFortune`) reads/writes a `(user_id, fortune_date)`-keyed `fortunes` row in Supabase Postgres. Profile row absence drives onboarding routing. AI calls go to OpenRouter (`google/gemini-2.5-flash`, JSON mode); responses are zod-validated; failures fall through to a static per-MBTI fallback that is **not** persisted.

**Tech Stack:** Next.js 16.2.4 (App Router) · React 19.2.4 · Tailwind CSS v4 · `@base-ui/react` + `lucide-react` · Supabase Auth + Postgres (via `@supabase/ssr`, accessed in dev/test through Supabase MCP branches) · OpenRouter REST · Vitest for unit/integration tests · Pencil MCP for design.

**Source spec:** `docs/superpowers/specs/2026-05-02-mbti-fortune-design.md`.

**Hard gate:** Phase 1 (Pencil mockups) must be approved by the user before any code in Phase 3 onward is written. Phase 0 and Phase 2 (foundation + Supabase schema) may proceed in parallel with Phase 1 because they don't lock visual decisions.

---

## File Structure

```
src/
├── app/
│   ├── _actions/
│   │   ├── fortune.ts         # getOrCreateTodayFortune, getFortuneByDate, getFortuneHistory
│   │   ├── profile.ts         # createProfile, updateMbti
│   │   └── auth.ts            # signOut
│   ├── _components/
│   │   ├── fortune-card.tsx   # main fortune card (used by / and /history/[date])
│   │   ├── lucky-trio.tsx     # 3-up mini cards
│   │   ├── mbti-grid.tsx      # 4×4 selection grid (onboarding + settings)
│   │   ├── top-bar.tsx        # date + icon buttons row
│   │   ├── pill-tab.tsx       # segment toggle
│   │   ├── fortune-skeleton.tsx
│   │   ├── history-calendar.tsx
│   │   └── history-list.tsx
│   ├── _lib/
│   │   ├── supabase/
│   │   │   ├── server.ts      # createServerSupabase()
│   │   │   ├── browser.ts     # createBrowserSupabase()
│   │   │   └── middleware.ts  # updateSession() helper
│   │   ├── auth/
│   │   │   └── guards.ts      # requireSession(), requireProfile()
│   │   ├── kst.ts             # todayKst(), formatKstIso(), kstWeekday()
│   │   ├── mbti.ts            # MBTI_TYPES, MBTI_NICKNAMES, isMbti()
│   │   └── fortune/
│   │       ├── schema.ts      # zod FortunePayloadSchema
│   │       ├── prompt.ts      # buildSystemPrompt(), buildUserPrompt()
│   │       ├── openrouter.ts  # callOpenRouter()
│   │       ├── fallback.ts    # FALLBACK_FORTUNES (16 entries)
│   │       └── service.ts     # generateFortune() — orchestration helper
│   ├── login/
│   │   └── page.tsx
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts
│   ├── onboarding/
│   │   └── mbti/
│   │       └── page.tsx
│   ├── history/
│   │   ├── page.tsx
│   │   └── [date]/
│   │       └── page.tsx
│   ├── settings/
│   │   └── page.tsx
│   ├── page.tsx               # today's fortune
│   ├── layout.tsx
│   ├── error.tsx
│   ├── not-found.tsx
│   └── globals.css
├── middleware.ts
└── types/
    └── database.ts            # generated Supabase types

supabase/
└── migrations/
    ├── 20260502_001_profiles.sql
    └── 20260502_002_fortunes.sql

tests/
├── unit/
│   ├── kst.test.ts
│   ├── mbti.test.ts
│   ├── fortune-schema.test.ts
│   ├── fortune-prompt.test.ts
│   └── fortune-fallback.test.ts
└── integration/
    ├── openrouter.test.ts     # mocked HTTP
    └── fortune-service.test.ts # service against Supabase branch + mocked OpenRouter

docs/superpowers/
├── specs/2026-05-02-mbti-fortune-design.md
└── plans/2026-05-02-mbti-fortune.md  (this file)

pencil/
└── mbti-fortune.pen           # opened/produced via Pencil MCP
```

**Boundaries:**
- `_lib/fortune/*` is pure logic (no Supabase, no Next imports). Easy to unit test.
- `_lib/supabase/*` and `_lib/auth/*` are I/O wrappers — touched by Server Actions only.
- `_actions/*` files contain `'use server'` exports and orchestrate `_lib` modules.
- `_components/*` are presentational — they receive data, never call Server Actions directly except through `<form action={…}>` patterns.

---

## Phase 0: Project Foundation

### Task 0.1: Initialize git (if not already)

**Files:**
- Create: `.gitignore` additions

- [ ] **Step 1: Verify git state**

```bash
test -d .git && echo "already a repo" || git init -b main
```

- [ ] **Step 2: Ensure `.gitignore` covers env, generated types, test artifacts**

Append to `.gitignore` if missing:

```
.env
.env.local
.env*.local
src/types/database.ts
coverage/
playwright-report/
test-results/
```

- [ ] **Step 3: Initial commit of current scaffold**

```bash
git add -A
git commit -m "chore: snapshot baseline scaffold before plan execution"
```

---

### Task 0.2: Install runtime dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add dependencies**

```bash
npm install @supabase/ssr @supabase/supabase-js zod
```

- [ ] **Step 2: Verify install**

```bash
npm ls @supabase/ssr @supabase/supabase-js zod
```

Expected: each lists a single resolved version, no peer-dep errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add supabase ssr/client and zod"
```

---

### Task 0.3: Install dev dependencies (Vitest)

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install**

```bash
npm install -D vitest @vitest/ui @testing-library/dom happy-dom
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 3: Add npm scripts**

Edit `package.json` `scripts`:

```json
"test": "vitest run",
"test:watch": "vitest",
"types:supabase": "supabase gen types typescript --project-id $SUPABASE_PROJECT_ID --schema public > src/types/database.ts"
```

- [ ] **Step 4: Verify**

```bash
npm test
```

Expected: "No test files found" or zero tests pass — exit code 0.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: configure vitest"
```

---

### Task 0.4: Add environment variable template

**Files:**
- Create: `.env.local.example`

- [ ] **Step 1: Write `.env.local.example`**

```
# --- Supabase (required) ---
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# --- OpenRouter (required, server-only) ---
OPENROUTER_API_KEY=
OPENROUTER_MODEL=google/gemini-2.5-flash
OPENROUTER_REFERER=http://localhost:3000
OPENROUTER_TITLE=MBTI Daily Fortune
```

- [ ] **Step 2: Commit**

```bash
git add .env.local.example
git commit -m "chore: env template"
```

---

### Task 0.5: Wire DESIGN.md tokens into Tailwind theme

The shadcn-default tokens in `src/app/globals.css` don't match DESIGN.md. Replace them with the named tokens we'll actually use.

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Replace `globals.css` body with DESIGN.md tokens**

```css
@import "tailwindcss";
@import "tw-animate-css";

@theme inline {
  /* --- Colors (DESIGN.md) --- */
  --color-canvas: #ffffff;
  --color-surface-soft: #f5f6f7;
  --color-hairline: #d8dadc;
  --color-hairline-soft: rgba(10, 19, 23, 0.12);

  --color-ink-deep: #0a1317;
  --color-ink: #1c2b33;
  --color-charcoal: #404a51;
  --color-slate: #5a6770;
  --color-steel: #707d85;
  --color-stone: #98a2a8;

  --color-ink-button: #0a1317;
  --color-on-ink-button: #ffffff;

  --color-primary: #1877f2;          /* cobalt — reserved, not used in this app */
  --color-primary-deep: #0143b5;
  --color-primary-soft: rgba(24, 119, 242, 0.15);
  --color-on-primary: #ffffff;

  --color-success: #2bb169;
  --color-attention: #ff8a00;
  --color-warning: #ffd400;
  --color-critical: #e0232f;
  --color-critical-strong: #a91720;

  /* --- Radii (DESIGN.md) --- */
  --radius-xs: 2px;
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 16px;
  --radius-xxl: 24px;
  --radius-xxxl: 32px;
  --radius-feature: 40px;
  --radius-full: 9999px;

  /* --- Spacing (DESIGN.md, additive — Tailwind defaults still work) --- */
  --spacing-xxs: 4px;
  --spacing-xs: 8px;
  --spacing-sm: 10px;
  --spacing-md: 12px;
  --spacing-base: 16px;
  --spacing-lg: 20px;
  --spacing-xl: 24px;
  --spacing-xxl: 32px;
  --spacing-xxxl: 40px;
  --spacing-section-sm: 48px;
  --spacing-section: 64px;
  --spacing-section-lg: 80px;
  --spacing-hero: 120px;

  --font-sans:
    "Optimistic VF", "Montserrat", "Helvetica", "Arial",
    "Noto Sans KR", system-ui, sans-serif;
}

:root {
  color-scheme: light;
}

@layer base {
  html, body {
    background: var(--color-canvas);
    color: var(--color-ink);
    font-family: var(--font-sans);
    font-feature-settings: "ss01", "ss02";
    -webkit-font-smoothing: antialiased;
  }
}
```

- [ ] **Step 2: Update `src/app/layout.tsx` to remove Geist fonts (we use the CSS var only)**

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MBTI 데일리 운세",
  description: "내 MBTI에 맞춘 오늘의 다정한 한 줄.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-canvas text-ink">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Run dev server, eyeball that body has white canvas + correct font fallback**

```bash
npm run dev
```

Open `http://localhost:3000`. Confirm: page background white, default page font is Helvetica/Arial fallback (Optimistic VF is licensed and not bundled — that's expected).

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: wire DESIGN.md tokens into tailwind theme"
```

---

## Phase 1: Pencil Mockups (USER GATE)

> **STOP**: After Phase 1, the implementer **must obtain explicit user approval** of the mockups before starting Phase 3 (UI code). Phase 2 (Supabase schema) may proceed in parallel because it has no visual coupling.

### Task 1.1: Create Pencil document and document brand tokens

**Files:**
- Create: `pencil/mbti-fortune.pen` (managed via Pencil MCP)

- [ ] **Step 1: Open or create the Pencil document**

Use the Pencil MCP tool `open_document`. If a doc doesn't exist for this project, create one named `mbti-fortune`. Capture the resulting `documentId` for subsequent steps.

- [ ] **Step 2: Read Pencil's authoring guidelines**

Use `get_guidelines`. Apply Pencil's conventions to all subsequent design steps.

- [ ] **Step 3: Encode DESIGN.md tokens as Pencil variables**

Use `set_variables` to register the colors, radii, and typography tokens enumerated in `globals.css` (Task 0.5). Mirror the names exactly (`canvas`, `surface-soft`, `ink-deep`, `radius-xxxl`, etc.) so designers and engineers reference identical names.

- [ ] **Step 4: Confirm with `get_variables`**

Verify the round-trip and post the variable list back to the user for sanity check before designing screens.

---

### Task 1.2: Mockup — `/login`

- [ ] **Step 1: Find empty space**

Use `find_empty_space_on_canvas` to locate where to drop the new artboard. Use a 375×812 mobile artboard.

- [ ] **Step 2: Design**

Use `batch_design` to lay out:
- Top-third: wordmark logo block + one-line subtitle (`{typography.subtitle-md}`, `{colors.ink}`).
- Bottom safe area: `button-primary` "Google로 시작하기" full-width, `{rounded.full}`, `{colors.ink-button}` background, `{colors.on-ink-button}` text.
- Below CTA: `{typography.caption}` `{colors.steel}` legal microcopy.

- [ ] **Step 3: Snapshot + screenshot**

Use `snapshot_layout` then `get_screenshot`. Attach the screenshot in your reply to the user.

---

### Task 1.3: Mockup — `/onboarding/mbti`

- [ ] **Step 1: Layout**

375×812 artboard. Header copy "내 MBTI를 알려주세요" `{typography.heading-lg}`, supporting line `{typography.body-md}`.

- [ ] **Step 2: 4×4 MBTI grid**

16 tiles, each ~76×84 with `{rounded.xl}` corners, `{colors.surface-soft}` fill, `1px {colors.hairline-soft}` border. Inside each tile: type code (e.g., "ENFP") `{typography.subtitle-lg}` and Korean nickname (e.g., "활동가") `{typography.body-sm}` `{colors.steel}`. Show one tile in selected state (`2px {colors.ink-deep}` border).

- [ ] **Step 3: Sticky bottom CTA**

"시작하기" — `button-primary`, full width. Also produce a `button-primary-disabled` variant for "no tile selected" state.

- [ ] **Step 4: Snapshot + screenshot**

---

### Task 1.4: Mockup — `/` (Today's Fortune)

- [ ] **Step 1: Top bar**

Date pill on left (`{typography.body-sm-bold}`), two `button-icon-circular` (history, settings) on right.

- [ ] **Step 2: Main fortune card**

`{rounded.xxxl}` 32px, `{colors.surface-soft}` background, padding `{spacing.xxl}`. Inside:
- "ENFP인 당신에게" eyebrow `{typography.body-sm-bold}` `{colors.steel}`.
- Headline `{typography.heading-md}` (300 weight) — example "오늘은 작은 결정 하나가 마음을 가볍게 해줄 거예요."
- Body advice `{typography.body-md}` `{colors.ink}` 3 lines.

- [ ] **Step 3: Lucky trio**

Three mini-cards: color (48px swatch + name), number (~36px numeral), item (noun phrase). Each `{rounded.xl}`, `{colors.canvas}`, `1px {colors.hairline-soft}`. Even gaps using `{spacing.md}`.

- [ ] **Step 4: Footer link**

"내 기록 보기" `{typography.link-md}` `{colors.ink-deep}` centered.

- [ ] **Step 5: Snapshot + screenshot**

---

### Task 1.5: Mockup — `/history` (Calendar + List variants)

Two artboards side by side: calendar mode and list mode.

- [ ] **Step 1: Top bar with back arrow + title "내 운세 기록"**

- [ ] **Step 2: Pill-tab segment**

`button-pill-tab` row: `[캘린더] [리스트]`, one active.

- [ ] **Step 3a: Calendar variant**

7-column month grid. Days with a saved fortune get a small colored dot under the date. Show today's cell with a `2px {colors.ink-deep}` ring.

- [ ] **Step 3b: List variant**

Vertical rows: date (`{typography.body-sm-bold}`), one-line headline (`{typography.body-md}`), lucky-color dot at right. Row separator `1px {colors.hairline-soft}`.

- [ ] **Step 4: Snapshot + screenshot**

---

### Task 1.6: Mockup — `/history/[date]` (Detail)

- [ ] **Step 1: Top bar with back arrow + the specific date**

- [ ] **Step 2: Reuse the fortune card from Task 1.4**

Same component; only data is different. Footer link reads "오늘의 운세 보기".

- [ ] **Step 3: Snapshot + screenshot**

---

### Task 1.7: Mockup — `/settings`

- [ ] **Step 1: Profile block**

Avatar circle (40px) + name `{typography.subtitle-lg}` + email `{typography.body-sm}` `{colors.steel}`.

- [ ] **Step 2: List rows**

- "내 MBTI 변경" — chevron right.
- Helper text below row: "오늘 운세는 변경 전 MBTI 기준으로 유지돼요. 새 MBTI는 내일부터 반영됩니다." `{typography.body-sm}` `{colors.steel}`.
- "로그아웃" — text in `{colors.critical}`.

- [ ] **Step 3: Footer**

Version + 약관 + 개인정보처리방침 — `{typography.caption}` `{colors.stone}`.

- [ ] **Step 4: Snapshot + screenshot**

---

### Task 1.8: Present mockups to user, await approval

- [ ] **Step 1: Compile screenshots**

Send the user one message containing all 6 screenshots (login, onboarding, today, history-calendar, history-list, history-detail, settings) inline, with a brief caption per screen.

- [ ] **Step 2: Ask for explicit approval**

Use this exact prompt to the user:

> "디자인 6개 화면 모두 Pencil에 만들었습니다. 이대로 가도 될까요? 수정 요청 사항이 있으면 화면별로 알려주세요. 승인 주시면 Phase 3(UI 코딩)로 진행하겠습니다."

- [ ] **Step 3: Iterate until approval**

If the user requests changes: apply via `batch_design` / `replace_all_matching_properties` and re-snapshot. Do not proceed to Phase 3 without unambiguous approval.

- [ ] **Step 4: Commit a marker file once approved**

```bash
mkdir -p docs/superpowers/sign-offs
echo "Pencil mockups approved $(date -Iseconds)" > docs/superpowers/sign-offs/2026-05-02-pencil-approved.txt
git add docs/superpowers/sign-offs
git commit -m "docs: record pencil mockup sign-off"
```

---

## Phase 2: Supabase schema (parallel-safe with Phase 1)

> Use Supabase MCP tools throughout. Operate on a development **branch** so production data is untouched.

### Task 2.1: Create a Supabase dev branch

- [ ] **Step 1: List existing branches**

Use the Supabase MCP `list_branches` tool to check whether a dev branch already exists for this project. Capture the branch IDs.

- [ ] **Step 2: Create branch if missing**

If no `dev` branch exists, use `create_branch` with name `mbti-fortune-dev`. Capture the new branch ID.

- [ ] **Step 3: Record branch info**

Save branch ID + URL into `docs/superpowers/sign-offs/2026-05-02-supabase-branch.md` for later reference.

---

### Task 2.2: Migration — `profiles` table

**Files:**
- Create: `supabase/migrations/20260502_001_profiles.sql`

- [ ] **Step 1: Write migration SQL**

```sql
-- 20260502_001_profiles.sql

create table public.profiles (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  mbti           text not null
                 check (mbti in (
                   'INTJ','INTP','ENTJ','ENTP',
                   'INFJ','INFP','ENFJ','ENFP',
                   'ISTJ','ISFJ','ESTJ','ESFJ',
                   'ISTP','ISFP','ESTP','ESFP'
                 )),
  display_name   text,
  avatar_url     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy profiles_select_self on public.profiles
  for select using (auth.uid() = user_id);

create policy profiles_insert_self on public.profiles
  for insert with check (auth.uid() = user_id);

create policy profiles_update_self on public.profiles
  for update using (auth.uid() = user_id);
```

- [ ] **Step 2: Apply migration via Supabase MCP**

Use `apply_migration` with the dev branch ID and SQL above.

- [ ] **Step 3: Verify**

Use `list_tables` (filter to `public` schema) and confirm `profiles` exists with the expected columns. Use `get_advisors` (`type=security`) to confirm no security advisories opened by this migration.

---

### Task 2.3: Migration — `fortunes` table

**Files:**
- Create: `supabase/migrations/20260502_002_fortunes.sql`

- [ ] **Step 1: Write migration SQL**

```sql
-- 20260502_002_fortunes.sql

create table public.fortunes (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.profiles(user_id) on delete cascade,
  fortune_date         date not null,
  mbti_at_generation   text not null
                       check (mbti_at_generation in (
                         'INTJ','INTP','ENTJ','ENTP',
                         'INFJ','INFP','ENFJ','ENFP',
                         'ISTJ','ISFJ','ESTJ','ESFJ',
                         'ISTP','ISFP','ESTP','ESFP'
                       )),
  payload              jsonb not null,
  model                text not null,
  created_at           timestamptz not null default now(),
  unique (user_id, fortune_date)
);

create index fortunes_user_date_idx
  on public.fortunes (user_id, fortune_date desc);

alter table public.fortunes enable row level security;

create policy fortunes_select_self on public.fortunes
  for select using (auth.uid() = user_id);

create policy fortunes_insert_self on public.fortunes
  for insert with check (auth.uid() = user_id);
-- intentional: no update / delete policies → fortunes are immutable
```

- [ ] **Step 2: Apply migration via Supabase MCP**

Use `apply_migration` against the dev branch.

- [ ] **Step 3: Verify**

Use `list_tables` and confirm `fortunes` exists with the unique constraint and index. Run `get_advisors` again.

---

### Task 2.4: Configure Google OAuth provider

This is a Supabase dashboard setting; document the steps so the user (or whoever holds the dashboard) can complete it.

- [ ] **Step 1: Document required dashboard config**

Create `docs/superpowers/sign-offs/2026-05-02-google-oauth-setup.md` with:

```
1. Supabase Dashboard → Authentication → Providers → Google → Enable.
2. Supply Google Cloud OAuth Client ID + Secret.
3. Authorized redirect URI (Google side): https://<project>.supabase.co/auth/v1/callback
4. Site URL (Supabase Auth → URL Configuration): http://localhost:3000 in dev,
   production URL in prod.
5. Add http://localhost:3000/auth/callback to "Additional redirect URLs".
```

- [ ] **Step 2: Ask the user to confirm the dashboard steps are done**

This is a manual gate. Don't proceed past Phase 4.1 until confirmed.

---

### Task 2.5: Generate TypeScript types from the schema

**Files:**
- Create: `src/types/database.ts`

- [ ] **Step 1: Generate types via Supabase MCP**

Use `generate_typescript_types` against the dev branch. Write the result to `src/types/database.ts`.

- [ ] **Step 2: Verify the file imports cleanly**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations src/types/database.ts docs/superpowers/sign-offs
git commit -m "feat(db): profiles + fortunes tables, RLS, generated types"
```

---

## Phase 3: Pure-logic modules (TDD)

> **Gate:** Phase 1 must be approved before this phase merges. Phase 2 must be applied before Phase 5+.

### Task 3.1: KST date utilities

**Files:**
- Create: `src/app/_lib/kst.ts`
- Create: `tests/unit/kst.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/kst.test.ts
import { describe, it, expect } from 'vitest'
import { todayKstIso, kstWeekday } from '@/app/_lib/kst'

describe('todayKstIso', () => {
  it('returns YYYY-MM-DD for the KST calendar day at given UTC instant', () => {
    // 2026-05-02 14:30 UTC === 2026-05-02 23:30 KST → '2026-05-02'
    expect(todayKstIso(new Date('2026-05-02T14:30:00Z'))).toBe('2026-05-02')
  })

  it('rolls over to next day after KST midnight', () => {
    // 2026-05-02 15:30 UTC === 2026-05-03 00:30 KST → '2026-05-03'
    expect(todayKstIso(new Date('2026-05-02T15:30:00Z'))).toBe('2026-05-03')
  })

  it('rolls back to previous day before KST midnight', () => {
    // 2026-05-02 14:59 UTC === 2026-05-02 23:59 KST → '2026-05-02'
    expect(todayKstIso(new Date('2026-05-02T14:59:00Z'))).toBe('2026-05-02')
  })
})

describe('kstWeekday', () => {
  it('returns Korean weekday name', () => {
    // 2026-05-02 is a Saturday in KST
    expect(kstWeekday(new Date('2026-05-02T05:00:00Z'))).toBe('토요일')
  })
})
```

- [ ] **Step 2: Run, expect failure**

```bash
npm test -- tests/unit/kst.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// src/app/_lib/kst.ts
const KST_OFFSET_MS = 9 * 60 * 60 * 1000

export function todayKstIso(now: Date = new Date()): string {
  const kst = new Date(now.getTime() + KST_OFFSET_MS)
  return kst.toISOString().slice(0, 10)
}

const WEEKDAYS = ['일요일','월요일','화요일','수요일','목요일','금요일','토요일'] as const

export function kstWeekday(now: Date = new Date()): string {
  const kst = new Date(now.getTime() + KST_OFFSET_MS)
  return WEEKDAYS[kst.getUTCDay()]
}
```

- [ ] **Step 4: Run, expect pass**

```bash
npm test -- tests/unit/kst.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/_lib/kst.ts tests/unit/kst.test.ts
git commit -m "feat(lib): kst date utilities"
```

---

### Task 3.2: MBTI constants and guard

**Files:**
- Create: `src/app/_lib/mbti.ts`
- Create: `tests/unit/mbti.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/mbti.test.ts
import { describe, it, expect } from 'vitest'
import { MBTI_TYPES, MBTI_NICKNAMES, isMbti } from '@/app/_lib/mbti'

describe('MBTI_TYPES', () => {
  it('contains exactly 16 types', () => {
    expect(MBTI_TYPES).toHaveLength(16)
    expect(new Set(MBTI_TYPES).size).toBe(16)
  })
})

describe('MBTI_NICKNAMES', () => {
  it('has a Korean nickname for every MBTI type', () => {
    for (const t of MBTI_TYPES) {
      expect(MBTI_NICKNAMES[t]).toBeTruthy()
    }
  })
})

describe('isMbti', () => {
  it('accepts valid types', () => {
    expect(isMbti('ENFP')).toBe(true)
  })
  it('rejects invalid types', () => {
    expect(isMbti('XXXX')).toBe(false)
    expect(isMbti('')).toBe(false)
    expect(isMbti(undefined)).toBe(false)
  })
})
```

- [ ] **Step 2: Run, expect failure**

```bash
npm test -- tests/unit/mbti.test.ts
```

- [ ] **Step 3: Implement**

```ts
// src/app/_lib/mbti.ts
export const MBTI_TYPES = [
  'INTJ','INTP','ENTJ','ENTP',
  'INFJ','INFP','ENFJ','ENFP',
  'ISTJ','ISFJ','ESTJ','ESFJ',
  'ISTP','ISFP','ESTP','ESFP',
] as const

export type Mbti = (typeof MBTI_TYPES)[number]

export const MBTI_NICKNAMES: Record<Mbti, string> = {
  INTJ: '전략가',  INTP: '논리술사',
  ENTJ: '통솔자',  ENTP: '변론가',
  INFJ: '옹호자',  INFP: '중재자',
  ENFJ: '선도자',  ENFP: '활동가',
  ISTJ: '현실주의자', ISFJ: '수호자',
  ESTJ: '경영자', ESFJ: '집정관',
  ISTP: '장인',  ISFP: '모험가',
  ESTP: '사업가', ESFP: '연예인',
}

export function isMbti(value: unknown): value is Mbti {
  return typeof value === 'string' && (MBTI_TYPES as readonly string[]).includes(value)
}
```

- [ ] **Step 4: Run, expect pass**

```bash
npm test -- tests/unit/mbti.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/app/_lib/mbti.ts tests/unit/mbti.test.ts
git commit -m "feat(lib): mbti types, nicknames, type guard"
```

---

### Task 3.3: Fortune zod schema

**Files:**
- Create: `src/app/_lib/fortune/schema.ts`
- Create: `tests/unit/fortune-schema.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/fortune-schema.test.ts
import { describe, it, expect } from 'vitest'
import { FortunePayloadSchema } from '@/app/_lib/fortune/schema'

const valid = {
  headline: '오늘은 한 정거장 일찍 내려보세요.',
  advice: '익숙한 길보다 한 정거장 일찍 내려보세요. 평소엔 보이지 않던 신호가 눈에 들어올 거예요.',
  lucky: {
    color:  { name: 'soft mint', hex: '#B8E6D2' },
    number: 7,
    item:   '따뜻한 차 한 잔',
  },
}

describe('FortunePayloadSchema', () => {
  it('accepts a well-formed payload', () => {
    expect(() => FortunePayloadSchema.parse(valid)).not.toThrow()
  })

  it('rejects 3-digit hex', () => {
    expect(() => FortunePayloadSchema.parse({
      ...valid,
      lucky: { ...valid.lucky, color: { name: 'red', hex: '#F00' } },
    })).toThrow()
  })

  it('rejects number out of range', () => {
    expect(() => FortunePayloadSchema.parse({ ...valid, lucky: { ...valid.lucky, number: 100 } })).toThrow()
    expect(() => FortunePayloadSchema.parse({ ...valid, lucky: { ...valid.lucky, number: 0 } })).toThrow()
    expect(() => FortunePayloadSchema.parse({ ...valid, lucky: { ...valid.lucky, number: 1.5 } })).toThrow()
  })

  it('rejects empty strings', () => {
    expect(() => FortunePayloadSchema.parse({ ...valid, headline: '' })).toThrow()
  })
})
```

- [ ] **Step 2: Run, expect failure**

```bash
npm test -- tests/unit/fortune-schema.test.ts
```

- [ ] **Step 3: Implement**

```ts
// src/app/_lib/fortune/schema.ts
import { z } from 'zod'

const HEX_RE = /^#[0-9A-Fa-f]{6}$/

export const FortunePayloadSchema = z.object({
  headline: z.string().min(1),
  advice:   z.string().min(1),
  lucky: z.object({
    color: z.object({
      name: z.string().min(1),
      hex:  z.string().regex(HEX_RE),
    }),
    number: z.number().int().min(1).max(99),
    item:   z.string().min(1),
  }),
})

export type FortunePayload = z.infer<typeof FortunePayloadSchema>
```

- [ ] **Step 4: Run, expect pass**

```bash
npm test -- tests/unit/fortune-schema.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/app/_lib/fortune/schema.ts tests/unit/fortune-schema.test.ts
git commit -m "feat(fortune): zod payload schema"
```

---

### Task 3.4: Prompt builder

**Files:**
- Create: `src/app/_lib/fortune/prompt.ts`
- Create: `tests/unit/fortune-prompt.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/unit/fortune-prompt.test.ts
import { describe, it, expect } from 'vitest'
import { buildSystemPrompt, buildUserPrompt } from '@/app/_lib/fortune/prompt'

describe('buildSystemPrompt', () => {
  it('contains tone constraints and JSON schema reference', () => {
    const sys = buildSystemPrompt()
    expect(sys).toContain('coaching')
    expect(sys).toContain('headline')
    expect(sys).toContain('lucky')
    expect(sys).toContain('JSON only')
  })
})

describe('buildUserPrompt', () => {
  it('includes mbti, date, weekday, and a deterministic seed', () => {
    const out = buildUserPrompt({
      mbti: 'ENFP',
      kstDateIso: '2026-05-02',
      kstWeekday: '토요일',
      userIdHash: 'abc123',
    })
    expect(out).toContain('MBTI: ENFP')
    expect(out).toContain('Date: 2026-05-02')
    expect(out).toContain('Day-of-week: 토요일')
    expect(out).toContain('Seed: abc123-2026-05-02')
  })
})
```

- [ ] **Step 2: Run, expect failure**

- [ ] **Step 3: Implement**

```ts
// src/app/_lib/fortune/prompt.ts
import type { Mbti } from '../mbti'

export function buildSystemPrompt(): string {
  return `You are a warm, calm life coach who writes a short daily reflection
for a Korean user, framed as a soft fortune based on their MBTI.

Constraints:
- Tone: calm, warm coaching in Korean. Avoid mystical/divination phrasing.
- Length: headline ~30 chars, advice 2–3 sentences ~120 chars total.
- Output language: Korean.
- Ground advice in something a person could actually do today.

Output JSON only, matching this schema exactly:
{
  "headline": string,
  "advice":   string,
  "lucky": {
    "color":  { "name": string, "hex": string (#RRGGBB) },
    "number": integer (1..99),
    "item":   string
  }
}`
}

export function buildUserPrompt(args: {
  mbti: Mbti
  kstDateIso: string
  kstWeekday: string
  userIdHash: string
}): string {
  const { mbti, kstDateIso, kstWeekday, userIdHash } = args
  return [
    `MBTI: ${mbti}`,
    `Date: ${kstDateIso}`,
    `Day-of-week: ${kstWeekday}`,
    `Seed: ${userIdHash}-${kstDateIso}`,
    '',
    'Generate one daily reflection.',
  ].join('\n')
}
```

- [ ] **Step 4: Run, expect pass**

- [ ] **Step 5: Commit**

```bash
git add src/app/_lib/fortune/prompt.ts tests/unit/fortune-prompt.test.ts
git commit -m "feat(fortune): prompt builder"
```

---

### Task 3.5: Fallback fortunes registry

**Files:**
- Create: `src/app/_lib/fortune/fallback.ts`
- Create: `tests/unit/fortune-fallback.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// tests/unit/fortune-fallback.test.ts
import { describe, it, expect } from 'vitest'
import { FALLBACK_FORTUNES } from '@/app/_lib/fortune/fallback'
import { MBTI_TYPES } from '@/app/_lib/mbti'
import { FortunePayloadSchema } from '@/app/_lib/fortune/schema'

describe('FALLBACK_FORTUNES', () => {
  it('has an entry for every MBTI type', () => {
    for (const t of MBTI_TYPES) {
      expect(FALLBACK_FORTUNES[t]).toBeDefined()
    }
  })

  it('every entry passes the FortunePayloadSchema', () => {
    for (const t of MBTI_TYPES) {
      expect(() => FortunePayloadSchema.parse(FALLBACK_FORTUNES[t])).not.toThrow()
    }
  })
})
```

- [ ] **Step 2: Run, expect failure**

- [ ] **Step 3: Implement (16 entries — generic but valid)**

```ts
// src/app/_lib/fortune/fallback.ts
import type { Mbti } from '../mbti'
import type { FortunePayload } from './schema'

const generic = (headline: string, advice: string): FortunePayload => ({
  headline,
  advice,
  lucky: {
    color:  { name: 'soft mint', hex: '#B8E6D2' },
    number: 7,
    item:   '따뜻한 차 한 잔',
  },
})

export const FALLBACK_FORTUNES: Record<Mbti, FortunePayload> = {
  INTJ: generic('계획보다 한 걸음만 빠른 행동을 고르세요.', '오늘은 머릿속에서 다듬던 결론을 한 줄로 적어 보세요. 글자가 되어 나오면 다음 수가 또렷해집니다.'),
  INTP: generic('완벽한 답보다 두 번째로 좋은 답을 골라보세요.', '시작하는 데 필요한 정보는 이미 충분합니다. 나머지는 움직이면서 채우면 돼요.'),
  ENTJ: generic('속도를 한 단계 늦춰서 사람을 살피세요.', '오늘은 결정을 빠르게 내리는 만큼, 옆 사람의 반응에 한 번 더 머물러 주세요.'),
  ENTP: generic('새 아이디어보다 오래된 아이디어를 다시 보세요.', '지난주 노트에 적어둔 한 가지를 골라 작은 실험을 해보면 의외의 단서가 보일 거예요.'),
  INFJ: generic('타인의 부탁 전에 내 컨디션을 먼저 점검하세요.', '오늘은 거절이 친절일 수 있어요. 무리하지 않은 만큼이 정확한 도움이 됩니다.'),
  INFP: generic('마음에 걸리는 한 가지를 작게라도 시작해 보세요.', '완성하지 않아도 돼요. 첫 줄을 적는 것만으로도 마음의 무게는 분명히 가벼워집니다.'),
  ENFJ: generic('나에게 주는 작은 칭찬을 잊지 마세요.', '오늘 가장 잘한 일을 하나만 적어 보세요. 다른 사람을 향한 다정함이 더 단단해질 거예요.'),
  ENFP: generic('충동을 한 가지만 골라 즐겨보세요.', '오늘은 작은 즉흥이 답이 됩니다. 단, 시간 한도는 30분으로 정해두면 좋아요.'),
  ISTJ: generic('체크리스트의 마지막 한 줄을 비워두세요.', '계획대로 가는 하루지만, 빈자리 하나가 새 가능성을 부릅니다.'),
  ISFJ: generic('나를 위한 일정을 캘린더에 넣으세요.', '오늘은 챙길 사람 목록에 본인 이름을 한 번 더해 보세요. 그 한 줄이 다른 모든 줄을 든든하게 합니다.'),
  ESTJ: generic('빠른 결정 사이에 5분의 침묵을 두세요.', '결정 직전 한 호흡이 오늘의 가장 효율적인 일이 될 수 있어요.'),
  ESFJ: generic('주변보다 내 마음의 온도를 먼저 살피세요.', '오늘은 안부 인사를 받기보다 건네 보세요. 다정함은 들어오는 만큼 다시 채워집니다.'),
  ISTP: generic('익숙한 도구로 새 문제를 풀어보세요.', '오늘은 새 도구를 배우는 날이 아니라, 가지고 있는 도구를 한 번 더 다듬는 날이 잘 맞아요.'),
  ISFP: generic('하루 중 5분은 화면 밖에 두세요.', '눈을 들어 창밖을 보세요. 그 짧은 거리만큼 마음의 시야도 넓어집니다.'),
  ESTP: generic('당장 실행해도 좋을 한 가지를 고르세요.', '오늘은 계획표보다 한 발 빠른 움직임이 잘 맞아요. 다만 멈출 줄도 잊지 마세요.'),
  ESFP: generic('가까운 사람과의 짧은 대화에 시간을 내주세요.', '오늘 가장 작은 만남이 가장 큰 환기를 가져옵니다.'),
}
```

- [ ] **Step 4: Run, expect pass**

- [ ] **Step 5: Commit**

```bash
git add src/app/_lib/fortune/fallback.ts tests/unit/fortune-fallback.test.ts
git commit -m "feat(fortune): per-mbti fallback registry"
```

---

### Task 3.6: OpenRouter client

**Files:**
- Create: `src/app/_lib/fortune/openrouter.ts`
- Create: `tests/integration/openrouter.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/integration/openrouter.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { callOpenRouter } from '@/app/_lib/fortune/openrouter'

const ENV = {
  OPENROUTER_API_KEY: 'test-key',
  OPENROUTER_MODEL: 'google/gemini-2.5-flash',
  OPENROUTER_REFERER: 'http://localhost:3000',
  OPENROUTER_TITLE: 'Test',
}

beforeEach(() => {
  for (const [k, v] of Object.entries(ENV)) process.env[k] = v
})
afterEach(() => {
  vi.unstubAllGlobals()
})

function mockFetch(status: number, body: unknown) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: async () => typeof body === 'string' ? body : JSON.stringify(body),
    json: async () => body,
  }))
}

describe('callOpenRouter', () => {
  it('returns the assistant content on 200', async () => {
    mockFetch(200, {
      choices: [{ message: { content: '{"headline":"x","advice":"y","lucky":{"color":{"name":"a","hex":"#000000"},"number":1,"item":"z"}}' } }],
    })
    const result = await callOpenRouter({ system: 'sys', user: 'usr' })
    expect(result.content).toContain('"headline":"x"')
    expect(result.model).toBe('google/gemini-2.5-flash')
  })

  it('throws on non-2xx', async () => {
    mockFetch(429, { error: 'rate limited' })
    await expect(callOpenRouter({ system: 'sys', user: 'usr' })).rejects.toThrow(/429/)
  })

  it('respects timeout via AbortController', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation((_url: string, init: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
      })
    }))
    await expect(callOpenRouter({ system: 'sys', user: 'usr', timeoutMs: 10 })).rejects.toThrow()
  })
})
```

- [ ] **Step 2: Run, expect failure**

- [ ] **Step 3: Implement**

```ts
// src/app/_lib/fortune/openrouter.ts

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions'

export interface CallArgs {
  system: string
  user: string
  timeoutMs?: number
}

export interface CallResult {
  content: string
  model: string
}

export async function callOpenRouter(args: CallArgs): Promise<CallResult> {
  const apiKey = requireEnv('OPENROUTER_API_KEY')
  const model = requireEnv('OPENROUTER_MODEL')
  const referer = process.env.OPENROUTER_REFERER ?? ''
  const title = process.env.OPENROUTER_TITLE ?? 'MBTI Daily Fortune'

  const ctrl = new AbortController()
  const timeout = setTimeout(() => ctrl.abort(), args.timeoutMs ?? 8000)

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
        'HTTP-Referer':  referer,
        'X-Title':       title,
      },
      body: JSON.stringify({
        model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: args.system },
          { role: 'user',   content: args.user   },
        ],
        temperature: 0.7,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`OpenRouter ${res.status}: ${body.slice(0, 300)}`)
    }

    const data = await res.json() as {
      choices?: { message?: { content?: string } }[]
    }
    const content = data.choices?.[0]?.message?.content
    if (!content) throw new Error('OpenRouter returned no content')

    return { content, model }
  } finally {
    clearTimeout(timeout)
  }
}

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env: ${name}`)
  return v
}
```

- [ ] **Step 4: Run, expect pass**

```bash
npm test -- tests/integration/openrouter.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/app/_lib/fortune/openrouter.ts tests/integration/openrouter.test.ts
git commit -m "feat(fortune): openrouter client wrapper"
```

---

### Task 3.7: Fortune service (orchestrates prompt + OpenRouter + validation + fallback)

This module is pure of Supabase — it just generates a payload. The Server Action layer (Task 5.1) wraps DB I/O around it.

**Files:**
- Create: `src/app/_lib/fortune/service.ts`
- Create: `tests/integration/fortune-service.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// tests/integration/fortune-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateFortune } from '@/app/_lib/fortune/service'
import * as openrouter from '@/app/_lib/fortune/openrouter'
import { FALLBACK_FORTUNES } from '@/app/_lib/fortune/fallback'

const VALID = JSON.stringify({
  headline: 'h', advice: 'a',
  lucky: { color: { name: 'soft mint', hex: '#B8E6D2' }, number: 7, item: 'tea' },
})
const INVALID = '{ not json'

beforeEach(() => vi.restoreAllMocks())

describe('generateFortune', () => {
  it('returns parsed payload on first valid response', async () => {
    vi.spyOn(openrouter, 'callOpenRouter').mockResolvedValue({ content: VALID, model: 'm' })
    const out = await generateFortune({ mbti: 'ENFP', userIdHash: 'h', now: new Date('2026-05-02T10:00:00Z') })
    expect(out.kind).toBe('ai')
    if (out.kind !== 'ai') return
    expect(out.payload.headline).toBe('h')
    expect(out.model).toBe('m')
  })

  it('retries once on invalid JSON, succeeds on retry', async () => {
    const spy = vi.spyOn(openrouter, 'callOpenRouter')
      .mockResolvedValueOnce({ content: INVALID, model: 'm' })
      .mockResolvedValueOnce({ content: VALID, model: 'm' })
    const out = await generateFortune({ mbti: 'ENFP', userIdHash: 'h', now: new Date('2026-05-02T10:00:00Z') })
    expect(spy).toHaveBeenCalledTimes(2)
    expect(out.kind).toBe('ai')
  })

  it('returns fallback after both attempts fail', async () => {
    vi.spyOn(openrouter, 'callOpenRouter').mockRejectedValue(new Error('boom'))
    const out = await generateFortune({ mbti: 'ENFP', userIdHash: 'h', now: new Date('2026-05-02T10:00:00Z') })
    expect(out.kind).toBe('fallback')
    if (out.kind !== 'fallback') return
    expect(out.payload).toEqual(FALLBACK_FORTUNES.ENFP)
  })
})
```

- [ ] **Step 2: Run, expect failure**

- [ ] **Step 3: Implement**

```ts
// src/app/_lib/fortune/service.ts
import { todayKstIso, kstWeekday } from '../kst'
import type { Mbti } from '../mbti'
import { FALLBACK_FORTUNES } from './fallback'
import { callOpenRouter } from './openrouter'
import { buildSystemPrompt, buildUserPrompt } from './prompt'
import { FortunePayloadSchema, type FortunePayload } from './schema'

export type GenerateResult =
  | { kind: 'ai'; payload: FortunePayload; model: string }
  | { kind: 'fallback'; payload: FortunePayload; model: null }

export async function generateFortune(args: {
  mbti: Mbti
  userIdHash: string
  now?: Date
}): Promise<GenerateResult> {
  const now = args.now ?? new Date()
  const system = buildSystemPrompt()
  const user = buildUserPrompt({
    mbti: args.mbti,
    kstDateIso: todayKstIso(now),
    kstWeekday: kstWeekday(now),
    userIdHash: args.userIdHash,
  })

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { content, model } = await callOpenRouter({ system, user })
      const parsed = JSON.parse(content)
      const payload = FortunePayloadSchema.parse(parsed)
      return { kind: 'ai', payload, model }
    } catch (err) {
      if (attempt === 0) {
        await sleep(500)
        continue
      }
      console.error('[fortune] generation failed, falling back:', err)
    }
  }

  return {
    kind: 'fallback',
    payload: FALLBACK_FORTUNES[args.mbti],
    model: null,
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
```

- [ ] **Step 4: Run, expect pass**

- [ ] **Step 5: Commit**

```bash
git add src/app/_lib/fortune/service.ts tests/integration/fortune-service.test.ts
git commit -m "feat(fortune): service orchestrates prompt + openrouter + validation + fallback"
```

---

## Phase 4: Auth + routing primitives

### Task 4.1: Supabase server / browser / middleware clients

**Files:**
- Create: `src/app/_lib/supabase/server.ts`
- Create: `src/app/_lib/supabase/browser.ts`
- Create: `src/app/_lib/supabase/middleware.ts`
- Create: `src/middleware.ts`

- [ ] **Step 1: Read Next 16 + Supabase SSR patterns**

Read `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md` (cookies/headers in Server Components) and `node_modules/next/dist/docs/01-app/02-guides/authentication.md` before writing the wrappers.

- [ ] **Step 2: Implement server client**

```ts
// src/app/_lib/supabase/server.ts
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export async function createServerSupabase() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          for (const { name, value, options } of toSet) {
            cookieStore.set(name, value, options)
          }
        },
      },
    },
  )
}
```

- [ ] **Step 3: Implement browser client**

```ts
// src/app/_lib/supabase/browser.ts
'use client'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createBrowserSupabase() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
```

- [ ] **Step 4: Implement middleware session refresh**

```ts
// src/app/_lib/supabase/middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (toSet) => {
          for (const { name, value } of toSet) request.cookies.set(name, value)
          response = NextResponse.next({ request })
          for (const { name, value, options } of toSet) response.cookies.set(name, value, options)
        },
      },
    },
  )

  // Touching getUser() refreshes the session cookie if expired.
  await supabase.auth.getUser()
  return response
}
```

- [ ] **Step 5: Wire up `src/middleware.ts`**

```ts
// src/middleware.ts
import { updateSession } from '@/app/_lib/supabase/middleware'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  return updateSession(req)
}

export const config = {
  matcher: [
    // Skip static files and Next internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

- [ ] **Step 6: Verify dev server still boots**

```bash
npm run dev
```

Expected: server starts, `/` renders (still placeholder), no runtime errors in console.

- [ ] **Step 7: Commit**

```bash
git add src/app/_lib/supabase src/middleware.ts
git commit -m "feat(auth): supabase ssr client + session middleware"
```

---

### Task 4.2: Auth guard helpers

**Files:**
- Create: `src/app/_lib/auth/guards.ts`

- [ ] **Step 1: Implement**

```ts
// src/app/_lib/auth/guards.ts
import { redirect } from 'next/navigation'
import { createServerSupabase } from '../supabase/server'

export async function requireSession() {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) redirect('/login')
  return { supabase, user: data.user }
}

export async function requireProfile() {
  const { supabase, user } = await requireSession()
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile) redirect('/onboarding/mbti')

  return {
    supabase,
    user: { id: user.id, email: user.email ?? undefined },
    profile,
  }
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/_lib/auth/guards.ts
git commit -m "feat(auth): requireSession + requireProfile guards"
```

---

### Task 4.3: `/login` page

**Files:**
- Create: `src/app/login/page.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/app/login/page.tsx
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/app/_lib/supabase/server'
import { LoginButton } from './login-button'

export default async function LoginPage() {
  const supabase = await createServerSupabase()
  const { data } = await supabase.auth.getUser()
  if (data.user) redirect('/')

  return (
    <main className="flex min-h-dvh flex-col px-(--spacing-xl) pb-(--spacing-xxxl) pt-(--spacing-section)">
      <div className="flex-1 flex flex-col justify-center items-center gap-(--spacing-md)">
        <h1 className="text-[40px] leading-[1.16] font-medium tracking-[0] text-ink-deep" style={{ fontFeatureSettings: '"ss01","ss02"' }}>
          MBTI 데일리 운세
        </h1>
        <p className="text-[18px] leading-[1.44] text-ink text-center">
          내 MBTI에 맞춘 오늘의 다정한 한 줄.
        </p>
      </div>
      <LoginButton />
      <p className="mt-(--spacing-md) text-[12px] leading-[1.33] text-steel text-center">
        로그인 시 서비스 이용약관과 개인정보처리방침에 동의하게 돼요.
      </p>
    </main>
  )
}
```

- [ ] **Step 2: Implement client button**

```tsx
// src/app/login/login-button.tsx
'use client'
import { createBrowserSupabase } from '@/app/_lib/supabase/browser'

export function LoginButton() {
  async function onClick() {
    const supabase = createBrowserSupabase()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-full bg-ink-button text-on-ink-button px-[30px] py-[14px] text-[14px] font-bold tracking-[-0.14px]"
    >
      Google로 시작하기
    </button>
  )
}
```

- [ ] **Step 3: Verify in browser**

```bash
npm run dev
```

Open `http://localhost:3000/login`. Confirm: layout matches Pencil mockup (Task 1.2). Clicking the button initiates Google OAuth (will fail until provider is configured in Task 2.4 — that's fine).

- [ ] **Step 4: Commit**

```bash
git add src/app/login
git commit -m "feat(auth): /login page with google oauth"
```

---

### Task 4.4: `/auth/callback` route handler

**Files:**
- Create: `src/app/auth/callback/route.ts`

- [ ] **Step 1: Implement**

```ts
// src/app/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/app/_lib/supabase/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createServerSupabase()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url))
    }
  }
  return NextResponse.redirect(new URL('/login?error=oauth', request.url))
}
```

- [ ] **Step 2: End-to-end smoke (after Task 2.4 is done)**

Manual test: open `/login` → Google flow → should land on `/` (or `/onboarding/mbti` if no profile yet).

- [ ] **Step 3: Commit**

```bash
git add src/app/auth/callback
git commit -m "feat(auth): oauth callback route"
```

---

## Phase 5: Onboarding

### Task 5.1: MBTI grid component

**Files:**
- Create: `src/app/_components/mbti-grid.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/app/_components/mbti-grid.tsx
'use client'
import { useState } from 'react'
import { MBTI_TYPES, MBTI_NICKNAMES, type Mbti } from '@/app/_lib/mbti'

interface Props {
  name: string                 // hidden input name (used inside <form>)
  initialValue?: Mbti
  onChange?: (value: Mbti) => void
}

export function MbtiGrid({ name, initialValue, onChange }: Props) {
  const [selected, setSelected] = useState<Mbti | undefined>(initialValue)

  return (
    <>
      <input type="hidden" name={name} value={selected ?? ''} />
      <div className="grid grid-cols-4 gap-(--spacing-md)">
        {MBTI_TYPES.map((t) => {
          const isSelected = t === selected
          return (
            <button
              type="button"
              key={t}
              onClick={() => { setSelected(t); onChange?.(t) }}
              className={[
                'flex flex-col items-center justify-center gap-1',
                'rounded-xl bg-surface-soft px-2 py-3',
                'border',
                isSelected
                  ? 'border-2 border-ink-deep'
                  : 'border-hairline-soft',
              ].join(' ')}
            >
              <span className="text-[18px] leading-[1.44] font-bold text-ink-deep">{t}</span>
              <span className="text-[14px] leading-[1.43] text-steel">{MBTI_NICKNAMES[t]}</span>
            </button>
          )
        })}
      </div>
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/_components/mbti-grid.tsx
git commit -m "feat(ui): mbti grid component"
```

---

### Task 5.2: `createProfile` server action

**Files:**
- Create: `src/app/_actions/profile.ts`

- [ ] **Step 1: Implement**

```ts
// src/app/_actions/profile.ts
'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createServerSupabase } from '@/app/_lib/supabase/server'
import { isMbti } from '@/app/_lib/mbti'

export async function createProfile(formData: FormData) {
  const mbti = formData.get('mbti')
  if (!isMbti(mbti)) throw new Error('Invalid MBTI')

  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/login')

  const { error } = await supabase.from('profiles').insert({
    user_id: auth.user.id,
    mbti,
    display_name:
      (auth.user.user_metadata?.full_name as string | undefined) ??
      (auth.user.user_metadata?.name as string | undefined) ??
      null,
    avatar_url:
      (auth.user.user_metadata?.avatar_url as string | undefined) ?? null,
  })
  if (error && error.code !== '23505') throw error  // ignore unique-violation race

  revalidatePath('/')
  redirect('/')
}

export async function updateMbti(formData: FormData) {
  const mbti = formData.get('mbti')
  if (!isMbti(mbti)) throw new Error('Invalid MBTI')

  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/login')

  const { error } = await supabase
    .from('profiles')
    .update({ mbti })
    .eq('user_id', auth.user.id)
  if (error) throw error

  revalidatePath('/settings')
  redirect('/settings')
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/_actions/profile.ts
git commit -m "feat(profile): create + update profile server actions"
```

---

### Task 5.3: `/onboarding/mbti` page

**Files:**
- Create: `src/app/onboarding/mbti/page.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/app/onboarding/mbti/page.tsx
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/app/_lib/supabase/server'
import { MbtiGrid } from '@/app/_components/mbti-grid'
import { createProfile } from '@/app/_actions/profile'

export default async function OnboardingMbtiPage() {
  const supabase = await createServerSupabase()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect('/login')

  const { data: existing } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('user_id', data.user.id)
    .maybeSingle()
  if (existing) redirect('/')

  return (
    <main className="flex min-h-dvh flex-col px-(--spacing-xl) pb-(--spacing-xxxl) pt-(--spacing-xxl)">
      <h1 className="text-[36px] leading-[1.28] font-medium text-ink-deep" style={{ fontFeatureSettings: '"ss01","ss02"' }}>
        내 MBTI를 알려주세요
      </h1>
      <p className="mt-(--spacing-xs) text-[16px] leading-[1.5] text-charcoal">
        선택한 MBTI를 기준으로 매일 한 편의 운세를 만들어드려요.
      </p>

      <form action={createProfile} className="mt-(--spacing-xxl) flex-1 flex flex-col">
        <MbtiGrid name="mbti" />
        <div className="mt-auto pt-(--spacing-xl)">
          <button
            type="submit"
            className="w-full rounded-full bg-ink-button text-on-ink-button px-[30px] py-[14px] text-[14px] font-bold tracking-[-0.14px] disabled:bg-stone disabled:text-canvas"
          >
            시작하기
          </button>
        </div>
      </form>
    </main>
  )
}
```

> Note: native `disabled:` styling for empty selection requires the form to validate `mbti` not empty. The grid stores empty string when none selected; the server action throws on invalid MBTI. Wrap the button in a small client component if you want disabled-until-selected styling. Defer to Task 5.4.

- [ ] **Step 2: Commit**

```bash
git add src/app/onboarding
git commit -m "feat(onboarding): mbti selection page"
```

---

### Task 5.4: Disabled-until-selected submit (optional polish)

**Files:**
- Create: `src/app/onboarding/mbti/submit-button.tsx`
- Modify: `src/app/onboarding/mbti/page.tsx`
- Modify: `src/app/_components/mbti-grid.tsx` (export `useMbtiSelection` or accept controlled value via context)

- [ ] **Step 1: Lift selection state**

Switch `MbtiGrid` to controlled mode by accepting `value` + `onChange` props (already supported). Manage state in a thin client wrapper that hosts both grid and submit button.

```tsx
// src/app/onboarding/mbti/onboarding-form.tsx
'use client'
import { useState } from 'react'
import type { Mbti } from '@/app/_lib/mbti'
import { MbtiGrid } from '@/app/_components/mbti-grid'
import { createProfile } from '@/app/_actions/profile'

export function OnboardingForm() {
  const [value, setValue] = useState<Mbti | undefined>(undefined)
  return (
    <form action={createProfile} className="mt-(--spacing-xxl) flex-1 flex flex-col">
      <MbtiGrid name="mbti" initialValue={value} onChange={setValue} />
      <div className="mt-auto pt-(--spacing-xl)">
        <button
          type="submit"
          disabled={!value}
          className="w-full rounded-full bg-ink-button text-on-ink-button px-[30px] py-[14px] text-[14px] font-bold tracking-[-0.14px] disabled:bg-stone disabled:text-canvas"
        >
          시작하기
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Use it in the page**

Replace the inline `<form>` block in `src/app/onboarding/mbti/page.tsx` with `<OnboardingForm />`.

- [ ] **Step 3: Manual smoke**

Onboarding page in browser: button is disabled until a tile is tapped.

- [ ] **Step 4: Commit**

```bash
git add src/app/onboarding/mbti
git commit -m "feat(onboarding): disable submit until mbti selected"
```

---

## Phase 6: Today's fortune UI + Server Action

### Task 6.1: `getOrCreateTodayFortune` Server Action

**Files:**
- Create: `src/app/_actions/fortune.ts`

- [ ] **Step 1: Implement**

```ts
// src/app/_actions/fortune.ts
'use server'
import { createHash } from 'node:crypto'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/app/_lib/supabase/server'
import { todayKstIso } from '@/app/_lib/kst'
import { isMbti, type Mbti } from '@/app/_lib/mbti'
import { generateFortune } from '@/app/_lib/fortune/service'
import type { FortunePayload } from '@/app/_lib/fortune/schema'
import { FortunePayloadSchema } from '@/app/_lib/fortune/schema'

export interface TodayFortune {
  fortuneDate: string
  payload: FortunePayload
  mbti: Mbti
  source: 'db' | 'ai' | 'fallback'
}

export async function getOrCreateTodayFortune(): Promise<TodayFortune> {
  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('mbti')
    .eq('user_id', auth.user.id)
    .maybeSingle()
  if (!profile) redirect('/onboarding/mbti')
  if (!isMbti(profile.mbti)) throw new Error('Stored MBTI is invalid')

  const today = todayKstIso()

  // 1) Fast path: today's row already exists.
  {
    const { data: existing } = await supabase
      .from('fortunes')
      .select('fortune_date, payload, mbti_at_generation')
      .eq('user_id', auth.user.id)
      .eq('fortune_date', today)
      .maybeSingle()
    if (existing) {
      return {
        fortuneDate: existing.fortune_date,
        payload: FortunePayloadSchema.parse(existing.payload),
        mbti: existing.mbti_at_generation as Mbti,
        source: 'db',
      }
    }
  }

  // 2) Generate.
  const userIdHash = createHash('sha256').update(auth.user.id).digest('hex').slice(0, 16)
  const result = await generateFortune({ mbti: profile.mbti, userIdHash })

  if (result.kind === 'fallback') {
    // Don't persist fallback — let next visit retry.
    return {
      fortuneDate: today,
      payload: result.payload,
      mbti: profile.mbti,
      source: 'fallback',
    }
  }

  // 3) Insert; tolerate two-tab races via ON CONFLICT DO NOTHING semantics.
  const { error: insertError } = await supabase.from('fortunes').insert({
    user_id: auth.user.id,
    fortune_date: today,
    mbti_at_generation: profile.mbti,
    payload: result.payload as never,
    model: result.model,
  })
  if (insertError && insertError.code !== '23505') throw insertError

  // 4) Re-select to return the canonical row (handles the conflict case).
  const { data: row, error: selectError } = await supabase
    .from('fortunes')
    .select('fortune_date, payload, mbti_at_generation')
    .eq('user_id', auth.user.id)
    .eq('fortune_date', today)
    .single()
  if (selectError) throw selectError

  return {
    fortuneDate: row.fortune_date,
    payload: FortunePayloadSchema.parse(row.payload),
    mbti: row.mbti_at_generation as Mbti,
    source: 'ai',
  }
}

export async function getFortuneByDate(date: string) {
  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/login')

  const { data, error } = await supabase
    .from('fortunes')
    .select('fortune_date, payload, mbti_at_generation')
    .eq('user_id', auth.user.id)
    .eq('fortune_date', date)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  return {
    fortuneDate: data.fortune_date,
    payload: FortunePayloadSchema.parse(data.payload),
    mbti: data.mbti_at_generation as Mbti,
  }
}

export async function getFortuneHistory(limit = 60) {
  const supabase = await createServerSupabase()
  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) redirect('/login')

  const { data, error } = await supabase
    .from('fortunes')
    .select('fortune_date, payload, mbti_at_generation')
    .eq('user_id', auth.user.id)
    .order('fortune_date', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data.map(row => ({
    fortuneDate: row.fortune_date,
    payload: FortunePayloadSchema.parse(row.payload),
    mbti: row.mbti_at_generation as Mbti,
  }))
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/_actions/fortune.ts
git commit -m "feat(fortune): server actions for today/by-date/history"
```

---

### Task 6.2: `FortuneCard` + `LuckyTrio` components

**Files:**
- Create: `src/app/_components/fortune-card.tsx`
- Create: `src/app/_components/lucky-trio.tsx`

- [ ] **Step 1: Implement `LuckyTrio`**

```tsx
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
```

- [ ] **Step 2: Implement `FortuneCard`**

```tsx
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
```

- [ ] **Step 3: Commit**

```bash
git add src/app/_components/fortune-card.tsx src/app/_components/lucky-trio.tsx
git commit -m "feat(ui): fortune card + lucky trio"
```

---

### Task 6.3: Top bar component + fortune skeleton

**Files:**
- Create: `src/app/_components/top-bar.tsx`
- Create: `src/app/_components/fortune-skeleton.tsx`

- [ ] **Step 1: Implement top bar**

```tsx
// src/app/_components/top-bar.tsx
import Link from 'next/link'
import { History, Settings } from 'lucide-react'

export function TopBar({ dateLabel }: { dateLabel: string }) {
  return (
    <header className="flex items-center justify-between py-(--spacing-md)">
      <span className="text-[14px] leading-[1.43] font-bold tracking-[-0.14px] text-ink">{dateLabel}</span>
      <nav className="flex items-center gap-(--spacing-xs)">
        <Link
          href="/history"
          aria-label="내 기록"
          className="w-10 h-10 rounded-full bg-canvas border border-hairline-soft flex items-center justify-center"
        >
          <History size={20} />
        </Link>
        <Link
          href="/settings"
          aria-label="설정"
          className="w-10 h-10 rounded-full bg-canvas border border-hairline-soft flex items-center justify-center"
        >
          <Settings size={20} />
        </Link>
      </nav>
    </header>
  )
}
```

- [ ] **Step 2: Implement skeleton**

```tsx
// src/app/_components/fortune-skeleton.tsx
export function FortuneSkeleton() {
  return (
    <section className="animate-pulse">
      <div className="rounded-[32px] bg-surface-soft px-(--spacing-xxl) py-(--spacing-xxl)">
        <div className="h-4 w-32 bg-hairline rounded" />
        <div className="mt-(--spacing-md) h-7 w-3/4 bg-hairline rounded" />
        <div className="mt-(--spacing-base) h-4 w-full bg-hairline rounded" />
        <div className="mt-2 h-4 w-2/3 bg-hairline rounded" />
      </div>
      <div className="mt-(--spacing-md) grid grid-cols-3 gap-(--spacing-md)">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-28 rounded-xl border border-hairline-soft bg-canvas" />
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/_components/top-bar.tsx src/app/_components/fortune-skeleton.tsx
git commit -m "feat(ui): top bar + fortune skeleton"
```

---

### Task 6.4: `/` page with Suspense + skeleton

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Replace placeholder with full home page**

```tsx
// src/app/page.tsx
import Link from 'next/link'
import { Suspense } from 'react'
import { requireProfile } from '@/app/_lib/auth/guards'
import { TopBar } from '@/app/_components/top-bar'
import { FortuneCard } from '@/app/_components/fortune-card'
import { FortuneSkeleton } from '@/app/_components/fortune-skeleton'
import { getOrCreateTodayFortune } from '@/app/_actions/fortune'
import { todayKstIso } from '@/app/_lib/kst'

function formatDateKo(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${y}년 ${m}월 ${d}일`
}

export default async function HomePage() {
  await requireProfile() // route guard
  return (
    <main className="flex min-h-dvh flex-col px-(--spacing-xl) pb-(--spacing-xxxl)">
      <TopBar dateLabel={formatDateKo(todayKstIso())} />
      <Suspense fallback={<FortuneSkeleton />}>
        <TodayFortune />
      </Suspense>
      <div className="mt-(--spacing-xxl) text-center">
        <Link href="/history" className="text-[16px] leading-[1.5] font-bold text-ink-deep underline-offset-4 hover:underline">
          내 기록 보기
        </Link>
      </div>
    </main>
  )
}

async function TodayFortune() {
  const { payload, mbti, source } = await getOrCreateTodayFortune()
  return <FortuneCard mbti={mbti} payload={payload} fallbackNotice={source === 'fallback'} />
}
```

- [ ] **Step 2: Smoke test in browser**

Sign in → Onboarding (pick MBTI) → land on `/`. Confirm card renders, lucky trio renders, date is correct.

Refresh: same fortune (cached from DB).

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(home): today's fortune page with suspense + skeleton"
```

---

## Phase 7: History

### Task 7.1: Pill-tab segment component

**Files:**
- Create: `src/app/_components/pill-tab.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/app/_components/pill-tab.tsx
'use client'
import { useRouter, useSearchParams } from 'next/navigation'

export function PillTab({
  options,
  current,
  paramName,
}: {
  options: { value: string; label: string }[]
  current: string
  paramName: string
}) {
  const router = useRouter()
  const params = useSearchParams()
  return (
    <div className="inline-flex rounded-full bg-canvas border border-hairline p-1">
      {options.map((o) => {
        const active = o.value === current
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => {
              const next = new URLSearchParams(params)
              next.set(paramName, o.value)
              router.replace(`?${next.toString()}`, { scroll: false })
            }}
            className={[
              'px-(--spacing-base) py-(--spacing-xs) text-[14px] leading-[1.43] font-bold rounded-full',
              active ? 'bg-ink-deep text-canvas' : 'text-ink',
            ].join(' ')}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/_components/pill-tab.tsx
git commit -m "feat(ui): pill-tab segment toggle"
```

---

### Task 7.2: History list + calendar components

**Files:**
- Create: `src/app/_components/history-list.tsx`
- Create: `src/app/_components/history-calendar.tsx`

- [ ] **Step 1: Implement list**

```tsx
// src/app/_components/history-list.tsx
import Link from 'next/link'
import type { FortunePayload } from '@/app/_lib/fortune/schema'

interface Item {
  fortuneDate: string
  payload: FortunePayload
}

export function HistoryList({ items }: { items: Item[] }) {
  if (items.length === 0) return <EmptyState />
  return (
    <ul className="divide-y divide-hairline-soft">
      {items.map((it) => (
        <li key={it.fortuneDate}>
          <Link href={`/history/${it.fortuneDate}`} className="flex items-center gap-(--spacing-md) py-(--spacing-base)">
            <span className="text-[14px] leading-[1.43] font-bold text-ink w-20 shrink-0">{formatShortDate(it.fortuneDate)}</span>
            <span className="text-[16px] leading-[1.5] text-ink flex-1 line-clamp-1">{it.payload.headline}</span>
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ background: it.payload.lucky.color.hex }}
              aria-hidden
            />
          </Link>
        </li>
      ))}
    </ul>
  )
}

function EmptyState() {
  return (
    <div className="py-(--spacing-section) text-center">
      <p className="text-[16px] leading-[1.5] text-ink">아직 기록이 없어요.</p>
      <p className="mt-(--spacing-xs) text-[14px] leading-[1.43] text-steel">오늘 운세를 보면 여기에 쌓여요.</p>
      <Link href="/" className="mt-(--spacing-base) inline-block text-[16px] leading-[1.5] font-bold text-ink-deep underline-offset-4 hover:underline">
        오늘의 운세 보기
      </Link>
    </div>
  )
}

function formatShortDate(iso: string): string {
  const [, m, d] = iso.split('-').map(Number)
  return `${m}/${d}`
}
```

- [ ] **Step 2: Implement calendar**

```tsx
// src/app/_components/history-calendar.tsx
import Link from 'next/link'
import type { FortunePayload } from '@/app/_lib/fortune/schema'

interface Item {
  fortuneDate: string
  payload: FortunePayload
}

export function HistoryCalendar({ items, todayIso }: { items: Item[]; todayIso: string }) {
  const byDate = new Map(items.map(it => [it.fortuneDate, it]))
  const [y, m] = todayIso.split('-').map(Number)
  const firstDay = new Date(Date.UTC(y, m - 1, 1))
  const startWeekday = firstDay.getUTCDay()
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate()

  const cells: ({ iso: string; item: Item | undefined } | null)[] = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    cells.push({ iso, item: byDate.get(iso) })
  }

  return (
    <div>
      <h2 className="text-[18px] leading-[1.44] font-bold text-ink-deep">{y}년 {m}월</h2>
      <div className="mt-(--spacing-md) grid grid-cols-7 gap-1 text-center">
        {['일','월','화','수','목','금','토'].map(d => (
          <span key={d} className="text-[12px] leading-[1.33] text-steel py-1">{d}</span>
        ))}
        {cells.map((c, idx) => {
          if (!c) return <span key={`b-${idx}`} />
          const isToday = c.iso === todayIso
          const day = Number(c.iso.slice(8, 10))
          const cell = (
            <span
              className={[
                'flex flex-col items-center justify-center h-12 rounded-lg',
                isToday ? 'border-2 border-ink-deep' : '',
              ].join(' ')}
            >
              <span className="text-[14px] leading-[1.43] text-ink">{day}</span>
              {c.item && (
                <span
                  className="mt-1 w-2 h-2 rounded-full"
                  style={{ background: c.item.payload.lucky.color.hex }}
                  aria-hidden
                />
              )}
            </span>
          )
          return c.item ? (
            <Link key={c.iso} href={`/history/${c.iso}`}>{cell}</Link>
          ) : (
            <span key={c.iso}>{cell}</span>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/_components/history-list.tsx src/app/_components/history-calendar.tsx
git commit -m "feat(ui): history list + calendar"
```

---

### Task 7.3: `/history` page

**Files:**
- Create: `src/app/history/page.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/app/history/page.tsx
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { requireProfile } from '@/app/_lib/auth/guards'
import { getFortuneHistory } from '@/app/_actions/fortune'
import { todayKstIso } from '@/app/_lib/kst'
import { PillTab } from '@/app/_components/pill-tab'
import { HistoryList } from '@/app/_components/history-list'
import { HistoryCalendar } from '@/app/_components/history-calendar'

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  await requireProfile()
  const { view = 'calendar' } = await searchParams
  const items = await getFortuneHistory(60)

  return (
    <main className="flex min-h-dvh flex-col px-(--spacing-xl) pb-(--spacing-xxxl)">
      <header className="flex items-center gap-(--spacing-base) py-(--spacing-md)">
        <Link href="/" aria-label="뒤로" className="w-10 h-10 rounded-full flex items-center justify-center">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-[24px] leading-[1.25] font-medium text-ink-deep" style={{ fontFeatureSettings: '"ss01","ss02"' }}>
          내 운세 기록
        </h1>
      </header>

      <div className="mt-(--spacing-md)">
        <PillTab
          paramName="view"
          current={view}
          options={[
            { value: 'calendar', label: '캘린더' },
            { value: 'list',     label: '리스트' },
          ]}
        />
      </div>

      <section className="mt-(--spacing-xl)">
        {view === 'list'
          ? <HistoryList items={items} />
          : <HistoryCalendar items={items} todayIso={todayKstIso()} />}
      </section>
    </main>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/history/page.tsx
git commit -m "feat(history): page with calendar/list toggle"
```

---

### Task 7.4: `/history/[date]` detail page

**Files:**
- Create: `src/app/history/[date]/page.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/app/history/[date]/page.tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { requireProfile } from '@/app/_lib/auth/guards'
import { getFortuneByDate } from '@/app/_actions/fortune'
import { FortuneCard } from '@/app/_components/fortune-card'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export default async function HistoryDetailPage({
  params,
}: {
  params: Promise<{ date: string }>
}) {
  await requireProfile()
  const { date } = await params
  if (!DATE_RE.test(date)) notFound()

  const data = await getFortuneByDate(date)
  if (!data) notFound()

  return (
    <main className="flex min-h-dvh flex-col px-(--spacing-xl) pb-(--spacing-xxxl)">
      <header className="flex items-center gap-(--spacing-base) py-(--spacing-md)">
        <Link href="/history" aria-label="뒤로" className="w-10 h-10 rounded-full flex items-center justify-center">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-[18px] leading-[1.44] font-bold text-ink-deep">{date}</h1>
      </header>
      <FortuneCard mbti={data.mbti} payload={data.payload} />
      <div className="mt-(--spacing-xxl) text-center">
        <Link href="/" className="text-[16px] leading-[1.5] font-bold text-ink-deep underline-offset-4 hover:underline">
          오늘의 운세 보기
        </Link>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/history
git commit -m "feat(history): detail page reuses fortune card"
```

---

## Phase 8: Settings

### Task 8.1: `signOut` server action

**Files:**
- Create: `src/app/_actions/auth.ts`

- [ ] **Step 1: Implement**

```ts
// src/app/_actions/auth.ts
'use server'
import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/app/_lib/supabase/server'

export async function signOut() {
  const supabase = await createServerSupabase()
  await supabase.auth.signOut()
  redirect('/login')
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/_actions/auth.ts
git commit -m "feat(auth): sign-out server action"
```

---

### Task 8.2: `/settings` page

**Files:**
- Create: `src/app/settings/page.tsx`
- Create: `src/app/settings/mbti-update-form.tsx`

- [ ] **Step 1: Implement page**

```tsx
// src/app/settings/page.tsx
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { requireProfile } from '@/app/_lib/auth/guards'
import { signOut } from '@/app/_actions/auth'
import { MbtiUpdateForm } from './mbti-update-form'
import { MBTI_NICKNAMES, type Mbti } from '@/app/_lib/mbti'

export default async function SettingsPage() {
  const { profile, user } = await requireProfile()
  const mbti = profile.mbti as Mbti

  return (
    <main className="flex min-h-dvh flex-col px-(--spacing-xl) pb-(--spacing-xxxl)">
      <header className="flex items-center gap-(--spacing-base) py-(--spacing-md)">
        <Link href="/" aria-label="뒤로" className="w-10 h-10 rounded-full flex items-center justify-center">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-[24px] leading-[1.25] font-medium text-ink-deep" style={{ fontFeatureSettings: '"ss01","ss02"' }}>설정</h1>
      </header>

      <section className="mt-(--spacing-xl) flex items-center gap-(--spacing-md)">
        {profile.avatar_url && (
          <img src={profile.avatar_url} alt="" className="w-10 h-10 rounded-full" />
        )}
        <div>
          <p className="text-[18px] leading-[1.44] font-bold text-ink-deep">{profile.display_name ?? '이름 없음'}</p>
          <p className="text-[14px] leading-[1.43] text-steel">{user.email}</p>
        </div>
      </section>

      <section className="mt-(--spacing-xxl)">
        <h2 className="text-[14px] leading-[1.43] font-bold text-ink">내 MBTI</h2>
        <p className="mt-(--spacing-xs) text-[14px] leading-[1.43] text-steel">
          오늘 운세는 변경 전 MBTI 기준으로 유지돼요. 새 MBTI는 내일부터 반영됩니다.
        </p>
        <p className="mt-(--spacing-base) text-[16px] leading-[1.5] text-ink">
          현재: <span className="font-bold">{mbti}</span> ({MBTI_NICKNAMES[mbti]})
        </p>
        <div className="mt-(--spacing-base)">
          <MbtiUpdateForm initial={mbti} />
        </div>
      </section>

      <form action={signOut} className="mt-auto pt-(--spacing-xxl)">
        <button
          type="submit"
          className="w-full rounded-full border-2 border-critical text-critical px-[28px] py-[12px] text-[14px] font-bold tracking-[-0.14px]"
        >
          로그아웃
        </button>
      </form>
    </main>
  )
}
```

- [ ] **Step 2: Implement MBTI update form**

```tsx
// src/app/settings/mbti-update-form.tsx
'use client'
import { useState } from 'react'
import type { Mbti } from '@/app/_lib/mbti'
import { MbtiGrid } from '@/app/_components/mbti-grid'
import { updateMbti } from '@/app/_actions/profile'

export function MbtiUpdateForm({ initial }: { initial: Mbti }) {
  const [value, setValue] = useState<Mbti>(initial)
  return (
    <form action={updateMbti}>
      <MbtiGrid name="mbti" initialValue={initial} onChange={setValue} />
      <button
        type="submit"
        disabled={value === initial}
        className="mt-(--spacing-base) w-full rounded-full bg-ink-button text-on-ink-button px-[30px] py-[14px] text-[14px] font-bold tracking-[-0.14px] disabled:bg-stone disabled:text-canvas"
      >
        변경 저장
      </button>
    </form>
  )
}
```

- [ ] **Step 3: Smoke test**

Open `/settings` → confirm avatar/name/email render. Change MBTI → form submits → redirected back to `/settings` with new value. Sign out works.

- [ ] **Step 4: Commit**

```bash
git add src/app/settings
git commit -m "feat(settings): profile, mbti update, sign out"
```

---

## Phase 9: Error & not-found boundaries

### Task 9.1: Root `error.tsx` and `not-found.tsx`

**Files:**
- Create: `src/app/error.tsx`
- Create: `src/app/not-found.tsx`

- [ ] **Step 1: Implement error boundary**

```tsx
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
```

- [ ] **Step 2: Implement not-found**

```tsx
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
```

- [ ] **Step 3: Commit**

```bash
git add src/app/error.tsx src/app/not-found.tsx
git commit -m "feat(ux): error and not-found boundaries"
```

---

## Phase 10: End-to-end smoke (manual checklist)

### Task 10.1: End-to-end manual run-through

- [ ] **Step 1: Start dev server with all envs set**

```bash
cp .env.local.example .env.local
# fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# OPENROUTER_API_KEY at minimum
npm run dev
```

- [ ] **Step 2: Run scenarios**

In a 375-wide mobile viewport (Chrome devtools), verify each:

1. `/` while signed-out → redirects to `/login`.
2. Sign in with Google → redirected to `/onboarding/mbti` (no profile yet).
3. Pick MBTI → submit → redirected to `/`. Skeleton shows briefly. Card appears with headline + advice + lucky trio.
4. Refresh `/` → identical card (DB cached).
5. Tap history icon → `/history` (calendar default). Today's day has a colored dot.
6. Switch to list view via pill tab → list row appears.
7. Tap a list row → `/history/<date>` detail. Same fortune visible.
8. Tap settings → profile loads, MBTI listed. Change MBTI → redirected back. Today's fortune (`/`) is unchanged. (New MBTI takes effect tomorrow.)
9. Sign out → redirected to `/login`.

- [ ] **Step 3: Force fallback path**

Temporarily set `OPENROUTER_API_KEY=invalid`. Sign in as a fresh test user (or use a Supabase branch reset). Onboarding → `/`. Confirm the "다시 불러오는 중이에요" notice appears and the fortune body is the per-MBTI fallback. Confirm no `fortunes` row was inserted (use Supabase MCP `execute_sql` with `select count(*) from fortunes where user_id = '<id>' and fortune_date = current_date at time zone 'Asia/Seoul'`).

- [ ] **Step 4: Document smoke results**

Append a short summary (date, scenarios passed/failed, any follow-ups) to `docs/superpowers/sign-offs/2026-05-02-smoke.md` and commit.

---

## Self-review checklist (run before declaring complete)

- [ ] All 6 mobile screens implemented and visually match the approved Pencil mockups.
- [ ] `getOrCreateTodayFortune` returns `db` source on second call same day (no extra OpenRouter usage).
- [ ] Fallback path does not insert into `fortunes`.
- [ ] `mbti_at_generation` is preserved when user changes MBTI mid-day.
- [ ] All RLS policies are in place (`get_advisors` clean).
- [ ] No `OPENROUTER_API_KEY` reference in any file under `src/app/_components` or any client component.
- [ ] `npm test` passes.
- [ ] `npx tsc --noEmit` clean.
- [ ] `npm run build` succeeds.

---

## Out of scope (deferred to future plans)

- Notifications/reminders.
- MBTI quiz on-site.
- Trend / stats dashboard.
- Internationalization.
- Sentry / APM.
- Playwright E2E (manual smoke serves the MVP).
- Curated lucky-color palette (current: model-generated hex; revisit if quality drifts).
