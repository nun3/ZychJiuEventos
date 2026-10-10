/** Mirrors public.event_status — kept local so unit tests do not need path aliases. */
export type PublicEventStatus =
  | 'rascunho'
  | 'publicado'
  | 'inscricao'
  | 'pagamento'
  | 'checagem'
  | 'chaves'
  | 'em_andamento'
  | 'concluido'
  | 'cancelado'

/** Mirrors public.event_phase_type */
export type PublicPhaseType = 'inscricao' | 'pagamento' | 'checagem' | 'chaves'

export type PublicPrimaryAction = 'inscricao' | 'checagem' | 'chaves' | 'informacoes' | 'none'

export type PublicPhaseTimelineState = 'concluida' | 'atual' | 'futura'

export type PublicBadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'error'

export type PublicPhaseTimelinePresentation = {
  state: PublicPhaseTimelineState
  label: string
  tone: 'success' | 'neutral'
}

type PublicStatusPresentation = {
  eventLabel: string
  eventBadgeVariant: PublicBadgeVariant
  registrationLabel: string
  registrationBadgeVariant: PublicBadgeVariant
  registrationHint: string
  prioritizeOperationalLinks: boolean
  showCheckingLink: boolean
  showRegistrationCta: boolean
}

const PHASE_ORDER: PublicPhaseType[] = ['inscricao', 'pagamento', 'checagem', 'chaves']

const statusPresentation: Record<PublicEventStatus, PublicStatusPresentation> = {
  rascunho: {
    eventLabel: 'Rascunho',
    eventBadgeVariant: 'neutral',
    registrationLabel: 'Inscrição indisponível',
    registrationBadgeVariant: 'neutral',
    registrationHint: 'Este evento ainda não está publicado.',
    prioritizeOperationalLinks: false,
    showCheckingLink: false,
    showRegistrationCta: false,
  },
  publicado: {
    eventLabel: 'Campeonato publicado',
    eventBadgeVariant: 'info',
    registrationLabel: 'Inscrições em breve',
    registrationBadgeVariant: 'info',
    registrationHint: 'Inscrições ainda não abertas. Acompanhe os prazos e fases do campeonato.',
    prioritizeOperationalLinks: false,
    showCheckingLink: false,
    showRegistrationCta: false,
  },
  inscricao: {
    eventLabel: 'Inscrições abertas',
    eventBadgeVariant: 'success',
    registrationLabel: 'Inscrições abertas',
    registrationBadgeVariant: 'success',
    registrationHint: 'Faça a inscrição dos atletas enquanto a fase estiver aberta.',
    prioritizeOperationalLinks: false,
    showCheckingLink: false,
    showRegistrationCta: true,
  },
  pagamento: {
    eventLabel: 'Fase de pagamento',
    eventBadgeVariant: 'warning',
    registrationLabel: 'Inscrições encerradas',
    registrationBadgeVariant: 'warning',
    registrationHint: 'Inscrições encerradas. Pendências financeiras seguem o fluxo da organização.',
    prioritizeOperationalLinks: false,
    showCheckingLink: false,
    showRegistrationCta: false,
  },
  checagem: {
    eventLabel: 'Checagem liberada',
    eventBadgeVariant: 'info',
    registrationLabel: 'Inscrições encerradas',
    registrationBadgeVariant: 'warning',
    registrationHint: 'Inscrições encerradas. Consulte a checagem pública.',
    prioritizeOperationalLinks: true,
    showCheckingLink: true,
    showRegistrationCta: false,
  },
  chaves: {
    eventLabel: 'Chaves publicadas',
    eventBadgeVariant: 'info',
    registrationLabel: 'Inscrições encerradas',
    registrationBadgeVariant: 'warning',
    registrationHint: 'Inscrições encerradas. Consulte chaves e programação oficiais.',
    prioritizeOperationalLinks: true,
    showCheckingLink: true,
    showRegistrationCta: false,
  },
  em_andamento: {
    eventLabel: 'Evento em andamento',
    eventBadgeVariant: 'success',
    registrationLabel: 'Inscrições encerradas',
    registrationBadgeVariant: 'warning',
    registrationHint: 'Inscrições encerradas. Acompanhe programação e chaves.',
    prioritizeOperationalLinks: true,
    showCheckingLink: true,
    showRegistrationCta: false,
  },
  concluido: {
    eventLabel: 'Evento finalizado',
    eventBadgeVariant: 'neutral',
    registrationLabel: 'Inscrições encerradas',
    registrationBadgeVariant: 'neutral',
    registrationHint: 'Campeonato encerrado. Consulte o histórico em chaves e programação.',
    prioritizeOperationalLinks: true,
    showCheckingLink: true,
    showRegistrationCta: false,
  },
  cancelado: {
    eventLabel: 'Cancelado',
    eventBadgeVariant: 'error',
    registrationLabel: 'Cancelado',
    registrationBadgeVariant: 'error',
    registrationHint: 'Este evento foi cancelado.',
    prioritizeOperationalLinks: false,
    showCheckingLink: false,
    showRegistrationCta: false,
  },
}

const phaseLabels: Record<PublicPhaseType, string> = {
  inscricao: 'Inscrição',
  pagamento: 'Pagamento',
  checagem: 'Checagem',
  chaves: 'Chaves',
}

/** Operational phase currently reflected by event.status — source of truth for timeline. */
export function resolveCurrentPhase(status: PublicEventStatus): PublicPhaseType | null {
  switch (status) {
    case 'inscricao':
    case 'pagamento':
    case 'checagem':
    case 'chaves':
      return status
    default:
      return null
  }
}

export function resolvePrimaryAction(status: PublicEventStatus): PublicPrimaryAction {
  if (status === 'inscricao') return 'inscricao'
  if (status === 'checagem') return 'checagem'
  if (status === 'chaves' || status === 'em_andamento' || status === 'concluido') return 'chaves'
  if (status === 'pagamento') return 'chaves'
  if (status === 'publicado') return 'informacoes'
  return 'none'
}

/**
 * Timeline labels follow event.status, not calendar windows alone.
 * Calendar windows remain for date display only.
 */
export function resolvePhaseTimelineStatus(
  phaseTipo: PublicPhaseType,
  eventStatus: PublicEventStatus,
): PublicPhaseTimelinePresentation {
  if (eventStatus === 'cancelado') {
    return { state: 'concluida', label: 'Encerrada', tone: 'neutral' }
  }

  if (eventStatus === 'rascunho' || eventStatus === 'publicado') {
    return { state: 'futura', label: 'Futura', tone: 'neutral' }
  }

  if (eventStatus === 'em_andamento' || eventStatus === 'concluido') {
    return { state: 'concluida', label: 'Concluída', tone: 'neutral' }
  }

  const current = resolveCurrentPhase(eventStatus)
  if (!current) {
    return { state: 'futura', label: 'Futura', tone: 'neutral' }
  }

  const phaseRank = PHASE_ORDER.indexOf(phaseTipo)
  const currentRank = PHASE_ORDER.indexOf(current)
  if (phaseRank < 0 || currentRank < 0) {
    return { state: 'futura', label: 'Futura', tone: 'neutral' }
  }
  if (phaseRank < currentRank) {
    return { state: 'concluida', label: 'Concluída', tone: 'neutral' }
  }
  if (phaseRank === currentRank) {
    return { state: 'atual', label: 'Em andamento', tone: 'success' }
  }
  return { state: 'futura', label: 'Futura', tone: 'neutral' }
}

/**
 * Visão geral usa somente `event.informacoes` publicado pelo organizador.
 * Origem do conteúdo = fonte de verdade; não filtrar por palavras genéricas
 * (ex.: Sandbox) que podem existir em texto público legítimo.
 * Bloqueia apenas notas de curadoria/admin claramente internas.
 */
export function resolvePublicOverviewText(informacoes: string | null | undefined): string | null {
  const text = informacoes?.trim()
  if (!text) return null

  const internalCurationNotes = [
    /banner oficial para o carrossel editorial da home/i,
    /publicado com banner oficial para o carrossel/i,
    /destaques?\s+da\s+home/i,
    /\bmc-sim\b[\s\S]{0,80}\bnão alterar\b/i,
  ]

  if (internalCurationNotes.some((pattern) => pattern.test(text))) return null
  return text
}

export type PublicEventPhaseInput = {
  id: string
  tipo: PublicPhaseType
  inicio: string
  fim: string
}

export type PublicEventPresentation = {
  eventStatus: {
    label: string
    badgeVariant: PublicBadgeVariant
  }
  registrationStatus: {
    label: string
    badgeVariant: PublicBadgeVariant
    hint: string
  }
  currentPhase: PublicPhaseType | null
  primaryAction: PublicPrimaryAction
  showRegistrationCta: boolean
  showCheckingLink: boolean
  prioritizeOperationalLinks: boolean
  overviewText: string | null
  phases: Array<
    PublicEventPhaseInput & {
      timeline: PublicPhaseTimelinePresentation
    }
  >
}

export function getPublicEventPresentation(input: {
  status: PublicEventStatus
  phases?: PublicEventPhaseInput[] | null
  informacoes?: string | null
}): PublicEventPresentation {
  const base = statusPresentation[input.status]
  return {
    eventStatus: {
      label: base.eventLabel,
      badgeVariant: base.eventBadgeVariant,
    },
    registrationStatus: {
      label: base.registrationLabel,
      badgeVariant: base.registrationBadgeVariant,
      hint: base.registrationHint,
    },
    currentPhase: resolveCurrentPhase(input.status),
    primaryAction: resolvePrimaryAction(input.status),
    showRegistrationCta: base.showRegistrationCta,
    showCheckingLink: base.showCheckingLink,
    prioritizeOperationalLinks: base.prioritizeOperationalLinks,
    overviewText: resolvePublicOverviewText(input.informacoes),
    phases: (input.phases ?? []).map((phase) => ({
      ...phase,
      timeline: resolvePhaseTimelineStatus(phase.tipo, input.status),
    })),
  }
}

/** @deprecated Prefer getPublicEventPresentation — kept for nav/helpers that only need status flags. */
export function getPublicEventStatus(status: PublicEventStatus): PublicStatusPresentation {
  return statusPresentation[status]
}

export function getPublicPhaseLabel(tipo: PublicPhaseType) {
  return phaseLabels[tipo]
}

export type PublicEventNavItem = {
  id: string
  label: string
  href: string
  current?: boolean
}

export function getPublicEventNavItems(params: {
  eventId: string
  status: PublicEventStatus
  current: 'informacoes' | 'checagem' | 'chaves' | 'programacao'
}): PublicEventNavItem[] {
  const presentation = getPublicEventStatus(params.status)
  const base = `/eventos/${params.eventId}`
  const items: PublicEventNavItem[] = [
    { id: 'informacoes', label: 'Informações', href: base, current: params.current === 'informacoes' },
  ]
  if (presentation.showCheckingLink) {
    items.push({
      id: 'checagem',
      label: 'Checagem',
      href: `${base}/checagem`,
      current: params.current === 'checagem',
    })
  }
  items.push(
    { id: 'chaves', label: 'Chaves', href: `${base}/chaves`, current: params.current === 'chaves' },
    { id: 'programacao', label: 'Programação', href: `${base}/programacao`, current: params.current === 'programacao' },
  )
  return items
}

export type PublicEventSectionId =
  | 'visao-geral'
  | 'cronograma'
  | 'categorias'
  | 'documentos'
  | 'local'

export type PublicEventSection = {
  id: PublicEventSectionId
  label: string
}

export function buildPublicEventSections(flags: {
  hasOverview: boolean
  hasPhases: boolean
  hasCategories: boolean
  hasDocuments: boolean
  hasLocation: boolean
}): PublicEventSection[] {
  const sections: PublicEventSection[] = []
  if (flags.hasOverview) sections.push({ id: 'visao-geral', label: 'Visão geral' })
  if (flags.hasPhases) sections.push({ id: 'cronograma', label: 'Prazos e fases' })
  if (flags.hasCategories) sections.push({ id: 'categorias', label: 'Categorias' })
  if (flags.hasDocuments) sections.push({ id: 'documentos', label: 'Regulamento e documentos' })
  if (flags.hasLocation) sections.push({ id: 'local', label: 'Local' })
  return sections
}

export function formatPublicEventDate(dataEvento: string, timeZone = 'UTC') {
  const date = new Date(`${dataEvento}T12:00:00Z`)
  return {
    long: new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date),
    weekday: new Intl.DateTimeFormat('pt-BR', { weekday: 'long', timeZone: 'UTC' }).format(date),
    // data_evento is date-only; do not invent a clock time
    dateOnlyLabel: new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(date),
    timeZone,
  }
}

export function formatPhaseWindow(inicio: string, fim: string, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone,
  })
  return `${formatter.format(new Date(inicio))} até ${formatter.format(new Date(fim))}`
}
