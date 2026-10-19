import 'server-only'

import { unstable_cache } from 'next/cache'
import type { Event } from '@/components/ModernEventGrid'
import { createPublicClient } from '@/lib/supabase/public'
import { getPublicOrganizationScope } from './public-organization'
import { publicEventStatuses } from './public-access'

const getCachedPublicEvents = unstable_cache(async (organizationId: string | null): Promise<Event[]> => {
  let query = createPublicClient()
    .from('events')
    .select('id, nome, data_evento, local, informacoes, imagem_cartaz_url, status, results_publicados')
    .in('status', publicEventStatuses)
    .order('data_evento', { ascending: true })
  if (organizationId) query = query.eq('organization_id', organizationId)

  const { data } = await query

  const formatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', timeZone: 'UTC' })
  const fullFormatter = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' })
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (data || []).map((event) => {
    const date = new Date(`${event.data_evento}T12:00:00Z`)

    return {
      id: event.id,
      title: event.nome,
      type: 'Campeonato Jiu-Jitsu',
      eventType: 'Campeonato',
      sport: 'Jiu-Jitsu',
      state: event.local.match(/\/([A-Z]{2})$/)?.[1] || 'Todos',
      date: formatter.format(date),
      dateFull: fullFormatter.format(date),
      dateObj: event.data_evento,
      location: event.local,
      daysLeft: Math.max(0, Math.ceil((date.getTime() - today.getTime()) / 86400000)),
      image: event.imagem_cartaz_url || undefined,
      description: event.informacoes || undefined,
      status: event.status,
      resultsPublished: event.results_publicados,
    }
  })
}, ['public-home-events'], { revalidate: 60, tags: ['public-home-events'] })

export async function getPublicEvents(): Promise<Event[]> {
  const scope = getPublicOrganizationScope()
  if (scope.mode === 'blocked') return []
  return getCachedPublicEvents(scope.mode === 'restricted' ? scope.organizationId : null)
}
