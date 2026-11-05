const AUTH_ENTRY_PATHS = ['/login', '/admin/autenticacao'] as const

export function isSafePostLoginPath(value: string): boolean {
  if (!value.startsWith('/') || value.startsWith('//')) return false
  return !AUTH_ENTRY_PATHS.some(
    (entry) => value === entry || value.startsWith(`${entry}?`) || value.startsWith(`${entry}/`),
  )
}

export function resolvePostLoginRedirect(
  rawRedirectTo: string | null | undefined,
  fallback: '/dashboard' | '/admin/eventos' = '/dashboard',
): string {
  const candidate = typeof rawRedirectTo === 'string' ? rawRedirectTo.trim() : ''
  return isSafePostLoginPath(candidate) ? candidate : fallback
}

export function resolveAdminPostLoginRedirect(rawRedirectTo: string | null | undefined): string {
  return resolvePostLoginRedirect(rawRedirectTo, '/admin/eventos')
}
