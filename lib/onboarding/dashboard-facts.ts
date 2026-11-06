import type { DashboardActor } from '@/lib/auth/dashboard-actor'
import { createClient } from '@/lib/supabase/server'
import { guidanceStepsForPhase, type EventGuidanceStep } from './event-guidance'
import {
  buildAthleteChecklist,
  buildProfessorChecklist,
  resolveOnboardingProfile,
  type FirstStepsChecklist,
} from './checklists'

export async function loadDashboardChecklist(actor: DashboardActor | null, hasPublishedEvent: boolean): Promise<FirstStepsChecklist | null> {
  if (!actor) return null
  const profile = resolveOnboardingProfile(actor)
  if (profile === 'organizer') return null
  const supabase = createClient()

  if (profile === 'professor') {
    const [{ data: team }, { data: managed }] = await Promise.all([
      supabase.from('teams').select('id').eq('created_by', actor.userId).limit(1).maybeSingle(),
      supabase.from('athlete_managers').select('athlete_id').eq('manager_id', actor.userId),
    ])
    const athleteIds = Array.from(new Set((managed || []).map((row) => row.athlete_id)))
    const registrations = athleteIds.length
      ? await supabase.from('registrations').select('id, status, event_id, events(status)').in('athlete_id', athleteIds)
      : { data: [] }
    const hasRegistration = (registrations.data || []).length > 0
    const hasCheckingFollowUp = (registrations.data || []).some((row) => (
      row.status === 'efetivada' && ['checagem', 'chaves', 'em_andamento', 'concluido'].includes(String((row.events as { status?: string } | null)?.status || ''))
    ))

    return buildProfessorChecklist({
      hasTeam: Boolean(team),
      hasAthlete: athleteIds.length > 0,
      hasRegistration,
      hasCheckingFollowUp,
    })
  }

  const { data: selfAthlete } = await supabase
    .from('athletes')
    .select('id, team_id')
    .eq('user_id', actor.userId)
    .maybeSingle()
  const ownRegistration = selfAthlete
    ? await supabase.from('registrations').select('id').eq('athlete_id', selfAthlete.id).limit(1).maybeSingle()
    : { data: null }

  return buildAthleteChecklist({
    hasSportsProfile: Boolean(selfAthlete),
    hasTeam: Boolean(selfAthlete?.team_id),
    hasPublishedEvent,
    hasRegistration: Boolean(ownRegistration.data),
  })
}

export type OrganizerChampionship = {
  id: string
  nome: string
  data_evento: string
  local: string
  status: string
  imagem_cartaz_url: string | null
  steps: EventGuidanceStep[]
}

export type OrganizerEventRow = {
  id: string
  nome: string
  data_evento: string
  local: string
  status: string
  timezone: string
}

export type OrganizerEventHub = {
  cards: OrganizerChampionship[]
  rows: OrganizerEventRow[]
  error: boolean
}

/** Cards ativos e a tabela completa, com a mesma fase da administração do evento. */
export async function loadOrganizerEventHub(organizationId: string): Promise<OrganizerEventHub> {
  const supabase = createClient()
  const { data: events, error } = await supabase
    .from('events')
    .select('id, nome, data_evento, local, status, timezone, imagem_cartaz_url')
    .eq('organization_id', organizationId)
    .order('data_evento', { ascending: true })

  if (error) return { cards: [], rows: [], error: true }

  const rows = events || []
  const chavesIds = rows.filter((event) => event.status === 'chaves').map((event) => event.id)
  const publishedBrackets = new Set<string>()
  const publishedSchedules = new Set<string>()

  if (chavesIds.length) {
    const [{ data: brackets }, { data: schedules }] = await Promise.all([
      supabase.from('category_brackets').select('event_id').in('event_id', chavesIds).in('status', ['publicada', 'em_andamento', 'concluida']),
      supabase.from('event_schedules').select('event_id').in('event_id', chavesIds).eq('status', 'publicada'),
    ])
    for (const bracket of brackets || []) publishedBrackets.add(bracket.event_id)
    for (const schedule of schedules || []) publishedSchedules.add(schedule.event_id)
  }

  return {
    error: false,
    rows: rows.map((event) => ({
      id: event.id,
      nome: event.nome,
      data_evento: event.data_evento,
      local: event.local,
      status: event.status,
      timezone: event.timezone,
    })),
    cards: rows.filter((event) => event.status !== 'cancelado').map((event) => ({
      id: event.id,
      nome: event.nome,
      data_evento: event.data_evento,
      local: event.local,
      status: event.status,
      imagem_cartaz_url: event.imagem_cartaz_url,
      steps: guidanceStepsForPhase(event.status, {
        hasPublishedBracket: publishedBrackets.has(event.id),
        schedulePublished: publishedSchedules.has(event.id),
      }),
    })),
  }
}
