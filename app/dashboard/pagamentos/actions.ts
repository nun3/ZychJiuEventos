'use server'

import { createClient } from '@/lib/supabase/server'
import { createPaymentGateway } from '@/lib/payments/server'
import { isPaymentsManualOnly } from '@/lib/payments/manual-only'
import { ensurePaymentCustomer } from '@/lib/payments/customer'
import { SupabaseIssuanceStore } from '@/lib/payments/issuance-store'
import { issueReservedPayment, type IssuanceResult } from '@/lib/payments/issuance'
import { GatewayError } from '@/lib/payments/gateway'

export type IssuePaymentState = { error: string | null; result: IssuanceResult | null }

export async function issuePayment(_previous: IssuePaymentState, formData: FormData): Promise<IssuePaymentState> {
  const paymentId = String(formData.get('paymentId') || '')
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(paymentId)) return { error: 'Pagamento inválido.', result: null }
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sua sessão expirou. Entre novamente.', result: null }
  const { data: profile } = await supabase.from('profiles').select('nome_completo, cpf').eq('id', user.id).single()
  if (!profile?.nome_completo || !profile.cpf) return { error: 'Complete nome e CPF no seu perfil antes de emitir a cobrança.', result: null }
  if (isPaymentsManualOnly()) {
    return { error: 'A emissão de cobrança está desligada neste go-live. O organizador confirma o recebimento por baixa manual.', result: null }
  }

  try {
    const gateway = createPaymentGateway()
    await ensurePaymentCustomer(gateway, user.id, profile.nome_completo, profile.cpf)
    const result = await issueReservedPayment(new SupabaseIssuanceStore(), gateway, paymentId, user.id)
    if (result.kind === 'reconcile') return { error: 'A resposta do gateway ficou incerta. A cobrança foi marcada para conciliação; não tente emitir novamente.', result }
    if (result.kind === 'busy') return { error: 'Outra emissão está em andamento. Atualize a página em instantes.', result }
    return { error: null, result }
  } catch (error) {
    if (error instanceof GatewayError && error.code === 'request' && !error.reconciliationRequired) {
      return { error: 'O Asaas recusou a emissão. Verifique se essa forma de pagamento está habilitada no Sandbox.', result: null }
    }
    return { error: 'Não foi possível preparar o pagador ou emitir a cobrança. Nenhuma nova tentativa foi feita automaticamente.', result: null }
  }
}
