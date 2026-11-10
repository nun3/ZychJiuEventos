type CatalogEvent = {
  id: string
  status?: string
  dateObj?: string
  daysLeft: number
}

const STATUS_LABELS: Record<string, string> = {
  publicado: 'Em breve',
  inscricao: 'Inscrições abertas',
  pagamento: 'Inscrições encerradas',
  checagem: 'Checagem liberada',
  chaves: 'Chaves publicadas',
  em_andamento: 'Em andamento',
  concluido: 'Encerrado',
  cancelado: 'Cancelado',
}

const BRACKET_STATUSES = new Set(['pagamento', 'checagem', 'chaves', 'em_andamento', 'concluido'])

export type CatalogAction = { href: string; label: string }

export function isPreviewCatalogEvent(event: Pick<CatalogEvent, 'id'>) {
  return event.id.startsWith('preview-')
}

export function catalogStatusLabel(status?: string) {
  if (!status) return 'Campeonato'
  return STATUS_LABELS[status] || 'Campeonato'
}

export function isPastCatalogEvent(dateObj: string | undefined, now = new Date()) {
  if (!dateObj) return false
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  return new Date(`${dateObj}T12:00:00Z`).getTime() < today.getTime()
}

export function eventDateParts(dateObj?: string) {
  if (!dateObj) return null
  const date = new Date(`${dateObj}T12:00:00Z`)
  const day = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', timeZone: 'UTC' }).format(date)
  const month = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' }).format(date).replace('.', '').toUpperCase()
  const year = new Intl.DateTimeFormat('pt-BR', { year: 'numeric', timeZone: 'UTC' }).format(date)
  const long = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
  return {
    day,
    month,
    year,
    long: long.charAt(0).toUpperCase() + long.slice(1),
  }
}

export function countdownLabel(event: Pick<CatalogEvent, 'dateObj' | 'daysLeft'>, now = new Date()) {
  if (isPastCatalogEvent(event.dateObj, now)) return 'Encerrado'
  if (event.daysLeft <= 0) return 'Hoje'
  return `Faltam ${event.daysLeft} ${event.daysLeft === 1 ? 'dia' : 'dias'}`
}

export function featuredActions(event: CatalogEvent): [CatalogAction, CatalogAction] {
  if (isPreviewCatalogEvent(event)) {
    return [
      { href: '#experimentar-demo', label: 'Inscrever-se agora' },
      { href: `/eventos/${event.id}`, label: 'Ver campeonato' },
    ]
  }
  if (event.status === 'inscricao') {
    return [
      { href: `/eventos/${event.id}/inscricao/cadastrar-atleta`, label: 'Inscrever-se agora' },
      { href: `/eventos/${event.id}`, label: 'Ver campeonato' },
    ]
  }
  return [
    { href: `/eventos/${event.id}`, label: 'Ver campeonato' },
    { href: '#experimentar-demo', label: 'Experimentar sem cadastro' },
  ]
}

export function rowActions(event: CatalogEvent): [CatalogAction, CatalogAction] {
  if (isPreviewCatalogEvent(event)) {
    return [
      { href: '#experimentar-demo', label: 'Inscrever-se' },
      { href: `/eventos/${event.id}`, label: 'Detalhes' },
    ]
  }
  const details: CatalogAction = { href: `/eventos/${event.id}`, label: 'Detalhes' }
  if (event.status === 'inscricao') {
    return [
      { href: `/eventos/${event.id}/inscricao/cadastrar-atleta`, label: 'Inscrever-se' },
      details,
    ]
  }
  if (event.status && BRACKET_STATUSES.has(event.status)) {
    return [
      { href: `/eventos/${event.id}/chaves`, label: 'Chaves' },
      details,
    ]
  }
  return [
    { href: `/eventos/${event.id}`, label: 'Ver campeonato' },
    { href: '#experimentar-demo', label: 'Experimentar sem cadastro' },
  ]
}

/** Agrupamento por estágio, para os filtros rápidos do calendário. */
export type StatusGroup = 'abertas' | 'breve' | 'andamento'

export const STATUS_GROUP_LABELS: Record<StatusGroup, string> = {
  abertas: 'Inscrições abertas',
  breve: 'Em breve',
  andamento: 'Em andamento',
}

export function statusGroup(status?: string): StatusGroup | null {
  if (status === 'inscricao') return 'abertas'
  if (status === 'publicado') return 'breve'
  if (status && BRACKET_STATUSES.has(status) && status !== 'concluido') return 'andamento'
  return null
}

/** Tom do selo de status: sempre cor + texto (nunca só cor). */
export function statusTone(status?: string): 'open' | 'soon' | 'live' | 'done' {
  const group = statusGroup(status)
  if (group === 'abertas') return 'open'
  if (group === 'andamento') return 'live'
  if (status === 'concluido' || status === 'cancelado') return 'done'
  return 'soon'
}

/** CTA primário é sempre "Ver evento"; a ação contextual só existe quando o status a sustenta. */
export function cardActions(event: CatalogEvent): { details: CatalogAction; contextual: CatalogAction | null } {
  const details: CatalogAction = { href: `/eventos/${event.id}`, label: 'Ver evento' }
  if (isPreviewCatalogEvent(event)) return { details, contextual: { href: '#experimentar-demo', label: 'Inscrever-se' } }
  if (event.status === 'inscricao') return { details, contextual: { href: `/eventos/${event.id}/inscricao/cadastrar-atleta`, label: 'Inscrever-se' } }
  if (event.status && BRACKET_STATUSES.has(event.status)) return { details, contextual: { href: `/eventos/${event.id}/chaves`, label: 'Chaves' } }
  return { details, contextual: null }
}
