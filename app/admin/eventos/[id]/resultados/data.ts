import 'server-only'

import type { Json } from '@/lib/supabase/database.types'
import { parseFightDurationMinutes } from '@/lib/events/fight-duration'
import { createClient } from '@/lib/supabase/server'

export type ResultSide = {
  entryId: string
  name: string
  team: string | null
}

export type ResultMatch = {
  matchId: string
  round: 'semifinal' | 'final'
  order: number
  status: 'pendente' | 'concluido' | 'wo'
  sideA: ResultSide | null
  sideB: ResultSide | null
  winnerEntryId: string | null
  canRecord: boolean
}

export type ResultPlacement = {
  place: number
  athlete: ResultSide
}

export type GroupChecklistState = {
  status: 'pendente' | 'realizada'
  confirmedAt: string | null
  confirmedBy: string | null
  confirmedByName: string | null
}

export type ResultGroup = {
  groupId: string
  label: string
  topology: 'final_2' | 'copo_3' | 'semi_4'
  status: 'aguardando' | 'em_andamento' | 'concluido'
  matches: ResultMatch[]
  placements: ResultPlacement[]
  weighIn: GroupChecklistState
  awards: GroupChecklistState
  resultStatus: 'pendente' | 'registrado'
}

export type ResultBracket = {
  bracketId: string
  categoryId: string
  category: string
  durationMinutes: number | null
  version: number
  mode: 'competicao' | 'sem_confronto'
  status: 'publicada' | 'em_andamento' | 'concluida'
  groups: ResultGroup[]
}

export type ResultsPageData = {
  event: { id: string; name: string; status: string }
  brackets: ResultBracket[]
}

export type ResultsLoadResult =
  | { kind: 'ok'; data: ResultsPageData }
  | { kind: 'unauthenticated' }
  | { kind: 'forbidden' }
  | { kind: 'not_found' }
  | { kind: 'error'; message: string }

function record(value: Json | undefined): Record<string, Json | undefined> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, Json | undefined>
    : null
}

function text(value: Json | undefined) {
  return typeof value === 'string' && value.trim() ? value : null
}

function number(value: Json | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function parseSide(value: Json | undefined): ResultSide | null {
  const source = record(value)
  if (!source) return null
  const entryId = text(source.entryId)
  const name = text(source.name)
  if (!entryId || !name) return null
  return { entryId, name, team: text(source.team) }
}

function parseMatch(value: Json): ResultMatch | null {
  const source = record(value)
  if (!source) return null
  const matchId = text(source.matchId)
  const round = text(source.round)
  const order = number(source.order)
  const status = text(source.status)
  if (
    !matchId
    || (round !== 'semifinal' && round !== 'final')
    || order === null
    || !['pendente', 'concluido', 'wo'].includes(status || '')
  ) return null
  return {
    matchId,
    round,
    order,
    status: status as ResultMatch['status'],
    sideA: parseSide(source.sideA),
    sideB: parseSide(source.sideB),
    winnerEntryId: text(source.winnerEntryId),
    canRecord: source.canRecord === true,
  }
}

function parsePlacement(value: Json): ResultPlacement | null {
  const source = record(value)
  const place = source ? number(source.place) : null
  const athlete = source ? parseSide(source.athlete) : null
  return place !== null && athlete ? { place, athlete } : null
}

const pendingChecklist: GroupChecklistState = {
  status: 'pendente',
  confirmedAt: null,
  confirmedBy: null,
  confirmedByName: null,
}

function parseChecklistState(value: Json | undefined): GroupChecklistState {
  const source = record(value)
  const status = text(source?.status)
  if (status !== 'realizada') return pendingChecklist
  return {
    status,
    confirmedAt: text(source?.confirmedAt),
    confirmedBy: text(source?.confirmedBy),
    confirmedByName: text(source?.confirmedByName),
  }
}

function parseChecklist(value: Json): { groupId: string; weighIn: GroupChecklistState; awards: GroupChecklistState; resultStatus: ResultGroup['resultStatus'] } | null {
  const source = record(value)
  const groupId = text(source?.groupId)
  if (!groupId) return null
  return {
    groupId,
    weighIn: parseChecklistState(source?.weighIn),
    awards: parseChecklistState(source?.awards),
    resultStatus: text(source?.resultStatus) === 'registrado' ? 'registrado' : 'pendente',
  }
}

function parseGroup(value: Json): ResultGroup | null {
  const source = record(value)
  if (!source) return null
  const groupId = text(source.groupId)
  const label = text(source.label)
  const topology = text(source.topology)
  const status = text(source.status)
  if (
    !groupId
    || !label
    || !['final_2', 'copo_3', 'semi_4'].includes(topology || '')
    || !['aguardando', 'em_andamento', 'concluido'].includes(status || '')
  ) return null
  return {
    groupId,
    label,
    topology: topology as ResultGroup['topology'],
    status: status as ResultGroup['status'],
    matches: Array.isArray(source.matches)
      ? source.matches.map(parseMatch).filter((match): match is ResultMatch => Boolean(match))
      : [],
    placements: Array.isArray(source.placements)
      ? source.placements.map(parsePlacement).filter((placement): placement is ResultPlacement => Boolean(placement))
      : [],
    weighIn: pendingChecklist,
    awards: pendingChecklist,
    resultStatus: 'pendente',
  }
}

function parseBracket(value: Json): ResultBracket | null {
  const source = record(value)
  if (!source) return null
  const bracketId = text(source.bracketId)
  const categoryId = text(source.categoryId)
  const category = text(source.category)
  const version = number(source.version)
  const mode = text(source.mode)
  const status = text(source.status)
  if (
    !bracketId
    || !categoryId
    || !category
    || version === null
    || (mode !== 'competicao' && mode !== 'sem_confronto')
    || !['publicada', 'em_andamento', 'concluida'].includes(status || '')
  ) return null
  return {
    bracketId,
    categoryId,
    category,
    durationMinutes: parseFightDurationMinutes(source.durationMinutes),
    version,
    mode,
    status: status as ResultBracket['status'],
    groups: Array.isArray(source.groups)
      ? source.groups.map(parseGroup).filter((group): group is ResultGroup => Boolean(group))
      : [],
  }
}

export async function loadResultsPageData(eventId: string): Promise<ResultsLoadResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { kind: 'unauthenticated' }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, nome, organization_id, status')
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

  const { data: bracketRows, error: bracketsError } = await supabase
    .from('category_brackets')
    .select('id')
    .eq('event_id', event.id)
    .in('status', ['publicada', 'em_andamento', 'concluida'])
  if (bracketsError) return { kind: 'error', message: 'Não foi possível carregar as chaves oficiais.' }

  const operations = await Promise.all(
    (bracketRows || []).map((bracket) => supabase.rpc('get_category_bracket_operation', { target_bracket_id: bracket.id })),
  )
  if (operations.some((operation) => operation.error)) {
    return { kind: 'error', message: 'Não foi possível carregar os confrontos.' }
  }

  const { data: checklistPayload, error: checklistError } = await supabase.rpc('get_event_group_checklists', {
    target_event_id: event.id,
  })
  if (checklistError) return { kind: 'error', message: 'Não foi possível carregar o checklist operacional.' }
  const checklistRecord = record(checklistPayload)
  const checklistGroups = checklistRecord && Array.isArray(checklistRecord.groups) ? checklistRecord.groups : []
  const checklists = new Map(
    checklistGroups
      .map(parseChecklist)
      .filter((item): item is NonNullable<ReturnType<typeof parseChecklist>> => Boolean(item))
      .map((item) => [item.groupId, item]),
  )

  const brackets = operations
    .map((operation) => parseBracket(operation.data))
    .filter((bracket): bracket is ResultBracket => Boolean(bracket))
    .map((bracket) => ({
      ...bracket,
      groups: bracket.groups.map((group) => {
        const checklist = checklists.get(group.groupId)
        return checklist
          ? {
              ...group,
              weighIn: checklist.weighIn,
              awards: checklist.awards,
              resultStatus: checklist.resultStatus,
            }
          : group
      }),
    }))
    .sort((a, b) => a.category.localeCompare(b.category, 'pt-BR'))

  return {
    kind: 'ok',
    data: {
      event: { id: event.id, name: event.nome, status: event.status },
      brackets,
    },
  }
}
