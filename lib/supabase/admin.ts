import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

/** Only for internal operations; callers must independently authorize the actor/resource. */
export function createPrivilegedClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY
  if (!url || !key?.startsWith('sb_secret_')) throw new Error('Credencial privada Supabase não configurada.')
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
