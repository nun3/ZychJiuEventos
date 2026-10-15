import type { PaymentMethod, PaymentObservation } from './domain'

export type ChargeSplit = { walletId: string; percentualValue: number }
export type ChargeInput = {
  customerId: string; reference: string; totalCents: number;
  method: PaymentMethod; dueDate: string; description: string
  split?: ChargeSplit[]
}
export type GatewayChargeSplit = ChargeSplit & { id: string | null; status: string | null }
export type GatewayCharge = {
  id: string; reference: string; totalCents: number; method: PaymentMethod;
  observation: PaymentObservation; boletoUrl: string | null
  netValueCents?: number | null; split?: GatewayChargeSplit[]
}
export type PixInstructions = { imageBase64: string; copyPaste: string; expiresAt: string }
export type CustomerInput = { name: string; cpfCnpj: string; reference: string }
export type GatewayCustomer = { id: string; reference: string }
export interface PaymentGateway {
  createCharge(input: ChargeInput): Promise<GatewayCharge>
  getCharge(id: string): Promise<GatewayCharge>
  getPixInstructions(id: string): Promise<PixInstructions>
  findCharges(reference: string): Promise<GatewayCharge[]>
}

export class GatewayError extends Error {
  constructor(public readonly code: 'configuration' | 'request' | 'transport' | 'response', public readonly reconciliationRequired = false, public readonly httpStatus?: number) {
    super('Não foi possível concluir a comunicação com o gateway.')
    this.name = 'GatewayError'
  }
}
