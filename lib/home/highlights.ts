import 'server-only'

import type { Event } from '@/components/ModernEventGrid'
import { createClient } from '@/lib/supabase/server'

type HighlightRule = { event_id: string; position: number; pinned: boolean; active: boolean }

const statusPriority: Record<string, number> = {
  em_andamento: 0,
  inscricao: 1,
  publicado: 2,
  pagamento: 3,
  checagem: 4,
  chaves: 5,
  concluido: 6,
}

export async function getHomeHighlights(events: Event[], limit = 5): Promise<Event[]> {
  const eligible = events.filter((event) => Boolean(event.image))
  if (!eligible.length) return []

  const { data, error } = await createClient().rpc('get_home_event_highlight_rules')
  if (error) return automaticHighlights(eligible, limit)

  const rules = (data || []) as HighlightRule[]
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
