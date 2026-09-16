import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseConfig } from './config'
import type { Database } from './database.types'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  const { url, publishableKey } = getSupabaseConfig()

  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value))
      },
    },
  })

  const { data, error } = await supabase.auth.getUser()
  const user = error ? null : data.user
  const pathname = request.nextUrl.pathname
  const isAdminLogin = pathname === '/admin/autenticacao'
  const isProtected = pathname.startsWith('/dashboard') ||
    (pathname.startsWith('/admin') && !isAdminLogin)

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = pathname.startsWith('/admin') ? '/admin/autenticacao' : '/login'
    loginUrl.searchParams.set('redirectTo', `${pathname}${request.nextUrl.search}`)
    return NextResponse.redirect(loginUrl)
  }

  if (user && pathname.startsWith('/admin') && !isAdminLogin) {
    const [{ data: isAdmin }, { data: memberships }] = await Promise.all([
      supabase.rpc('is_platform_admin'),
      supabase.from('organization_members').select('organization_id').limit(1),
    ])

    if (!isAdmin && (!memberships || memberships.length === 0)) {
      const dashboardUrl = request.nextUrl.clone()
      dashboardUrl.pathname = '/dashboard'
      dashboardUrl.searchParams.set('erro', 'sem_permissao')
      return NextResponse.redirect(dashboardUrl)
    }
  }

  return response
}
