import 'server-only'

import type { Json } from '@/lib/supabase/database.types'
import { createClient } from '@/lib/supabase/server'

export type ScheduleArea = {
  areaId: string
  number: number
  name: string
  active: boolean
}

export type ScheduleSide = {
  entryId: string
  name: string
  team: string | null
}

export type ScheduleMatch = {
  matchId: string
  fightNumber: number | null
  round: 'semifinal' | 'final'
  order: number
  status: 'pendente' | 'concluido' | 'wo'
  sideA: ScheduleSide | null
  sideB: ScheduleSide | null
}

export type ScheduleGroup = {
  groupId: string
  category: string
  label: string
  topology: 'final_2' | 'copo_3' | 'semi_4'
  areaId: string | null
  matches: ScheduleMatch[]
}

export type SchedulePageData = {
  event: {
    id: string
    name: string
    status: string
  }
  schedule: {
    scheduleId: string | null
    status: 'draft' | 'publicada' | null
    editable: boolean
    publishedAt: string | null
    areas: ScheduleArea[]
    groups: ScheduleGroup[]
  }
}

export type ScheduleLoadResult =
  | { kind: 'ok'; data: SchedulePageData }
  | { kind: 'unauthenticated' }
  | { kind: 'forbidden' }
  | { kind: 'not_found' }
  | { kind: 'error'; message: string }

type ObjectValue = { [key: string]: Json | undefined }

function objectValue(value: Json | undefined): ObjectValue | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null
}

function stringValue(value: Json | undefined) {
  return typeof value === 'string' ? value : null
}

function numberValue(value: Json | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function parseSide(value: Json | undefined): ScheduleSide | null {
  const side = objectValue(value)
  const entryId = stringValue(side?.entryId)
  const name = stringValue(side?.name)
  if (!side || !entryId || !name) return null
  return { entryId, name, team: stringValue(side.team) }
}

function parseMatch(value: Json): ScheduleMatch | null {
  const match = objectValue(value)
  const matchId = stringValue(match?.matchId)
  const round = stringValue(match?.round)
  const order = numberValue(match?.order)
  const status = stringValue(match?.status)
  if (
    !match
    || !matchId
    || !['semifinal', 'final'].includes(round || '')
    || order === null
    || !['pendente', 'concluido', 'wo'].includes(status || '')
  ) return null
  return {
    matchId,
    fightNumber: numberValue(match.fightNumber),
    round: round as ScheduleMatch['round'],
    order,
    status: status as ScheduleMatch['status'],
    sideA: parseSide(match.sideA),
    sideB: parseSide(match.sideB),
  }
}

function parseGroup(value: Json): ScheduleGroup | null {
  const group = objectValue(value)
  const groupId = stringValue(group?.groupId)
  const category = stringValue(group?.category)
  const label = stringValue(group?.label)
  const topology = stringValue(group?.topology)
  if (!group || !groupId || !category || !label || !['final_2', 'copo_3', 'semi_4'].includes(topology || '')) {
    return null
  }
  return {
    groupId,
    category,
    label,
    topology: topology as ScheduleGroup['topology'],
    areaId: stringValue(group.areaId),
    matches: Array.isArray(group.matches)
      ? group.matches.map(parseMatch).filter((match): match is ScheduleMatch => Boolean(match))
      : [],
  }
}

function parseArea(value: Json): ScheduleArea | null {
  const area = objectValue(value)
  const areaId = stringValue(area?.areaId)
  const number = numberValue(area?.number)
  const name = stringValue(area?.name)
  if (!area || !areaId || number === null || !name || typeof area.active !== 'boolean') return null
  return { areaId, number, name, active: area.active }
}

function parseSchedule(payload: Json) {
  const schedule = objectValue(payload)
  if (!schedule || schedule.kind !== 'schedule') return null
  const status = stringValue(schedule.status)
  if (status !== null && !['draft', 'publicada'].includes(status)) return null
  return {
    scheduleId: stringValue(schedule.scheduleId),
    status: status as SchedulePageData['schedule']['status'],
    editable: schedule.editable === true,
    publishedAt: stringValue(schedule.publishedAt),
    areas: Array.isArray(schedule.areas)
      ? schedule.areas.map(parseArea).filter((area): area is ScheduleArea => Boolean(area))
      : [],
    groups: Array.isArray(schedule.groups)
      ? schedule.groups.map(parseGroup).filter((group): group is ScheduleGroup => Boolean(group))
      : [],
  }
}

export async function loadSchedulePageData(eventId: string): Promise<ScheduleLoadResult> {
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

  const { data, error } = await supabase.rpc('get_event_schedule_operation', { target_event_id: event.id })
  if (error) return { kind: 'error', message: 'Não foi possível carregar a programação.' }
  const schedule = parseSchedule(data)
  if (!schedule) return { kind: 'error', message: 'A programação retornou dados inválidos.' }

  return {
    kind: 'ok',
    data: {
      event: { id: event.id, name: event.nome, status: event.status },
      schedule,
    },
  }
}
