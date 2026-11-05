export const EVENT_GUIDANCE_STEPS = [
  'configuracao',
  'inscricoes',
  'pagamento',
  'checagem',
  'chaves',
  'programacao',
  'resultados',
  'concluido',
] as const

export type EventGuidanceStepId = (typeof EVENT_GUIDANCE_STEPS)[number]
export type EventGuidanceStatus =
  | 'rascunho'
  | 'publicado'
  | 'inscricao'
  | 'pagamento'
  | 'checagem'
  | 'chaves'
  | 'em_andamento'
  | 'concluido'
  | 'cancelado'
  | string

export type EventGuidanceStepState = 'done' | 'current' | 'upcoming' | 'blocked'
export type EventGuidanceTransition = 'inscricao' | 'pagamento' | 'checagem' | 'chaves'

export type EventGuidanceStep = {
  id: EventGuidanceStepId
  label: string
  state: EventGuidanceStepState
}

export type EventGuidanceFacts = {
  eventId: string
  status: EventGuidanceStatus
  checkingLocked: boolean
  hasCategory: boolean
  efetivadasCount: number
  pendingRequestsCount: number
  hasPublishedBracket: boolean
  schedulePublished: boolean
}

export type NextAction = {
  title: string
  facts: string[]
  message: string
  href: string | null
  cta: string | null
  /** Transição já existente. Quando preenchida, o CTA executa a action no shell. */
  transition?: EventGuidanceTransition | null
}

export const EVENT_GUIDANCE_LABELS: Record<EventGuidanceStepId, string> = {
  configuracao: 'Configuração',
  inscricoes: 'Inscrições',
  pagamento: 'Pagamento',
  checagem: 'Checagem',
  chaves: 'Chaves',
  programacao: 'Programação',
  resultados: 'Resultados',
  concluido: 'Concluído',
}

const STATUS_RANK: Record<string, number> = {
  rascunho: 0,
  publicado: 1,
  inscricao: 2,
  pagamento: 3,
  checagem: 4,
  chaves: 5,
  em_andamento: 6,
  concluido: 7,
  cancelado: -1,
}

/** Entrada única da lista: o módulo operacional da fase real, sem atalho para todos os módulos. */
export function adminEventContinuePath(eventId: string, status: string) {
  const base = `/admin/eventos/${eventId}`
  switch (status) {
    case 'rascunho':
      return `${base}/editar`
    case 'pagamento':
      return `${base}/financeiro`
    case 'checagem':
      return `${base}/checagem`
    case 'chaves':
      return `${base}/chaves`
    case 'em_andamento':
    case 'concluido':
      return `${base}/resultados`
    default:
      return `${base}/configuracao`
  }
}

export function eventStatusRank(status: EventGuidanceStatus) {
  return STATUS_RANK[status] ?? -1
}

export function currentGuidanceStep(facts: EventGuidanceFacts): EventGuidanceStepId | null {
  if (facts.status === 'cancelado') return null
  if (facts.status === 'rascunho' || facts.status === 'publicado') return 'configuracao'
  if (facts.status === 'inscricao') return 'inscricoes'
  if (facts.status === 'pagamento') return 'pagamento'
  if (facts.status === 'checagem') return 'checagem'
  if (facts.status === 'chaves') {
    if (!facts.hasPublishedBracket) return 'chaves'
    if (!facts.schedulePublished) return 'programacao'
    return 'resultados'
  }
  if (facts.status === 'em_andamento') return 'resultados'
  if (facts.status === 'concluido') return 'concluido'
  return null
}

function isStepComplete(id: EventGuidanceStepId, facts: EventGuidanceFacts) {
  const rank = eventStatusRank(facts.status)
  if (id === 'configuracao') return rank >= 1
  if (id === 'inscricoes') return rank >= 3
  if (id === 'pagamento') return rank >= 4
  if (id === 'checagem') return rank >= 5
  if (id === 'chaves') return rank >= 6 || (facts.status === 'chaves' && facts.hasPublishedBracket)
  if (id === 'programacao') return rank >= 6 || facts.schedulePublished
  if (id === 'resultados' || id === 'concluido') return facts.status === 'concluido'
  return false
}

/** Progresso visual a partir da fase real. Chaves também olha chave e programação publicadas. */
export function guidanceStepsForPhase(
  status: string,
  flags?: { hasPublishedBracket?: boolean; schedulePublished?: boolean },
): EventGuidanceStep[] {
  return buildEventGuidanceSteps({
    eventId: '',
    status,
    checkingLocked: false,
    hasCategory: false,
    efetivadasCount: 0,
    pendingRequestsCount: 0,
    hasPublishedBracket: Boolean(flags?.hasPublishedBracket),
    schedulePublished: Boolean(flags?.schedulePublished),
  })
}

export function buildEventGuidanceSteps(facts: EventGuidanceFacts): EventGuidanceStep[] {
  if (facts.status === 'cancelado') {
    return EVENT_GUIDANCE_STEPS.map((id) => ({
      id,
      label: EVENT_GUIDANCE_LABELS[id],
      state: 'blocked',
    }))
  }
  const current = currentGuidanceStep(facts)
  return EVENT_GUIDANCE_STEPS.map((id) => {
    let state: EventGuidanceStepState = 'upcoming'
    if (isStepComplete(id, facts) && id !== current) state = 'done'
    else if (id === current) state = 'current'
    return { id, label: EVENT_GUIDANCE_LABELS[id], state }
  })
}

const ADMIN_SURFACES = new Set(['configuracao', 'checagem', 'financeiro', 'chaves', 'programacao', 'resultados'])

/** Esconde CTA que só reabre o módulo já aberto. Transições de fase permanecem. */
export function contextualizeNextAction(action: NextAction, surface: string): NextAction {
  if (action.transition || !action.href || !action.cta) return action
  const segment = action.href.split('?')[0].split('/').filter(Boolean).pop()
  if (segment && ADMIN_SURFACES.has(segment) && segment === surface) {
    return { ...action, href: null, cta: null }
  }
  return action
}

export function buildNextAction(facts: EventGuidanceFacts): NextAction {
  const base = `/admin/eventos/${facts.eventId}`
  const efetivadas = `${facts.efetivadasCount} ${facts.efetivadasCount === 1 ? 'atleta efetivado' : 'atletas efetivados'}`

  if (facts.status === 'cancelado') {
    return {
      title: 'Evento cancelado',
      facts: [],
      message: 'Este evento não tem próxima ação operacional.',
      href: null,
      cta: null,
    }
  }

  if (facts.status === 'rascunho') {
    return {
      title: 'Evento em rascunho',
      facts: [],
      message: 'Publique o evento para ele entrar no calendário e na operação.',
      href: `${base}/editar`,
      cta: 'Revisar evento',
    }
  }

  if (facts.status === 'publicado' && !facts.hasCategory) {
    return {
      title: 'Categorias pendentes',
      facts: [],
      message: 'Crie a versão de categorias antes de abrir as inscrições.',
      href: `${base}/configuracao`,
      cta: 'Configurar categorias',
    }
  }

  if (facts.status === 'publicado') {
    return {
      title: 'Evento publicado',
      facts: ['Categorias prontas'],
      message: 'Abra as inscrições quando o campeonato estiver pronto para receber atletas.',
      href: null,
      cta: 'Abrir inscrições',
      transition: 'inscricao',
    }
  }

  if (facts.status === 'inscricao') {
    return {
      title: 'Inscrições abertas',
      facts: [efetivadas],
      message: 'Receba os atletas. Quando a janela terminar, abra o pagamento para confirmar as inscrições.',
      href: null,
      cta: 'Abrir pagamento',
      transition: 'pagamento',
    }
  }

  if (facts.status === 'pagamento') {
    return {
      title: 'Pagamento aberto',
      facts: [efetivadas],
      message: 'A baixa manual confirma a inscrição. Quando os pagamentos estiverem conferidos, abra a checagem.',
      href: null,
      cta: 'Abrir checagem',
      transition: 'checagem',
    }
  }

  if (facts.status === 'checagem' && facts.pendingRequestsCount > 0) {
    return {
      title: 'Checagem aberta',
      facts: [efetivadas, `${facts.pendingRequestsCount} ${facts.pendingRequestsCount === 1 ? 'solicitação pendente' : 'solicitações pendentes'}`],
      message: 'Revise as solicitações pendentes antes de travar a checagem.',
      href: `${base}/checagem`,
      cta: 'Revisar solicitações',
    }
  }

  if (facts.status === 'checagem' && !facts.checkingLocked) {
    return {
      title: 'Checagem aberta',
      facts: [efetivadas, 'Nenhuma solicitação pendente'],
      message: 'Trave a checagem quando a lista oficial estiver estável. Depois disso as alterações deixam de ser permitidas.',
      href: `${base}/checagem`,
      cta: 'Ir para checagem',
    }
  }

  if (facts.status === 'checagem') {
    return {
      title: 'Checagem travada',
      facts: [efetivadas],
      message: 'A lista oficial está congelada. Avance para gerar as chaves.',
      href: null,
      cta: 'Abrir chaves',
      transition: 'chaves',
    }
  }

  if (facts.status === 'chaves' && !facts.hasPublishedBracket) {
    return {
      title: 'Gerar chaves',
      facts: [efetivadas],
      message: 'Gere a sugestão da categoria e ajuste o casamento antes de publicar.',
      href: `${base}/chaves`,
      cta: 'Gerar chaves',
    }
  }

  if (facts.status === 'chaves' && !facts.schedulePublished) {
    return {
      title: 'Programar lutas',
      facts: ['Chave publicada'],
      message: 'Atribua a área e publique para congelar a ordem das lutas.',
      href: `${base}/programacao`,
      cta: 'Abrir programação',
    }
  }

  if (facts.status === 'chaves') {
    return {
      title: 'Iniciar operação',
      facts: ['Chave publicada', 'Programação publicada'],
      message: 'Confirme a pesagem e registre os resultados das lutas.',
      href: `${base}/resultados`,
      cta: 'Abrir resultados',
    }
  }

  if (facts.status === 'em_andamento') {
    return {
      title: 'Evento em andamento',
      facts: [efetivadas],
      message: 'Registre os resultados e encerre o evento quando a operação terminar.',
      href: `${base}/resultados`,
      cta: 'Registrar resultados',
    }
  }

  if (facts.status === 'concluido') {
    return {
      title: 'Evento concluído',
      facts: [efetivadas],
      message: 'A operação esportiva ficou somente leitura. O fechamento considera inscrições efetivadas e pagamentos confirmados.',
      href: `${base}/financeiro`,
      cta: 'Ver financeiro',
    }
  }

  return {
    title: 'Operação do evento',
    facts: [],
    message: 'Siga a fase atual do evento pelas telas de operação.',
    href: '/admin/eventos',
    cta: 'Ver eventos',
  }
}
