import 'server-only'

import type { Json } from '@/lib/supabase/database.types'
import { isLiveStatus } from '@/lib/live/lifecycle'
import { allowsPublicOrganization } from '@/lib/events/public-organization'
import { createClient } from '@/lib/supabase/server'
import type {
  LiveActorRole,
  LiveResultType,
  LiveSessionPayload,
  LiveSide,
  OperatorArea,
  OperatorPageData,
  OperatorQueueMatch,
} from './types'

export type OperatorLoadResult =
  | { kind: 'ok'; data: OperatorPageData }
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

function parseSide(value: Json | undefined) {
  const side = objectValue(value)
  const entryId = stringValue(side?.entryId)
  const name = stringValue(side?.name)
  if (!side || !entryId || !name) return null
  return { entryId, name, team: stringValue(side.team) }
}

export function parseLiveSessionPayload(value: unknown): LiveSessionPayload | null {
  const row = objectValue(value as Json)
  if (!row) return null
  const id = stringValue(row.id)
  const eventId = stringValue(row.eventId)
  const matchId = stringValue(row.matchId)
  const status = stringValue(row.status)
  const durationSeconds = numberValue(row.durationSeconds)
  const version = numberValue(row.version)
  if (!id || !eventId || !matchId || !status || !isLiveStatus(status) || durationSeconds === null || version === null) {
    return null
  }
  const winnerSide = stringValue(row.winnerSide)
  const resultType = stringValue(row.resultType)
  return {
    id,
    eventId,
    matchId,
    areaId: stringValue(row.areaId),
    status,
    rulesetSnapshot: objectValue(row.rulesetSnapshot as Json) as Record<string, unknown> | null,
    durationSeconds,
    startedAt: stringValue(row.startedAt),
    pausedAt: stringValue(row.pausedAt),
    accumulatedPauseMs: numberValue(row.accumulatedPauseMs) ?? 0,
    finishedAt: stringValue(row.finishedAt),
    confirmedAt: stringValue(row.confirmedAt),
    winnerSide: winnerSide === 'a' || winnerSide === 'b' ? winnerSide as LiveSide : null,
    resultType: (resultType as LiveResultType | null) ?? null,
    scoreA: numberValue(row.scoreA) ?? 0,
    scoreB: numberValue(row.scoreB) ?? 0,
    advantagesA: numberValue(row.advantagesA) ?? 0,
    advantagesB: numberValue(row.advantagesB) ?? 0,
    penaltiesA: numberValue(row.penaltiesA) ?? 0,
    penaltiesB: numberValue(row.penaltiesB) ?? 0,
    version,
    lastEventSequence: numberValue(row.lastEventSequence) ?? 0,
    operatorId: stringValue(row.operatorId),
    updatedAt: stringValue(row.updatedAt),
    duplicate: row.duplicate === true,
    lastEventId: stringValue(row.lastEventId),
  }
}

function parseAreas(payload: ObjectValue): OperatorArea[] {
  if (!Array.isArray(payload.areas)) return []
  return payload.areas.flatMap((raw) => {
    const area = objectValue(raw)
    const areaId = stringValue(area?.areaId)
    const number = numberValue(area?.number)
    const name = stringValue(area?.name)
    if (!area || !areaId || number === null || !name || typeof area.active !== 'boolean') return []
    return [{ areaId, number, name, active: area.active }]
  })
}

function buildQueue(
  schedule: ObjectValue,
  sessionsByMatchId: Record<string, LiveSessionPayload>,
): Record<string, OperatorQueueMatch[]> {
  const queueByArea: Record<string, OperatorQueueMatch[]> = {}
  const groups = Array.isArray(schedule.groups) ? schedule.groups : []
  for (const rawGroup of groups) {
    const group = objectValue(rawGroup)
    const areaId = stringValue(group?.areaId)
    const category = stringValue(group?.category) || 'Categoria'
    const label = stringValue(group?.label) || ''
    if (!group || !areaId || !Array.isArray(group.matches)) continue
    for (const rawMatch of group.matches) {
      const match = objectValue(rawMatch)
      const matchId = stringValue(match?.matchId)
      const fightNumber = numberValue(match?.fightNumber)
      const round = stringValue(match?.round)
      const status = stringValue(match?.status)
      if (
        !match
        || !matchId
        || fightNumber === null
        || !['semifinal', 'final'].includes(round || '')
        || !['pendente', 'concluido', 'wo'].includes(status || '')
      ) continue
      const item: OperatorQueueMatch = {
        matchId,
        fightNumber,
        round: round as OperatorQueueMatch['round'],
        status: status as OperatorQueueMatch['status'],
        category,
        groupLabel: label,
        sideA: parseSide(match.sideA),
        sideB: parseSide(match.sideB),
        session: sessionsByMatchId[matchId] ?? null,
      }
      if (!queueByArea[areaId]) queueByArea[areaId] = []
      queueByArea[areaId].push(item)
    }
  }
  for (const areaId of Object.keys(queueByArea)) {
    queueByArea[areaId].sort((a, b) => a.fightNumber - b.fightNumber)
  }
  return queueByArea
}

export async function loadOperatorPageData(eventId: string): Promise<OperatorLoadResult> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { kind: 'unauthenticated' }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, nome, organization_id, status, local')
    .eq('id', eventId)
    .maybeSingle()
  if (eventError) return { kind: 'error', message: 'Não foi possível carregar o evento.' }
  if (!event || !allowsPublicOrganization(event.organization_id)) return { kind: 'not_found' }

  const [{ data: membership }, { data: platformRole }] = await Promise.all([
    supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', event.organization_id)
      .eq('user_id', user.id)
      .in('role', ['owner', 'organizer', 'staff'])
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

  const actorRole: LiveActorRole = platformRole
    ? 'admin'
    : (membership!.role as Exclude<LiveActorRole, 'admin'>)
  const canConfirm = actorRole === 'owner' || actorRole === 'organizer' || actorRole === 'admin'

  const { data: scheduleRaw, error: scheduleError } = await supabase.rpc('get_event_schedule_operation', {
    target_event_id: event.id,
  })
  if (scheduleError) return { kind: 'error', message: 'Não foi possível carregar a programação da área.' }
  const schedule = objectValue(scheduleRaw as Json)
  if (!schedule || schedule.kind !== 'schedule') {
    return { kind: 'error', message: 'A programação retornou dados inválidos.' }
  }

  const sessionsByMatchId: Record<string, LiveSessionPayload> = {}
  const { data: liveRaw, error: liveError } = await (supabase as unknown as {
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>
  }).rpc('list_event_live_sessions', { target_event_id: event.id })

  if (!liveError) {
    const live = objectValue(liveRaw as Json)
    const sessions = live && Array.isArray(live.sessions) ? live.sessions : []
    for (const item of sessions) {
      const session = parseLiveSessionPayload(item)
      if (session) sessionsByMatchId[session.matchId] = session
    }
  }

  return {
    kind: 'ok',
    data: {
      event: {
        id: event.id,
        name: event.nome,
        status: event.status,
        local: event.local,
      },
      actorRole,
      canConfirm,
      areas: parseAreas(schedule).filter((area) => area.active),
      queueByArea: buildQueue(schedule, sessionsByMatchId),
      sessionsByMatchId,
    },
  }
}
