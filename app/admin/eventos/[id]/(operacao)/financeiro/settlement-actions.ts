'use server'

import { revalidatePath } from 'next/cache'
import { allowsPublicOrganization } from '@/lib/events/public-organization'
import { GatewayError } from '@/lib/payments/gateway'
import { isPlatformSettlementEnabled } from '@/lib/payments/settlement-config'
import { issueSettlementCharge } from '@/lib/payments/settlement-issuance'
import { createSettlementGateway, SupabaseOrganizationCustomerStore, SupabaseSettlementIssuanceStore } from '@/lib/payments/settlement-server'
import { logger } from '@/lib/observability/logger'
import { createPrivilegedClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type CreateSettlementResult = { ok: boolean; message: string }
export type SettlementPix = { imageBase64: string; copyPaste: string; expiresAt: string }
export type PaySettlementState = { error: string | null; pix: SettlementPix | null; pending: boolean }

const createMessages: Record<string, string> = {
  'Existem comprovantes em analise': 'Analise os comprovantes pendentes antes de fechar o financeiro.',
  'Nenhuma inscricao paga pendente de fechamento': 'Não há inscrições pagas fora de um fechamento.',
  'Sem permissao para fechamento financeiro': 'Somente proprietário ou organizador pode emitir o fechamento.',
}

const issueMessages: Record<string, string> = {
  'Cliente da organizacao indisponivel': 'Não foi possível identificar a organização como pagadora no Asaas.',
  'Sem permissao para fechamento financeiro': 'Somente proprietário ou organizador pode pagar o fechamento.',
  'Fechamento nao esta apto para emissao': 'Este fechamento não está apto para emissão. Atualize a página.',
  'Fechamento cancelado': 'Este fechamento foi cancelado.',
}

export async function createEventSettlement(formData: FormData): Promise<CreateSettlementResult> {
  const eventId = String(formData.get('event_id') || '')
  if (!uuid.test(eventId)) return { ok: false, message: 'Evento inválido.' }
  if (formData.get('confirmed') !== 'yes') return { ok: false, message: 'Confirme a emissão do fechamento.' }
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, message: 'Sua sessão expirou.' }
  const { data: event } = await supabase.from('events').select('id, organization_id').eq('id', eventId).maybeSingle()
  if (!event || !allowsPublicOrganization(event.organization_id)) return { ok: false, message: 'Evento indisponível.' }

  const { data, error } = await supabase.rpc('create_event_financial_settlement', { target_event_id: eventId })
  if (error || !data || typeof data !== 'object' || Array.isArray(data) || data.kind !== 'event_financial_settlement') {
    logger.warn('settlement.create.rejected', { operation: 'create', eventId, result: 'rejected' })
    return { ok: false, message: createMessages[error?.message || ''] || 'Fechamento recusado: confira sua permissão e as inscrições pagas.' }
  }
  revalidatePath(`/admin/eventos/${eventId}/financeiro`)
  return { ok: true, message: 'Fechamento emitido. Os valores ficaram congelados.' }
}

export async function paySettlementPix(_previous: PaySettlementState, formData: FormData): Promise<PaySettlementState> {
  const settlementId = String(formData.get('settlement_id') || '')
  if (!uuid.test(settlementId)) return { error: 'Fechamento inválido.', pix: null, pending: false }
  if (!isPlatformSettlementEnabled()) return { error: 'O pagamento do fechamento via PIX está desligado neste ambiente.', pix: null, pending: false }
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sua sessão expirou.', pix: null, pending: false }

  const { data: settlement } = await supabase
    .from('event_financial_settlements')
    .select('id, event_id, organization_id, status')
    .eq('id', settlementId)
    .maybeSingle()
  if (!settlement || !allowsPublicOrganization(settlement.organization_id)) return { error: 'Fechamento indisponível.', pix: null, pending: false }
  if (settlement.status === 'pago') return { error: 'Este fechamento já está pago.', pix: null, pending: false }

  const [{ data: organization }, { data: profile }, { data: customer }] = await Promise.all([
    supabase.from('organizations').select('nome').eq('id', settlement.organization_id).single(),
    supabase.from('profiles').select('cpf').eq('id', user.id).single(),
    createPrivilegedClient().from('organization_billing_customers').select('state').eq('organization_id', settlement.organization_id).maybeSingle(),
  ])
  const cpf = (profile?.cpf || '').replace(/\D/g, '')
  if (!organization?.nome) return { error: 'Organização indisponível.', pix: null, pending: false }
  if (customer?.state !== 'ready' && !/^(\d{11}|\d{14})$/.test(cpf)) {
    return { error: 'Complete o CPF do seu perfil para identificar a organização como pagadora.', pix: null, pending: false }
  }

  try {
    const { gateway, split } = createSettlementGateway()
    const result = await issueSettlementCharge(
      { customerStore: new SupabaseOrganizationCustomerStore(user.id), issuanceStore: new SupabaseSettlementIssuanceStore(split), gateway },
      { settlementId, organizationId: settlement.organization_id, actorId: user.id, customerName: organization.nome, customerCpfCnpj: cpf },
    )
    revalidatePath(`/admin/eventos/${settlement.event_id}/financeiro`)
    if (result.kind === 'busy' || result.kind === 'customer_busy') return { error: 'Outra emissão está em andamento. Atualize a página em instantes.', pix: null, pending: false }
    if (result.kind !== 'issued') {
      return { error: 'A resposta do Asaas ficou incerta. O fechamento foi marcado para conciliação; não tente novamente.', pix: null, pending: false }
    }
    return { error: null, pix: result.pix, pending: result.instructionsPending }
  } catch (error) {
    logger.error('settlement.issue.failed', {
      operation: 'issue',
      eventId: settlement.event_id,
      result: error instanceof GatewayError ? error.code : 'unexpected',
    })
    if (error instanceof GatewayError && error.code === 'configuration') {
      return { error: 'Pagamento do fechamento indisponível: configuração do Asaas Sandbox incompleta.', pix: null, pending: false }
    }
    if (error instanceof GatewayError && error.code === 'request' && !error.reconciliationRequired) {
      return { error: 'O Asaas recusou a cobrança do fechamento. Nenhuma cobrança foi criada.', pix: null, pending: false }
    }
    const message = error instanceof Error ? issueMessages[error.message] : undefined
    return { error: message || 'Não foi possível emitir a cobrança do fechamento. Nenhuma nova tentativa foi feita automaticamente.', pix: null, pending: false }
  }
}
