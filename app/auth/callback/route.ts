import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function safeRedirectPath(value: string | null) {
  return value?.startsWith('/') && !value.startsWith('//') ? value : '/dashboard'
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
