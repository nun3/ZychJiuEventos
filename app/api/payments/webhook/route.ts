import { NextResponse, type NextRequest } from 'next/server'
import { createPrivilegedClient } from '@/lib/supabase/admin'
import { authenticateAsaasWebhook, dispatchAsaasWebhook, MAX_WEBHOOK_BODY_BYTES, readLimitedText, type WebhookDispatch } from '@/lib/payments/webhook'

export const runtime = 'nodejs'

const PROCESSORS = {
  athlete: 'process_payment_webhook',
  settlement: 'process_settlement_webhook',
} as const

export async function POST(request: NextRequest) {
  if (!authenticateAsaasWebhook(request.headers.get('asaas-access-token'), process.env.ASAAS_WEBHOOK_TOKEN)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
  }

  let dispatch: WebhookDispatch
  try {
    const declaredLength = request.headers.get('content-length')
    if (declaredLength && Number(declaredLength) > MAX_WEBHOOK_BODY_BYTES) {
      return NextResponse.json({ error: 'Payload muito grande.' }, { status: 413 })
    }
    dispatch = dispatchAsaasWebhook(JSON.parse(await readLimitedText(request.body)))
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 })
  }

  try {
    const supabase = createPrivilegedClient()
    const { data: inserted, error } = await supabase.from('webhook_events').insert({
      gateway: 'asaas',
      external_event_id: dispatch.event.id,
      event_type: dispatch.event.event,
      payload: dispatch.event,
      status: dispatch.route === 'ignored' ? 'ignorado' : 'recebido',
      ...(dispatch.route === 'ignored' ? { processed_at: new Date().toISOString(), last_error: dispatch.reason } : {}),
    }).select('id').single()
    if (error && error.code !== '23505') throw error
    let eventId = inserted?.id
    let duplicate = false
    if (!eventId) {
      duplicate = true
      const { data: existing, error: existingError } = await supabase.from('webhook_events')
        .select('id, status').eq('gateway', 'asaas').eq('external_event_id', dispatch.event.id).single()
      if (existingError || !existing) throw existingError || new Error('Evento duplicado ausente.')
      eventId = existing.id
      if (existing.status === 'processado' || existing.status === 'ignorado') {
        return NextResponse.json({ accepted: true, duplicate: true })
      }
    }
    if (dispatch.route === 'ignored') return NextResponse.json({ accepted: true, duplicate, result: { kind: 'ignored' } })
    const { data: result, error: processError } = await supabase.rpc(PROCESSORS[dispatch.route], { target_event_id: eventId })
    if (processError) throw processError
    if (result && typeof result === 'object' && !Array.isArray(result) && result.kind === 'failed') {
      return NextResponse.json({ error: 'Evento persistido para reprocessamento.' }, { status: 503 })
    }
    return NextResponse.json({ accepted: true, duplicate, result })
  } catch {
    return NextResponse.json({ error: 'Não foi possível registrar o evento.' }, { status: 503 })
  }
}
