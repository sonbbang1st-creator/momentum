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
