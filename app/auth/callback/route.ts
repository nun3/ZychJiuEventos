import { NextResponse, type NextRequest } from 'next/server'
import { safeInternalPath } from '@/lib/http/safe-redirect'
import { logger } from '@/lib/observability/logger'
import { createClient } from '@/lib/supabase/server'

function safeRedirectPath(value: string | null) {
  return safeInternalPath(value)
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const authErrorCode = request.nextUrl.searchParams.get('error_code')
  const redirectTo = safeRedirectPath(request.nextUrl.searchParams.get('redirectTo'))

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }
    logger.warn('auth.callback.exchange_failed', { operation: 'exchange', result: 'rejected' })
  } else {
    logger.warn('auth.callback.rejected', {
      operation: 'exchange',
      result: authErrorCode === 'otp_expired' ? 'expired' : 'invalid',
    })
  }

  if (authErrorCode === 'otp_expired') {
    const recoveryUrl = new URL('/recuperar-senha', request.url)
    recoveryUrl.searchParams.set('erro', 'link_expirado')
    return NextResponse.redirect(recoveryUrl)
  }

  const errorUrl = new URL('/login', request.url)
  errorUrl.searchParams.set('erro', 'callback_invalido')
  return NextResponse.redirect(errorUrl)
}
