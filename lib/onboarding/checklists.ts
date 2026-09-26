import { eventStatusRank, type EventGuidanceStatus } from './event-guidance'

export type OnboardingProfile = 'organizer' | 'professor' | 'athlete'

export type ChecklistItem = {
  id: string
  label: string
  done: boolean
  href: string
}

export type FirstStepsChecklist = {
  profile: OnboardingProfile
  title: string
  items: ChecklistItem[]
}

export type OrganizerChecklistFacts = {
  hasEvent: boolean
  hasCategory: boolean
  hasOpenedRegistrations: boolean
  hasReachedChecking: boolean
  hasReachedBrackets: boolean
  hasReachedSchedule: boolean
  hasReachedResults: boolean
}

export type ProfessorChecklistFacts = {
  hasTeam: boolean
  hasAthlete: boolean
  hasRegistration: boolean
  hasCheckingFollowUp: boolean
}

export type AthleteChecklistFacts = {
  hasSportsProfile: boolean
  hasTeam: boolean
  hasPublishedEvent: boolean
  hasRegistration: boolean
}

export function resolveOnboardingProfile(input: {
  canManageEvents: boolean
  isProfessor: boolean
  tipoCadastro: string | null
  hasSelfAthlete: boolean
}): OnboardingProfile {
  if (input.canManageEvents) return 'organizer'
  if (input.isProfessor || input.tipoCadastro === 'responsavel' || input.tipoCadastro === 'professor') return 'professor'
  return 'athlete'
}

export function organizerReached(status: EventGuidanceStatus, minimum: EventGuidanceStatus) {
  return eventStatusRank(status) >= eventStatusRank(minimum)
}

export function buildOrganizerChecklist(facts: OrganizerChecklistFacts): FirstStepsChecklist {
  return {
    profile: 'organizer',
    title: 'Configure seu primeiro campeonato',
    items: [
      { id: 'evento', label: 'Configurar evento', done: facts.hasEvent, href: facts.hasEvent ? '/admin/eventos' : '/admin/eventos/novo' },
      { id: 'categorias', label: 'Categorias', done: facts.hasCategory, href: '/admin/eventos' },
      { id: 'inscricoes', label: 'Receber inscrições', done: facts.hasOpenedRegistrations, href: '/admin/eventos' },
      { id: 'checagem', label: 'Checagem', done: facts.hasReachedChecking, href: '/admin/eventos' },
      { id: 'chaves', label: 'Chaves', done: facts.hasReachedBrackets, href: '/admin/eventos' },
      { id: 'programacao', label: 'Programação', done: facts.hasReachedSchedule, href: '/admin/eventos' },
      { id: 'resultados', label: 'Resultados', done: facts.hasReachedResults, href: '/admin/eventos' },
    ],
  }
}

export function buildProfessorChecklist(facts: ProfessorChecklistFacts): FirstStepsChecklist {
  return {
    profile: 'professor',
    title: 'Prepare sua equipe',
    items: [
      { id: 'equipe', label: 'Cadastrar equipe', done: facts.hasTeam, href: '/dashboard/meus-atletas' },
      { id: 'atletas', label: 'Adicionar atletas', done: facts.hasAthlete, href: '/dashboard/meus-atletas' },
      { id: 'inscricoes', label: 'Inscrever atletas', done: facts.hasRegistration, href: facts.hasRegistration ? '/dashboard/inscricoes' : '/eventos' },
      { id: 'checagem', label: 'Acompanhar checagem', done: facts.hasCheckingFollowUp, href: '/dashboard/inscricoes' },
    ],
  }
}

export function buildAthleteChecklist(facts: AthleteChecklistFacts): FirstStepsChecklist {
  return {
    profile: 'athlete',
    title: 'Prepare-se para competir',
    items: [
      { id: 'cadastro', label: 'Completar cadastro esportivo', done: facts.hasSportsProfile, href: '/dashboard/completar-cadastro-esportivo' },
      { id: 'equipe', label: 'Confirmar equipe', done: facts.hasTeam, href: facts.hasSportsProfile ? '/dashboard/meus-atletas' : '/dashboard/completar-cadastro-esportivo' },
      { id: 'evento', label: 'Encontrar evento', done: facts.hasPublishedEvent, href: '/eventos' },
      { id: 'inscricao', label: 'Fazer inscrição', done: facts.hasRegistration, href: facts.hasRegistration ? '/dashboard/inscricoes' : '/eventos' },
    ],
  }
}
