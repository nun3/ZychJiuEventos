import type { DashboardActor } from '@/lib/auth/dashboard-actor'
import { createClient } from '@/lib/supabase/server'
import {
  buildAthleteChecklist,
  buildOrganizerChecklist,
  buildProfessorChecklist,
  organizerReached,
  resolveOnboardingProfile,
  type FirstStepsChecklist,
} from './checklists'

export async function loadDashboardChecklist(actor: DashboardActor | null, hasPublishedEvent: boolean): Promise<FirstStepsChecklist | null> {
  if (!actor) return null
  const profile = resolveOnboardingProfile(actor)
  const supabase = createClient()

  if (profile === 'organizer' && actor.organization) {
    const { data: events } = await supabase
      .from('events')
      .select('id, status')
      .eq('organization_id', actor.organization.organizationId)
    const eventIds = (events || []).map((event) => event.id)
    const [{ data: rules }, { data: schedule }] = eventIds.length
      ? await Promise.all([
        supabase.from('category_rule_sets').select('id, event_categories(id)').in('event_id', eventIds).eq('ativo', true),
        supabase.from('event_schedules').select('id').in('event_id', eventIds).eq('status', 'publicada').limit(1).maybeSingle(),
      ])
      : [{ data: [] }, { data: null }]

    return buildOrganizerChecklist({
      hasEvent: eventIds.length > 0,
      hasCategory: (rules || []).some((rule) => (rule.event_categories || []).length > 0),
      hasOpenedRegistrations: (events || []).some((event) => organizerReached(event.status, 'inscricao')),
      hasReachedChecking: (events || []).some((event) => organizerReached(event.status, 'checagem')),
      hasReachedBrackets: (events || []).some((event) => organizerReached(event.status, 'chaves')),
      hasReachedSchedule: Boolean(schedule) || (events || []).some((event) => organizerReached(event.status, 'em_andamento')),
      hasReachedResults: (events || []).some((event) => organizerReached(event.status, 'em_andamento')),
    })
  }

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
