'use server'

import { revalidatePath } from 'next/cache'
import { allowsPublicOrganization } from '@/lib/events/public-organization'
import { normalizeRejectionReason } from '@/lib/finance/payment-receipt'
import { createClient } from '@/lib/supabase/server'

type Result = { ok: boolean; message: string }
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const rpcMessages: Record<string, string> = {
  'Comprovante nao esta em analise': 'Este comprovante já foi analisado. Atualize a página.',
  'Pagamento nao esta aguardando baixa': 'O pagamento não está mais aguardando. Atualize a página.',
  'Inscricoes vinculadas nao estao aptas para baixa': 'As inscrições deste pagamento não estão aptas para confirmação.',
}

/** Autoriza a revisão no servidor; a decisão final continua na RPC (papel, tenant, estado). */
async function loadReviewTarget(formData: FormData) {
  const receiptId = String(formData.get('receipt_id') || '')
  const eventId = String(formData.get('event_id') || '')
  if (!uuid.test(receiptId) || !uuid.test(eventId)) return { status: 'invalid' as const }
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { status: 'unauthenticated' as const }
  const { data: receipt } = await supabase
    .from('payment_receipts')
    .select('id, payment_id, event_id, organization_id')
    .eq('id', receiptId)
    .maybeSingle()
  if (!receipt || receipt.event_id !== eventId || !allowsPublicOrganization(receipt.organization_id)) {
    return { status: 'invalid' as const }
  }
  return { status: 'ok' as const, supabase, receipt }
}

function revalidateReceipt(eventId: string, paymentId: string) {
  revalidatePath(`/admin/eventos/${eventId}/financeiro`)
  revalidatePath(`/dashboard/pagamentos/${paymentId}`)
  revalidatePath('/dashboard/inscricoes')
}

export async function approvePaymentReceipt(formData: FormData): Promise<Result> {
  if (formData.get('confirmed') !== 'yes') {
    return { ok: false, message: 'Confirme que o valor foi recebido na conta da organização.' }
  }
  const target = await loadReviewTarget(formData)
  if (target.status === 'unauthenticated') return { ok: false, message: 'Sua sessão expirou.' }
  if (target.status !== 'ok') return { ok: false, message: 'Comprovante indisponível.' }

  const { data, error } = await target.supabase.rpc('approve_payment_receipt', { target_receipt_id: target.receipt.id })
  if (error || !data || typeof data !== 'object' || Array.isArray(data) || data.kind !== 'payment_receipt') {
    return { ok: false, message: rpcMessages[error?.message || ''] || 'Aprovação recusada: confira sua permissão e o estado do pagamento.' }
  }
  revalidateReceipt(target.receipt.event_id, target.receipt.payment_id)
  return {
    ok: true,
    message: data.alreadyReviewed ? 'Este comprovante já estava aprovado.' : 'Pagamento aprovado. Baixa manual registrada e inscrições confirmadas.',
  }
}

export async function rejectPaymentReceipt(formData: FormData): Promise<Result> {
  const reason = normalizeRejectionReason(String(formData.get('reason') || ''))
  if (!reason.ok) return { ok: false, message: reason.message }
  const target = await loadReviewTarget(formData)
  if (target.status === 'unauthenticated') return { ok: false, message: 'Sua sessão expirou.' }
  if (target.status !== 'ok') return { ok: false, message: 'Comprovante indisponível.' }

  const { data, error } = await target.supabase.rpc('reject_payment_receipt', {
    target_receipt_id: target.receipt.id,
    reason_text: reason.value,
  })
  if (error || !data || typeof data !== 'object' || Array.isArray(data) || data.kind !== 'payment_receipt') {
    return { ok: false, message: rpcMessages[error?.message || ''] || 'Rejeição recusada: confira sua permissão e o estado do comprovante.' }
  }
  revalidateReceipt(target.receipt.event_id, target.receipt.payment_id)
  return { ok: true, message: 'Comprovante rejeitado. O atleta verá o motivo e poderá reenviar.' }
}
