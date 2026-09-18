import 'server-only'

import { parseFightDurationMinutes } from '@/lib/events/fight-duration'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'

type BracketStatus = Database['public']['Enums']['bracket_status']
export type BracketTopology = Database['public']['Enums']['bracket_topology']

export type BracketParticipantView = {
  id: string
  name: string
  teamId: string | null
  teamName: string | null
  sourceOrder: number
}

export type BracketSlotView = {
  entryId: string
  slot: number
  participantId: string
}

export type BracketMatchView = {
  id: string
  round: Database['public']['Enums']['match_round']
  pairIndex: number
  sideAEntryId: string | null
  sideASourceMatchId: string | null
  sideBEntryId: string | null
  sideBSourceMatchId: string | null
  status: Database['public']['Enums']['match_status']
}

export type BracketGroupView = {
  id: string
  label: string
  sortOrder: number
  topology: BracketTopology
  slots: BracketSlotView[]
  matches: BracketMatchView[]
}

export type SameTeamWarningView = {
  groupLabel: string
  slots: [number, number]
  teamName: string
}

export type BracketView = {
  id: string
  version: number
  mode: Database['public']['Enums']['bracket_mode']
  status: BracketStatus
  generatedAt: string
  publishedAt: string | null
  participants: BracketParticipantView[]
  groups: BracketGroupView[]
  warnings: SameTeamWarningView[]
}

export type BracketCategoryView = {
  id: string
  name: string
  gender: string
  durationMinutes: number | null
  athleteCount: number
  draft: BracketView | null
  published: BracketView | null
}

export type BracketPageData = {
  event: {
    id: string
    name: string
    status: string
    checkingLocked: boolean
  }
  categories: BracketCategoryView[]
}

export type BracketPageLoadResult =
  | { kind: 'ok'; data: BracketPageData }
  | { kind: 'unauthenticated' }
  | { kind: 'forbidden' }
  | { kind: 'not_found' }
  | { kind: 'error'; message: string }

function buildBracketView(
  bracket: Database['public']['Tables']['category_brackets']['Row'],
  participants: Database['public']['Tables']['bracket_participants']['Row'][],
  groups: Database['public']['Tables']['bracket_groups']['Row'][],
  entries: Database['public']['Tables']['bracket_entries']['Row'][],
  matches: Database['public']['Tables']['bracket_matches']['Row'][],
): BracketView {
  const bracketParticipants = participants
    .filter((participant) => participant.bracket_id === bracket.id)
    .sort((a, b) => a.source_order - b.source_order)
    .map((participant) => ({
      id: participant.id,
      name: participant.nome_exibido,
      teamId: participant.team_id,
      teamName: participant.team_name,
      sourceOrder: participant.source_order,
    }))

  const participantById = new Map(bracketParticipants.map((participant) => [participant.id, participant]))
  const bracketGroups = groups
    .filter((group) => group.bracket_id === bracket.id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((group) => ({
      id: group.id,
      label: group.label,
      sortOrder: group.sort_order,
      topology: group.topology,
      slots: entries
        .filter((entry) => entry.group_id === group.id)
        .sort((a, b) => a.slot - b.slot)
        .map((entry) => ({ entryId: entry.id, slot: entry.slot, participantId: entry.participant_id })),
      matches: matches
        .filter((match) => match.group_id === group.id)
        .sort((a, b) => a.round.localeCompare(b.round) || a.pair_index - b.pair_index)
        .map((match) => ({
          id: match.id,
          round: match.round,
          pairIndex: match.pair_index,
          sideAEntryId: match.side_a_entry_id,
          sideASourceMatchId: match.side_a_source_match_id,
          sideBEntryId: match.side_b_entry_id,
          sideBSourceMatchId: match.side_b_source_match_id,
          status: match.status,
        })),
    }))

  const entryById = new Map(
    bracketGroups.flatMap((group) => group.slots.map((slot) => [slot.entryId, { ...slot, groupLabel: group.label }] as const)),
  )
  const warnings: SameTeamWarningView[] = []

  for (const group of bracketGroups) {
    for (const match of group.matches) {
      if (!match.sideAEntryId || !match.sideBEntryId) continue
      const sideA = entryById.get(match.sideAEntryId)
      const sideB = entryById.get(match.sideBEntryId)
      const participantA = sideA ? participantById.get(sideA.participantId) : null
      const participantB = sideB ? participantById.get(sideB.participantId) : null
      if (participantA?.teamId && participantA.teamId === participantB?.teamId && sideA && sideB) {
        warnings.push({
          groupLabel: group.label,
          slots: [sideA.slot, sideB.slot],
          teamName: participantA.teamName || 'Equipe não informada',
        })
      }
    }
  }

  return {
    id: bracket.id,
    version: bracket.version,
    mode: bracket.mode,
    status: bracket.status,
    generatedAt: bracket.generated_at,
    publishedAt: bracket.published_at,
    participants: bracketParticipants,
    groups: bracketGroups,
    warnings,
  }
}

export async function loadBracketPageData(eventId: string): Promise<BracketPageLoadResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { kind: 'unauthenticated' }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, nome, organization_id, status, checagem_travada_em')
    .eq('id', eventId)
    .maybeSingle()

  if (eventError) return { kind: 'error', message: 'Não foi possível carregar o evento.' }
  if (!event) return { kind: 'not_found' }

  const [{ data: membership }, { data: platformRole }] = await Promise.all([
    supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', event.organization_id)
      .eq('user_id', user.id)
      .in('role', ['owner', 'organizer'])
      .limit(1)
      .maybeSingle(),
    supabase
      .from('platform_user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle(),
  ])

  if (!membership && !platformRole) return { kind: 'forbidden' }

  const [{ data: registrations, error: registrationsError }, { data: bracketRows, error: bracketsError }] = await Promise.all([
    supabase
      .from('registrations')
      .select('category_id, current_category_id')
      .eq('event_id', event.id)
      .eq('status', 'efetivada'),
    supabase
      .from('category_brackets')
      .select('*')
      .eq('event_id', event.id)
      .in('status', ['draft', 'publicada', 'em_andamento', 'concluida'])
      .order('version', { ascending: false }),
  ])

  if (registrationsError || bracketsError) {
    return { kind: 'error', message: 'Não foi possível carregar as categorias e chaves.' }
  }

  const athleteCountByCategory = new Map<string, number>()
  for (const registration of registrations || []) {
    const categoryId = registration.current_category_id || registration.category_id
    athleteCountByCategory.set(categoryId, (athleteCountByCategory.get(categoryId) || 0) + 1)
  }

  const categoryIds = Array.from(new Set([
    ...Array.from(athleteCountByCategory.keys()),
    ...(bracketRows || []).map((bracket) => bracket.category_id),
  ]))

  if (!categoryIds.length) {
    return {
      kind: 'ok',
      data: {
        event: { id: event.id, name: event.nome, status: event.status, checkingLocked: Boolean(event.checagem_travada_em) },
        categories: [],
      },
    }
  }

  const { data: categoryRows, error: categoriesError } = await supabase
    .from('event_categories')
    .select('id, nome, genero, fight_duration_minutes')
    .in('id', categoryIds)

  if (categoriesError) return { kind: 'error', message: 'Não foi possível carregar as categorias.' }

  const bracketIds = (bracketRows || []).map((bracket) => bracket.id)
  let participants: Database['public']['Tables']['bracket_participants']['Row'][] = []
  let groups: Database['public']['Tables']['bracket_groups']['Row'][] = []
  let entries: Database['public']['Tables']['bracket_entries']['Row'][] = []
  let matches: Database['public']['Tables']['bracket_matches']['Row'][] = []

  if (bracketIds.length) {
    const [participantsResult, groupsResult, entriesResult] = await Promise.all([
      supabase.from('bracket_participants').select('*').in('bracket_id', bracketIds),
      supabase.from('bracket_groups').select('*').in('bracket_id', bracketIds),
      supabase.from('bracket_entries').select('*').in('bracket_id', bracketIds),
    ])

    if (participantsResult.error || groupsResult.error || entriesResult.error) {
      return { kind: 'error', message: 'Não foi possível carregar a composição das chaves.' }
    }

    participants = participantsResult.data || []
    groups = groupsResult.data || []
    entries = entriesResult.data || []

    const groupIds = groups.map((group) => group.id)
    if (groupIds.length) {
      const matchesResult = await supabase.from('bracket_matches').select('*').in('group_id', groupIds)
      if (matchesResult.error) return { kind: 'error', message: 'Não foi possível carregar os confrontos.' }
      matches = matchesResult.data || []
    }
  }

  const bracketViews = new Map(
    (bracketRows || []).map((bracket) => [
      bracket.id,
      buildBracketView(bracket, participants, groups, entries, matches),
    ]),
  )

  const categories = (categoryRows || [])
    .map<BracketCategoryView>((category) => {
      const categoryBrackets = (bracketRows || []).filter((bracket) => bracket.category_id === category.id)
      const draftRow = categoryBrackets.find((bracket) => bracket.status === 'draft')
      const publishedRow = categoryBrackets.find((bracket) => ['publicada', 'em_andamento', 'concluida'].includes(bracket.status))
      return {
        id: category.id,
        name: category.nome,
        gender: category.genero,
        durationMinutes: parseFightDurationMinutes(category.fight_duration_minutes),
        athleteCount: athleteCountByCategory.get(category.id) || 0,
        draft: draftRow ? bracketViews.get(draftRow.id) || null : null,
        published: publishedRow ? bracketViews.get(publishedRow.id) || null : null,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))

  return {
    kind: 'ok',
    data: {
      event: {
        id: event.id,
        name: event.nome,
        status: event.status,
        checkingLocked: Boolean(event.checagem_travada_em),
      },
      categories,
    },
  }
}
