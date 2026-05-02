import Link from 'next/link'
import { ChevronLeft, ChevronRight, Bell, FileText, LogOut } from 'lucide-react'
import { requireProfile } from '@/app/_lib/auth/guards'
import { signOut } from '@/app/_actions/auth'
import { MBTI_NICKNAMES, type Mbti } from '@/app/_lib/mbti'

export default async function SettingsPage() {
  const { profile, user } = await requireProfile()
  const mbti = profile.mbti as Mbti

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden bg-canvas px-6 pb-10 pt-5">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 h-[280px] w-[280px] rounded-full opacity-55 blur-[50px]"
        style={{ background: '#FBEDE2' }}
      />
      <div className="relative flex flex-col gap-6">
        <Link
          href="/"
          aria-label="뒤로"
          className="flex h-10 w-10 items-center justify-center rounded-full text-ink"
        >
          <ChevronLeft size={20} />
        </Link>
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] leading-[1.33] font-bold tracking-[2.5px] text-steel">PROFILE & SETTINGS</p>
          <h1
            className="text-[34px] leading-[1.16] font-medium tracking-[-0.8px] text-ink-deep"
            style={{ fontFeatureSettings: '"ss01","ss02"' }}
          >
            내 정보
          </h1>
        </div>

        <section className="flex items-center gap-3.5 rounded-[20px] bg-surface-soft p-3">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="h-14 w-14 rounded-full"
              style={{ boxShadow: '0 0 0 4px #FFFFFF' }}
            />
          ) : (
            <span
              className="block h-14 w-14 rounded-full"
              style={{ background: '#D6E8DD', boxShadow: '0 0 0 4px #FFFFFF' }}
              aria-hidden
            />
          )}
          <div className="flex flex-col gap-0.5">
            <p className="text-[18px] leading-[1.21] font-bold tracking-[-0.3px] text-ink-deep">
              {profile.display_name ?? '이름 없음'}
            </p>
            <p className="text-[12px] leading-[1.4] text-steel">{user.email}</p>
          </div>
        </section>

        <section
          className="flex flex-col gap-3.5 rounded-[28px] p-5"
          style={{
            background:
              'linear-gradient(135deg, #FBE5DD 0%, #EAF1F9 100%), #FBF4ED',
            backgroundBlendMode: 'multiply',
          }}
        >
          <p className="text-[11px] leading-[1.33] font-bold tracking-[2px] text-charcoal">내 MBTI</p>
          <div className="flex items-end justify-between">
            <div className="flex flex-col">
              <span
                className="text-[48px] leading-[1] font-medium tracking-[-1.5px] text-ink-deep"
                style={{ fontFeatureSettings: '"ss01","ss02"' }}
              >
                {mbti}
              </span>
              <span className="text-[14px] leading-[1.43] font-light text-charcoal">
                {MBTI_NICKNAMES[mbti]}
              </span>
            </div>
            <Link
              href="/settings/edit"
              className="inline-flex items-center gap-1.5 rounded-full bg-canvas px-4 py-2.5 text-[12px] font-bold text-ink-deep"
            >
              변경
              <ChevronRight size={14} />
            </Link>
          </div>
          <p className="text-[11px] leading-[1.4] text-steel">
            오늘 운세는 변경 전 MBTI 기준으로 유지돼요.
          </p>
        </section>

        <section className="flex flex-col">
          <Link
            href="/settings/notifications"
            className="flex items-center justify-between border-b border-hairline-soft py-[18px]"
          >
            <span className="flex items-center gap-3">
              <Bell size={18} className="text-ink" />
              <span className="text-[14px] leading-[1.43] text-ink">알림</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-[12px] text-steel">매일 오전 8시</span>
              <ChevronRight size={14} className="text-steel" />
            </span>
          </Link>
          <Link
            href="/legal"
            className="flex items-center justify-between border-b border-hairline-soft py-[18px]"
          >
            <span className="flex items-center gap-3">
              <FileText size={18} className="text-ink" />
              <span className="text-[14px] leading-[1.43] text-ink">이용약관 · 개인정보처리방침</span>
            </span>
            <ChevronRight size={14} className="text-steel" />
          </Link>
          <form action={signOut} className="flex">
            <button
              type="submit"
              className="flex w-full items-center gap-3 py-[18px] text-left"
            >
              <LogOut size={18} className="text-critical-strong" />
              <span className="text-[14px] leading-[1.43] font-bold text-critical-strong">로그아웃</span>
            </button>
          </form>
        </section>

        <p className="mt-auto pt-6 text-center text-[10px] leading-[1.33] font-bold tracking-[1.5px] text-stone">
          momentum · v0.1.0
        </p>
      </div>
    </main>
  )
}
