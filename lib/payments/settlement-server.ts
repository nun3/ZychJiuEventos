import 'server-only'
import { createPrivilegedClient } from '@/lib/supabase/admin'
import { AsaasSandboxGateway } from './asaas'
import type { CustomerClaim, CustomerProvisioningStore } from './customer-provisioning'
import { centsToDecimal } from './domain'
import { GatewayError, type ChargeInput, type ChargeSplit, type GatewayCharge } from './gateway'
import type { IssuanceClaim, IssuanceStore } from './issuance'
import { readSettlementConfig } from './settlement-config'
import { assertSettlementSplit } from './settlement-issuance'

export function createSettlementGateway() {
  const config = readSettlementConfig()
  return { gateway: new AsaasSandboxGateway(config.apiKey, fetch, config.baseUrl), split: config.split }
}

export class SupabaseOrganizationCustomerStore implements CustomerProvisioningStore {
  private client = createPrivilegedClient()
  constructor(private readonly actorId: string) {}
  async claim(organizationId: string): Promise<CustomerClaim> {
    const { data, error } = await this.client.rpc('claim_organization_billing_customer', { target_organization_id: organizationId, actor_id: this.actorId })
    if (error || !data || typeof data !== 'object' || Array.isArray(data) || typeof data.kind !== 'string') throw new GatewayError('configuration')
    if (data.kind === 'busy') return { kind: 'busy' }
    if (data.kind === 'ready' && typeof data.customerId === 'string') return { kind: 'ready', customerId: data.customerId }
    if ((data.kind === 'claimed' || data.kind === 'reconcile') && typeof data.token === 'string' && typeof data.reference === 'string') {
      return { kind: data.kind, token: data.token, reference: data.reference }
    }
    throw new GatewayError('response', true)
  }
  async complete(organizationId: string, token: string, gatewayCustomerId: string) {
    const { error } = await this.client.rpc('complete_organization_billing_customer', { target_organization_id: organizationId, claim_token: token, gateway_id: gatewayCustomerId })
    if (error) throw new GatewayError('configuration', true)
  }
  async requireReconciliation(organizationId: string, token: string) {
    const { error } = await this.client.rpc('flag_organization_billing_customer_reconciliation', { target_organization_id: organizationId, claim_token: token })
    if (error) throw new GatewayError('configuration', true)
  }
}

export class SupabaseSettlementIssuanceStore implements IssuanceStore {
  private client = createPrivilegedClient()
  constructor(private readonly split: ChargeSplit[]) {}
  async claim(settlementId: string, actorId: string): Promise<IssuanceClaim> {
    const { data, error } = await this.client.rpc('claim_settlement_issuance', { target_settlement_id: settlementId, actor_id: actorId })
    if (error) throw new Error(error.message)
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Resposta de emissão inválida.')
    if (data.kind === 'busy' || data.kind === 'reconcile') return { kind: data.kind }
    const input = data.input
    if (!input || typeof input !== 'object' || Array.isArray(input)
      || typeof input.customerId !== 'string' || typeof input.reference !== 'string'
      || typeof input.totalCents !== 'number' || !Number.isSafeInteger(input.totalCents)
      || input.method !== 'pix' || typeof input.dueDate !== 'string' || typeof input.description !== 'string') throw new Error('Dados de emissão inválidos.')
    const parsed: ChargeInput = {
      customerId: input.customerId, reference: input.reference, totalCents: input.totalCents,
      method: 'pix', dueDate: input.dueDate, description: input.description, split: this.split,
    }
    if (data.kind === 'issued' && typeof data.gatewayId === 'string') return { kind: 'issued', gatewayId: data.gatewayId, input: parsed }
    if (data.kind === 'claimed' && typeof data.token === 'string') return { kind: 'claimed', token: data.token, input: parsed }
    throw new Error('Estado de emissão inválido.')
  }
  async complete(settlementId: string, token: string, charge: GatewayCharge) {
    assertSettlementSplit(charge, this.split)
    const { error } = await this.client.rpc('complete_settlement_issuance', {
      target_settlement_id: settlementId, claim_token: token, gateway_id: charge.id,
      reference_value: charge.reference, amount_value: Number(centsToDecimal(charge.totalCents)),
      wallet_id: this.split[0].walletId, percent_value: this.split[0].percentualValue,
      split_value: charge.split?.find(item => item.walletId === this.split[0].walletId)?.id || '',
    })
    if (error) throw new Error('Não foi possível persistir a emissão do fechamento.')
  }
  async release(settlementId: string, token: string) {
    const { error } = await this.client.rpc('release_settlement_issuance_claim', { target_settlement_id: settlementId, claim_token: token })
    if (error) throw new Error('Não foi possível liberar a emissão recusada.')
  }
  async requireReconciliation(settlementId: string, token: string) {
    const { error } = await this.client.rpc('flag_settlement_issuance_reconciliation', { target_settlement_id: settlementId, claim_token: token })
    if (error) throw new Error('Emissão com resultado incerto; consultar conciliação.')
  }
}
