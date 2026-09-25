import { createClient } from '@/lib/supabase/server'

export async function requirePlatformAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'unauthenticated' as const, supabase, user: null }
  const { data: isAdmin } = await supabase.rpc('is_platform_admin')
  if (!isAdmin) return { status: 'forbidden' as const, supabase, user }
  return { status: 'ok' as const, supabase, user }
}
