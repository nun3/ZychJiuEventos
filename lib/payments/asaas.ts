import { toCents, centsToDecimal, MAX_AMOUNT_CENTS, type PaymentObservation } from './domain'
import { GatewayError, type PaymentGateway, type ChargeInput, type GatewayCharge, type PixInstructions, type CustomerInput, type GatewayCustomer } from './gateway'

const SANDBOX_URL = 'https://api-sandbox.asaas.com/v3'
type JsonObject = Record<string, unknown>
function object(value: unknown): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new GatewayError('response')
  return value as JsonObject
}
function requiredString(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw new GatewayError('response')
  return value
}
export function asaasObservation(status: string): PaymentObservation {
  switch (status) {
    case 'PENDING': return 'awaiting'
    case 'RECEIVED': return 'received'
    case 'OVERDUE': return 'overdue'
    case 'REFUNDED': return 'refunded'
    // CONFIRMED can represent a Pix risk hold; do not settle it automatically.
    default: return 'review'
  }
}
function normalizeCharge(value: unknown): GatewayCharge {
  const data = object(value)
  if (data.billingType !== 'PIX' && data.billingType !== 'BOLETO') throw new GatewayError('response')
  if (typeof data.value !== 'number' && typeof data.value !== 'string') throw new GatewayError('response')
  let totalCents: number
  try { totalCents = toCents(data.value) } catch { throw new GatewayError('response') }
  if (totalCents <= 0) throw new GatewayError('response')
  let boletoUrl: string | null = null
  if (data.bankSlipUrl != null) {
    try {
      const url = new URL(requiredString(data.bankSlipUrl))
      if (url.protocol !== 'https:' || !(url.hostname === 'asaas.com' || url.hostname.endsWith('.asaas.com'))) throw new Error()
      boletoUrl = url.href
    } catch { throw new GatewayError('response') }
  }
  return {
    id: requiredString(data.id), reference: requiredString(data.externalReference), totalCents,
    method: data.billingType === 'PIX' ? 'pix' : 'boleto',
    observation: asaasObservation(requiredString(data.status)), boletoUrl,
  }
}

/** Transport injection is for contract tests. Host is deliberately fixed to Sandbox. */
export class AsaasSandboxGateway implements PaymentGateway {
  constructor(private readonly apiKey: string, private readonly transport: typeof fetch = fetch) {
    if (!apiKey.trim()) throw new GatewayError('configuration')
  }
  async findCustomers(reference: string): Promise<GatewayCustomer[]> {
    if (!reference.trim()) throw new GatewayError('request')
    const data = object(await this.request('/customers?' + new URLSearchParams({ externalReference: reference, limit: '100' })))
    if (!Array.isArray(data.data) || data.hasMore !== false) throw new GatewayError('response', true)
    return data.data.map(value => {
      const customer = object(value)
      if (customer.externalReference !== reference) throw new GatewayError('response', true)
      return { id: requiredString(customer.id), reference }
    })
  }
  async createCustomer(input: CustomerInput): Promise<GatewayCustomer> {
    if (input.name.trim().length < 3 || !/^(\d{11}|\d{14})$/.test(input.cpfCnpj) || !input.reference.trim()) throw new GatewayError('request')
    const response = await this.request('/customers', {
      name: input.name.trim(), cpfCnpj: input.cpfCnpj,
      externalReference: input.reference, notificationDisabled: true,
    })
    try {
      const customer = object(response)
      if (customer.externalReference !== input.reference) throw new GatewayError('response')
      return { id: requiredString(customer.id), reference: input.reference }
    } catch { throw new GatewayError('response', true) }
  }
  private async request(path: string, body?: JsonObject): Promise<unknown> {
    let response: Response
    try {
      response = await this.transport(SANDBOX_URL + path, {
        method: body ? 'POST' : 'GET', redirect: 'error', cache: 'no-store',
        headers: { access_token: this.apiKey, 'Content-Type': 'application/json', 'User-Agent': 'MeuCamp-Sandbox/1.0' },
        ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000),
      })
    } catch {
      // POST outcome may be unknown: reconcile externalReference before another creation.
      throw new GatewayError('transport', !!body)
    }
    if (!response.ok) throw new GatewayError('request', !!body && (response.status >= 500 || response.status === 408), response.status)
    try { return await response.json() } catch { throw new GatewayError('response', !!body) }
  }
  async createCharge(input: ChargeInput): Promise<GatewayCharge> {
    if (!Number.isSafeInteger(input.totalCents) || input.totalCents <= 0 || input.totalCents > MAX_AMOUNT_CENTS || !input.customerId.trim() || !input.reference.trim()
      || !['pix', 'boleto'].includes(input.method) || !/^\d{4}-\d{2}-\d{2}$/.test(input.dueDate)
      || !Number.isFinite(Date.parse(input.dueDate)) || new Date(input.dueDate).toISOString().slice(0, 10) !== input.dueDate
      || input.description.length > 500) throw new GatewayError('request')
    const response = await this.request('/payments', {
      customer: input.customerId, externalReference: input.reference,
      value: Number(centsToDecimal(input.totalCents)), billingType: input.method === 'pix' ? 'PIX' : 'BOLETO',
      dueDate: input.dueDate, description: input.description,
    })
    try {
      const charge = normalizeCharge(response)
      if (charge.reference !== input.reference || charge.totalCents !== input.totalCents || charge.method !== input.method) throw new GatewayError('response')
      return charge
    } catch { throw new GatewayError('response', true) }
  }
  async getCharge(id: string) {
    if (!id.trim()) throw new GatewayError('request')
    const charge = normalizeCharge(await this.request('/payments/' + encodeURIComponent(id)))
    if (charge.id !== id) throw new GatewayError('response')
    return charge
  }
  async findCharges(reference: string) {
    if (!reference.trim()) throw new GatewayError('request')
    const data = object(await this.request('/payments?' + new URLSearchParams({ externalReference: reference, limit: '100' })))
    if (!Array.isArray(data.data) || data.hasMore !== false) throw new GatewayError('response', true)
    const charges = data.data.map(normalizeCharge)
    if (charges.some(c => c.reference !== reference)) throw new GatewayError('response', true)
    return charges
  }
  async getPixInstructions(id: string): Promise<PixInstructions> {
    if (!id.trim()) throw new GatewayError('request')
    const data = object(await this.request('/payments/' + encodeURIComponent(id) + '/pixQrCode'))
    return { imageBase64: requiredString(data.encodedImage), copyPaste: requiredString(data.payload), expiresAt: requiredString(data.expirationDate) }
  }
}
