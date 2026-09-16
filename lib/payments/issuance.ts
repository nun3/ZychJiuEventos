import { GatewayError, type ChargeInput, type GatewayCharge, type PaymentGateway, type PixInstructions } from './gateway'

export type IssuanceClaim =
  | { kind: 'busy' }
  | { kind: 'reconcile' }
  | { kind: 'issued'; gatewayId: string; input: ChargeInput }
  | { kind: 'claimed'; token: string; input: ChargeInput }

/** Implement with a server-only, atomic SQL claim that checks actor ownership and deadline.
 * Never implement this lock as process memory or a client-supplied flag.
 * An abandoned claim must become reconciliation-required, never automatically reset.
 */
export interface IssuanceStore {
  claim(paymentId: string, actorId: string): Promise<IssuanceClaim>
  complete(paymentId: string, token: string, charge: GatewayCharge): Promise<void>
  release(paymentId: string, token: string): Promise<void>
  requireReconciliation(paymentId: string, token: string): Promise<void>
}
export type IssuanceResult =
  | { kind: 'busy' | 'reconcile' }
  | { kind: 'issued'; charge: GatewayCharge; pix: PixInstructions | null; instructionsPending: boolean }

function assertMatches(charge: GatewayCharge, input: ChargeInput) {
  if (charge.reference !== input.reference || charge.totalCents !== input.totalCents || charge.method !== input.method) throw new GatewayError('response', true)
}

/** Gateway response never settles a registration; that belongs to webhook reconciliation. */
export async function issueReservedPayment(store: IssuanceStore, gateway: PaymentGateway, paymentId: string, actorId: string): Promise<IssuanceResult> {
  const claim = await store.claim(paymentId, actorId)
  if (claim.kind === 'busy' || claim.kind === 'reconcile') return { kind: claim.kind }
  let charge: GatewayCharge
  if (claim.kind === 'issued') {
    charge = await gateway.getCharge(claim.gatewayId)
    assertMatches(charge, claim.input)
  } else {
    try {
      const existing = await gateway.findCharges(claim.input.reference)
      if (existing.length > 1) throw new GatewayError('response', true)
      charge = existing[0] || await gateway.createCharge(claim.input)
      assertMatches(charge, claim.input)
      // Persist gateway identity before obtaining optional Pix instructions.
      await store.complete(paymentId, claim.token, charge)
    } catch (error) {
      // A validated 4xx response is a definitive refusal: no charge was created,
      // so the claim can be released for a later explicit user retry.
      if (error instanceof GatewayError && !error.reconciliationRequired) {
        await store.release(paymentId, claim.token)
        throw error
      }
      // A timeout, 5xx, malformed response or local persistence failure may
      // have created a charge. Never retry those outcomes automatically.
      await store.requireReconciliation(paymentId, claim.token)
      return { kind: 'reconcile' }
    }
  }
  if (charge.method === 'boleto') return { kind: 'issued', charge, pix: null, instructionsPending: !charge.boletoUrl }
  try {
    return { kind: 'issued', charge, pix: await gateway.getPixInstructions(charge.id), instructionsPending: false }
  } catch {
    // Missing QR code must not trigger another payment creation.
    return { kind: 'issued', charge, pix: null, instructionsPending: true }
  }
}
