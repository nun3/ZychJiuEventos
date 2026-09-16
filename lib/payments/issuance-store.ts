import 'server-only'
import { createPrivilegedClient } from '@/lib/supabase/admin'
import { centsToDecimal } from './domain'
import type { IssuanceClaim, IssuanceStore } from './issuance'
import type { GatewayCharge, ChargeInput } from './gateway'

export class SupabaseIssuanceStore implements IssuanceStore {
  private client = createPrivilegedClient()
  async claim(paymentId: string, actorId: string): Promise<IssuanceClaim> {
    const { data, error } = await this.client.rpc('claim_payment_issuance', { target_payment_id: paymentId, actor_id: actorId })
    if (error) throw new Error('Emissão indisponível: confira permissão, pagador e prazo.')
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Resposta de emissão inválida.')
    if (data.kind === 'busy' || data.kind === 'reconcile') return { kind: data.kind }
    const input = data.input
    if (!input || typeof input !== 'object' || Array.isArray(input)
      || typeof input.customerId !== 'string' || typeof input.reference !== 'string'
      || typeof input.totalCents !== 'number' || !Number.isSafeInteger(input.totalCents)
      || (input.method !== 'pix' && input.method !== 'boleto')
      || typeof input.dueDate !== 'string' || typeof input.description !== 'string') throw new Error('Dados de emissão inválidos.')
    const parsed: ChargeInput = { customerId: input.customerId, reference: input.reference, totalCents: input.totalCents, method: input.method, dueDate: input.dueDate, description: input.description }
    if (data.kind === 'issued' && typeof data.gatewayId === 'string') return { kind: 'issued', gatewayId: data.gatewayId, input: parsed }
    if (data.kind === 'claimed' && typeof data.token === 'string') return { kind: 'claimed', token: data.token, input: parsed }
    throw new Error('Estado de emissão inválido.')
  }
  async complete(paymentId: string, token: string, charge: GatewayCharge) {
    const { error } = await this.client.rpc('complete_payment_issuance', {
      target_payment_id: paymentId, claim_token: token, gateway_id: charge.id,
      reference_value: charge.reference, amount_value: Number(centsToDecimal(charge.totalCents)),
      method_value: charge.method, boleto_value: charge.boletoUrl || '',
    })
    if (error) throw new Error('Não foi possível persistir a emissão.')
  }
  async release(paymentId: string, token: string) {
    const { error } = await this.client.rpc('release_payment_issuance_claim', { target_payment_id: paymentId, claim_token: token })
    if (error) throw new Error('Não foi possível liberar a emissão recusada.')
  }
  async requireReconciliation(paymentId: string, token: string) {
    const { error } = await this.client.rpc('flag_payment_issuance_reconciliation', { target_payment_id: paymentId, claim_token: token })
    if (error) throw new Error('Emissão com resultado incerto; consultar conciliação.')
  }
}
