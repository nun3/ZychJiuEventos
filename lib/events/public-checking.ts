import 'server-only'

import { unstable_noStore as noStore } from 'next/cache'
import type { Json } from '@/lib/supabase/database.types'
import { createClient } from '@/lib/supabase/server'

export type PublicCheckingAthlete = {
  name: string
  team: string | null
  professor: string | null
  category: string
  alone: boolean
}

export type PublicCheckingResult = {
  athletes: PublicCheckingAthlete[]
  error: boolean
}

function record(value: Json | undefined): Record<string, Json | undefined> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, Json | undefined>
    : null
}

function text(value: Json | undefined) {
  return typeof value === 'string' && value.trim() ? value : null
}

function parseAthlete(value: Json): PublicCheckingAthlete | null {
  const source = record(value)
  const name = text(source?.name)
  const category = text(source?.category)
  if (!source || !name || !category) return null
  return {
    name,
    team: text(source.team),
    professor: text(source.professor),
    category,
    alone: source.alone === true,
  }
}

export async function getPublicEventChecking(eventId: string): Promise<PublicCheckingResult> {
  noStore()
  const { data, error } = await createClient().rpc('get_public_event_checking', { target_event_id: eventId })
  const payload = record(data)
  if (error || !payload || payload.kind !== 'public_checking' || !Array.isArray(payload.athletes)) {
    return { athletes: [], error: true }
  }
  return {
    athletes: payload.athletes.map(parseAthlete).filter((athlete): athlete is PublicCheckingAthlete => Boolean(athlete)),
    error: false,
  }
}
