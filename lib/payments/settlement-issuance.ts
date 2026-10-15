import { sameSplit } from './asaas'
import { provisionPaymentCustomer, type CustomerProvisioningStore } from './customer-provisioning'
import { GatewayError, type ChargeSplit, type GatewayCharge, type PaymentGateway } from './gateway'
import { issueReservedPayment, type IssuanceResult, type IssuanceStore } from './issuance'
import type { AsaasSandboxGateway } from './asaas'

export type SettlementGateway = PaymentGateway & Pick<AsaasSandboxGateway, 'findCustomers' | 'createCustomer'>

export type SettlementIssuanceResult = IssuanceResult | { kind: 'customer_busy' | 'customer_reconcile' }

/** Split evidence returned by Asaas must match the configured recipient; otherwise persistence is refused. */
export function assertSettlementSplit(charge: GatewayCharge, expected: ChargeSplit[]) {
  if (charge.split && !sameSplit(charge.split, expected)) throw new GatewayError('response', true)
}

/** Charge creation never marks the settlement paid; only PAYMENT_RECEIVED does. */
export async function issueSettlementCharge(
  deps: { customerStore: CustomerProvisioningStore; issuanceStore: IssuanceStore; gateway: SettlementGateway },
  args: { settlementId: string; organizationId: string; actorId: string; customerName: string; customerCpfCnpj: string },
): Promise<SettlementIssuanceResult> {
  const customer = await provisionPaymentCustomer(deps.customerStore, deps.gateway, args.organizationId, args.customerName, args.customerCpfCnpj)
  if (customer.kind === 'busy') return { kind: 'customer_busy' }
  if (customer.kind === 'reconcile') return { kind: 'customer_reconcile' }
  return issueReservedPayment(deps.issuanceStore, deps.gateway, args.settlementId, args.actorId)
}
