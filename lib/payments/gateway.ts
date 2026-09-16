import type { PaymentMethod, PaymentObservation } from './domain'

export type ChargeInput = {
  customerId: string; reference: string; totalCents: number;
  method: PaymentMethod; dueDate: string; description: string
}
export type GatewayCharge = {
  id: string; reference: string; totalCents: number; method: PaymentMethod;
  observation: PaymentObservation; boletoUrl: string | null
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
