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
