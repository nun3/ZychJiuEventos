'use server'

import { revalidatePath } from 'next/cache'
import { toCents } from '@/lib/payments/domain'
import { createClient } from '@/lib/supabase/server'

type Result = { ok: boolean; message: string }
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function setEventPlatformFee(formData: FormData): Promise<Result> {
  const eventId = String(formData.get('event_id') || '')
  const typed = String(formData.get('fee') || '').trim().replace(',', '.')
  if (!uuid.test(eventId)) return { ok: false, message: 'Evento inválido.' }
  let feeCents: number
  try {
    feeCents = toCents(typed)
  } catch {
    return { ok: false, message: 'Informe a taxa em reais, com no máximo duas casas decimais.' }
  }
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Sua sessão expirou.' }
  const { data, error } = await supabase.rpc('set_event_platform_fee', { target_event_id: eventId, fee_cents: feeCents })
  if (error || !data || typeof data !== 'object' || Array.isArray(data) || data.kind !== 'platform_fee') {
    return { ok: false, message: 'Taxa recusada: somente a plataforma configura a taxa contratada.' }
  }
  revalidatePath(`/admin/eventos/${eventId}/financeiro`)
  return { ok: true, message: 'Taxa MEU CAMP atualizada e auditada.' }
}

export async function settlePaymentManually(formData: FormData): Promise<Result> {
  const paymentId = String(formData.get('payment_id') || '')
  const eventId = String(formData.get('event_id') || '')
  const reason = String(formData.get('reason') || '').trim()
  if (!uuid.test(paymentId) || !uuid.test(eventId) || reason.length < 10 || reason.length > 500 || formData.get('confirmed') !== 'yes') return { ok: false, message: 'Confirme a operação e informe uma justificativa entre 10 e 500 caracteres.' }
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Sua sessão expirou.' }
  const { data, error } = await supabase.rpc('settle_payment_manually', { target_payment_id: paymentId, reason_text: reason })
  if (error || !data || typeof data !== 'object' || Array.isArray(data) || data.kind !== 'settled') return { ok: false, message: 'Baixa recusada: confira permissão, estado do pagamento e inscrições.' }
  revalidatePath(`/admin/eventos/${eventId}/financeiro`)
  revalidatePath('/dashboard/inscricoes')
  return { ok: true, message: 'Baixa manual registrada e auditada.' }
}
