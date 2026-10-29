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
      message: mapLiveError(error?.message, 'Outra mesa atualizou esta luta. O placar foi sincronizado.'),
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
