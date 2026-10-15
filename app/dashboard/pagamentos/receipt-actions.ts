'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { allowsPublicOrganization } from '@/lib/events/public-organization'
import {
  PAYMENT_RECEIPT_BUCKET,
  PAYMENT_RECEIPT_MAX_BYTES,
  buildReceiptStoragePath,
  validateReceiptFile,
} from '@/lib/finance/payment-receipt'
import { pdfHasActiveContentDeep } from '@/lib/finance/pdf-active-content'
import { isPaymentsManualOnly } from '@/lib/payments/manual-only'
import { createPrivilegedClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export type ReceiptUploadState = { ok: boolean; message: string | null }

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const rpcMessages: Record<string, string> = {
  'Ja existe comprovante em analise': 'Já existe um comprovante em análise para este pagamento.',
  'Pagamento nao esta aguardando comprovante': 'Este pagamento não aceita mais comprovantes.',
  'Limite de comprovantes atingido': 'Limite de envios atingido. Fale com a organização do evento.',
}

const unavailable: ReceiptUploadState = { ok: false, message: 'Este pagamento não está disponível para envio de comprovante.' }

export async function submitPaymentReceipt(
  _previous: ReceiptUploadState,
  formData: FormData,
): Promise<ReceiptUploadState> {
  if (!isPaymentsManualOnly()) return unavailable
  const paymentId = String(formData.get('payment_id') || '')
  const file = formData.get('receipt')
  if (!uuid.test(paymentId)) return unavailable
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: 'Selecione o arquivo do comprovante.' }
  if (file.size > PAYMENT_RECEIPT_MAX_BYTES) return { ok: false, message: 'O comprovante deve ter no máximo 4 MB.' }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Sua sessão expirou. Entre novamente.' }

  // Pré-condições com o cliente do usuário (RLS): só o próprio pagamento, aguardando, com instruções PIX.
  const { data: payment } = await supabase
    .from('payments')
    .select('id, event_id, status, metodo, events(organization_id)')
    .eq('id', paymentId)
    .eq('created_by', user.id)
    .maybeSingle()
  const organizationId = payment?.events?.organization_id || ''
  if (!payment || !organizationId || !allowsPublicOrganization(organizationId)) return unavailable
  if (payment.status !== 'aguardando' || payment.metodo !== 'pix') return unavailable

  const [{ data: instructions }, { count: activeCount }] = await Promise.all([
    supabase.from('payment_pix_instructions').select('payment_id').eq('payment_id', payment.id).maybeSingle(),
    supabase.from('payment_receipts').select('id', { count: 'exact', head: true }).eq('payment_id', payment.id).eq('status', 'em_analise'),
  ])
  if (!instructions) return unavailable
  if (activeCount) return { ok: false, message: rpcMessages['Ja existe comprovante em analise'] }

  const bytes = new Uint8Array(await file.arrayBuffer())
  const check = validateReceiptFile({ name: file.name, declaredType: file.type, size: file.size, bytes })
  if (!check.ok) return { ok: false, message: check.message }
  if (check.mimeType === 'application/pdf' && pdfHasActiveContentDeep(bytes)) {
    return { ok: false, message: 'Este PDF contém conteúdo ativo ou protegido e não pode ser aceito. Envie uma foto ou print do comprovante.' }
  }

  const receiptId = randomUUID()
  const path = buildReceiptStoragePath({
    organizationId,
    eventId: payment.event_id,
    paymentId: payment.id,
    receiptId,
    extension: check.extension,
  })

  // Escrita privilegiada somente após autorização acima; o caminho nunca vem do cliente.
  const admin = createPrivilegedClient()
  const upload = await admin.storage.from(PAYMENT_RECEIPT_BUCKET).upload(path, bytes, {
    contentType: check.mimeType,
    upsert: false,
    cacheControl: '60',
  })
  if (upload.error) return { ok: false, message: 'Não foi possível enviar o comprovante. Tente novamente.' }

  // Registro definitivo pela RPC do usuário: revalida dono, estado e metadados reais do objeto.
  const { data, error } = await supabase.rpc('submit_payment_receipt', {
    target_payment_id: payment.id,
    target_receipt_id: receiptId,
    file_extension: check.extension,
  })
  if (error || !data || typeof data !== 'object' || Array.isArray(data) || data.kind !== 'payment_receipt') {
    await admin.storage.from(PAYMENT_RECEIPT_BUCKET).remove([path])
    return { ok: false, message: rpcMessages[error?.message || ''] || 'Não foi possível registrar o comprovante. Tente novamente.' }
  }

  revalidatePath(`/dashboard/pagamentos/${payment.id}`)
  revalidatePath('/dashboard/inscricoes')
  revalidatePath(`/admin/eventos/${payment.event_id}/financeiro`)
  return { ok: true, message: 'Comprovante enviado. A organização vai validar seu pagamento.' }
}
