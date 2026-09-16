import 'server-only'
import { createPrivilegedClient } from '@/lib/supabase/admin'
import { GatewayError } from './gateway'
import { AsaasSandboxGateway } from './asaas'
import { provisionPaymentCustomer, type CustomerClaim, type CustomerProvisioningStore } from './customer-provisioning'

function cpfDigits(value: string) {
  return value.replace(/\D/g, '')
}

export async function ensurePaymentCustomer(gateway: AsaasSandboxGateway, userId: string, name: string, cpf: string) {
  const admin = createPrivilegedClient()
  const store: CustomerProvisioningStore = {
    async claim(actorId) {
      const { data, error } = await admin.rpc('claim_payment_customer', { actor_id: actorId })
      if (error || !data || typeof data !== 'object' || Array.isArray(data) || typeof data.kind !== 'string') throw new GatewayError('configuration')
      if (data.kind === 'busy') return { kind: 'busy' }
      if (data.kind === 'ready' && typeof data.customerId === 'string') return { kind: 'ready', customerId: data.customerId }
      if ((data.kind === 'claimed' || data.kind === 'reconcile') && typeof data.token === 'string' && typeof data.reference === 'string') {
        return { kind: data.kind, token: data.token, reference: data.reference } as CustomerClaim
      }
      throw new GatewayError('response', true)
    },
    async complete(actorId, token, gatewayCustomerId) {
      const { error } = await admin.rpc('complete_payment_customer', { actor_id: actorId, claim_token: token, gateway_id: gatewayCustomerId })
      if (error) throw new GatewayError('configuration', true)
    },
    async requireReconciliation(actorId, token) {
      const { error } = await admin.rpc('flag_payment_customer_reconciliation', { actor_id: actorId, claim_token: token })
      if (error) throw new GatewayError('configuration', true)
    },
  }
  const result = await provisionPaymentCustomer(store, gateway, userId, name, cpfDigits(cpf))
  if (result.kind === 'ready') return result.customerId
  throw new GatewayError('response', result.kind === 'reconcile')
}
