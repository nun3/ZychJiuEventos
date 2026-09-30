import 'server-only'

import { getPublicOrganizationScope } from '@/lib/events/public-organization'
import {
  buildProfileJourney,
  type JourneyAwardCandidate,
  type JourneyMatchFact,
  type JourneyOrganizedEventFact,
  type JourneyRegistrationFact,
  type ProfileJourney,
} from '@/lib/profile/profile-journey'
import { createClient } from '@/lib/supabase/server'

type AthleteTeam = { nome: string } | null

function mapRegistrationRows(
  rows: Array<{
    id: string
    athlete_id: string
    status: string
    events: {
      id: string
      nome: string
      data_evento: string
      local: string
      status: string
      organization_id: string
    } | null
    athletes: {
      id: string
      teams: AthleteTeam
    } | null
  }> | null,
): JourneyRegistrationFact[] {
  return (rows || []).flatMap((row) => {
    const event = row.events
    if (!event) return []
    return [{
      registrationId: row.id,
      athleteId: row.athlete_id,
      eventId: event.id,
      eventName: event.nome,
      eventDate: event.data_evento,
      eventLocal: event.local,
      eventStatus: event.status,
      organizationId: event.organization_id,
      registrationStatus: row.status,
      teamName: row.athletes?.teams?.nome ?? null,
    }]
  })
}

async function loadAwardCandidates(
  athleteIds: string[],
): Promise<JourneyAwardCandidate[]> {
  if (athleteIds.length === 0) return []
  const supabase = createClient()

  const { data: participants } = await supabase
    .from('bracket_participants')
    .select('id, athlete_id, bracket_id')
    .in('athlete_id', athleteIds)

  if (!participants?.length) return []

  const participantIds = participants.map((row) => row.id)
  const bracketIds = Array.from(new Set(participants.map((row) => row.bracket_id)))
  const athleteByParticipant = new Map(participants.map((row) => [row.id, row.athlete_id]))

  const [{ data: entries }, { data: brackets }] = await Promise.all([
    supabase.from('bracket_entries').select('id, participant_id, group_id, bracket_id').in('participant_id', participantIds),
    supabase.from('category_brackets').select('id, event_id, events(id, nome, data_evento, organization_id)').in('id', bracketIds),
  ])

  if (!entries?.length) return []

  const eventByBracket = new Map(
    (brackets || []).map((row) => {
      const event = row.events as unknown as {
        id: string
        nome: string
        data_evento: string
        organization_id: string
      } | null
      return [row.id, event] as const
    }),
  )

  const groupIds = Array.from(new Set(entries.map((row) => row.group_id)))
  const [{ data: groups }, { data: operations }, { data: matches }] = await Promise.all([
    supabase.from('bracket_groups').select('id, topology').in('id', groupIds),
    supabase.from('bracket_group_operations').select('group_id, awards_confirmed_at').in('group_id', groupIds).not('awards_confirmed_at', 'is', null),
    supabase
      .from('bracket_matches')
      .select('group_id, round, pair_index, status, side_a_entry_id, side_b_entry_id, winner_entry_id')
      .in('group_id', groupIds),
  ])

  const topologyByGroup = new Map((groups || []).map((row) => [row.id, row.topology]))
  const awardsByGroup = new Map(
    (operations || []).map((row) => [row.group_id, row.awards_confirmed_at as string]),
  )
  const matchesByGroup = new Map<string, JourneyMatchFact[]>()
  for (const match of matches || []) {
    const list = matchesByGroup.get(match.group_id) || []
    list.push({
      round: match.round,
      pairIndex: match.pair_index,
      status: match.status,
      sideAEntryId: match.side_a_entry_id,
      sideBEntryId: match.side_b_entry_id,
      winnerEntryId: match.winner_entry_id,
    })
    matchesByGroup.set(match.group_id, list)
  }

  const candidates: JourneyAwardCandidate[] = []
  for (const entry of entries) {
    const awardsConfirmedAt = awardsByGroup.get(entry.group_id)
    if (!awardsConfirmedAt) continue
    const topology = topologyByGroup.get(entry.group_id)
    if (!topology) continue
    const athleteId = athleteByParticipant.get(entry.participant_id)
    if (!athleteId) continue
    const event = eventByBracket.get(entry.bracket_id)
    if (!event) continue

    candidates.push({
      athleteId,
      entryId: entry.id,
      eventId: event.id,
      eventName: event.nome,
      eventDate: event.data_evento,
      organizationId: event.organization_id,
      topology,
      awardsConfirmedAt,
      matches: matchesByGroup.get(entry.group_id) || [],
    })
  }

  return candidates
}

export async function loadProfileJourney(params: {
  userId: string
  selfAthleteId: string | null
  managedAthleteIds: string[]
  canManageEvents: boolean
  isProfessor: boolean
}): Promise<ProfileJourney> {
  const scope = getPublicOrganizationScope()
  const showSports = Boolean(params.selfAthleteId)
  const showOperations = params.isProfessor || params.canManageEvents || params.managedAthleteIds.length > 0

  if (scope.mode === 'blocked') {
    return buildProfileJourney({
      scope,
      selfAthleteId: params.selfAthleteId,
      managedAthleteIds: params.managedAthleteIds,
      selfRegistrations: [],
      managedRegistrations: [],
      awardCandidates: [],
      organizedEvents: [],
      showSports,
      showOperations,
    })
  }

  const supabase = createClient()
  const registrationSelect = `
    id,
    athlete_id,
    status,
    events!inner(id, nome, data_evento, local, status, organization_id),
    athletes!inner(id, teams(nome))
  `

  const selfRegsPromise = params.selfAthleteId
    ? supabase
      .from('registrations')
      .select(registrationSelect)
      .eq('athlete_id', params.selfAthleteId)
      .eq('status', 'efetivada')
    : Promise.resolve({ data: null })

  const managedRegsPromise = params.managedAthleteIds.length
    ? supabase
      .from('registrations')
      .select(registrationSelect)
      .in('athlete_id', params.managedAthleteIds)
      .eq('status', 'efetivada')
    : Promise.resolve({ data: null })

  const organizedPromise = params.canManageEvents
    ? (() => {
      let query = supabase
        .from('events')
        .select('id, nome, data_evento, local, status, organization_id')
        .eq('created_by', params.userId)
        .neq('status', 'rascunho')
        .neq('status', 'cancelado')
      if (scope.mode === 'restricted') query = query.eq('organization_id', scope.organizationId)
      return query
    })()
    : Promise.resolve({ data: null })

  const athleteIds = Array.from(new Set([
    ...(params.selfAthleteId ? [params.selfAthleteId] : []),
    ...params.managedAthleteIds,
  ]))

  const [{ data: selfRows }, { data: managedRows }, { data: organizedRows }, awardCandidatesRaw] = await Promise.all([
    selfRegsPromise,
    managedRegsPromise,
    organizedPromise,
    loadAwardCandidates(athleteIds),
  ])

  const selfRegistrations = mapRegistrationRows(selfRows as never)
  const managedRegistrations = mapRegistrationRows(managedRows as never)
  const awardCandidates = scope.mode === 'restricted'
    ? awardCandidatesRaw.filter((item) => item.organizationId === scope.organizationId)
    : awardCandidatesRaw

  const organizedEvents: JourneyOrganizedEventFact[] = ((organizedRows || []) as Array<{
    id: string
    nome: string
    data_evento: string
    local: string
    status: string
    organization_id: string
  }>).map((event) => ({
    eventId: event.id,
    eventName: event.nome,
    eventDate: event.data_evento,
    eventLocal: event.local,
    eventStatus: event.status,
    organizationId: event.organization_id,
  }))

  return buildProfileJourney({
    scope,
    selfAthleteId: params.selfAthleteId,
    managedAthleteIds: params.managedAthleteIds,
    selfRegistrations,
    managedRegistrations,
    awardCandidates,
    organizedEvents,
    showSports,
    showOperations,
  })
}
