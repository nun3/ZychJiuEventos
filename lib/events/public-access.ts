import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import { allowsPublicOrganization, getPublicOrganizationScope } from './public-organization'

export const publicEventStatuses = ['publicado', 'inscricao', 'pagamento', 'checagem', 'chaves', 'em_andamento', 'concluido'] as const
type EventStatus = Database['public']['Enums']['event_status']

const publicEventColumns = 'id, organization_id, nome, status, data_evento, local, timezone, informacoes, valor_inscricao, imagem_cartaz_url, regulamento_url, tabela_peso_url' as const

export async function findPublicReleaseEvent(eventId: string, statuses: readonly EventStatus[] | null = [...publicEventStatuses]) {
  const scope = getPublicOrganizationScope()
  if (scope.mode === 'blocked') return null

  let query = createClient()
    .from('events')
    .select(publicEventColumns)
    .eq('id', eventId)
  if (statuses) query = query.in('status', statuses)

  if (scope.mode === 'restricted') query = query.eq('organization_id', scope.organizationId)

  const { data } = await query.maybeSingle()
  if (!data || !allowsPublicOrganization(data.organization_id)) return null
  return data
}
