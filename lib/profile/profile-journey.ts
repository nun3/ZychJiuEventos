/**
 * Minha Jornada — agregação READ ONLY a partir de fatos persistidos.
 * Não inventa medalhas, não edita totais, não duplica histórico.
 */

export type JourneyOrganizationScope =
  | { mode: 'unrestricted' }
  | { mode: 'restricted'; organizationId: string }
  | { mode: 'blocked' }

export type JourneyRegistrationFact = {
  registrationId: string
  athleteId: string
  eventId: string
  eventName: string
  eventDate: string
  eventLocal: string
  eventStatus: string
  organizationId: string
  registrationStatus: string
  teamName: string | null
}

export type JourneyOrganizedEventFact = {
  eventId: string
  eventName: string
  eventDate: string
  eventLocal: string
  eventStatus: string
  organizationId: string
}

export type JourneyMatchFact = {
  round: 'semifinal' | 'final'
  pairIndex: number
  status: 'pendente' | 'concluido' | 'wo'
  sideAEntryId: string | null
  sideBEntryId: string | null
  winnerEntryId: string | null
}

export type JourneyAwardCandidate = {
  athleteId: string
  entryId: string
  eventId: string
  eventName: string
  eventDate: string
  organizationId: string
  topology: 'final_2' | 'copo_3' | 'semi_4'
  awardsConfirmedAt: string
  matches: JourneyMatchFact[]
}

export type JourneyPlacement = {
  athleteId: string
  eventId: string
  eventName: string
  eventDate: string
  place: 1 | 2 | 3
  medal: 'ouro' | 'prata' | 'bronze'
}

export type JourneyTimelineItem = {
  key: string
  date: string
  title: string
  subtitle: string
  kind: 'upcoming' | 'result' | 'participation'
}

export type ProfileJourney = {
  empty: boolean
  emptyMessage: string
  emptyHint: string
  sports: {
    championships: number
    podiums: number
    gold: number
    silver: number
    bronze: number
    upcoming: Array<{
      eventId: string
      name: string
      date: string
      local: string
      teamName: string | null
    }>
    recent: Array<{
      eventId: string
      name: string
      date: string
      local: string
      teamName: string | null
      place: 1 | 2 | 3 | null
      medal: 'ouro' | 'prata' | 'bronze' | null
    }>
    timeline: JourneyTimelineItem[]
  } | null
  operations: {
    managedAthletes: number
    championshipsWithAthletes: number
    eventsOrganized: number
    eventsCompleted: number
    nextOrganizedEvent: {
      eventId: string
      name: string
      date: string
      local: string
    } | null
  } | null
}

const PARTICIPATION_STATUS = new Set(['efetivada'])
const EXCLUDED_EVENT_STATUS = new Set(['rascunho', 'cancelado'])

function medalForPlace(place: 1 | 2 | 3): 'ouro' | 'prata' | 'bronze' {
  if (place === 1) return 'ouro'
  if (place === 2) return 'prata'
  return 'bronze'
}

export function allowsJourneyOrganization(
  organizationId: string,
  scope: JourneyOrganizationScope,
): boolean {
  if (scope.mode === 'blocked') return false
  if (scope.mode === 'unrestricted') return true
  return scope.organizationId === organizationId
}

export function isCountableParticipation(fact: JourneyRegistrationFact, scope: JourneyOrganizationScope) {
  if (!PARTICIPATION_STATUS.has(fact.registrationStatus)) return false
  if (EXCLUDED_EVENT_STATUS.has(fact.eventStatus)) return false
  return allowsJourneyOrganization(fact.organizationId, scope)
}

/** Espelha a lógica de `bracket_group_placements_to_json` quando sides e winner estão resolvidos. */
export function deriveGroupPlacements(
  topology: 'final_2' | 'copo_3' | 'semi_4',
  matches: JourneyMatchFact[],
): Array<{ place: 1 | 2 | 3; entryId: string }> {
  const finalMatch = matches.find((match) => match.round === 'final' && match.pairIndex === 1)
  if (
    !finalMatch
    || (finalMatch.status !== 'concluido' && finalMatch.status !== 'wo')
    || !finalMatch.winnerEntryId
    || !finalMatch.sideAEntryId
    || !finalMatch.sideBEntryId
  ) {
    return []
  }

  const winnerId = finalMatch.winnerEntryId
  const loserId = finalMatch.sideAEntryId === winnerId ? finalMatch.sideBEntryId : finalMatch.sideAEntryId
  const result: Array<{ place: 1 | 2 | 3; entryId: string }> = [
    { place: 1, entryId: winnerId },
    { place: 2, entryId: loserId },
  ]

  if (topology === 'copo_3') {
    const semi = matches.find((match) => match.round === 'semifinal' && match.pairIndex === 1)
    if (
      semi
      && (semi.status === 'concluido' || semi.status === 'wo')
      && semi.winnerEntryId
      && semi.sideAEntryId
      && semi.sideBEntryId
    ) {
      const third = semi.sideAEntryId === semi.winnerEntryId ? semi.sideBEntryId : semi.sideAEntryId
      result.push({ place: 3, entryId: third })
    }
  } else if (topology === 'semi_4') {
    for (const semi of matches
      .filter((match) => match.round === 'semifinal')
      .sort((a, b) => a.pairIndex - b.pairIndex)) {
      if (
        (semi.status !== 'concluido' && semi.status !== 'wo')
        || !semi.winnerEntryId
        || !semi.sideAEntryId
        || !semi.sideBEntryId
      ) {
        continue
      }
      const third = semi.sideAEntryId === semi.winnerEntryId ? semi.sideBEntryId : semi.sideAEntryId
      result.push({ place: 3, entryId: third })
    }
  }

  return result
}

export function derivePlacementsForAthletes(
  candidates: JourneyAwardCandidate[],
  athleteIds: Set<string>,
  scope: JourneyOrganizationScope,
): JourneyPlacement[] {
  const byEventAthlete = new Map<string, JourneyPlacement>()

  for (const candidate of candidates) {
    if (!athleteIds.has(candidate.athleteId)) continue
    if (!allowsJourneyOrganization(candidate.organizationId, scope)) continue
    if (!candidate.awardsConfirmedAt) continue

    const placements = deriveGroupPlacements(candidate.topology, candidate.matches)
    const found = placements.find((placement) => placement.entryId === candidate.entryId)
    if (!found) continue

    const key = `${candidate.athleteId}:${candidate.eventId}`
    const next: JourneyPlacement = {
      athleteId: candidate.athleteId,
      eventId: candidate.eventId,
      eventName: candidate.eventName,
      eventDate: candidate.eventDate,
      place: found.place,
      medal: medalForPlace(found.place),
    }
    const previous = byEventAthlete.get(key)
    if (!previous || next.place < previous.place) {
      byEventAthlete.set(key, next)
    }
  }

  return Array.from(byEventAthlete.values())
}

function todayIso(now: Date) {
  return now.toISOString().slice(0, 10)
}

export function buildProfileJourney(input: {
  scope: JourneyOrganizationScope
  now?: Date
  selfAthleteId: string | null
  managedAthleteIds: string[]
  selfRegistrations: JourneyRegistrationFact[]
  managedRegistrations: JourneyRegistrationFact[]
  awardCandidates: JourneyAwardCandidate[]
  organizedEvents: JourneyOrganizedEventFact[]
  showSports: boolean
  showOperations: boolean
}): ProfileJourney {
  if (input.scope.mode === 'blocked') {
    return {
      empty: true,
      emptyMessage: 'Sua jornada começa no primeiro campeonato.',
      emptyHint: 'O contexto da organização está indisponível no momento.',
      sports: null,
      operations: null,
    }
  }

  const now = input.now ?? new Date()
  const today = todayIso(now)
  const selfId = input.selfAthleteId
  const selfRegs = input.selfRegistrations.filter((fact) => isCountableParticipation(fact, input.scope))
  const managedRegs = input.managedRegistrations.filter((fact) => isCountableParticipation(fact, input.scope))

  const selfAthleteIds = new Set(selfId ? [selfId] : [])
  const placements = derivePlacementsForAthletes(
    input.awardCandidates,
    selfAthleteIds,
    input.scope,
  )

  const championships = new Set(selfRegs.map((fact) => fact.eventId)).size
  const gold = placements.filter((item) => item.place === 1).length
  const silver = placements.filter((item) => item.place === 2).length
  const bronze = placements.filter((item) => item.place === 3).length
  const podiums = gold + silver + bronze

  const placeByEvent = new Map(placements.map((item) => [item.eventId, item]))

  const upcoming = selfRegs
    .filter((fact) => fact.eventDate >= today)
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate) || a.eventName.localeCompare(b.eventName))
    .filter((fact, index, list) => list.findIndex((item) => item.eventId === fact.eventId) === index)
    .slice(0, 3)
    .map((fact) => ({
      eventId: fact.eventId,
      name: fact.eventName,
      date: fact.eventDate,
      local: fact.eventLocal,
      teamName: fact.teamName,
    }))

  const recent = selfRegs
    .filter((fact) => fact.eventDate < today)
    .sort((a, b) => b.eventDate.localeCompare(a.eventDate) || a.eventName.localeCompare(b.eventName))
    .filter((fact, index, list) => list.findIndex((item) => item.eventId === fact.eventId) === index)
    .slice(0, 5)
    .map((fact) => {
      const place = placeByEvent.get(fact.eventId) || null
      return {
        eventId: fact.eventId,
        name: fact.eventName,
        date: fact.eventDate,
        local: fact.eventLocal,
        teamName: fact.teamName,
        place: place?.place ?? null,
        medal: place?.medal ?? null,
      }
    })

  const timelineMap = new Map<string, JourneyTimelineItem>()
  for (const item of upcoming) {
    timelineMap.set(item.eventId, {
      key: `up-${item.eventId}`,
      date: item.date,
      title: item.name,
      subtitle: 'Inscrito',
      kind: 'upcoming',
    })
  }
  for (const item of recent) {
    timelineMap.set(item.eventId, {
      key: `hist-${item.eventId}`,
      date: item.date,
      title: item.name,
      subtitle: item.place ? `${item.place}º lugar` : 'Participou',
      kind: item.place ? 'result' : 'participation',
    })
  }
  const timeline = Array.from(timelineMap.values())
    .sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title))
    .slice(0, 8)

  const organized = input.organizedEvents.filter(
    (event) => !EXCLUDED_EVENT_STATUS.has(event.eventStatus) && allowsJourneyOrganization(event.organizationId, input.scope),
  )
  const eventsOrganized = organized.length
  const eventsCompleted = organized.filter((event) => event.eventStatus === 'concluido').length
  const nextOrganizedEvent = organized
    .filter((event) => event.eventDate >= today)
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate))
    .map((event) => ({
      eventId: event.eventId,
      name: event.eventName,
      date: event.eventDate,
      local: event.eventLocal,
    }))[0] || null

  const managedAthleteIds = new Set(input.managedAthleteIds)
  const championshipsWithAthletes = new Set(
    managedRegs
      .filter((fact) => managedAthleteIds.has(fact.athleteId))
      .map((fact) => fact.eventId),
  ).size

  const sports = input.showSports
    ? {
        championships,
        podiums,
        gold,
        silver,
        bronze,
        upcoming,
        recent,
        timeline,
      }
    : null

  const operations = input.showOperations
    ? {
        managedAthletes: managedAthleteIds.size,
        championshipsWithAthletes,
        eventsOrganized,
        eventsCompleted,
        nextOrganizedEvent,
      }
    : null

  const hasSportsFacts = Boolean(
    sports
    && (sports.championships > 0
      || sports.podiums > 0
      || sports.upcoming.length > 0
      || sports.recent.length > 0),
  )
  const hasOpsFacts = Boolean(
    operations
    && (operations.managedAthletes > 0
      || operations.championshipsWithAthletes > 0
      || operations.eventsOrganized > 0),
  )

  return {
    empty: !hasSportsFacts && !hasOpsFacts,
    emptyMessage: 'Sua jornada começa no primeiro campeonato.',
    emptyHint: 'Suas participações, resultados e eventos aparecerão aqui automaticamente.',
    sports,
    operations,
  }
}
