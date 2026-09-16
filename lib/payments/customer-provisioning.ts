import type { AsaasSandboxGateway } from './asaas'

export type CustomerClaim =
  | { kind: 'ready'; customerId: string }
  | { kind: 'busy' }
  | { kind: 'claimed' | 'reconcile'; token: string; reference: string }

export interface CustomerProvisioningStore {
  claim(userId: string): Promise<CustomerClaim>
  complete(userId: string, token: string, gatewayCustomerId: string): Promise<void>
  requireReconciliation(userId: string, token: string): Promise<void>
}

export type CustomerProvisioningResult =
  | { kind: 'ready'; customerId: string }
  | { kind: 'busy' | 'reconcile' }

/** Serial claim must be persisted before this function performs an external POST. */
export async function provisionPaymentCustomer(
  store: CustomerProvisioningStore,
  gateway: Pick<AsaasSandboxGateway, 'findCustomers' | 'createCustomer'>,
  userId: string,
  name: string,
  cpfCnpj: string,
): Promise<CustomerProvisioningResult> {
  const claim = await store.claim(userId)
  if (claim.kind === 'ready' || claim.kind === 'busy') return claim
  try {
    const found = await gateway.findCustomers(claim.reference)
    if (found.length > 1) throw new Error('Clientes duplicados.')
    if (found.length === 1) {
      await store.complete(userId, claim.token, found[0].id)
      return { kind: 'ready', customerId: found[0].id }
    }
    // A previous uncertain POST must only be reconciled, never repeated automatically.
    if (claim.kind === 'reconcile') return { kind: 'reconcile' }
    const created = await gateway.createCustomer({ name, cpfCnpj, reference: claim.reference })
    await store.complete(userId, claim.token, created.id)
    return { kind: 'ready', customerId: created.id }
  } catch {
    await store.requireReconciliation(userId, claim.token)
    return { kind: 'reconcile' }
  }
}
