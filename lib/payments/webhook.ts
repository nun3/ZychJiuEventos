import { createHash, timingSafeEqual } from 'node:crypto'
import { isSettlementReference } from '../finance/settlement'
import type { PaymentObservation } from './domain'

export type AsaasWebhookEvent = {
  id: string
  event: string
  payment: {
    id: string
    externalReference: string
    value: number
    billingType: 'PIX' | 'BOLETO'
    status: string
  }
}

export const MAX_WEBHOOK_BODY_BYTES = 64 * 1024

export async function readLimitedText(body: ReadableStream<Uint8Array> | null, maximum = MAX_WEBHOOK_BODY_BYTES) {
  if (!body || !Number.isSafeInteger(maximum) || maximum < 1) throw new Error('Corpo inválido.')
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let size = 0
  let text = ''
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > maximum) {
      await reader.cancel()
      throw new Error('Corpo excede o limite.')
    }
    text += decoder.decode(value, { stream: true })
  }
  return text + decoder.decode()
}

export function authenticateAsaasWebhook(provided: string | null, expected: string | undefined): boolean {
  if (!expected || expected.length < 32 || expected.length > 255 || /\s/.test(expected) || !provided || provided.length > 255) return false
  return timingSafeEqual(createHash('sha256').update(provided).digest(), createHash('sha256').update(expected).digest())
}

export function webhookObservation(event: string): PaymentObservation {
  switch (event) {
    case 'PAYMENT_CREATED': return 'awaiting'
    case 'PAYMENT_RECEIVED': return 'received'
    case 'PAYMENT_OVERDUE': return 'overdue'
    case 'PAYMENT_DELETED': return 'deleted'
    case 'PAYMENT_REFUNDED': return 'refunded'
    default: return 'review'
  }
}

export function parseAsaasWebhook(value: unknown): AsaasWebhookEvent {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Payload inválido.')
  const data = value as Record<string, unknown>
  const payment = data.payment
  if (!payment || typeof payment !== 'object' || Array.isArray(payment)) throw new Error('Cobrança ausente.')
  const details = payment as Record<string, unknown>
  if (typeof data.id !== 'string' || !data.id.trim() || data.id.length > 128
    || typeof data.event !== 'string' || !data.event.trim() || data.event.length > 80
    || typeof details.id !== 'string' || !details.id.trim() || details.id.length > 128
    || typeof details.externalReference !== 'string' || !details.externalReference.trim() || details.externalReference.length > 128
    || (typeof details.value !== 'string' && typeof details.value !== 'number')
    || (details.billingType !== 'PIX' && details.billingType !== 'BOLETO')
    || typeof details.status !== 'string' || !details.status.trim() || details.status.length > 40) throw new Error('Payload de cobrança inválido.')
  const amountText = String(details.value).trim()
  const amount = Number(amountText)
  if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(amountText) || !Number.isFinite(amount) || amount <= 0 || amount > 9999999999.99) {
    throw new Error('Valor de cobrança inválido.')
  }
  return {
    id: data.id.trim(),
    event: data.event.trim(),
    payment: {
      id: details.id.trim(),
      externalReference: details.externalReference.trim(),
      value: amount,
      billingType: details.billingType,
      status: details.status.trim(),
    },
  }
}

export type SettlementWebhookEvent = {
  id: string
  event: string
  payment: {
    id: string
    externalReference: string
    value: number
    netValue: number | null
    billingType: string
    status: string
  }
  additionalInfo: { splitId: string } | null
}

export type WebhookEnvelope = { id: string; event: string }

export type WebhookDispatch =
  | { route: 'athlete'; event: AsaasWebhookEvent }
  | { route: 'settlement'; event: SettlementWebhookEvent }
  | { route: 'ignored'; event: WebhookEnvelope; reason: string }

function shortString(value: unknown, maximum: number): string | null {
  return typeof value === 'string' && value.trim() && value.length <= maximum ? value.trim() : null
}

function money(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null
  const text = String(value).trim()
  const amount = Number(text)
  return /^\d{1,10}(?:\.\d{1,2})?$/.test(text) && Number.isFinite(amount) ? amount : null
}

function parseSettlementWebhook(envelope: WebhookEnvelope, details: Record<string, unknown>, data: Record<string, unknown>): SettlementWebhookEvent | null {
  const id = shortString(details.id, 128)
  const externalReference = shortString(details.externalReference, 128)
  const billingType = shortString(details.billingType, 40)
  const status = shortString(details.status, 40)
  const value = money(details.value)
  if (!id || !externalReference || !billingType || !status || value === null || value <= 0) return null
  const netValue = details.netValue == null ? null : money(details.netValue)
  const info = data.additionalInfo
  const splitId = info && typeof info === 'object' && !Array.isArray(info)
    ? shortString((info as Record<string, unknown>).splitId, 128) : null
  return {
    ...envelope,
    payment: { id, externalReference, value, netValue, billingType, status },
    additionalInfo: splitId ? { splitId } : null,
  }
}

/** Dispatch by event first. Only a missing envelope is a client error; anything else is
 * stored and acknowledged so the Asaas queue is never interrupted by events we do not process. */
export function dispatchAsaasWebhook(value: unknown): WebhookDispatch {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Payload inválido.')
  const data = value as Record<string, unknown>
  const id = shortString(data.id, 128)
  const event = shortString(data.event, 80)
  if (!id || !event) throw new Error('Envelope inválido.')
  const envelope = { id, event }
  const payment = data.payment
  if (!event.startsWith('PAYMENT_') || !payment || typeof payment !== 'object' || Array.isArray(payment)) {
    return { route: 'ignored', event: envelope, reason: 'Evento sem cobrança processável' }
  }
  const details = payment as Record<string, unknown>
  if (isSettlementReference(details.externalReference)) {
    const parsed = parseSettlementWebhook(envelope, details, data)
    return parsed
      ? { route: 'settlement', event: parsed }
      : { route: 'ignored', event: envelope, reason: 'Payload de fechamento fora do contrato' }
  }
  if (event.startsWith('PAYMENT_SPLIT_')) {
    return { route: 'ignored', event: envelope, reason: 'Split sem fechamento associado' }
  }
  try {
    return { route: 'athlete', event: parseAsaasWebhook(value) }
  } catch {
    return { route: 'ignored', event: envelope, reason: 'Payload de cobrança fora do contrato' }
  }
}
