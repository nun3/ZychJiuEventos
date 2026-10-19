import type { StatusBadgeProps } from '@/components/ui/StatusBadge'
import { formatPublicEventDate } from '@/lib/events/public-event-presentation'

export type AdminEventHeroData = {
  id: string
  nome: string
  data_evento: string | null
  local: string | null
  status: string
  imagem_cartaz_url: string | null
}

export const ADMIN_EVENT_STATUS_LABELS: Record<string, string> = {
  rascunho: 'Rascunho',
  publicado: 'Publicado',
  inscricao: 'Inscrições',
  pagamento: 'Pagamento',
  checagem: 'Checagem',
  chaves: 'Chaves',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

export const ADMIN_EVENT_STATUS_VARIANTS: Record<string, StatusBadgeProps['variant']> = {
  rascunho: 'warning',
  publicado: 'success',
  inscricao: 'success',
  pagamento: 'warning',
  checagem: 'info',
  chaves: 'info',
  em_andamento: 'success',
  concluido: 'neutral',
  cancelado: 'error',
}

/** Campos mínimos para o hero administrativo — reutilizar nos selects das páginas. */
export const ADMIN_EVENT_HERO_SELECT =
  'id, nome, data_evento, local, status, imagem_cartaz_url' as const

export function adminEventStatusLabel(status: string) {
  return ADMIN_EVENT_STATUS_LABELS[status] || status.replaceAll('_', ' ')
}

export function adminEventStatusVariant(status: string): StatusBadgeProps['variant'] {
  return ADMIN_EVENT_STATUS_VARIANTS[status] || 'neutral'
}

export function formatAdminEventDate(dataEvento: string | null | undefined) {
  if (!dataEvento) return null
  return formatPublicEventDate(dataEvento).long
}

export function toAdminEventHeroData(event: {
  id: string
  nome?: string | null
  name?: string | null
  data_evento?: string | null
  local?: string | null
  status: string
  imagem_cartaz_url?: string | null
}): AdminEventHeroData {
  return {
    id: event.id,
    nome: event.nome || event.name || 'Evento',
    data_evento: event.data_evento ?? null,
    local: event.local ?? null,
    status: event.status,
    imagem_cartaz_url: event.imagem_cartaz_url ?? null,
  }
}
