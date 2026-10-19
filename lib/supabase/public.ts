import 'server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getSupabaseConfig } from './config'
import type { Database } from './database.types'

/** Cliente sem cookies para leituras já expostas publicamente via RLS. */
export function createPublicClient() {
  const { url, publishableKey } = getSupabaseConfig()
  return createSupabaseClient<Database>(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })
}
