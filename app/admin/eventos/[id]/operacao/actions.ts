'use server'

import { revalidatePath } from 'next/cache'
import { isLiveVersionConflict, mapLiveError } from '@/lib/live/errors'
import type { LiveEventType } from '@/lib/live/lifecycle'
import { createClient } from '@/lib/supabase/server'
import { parseLiveSessionPayload } from './data'
import type { LiveActionResult, LiveResultType, LiveSide } from './types'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type LiveRpcClient = {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>
  auth: { getUser: () => Promise<{ data: { user: { id: string } | null } }> }
}

async function client() {
  const supabase = createClient() as unknown as LiveRpcClient
  const { data: { user } } = await supabase.auth.getUser()
  return user ? supabase : null
}

function refresh(eventId: string) {
  revalidatePath(`/admin/eventos/${eventId}/operacao`)
}

export async function createLiveSessionAction(input: {
  eventId: string
  matchId: string
  areaId: string
  idempotencyKey: string
}): Promise<LiveActionResult> {
  if (
    !uuidPattern.test(input.eventId)
    || !uuidPattern.test(input.matchId)
    || !uuidPattern.test(input.areaId)
    || input.idempotencyKey.trim().length < 8
  ) {
    return { ok: false, message: 'Dados inválidos para abrir a luta.' }
  }
  const supabase = await client()
  if (!supabase) return { ok: false, message: 'Sua sessão expirou.' }

  const { data, error } = await supabase.rpc('create_match_live_session', {
    target_match_id: input.matchId,
    target_area_id: input.areaId,
    idempotency_key: input.idempotencyKey.trim(),
  })
  const session = parseLiveSessionPayload(data)
  if (error || !session) {
    return { ok: false, message: mapLiveError(error?.message, 'Não foi possível abrir a luta ao vivo.') }
  }
  refresh(input.eventId)
  return { ok: true, session }
}

export async function applyLiveActionAction(input: {
  eventId: string
  sessionId: string
  expectedVersion: number
  actionType: LiveEventType
  idempotencyKey: string
  competitorSide?: LiveSide | null
  actionValue?: number | null
  targetEventId?: string | null
  winnerSide?: LiveSide | null
  resultType?: LiveResultType | null
}): Promise<LiveActionResult> {
  if (
    !uuidPattern.test(input.eventId)
    || !uuidPattern.test(input.sessionId)
    || input.expectedVersion < 1
    || input.idempotencyKey.trim().length < 8
    || input.actionType === 'create_session'
  ) {
    return { ok: false, message: 'Dados inválidos para o comando ao vivo.' }
  }

  const supabase = await client()
  if (!supabase) return { ok: false, message: 'Sua sessão expirou.' }

  const { data, error } = await supabase.rpc('apply_match_live_action', {
    target_session_id: input.sessionId,
    expected_version: input.expectedVersion,
    action_type: input.actionType,
    idempotency_key: input.idempotencyKey.trim(),
    competitor_side: input.competitorSide ?? null,
    action_value: input.actionValue ?? null,
    target_event_id: input.targetEventId ?? null,
    winner_side: input.winnerSide ?? null,
    result_type: input.resultType ?? null,
    action_metadata: {},
  })

  if (isLiveVersionConflict(error?.message)) {
    const refreshed = await refreshLiveSessionAction({ eventId: input.eventId, sessionId: input.sessionId })
    return {
      ok: false,
      conflict: true,
      message: mapLiveError(
        error?.message,
        'O placar mudou. Sua última ação não foi aplicada. Estado sincronizado — confira antes de continuar.',
      ),
      session: refreshed.ok ? refreshed.session : null,
    }
  }

  const session = parseLiveSessionPayload(data)
  if (error || !session) {
    return { ok: false, message: mapLiveError(error?.message, 'Não foi possível aplicar o comando.') }
  }
  refresh(input.eventId)
  return { ok: true, session }
}

export type LiveUndoablePayload = {
  eventId: string
  type: 'score' | 'advantage' | 'penalty'
  side: LiveSide
  value: number | null
}

/** Lê o último evento undoável da sessão (sem migration; SELECT via RLS). */
export async function getLiveUndoableAction(input: {
  eventId: string
  sessionId: string
}): Promise<{ ok: true; undoable: LiveUndoablePayload | null } | { ok: false; message: string }> {
  if (!uuidPattern.test(input.eventId) || !uuidPattern.test(input.sessionId)) {
    return { ok: false, message: 'Sessão inválida.' }
  }
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Sua sessão expirou.' }

  // match_live_* ainda fora do database.types.ts gerado; SELECT autenticado via RLS.
  type LiveEventRow = {
    id: string
    type: string
    competitor_side: string | null
    value: number | null
    target_event_id: string | null
    event_id: string
  }
  const { data: rows, error } = await (supabase as any)
    .from('match_live_events')
    .select('id, type, competitor_side, value, target_event_id, sequence, event_id')
    .eq('session_id', input.sessionId)
    .in('type', ['score', 'advantage', 'penalty', 'undo'])
    .order('sequence', { ascending: false })
    .limit(80) as { data: LiveEventRow[] | null; error: { message: string } | null }

  if (error) {
    return { ok: false, message: mapLiveError(error.message, 'Não foi possível carregar o desfazer.') }
  }

  const events = (rows || []).filter((row) => row.event_id === input.eventId)
  const undone = new Set(
    events
      .filter((row) => row.type === 'undo' && row.target_event_id)
      .map((row) => String(row.target_event_id)),
  )
  const target = events.find((row) => (
    (row.type === 'score' || row.type === 'advantage' || row.type === 'penalty')
    && !undone.has(String(row.id))
  ))
  if (!target || (target.competitor_side !== 'a' && target.competitor_side !== 'b')) {
    return { ok: true, undoable: null }
  }
  return {
    ok: true,
    undoable: {
      eventId: String(target.id),
      type: target.type as 'score' | 'advantage' | 'penalty',
      side: target.competitor_side as LiveSide,
      value: typeof target.value === 'number' ? target.value : null,
    },
  }
}

export async function refreshLiveSessionAction(input: {
  eventId: string
  sessionId: string
}): Promise<LiveActionResult> {
  if (!uuidPattern.test(input.eventId) || !uuidPattern.test(input.sessionId)) {
    return { ok: false, message: 'Sessão inválida.' }
  }
  const supabase = await client()
  if (!supabase) return { ok: false, message: 'Sua sessão expirou.' }

  const { data, error } = await supabase.rpc('get_match_live_session', {
    target_session_id: input.sessionId,
  })
  const session = parseLiveSessionPayload(data)
  if (error || !session) {
    return { ok: false, message: mapLiveError(error?.message, 'Não foi possível sincronizar a luta.') }
  }
  return { ok: true, session }
}
