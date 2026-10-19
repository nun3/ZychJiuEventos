import 'server-only'

import { unstable_cache } from 'next/cache'
import type { Event } from '@/components/ModernEventGrid'
import { createPublicClient } from '@/lib/supabase/public'

type HighlightRule = { event_id: string; position: number; pinned: boolean; active: boolean }
export type HomeHighlightRulesResult = { rules: HighlightRule[]; available: boolean }

const statusPriority: Record<string, number> = {
  em_andamento: 0,
  inscricao: 1,
  publicado: 2,
  pagamento: 3,
  checagem: 4,
  chaves: 5,
  concluido: 6,
}

const getCachedHomeHighlightRules = unstable_cache(async (): Promise<HomeHighlightRulesResult> => {
  const { data, error } = await createPublicClient().rpc('get_home_event_highlight_rules')
  return { rules: (data || []) as HighlightRule[], available: !error }
}, ['public-home-highlight-rules'], { revalidate: 60, tags: ['public-home-events'] })

export async function getHomeHighlightRules(): Promise<HomeHighlightRulesResult> {
  return getCachedHomeHighlightRules()
}

export async function getHomeHighlights(
  events: Event[],
  limit = 5,
  rulesResult?: HomeHighlightRulesResult,
): Promise<Event[]> {
  const eligible = events.filter((event) => Boolean(event.image))
  if (!eligible.length) return []

  const loadedRules = rulesResult || await getHomeHighlightRules()
  if (!loadedRules.available) return automaticHighlights(eligible, limit)

  const rules = loadedRules.rules
  const eventById = new Map(eligible.map((event) => [event.id, event]))
  const suppressed = new Set(rules.filter((rule) => !rule.active).map((rule) => rule.event_id))
  const curated = rules
    .filter((rule) => rule.active && eventById.has(rule.event_id))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.position - b.position)
    .map((rule) => eventById.get(rule.event_id)!)
  const curatedIds = new Set(curated.map((event) => event.id))
  const automatic = automaticHighlights(eligible.filter((event) => !curatedIds.has(event.id) && !suppressed.has(event.id)), limit)

  return [...curated, ...automatic].slice(0, limit)
}

function automaticHighlights(events: Event[], limit: number) {
  return [...events]
    .sort((a, b) => {
      const priority = (statusPriority[a.status || ''] ?? 99) - (statusPriority[b.status || ''] ?? 99)
      return priority || (a.dateObj || '').localeCompare(b.dateObj || '')
    })
    .slice(0, limit)
}
