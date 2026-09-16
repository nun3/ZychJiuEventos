export type PaymentMethod = 'pix' | 'boleto'
export type PaymentState = 'aguardando' | 'pago' | 'expirado' | 'cancelado' | 'estornado'
export type PaymentObservation = 'awaiting' | 'received' | 'overdue' | 'deleted' | 'refunded' | 'review'
// Same maximum as the database numeric(12,2) columns.
export const MAX_AMOUNT_CENTS = 999999999999

/** Decimal input becomes integer cents before any arithmetic. */
export function toCents(value: string | number): number {
  const text = String(value)
  if (!/^\d+(\.\d{1,2})?$/.test(text)) throw new Error('Valor monetário inválido.')
  const [whole, fraction = ''] = text.split('.')
  const cents = Number(whole + fraction.padEnd(2, '0'))
  if (!Number.isSafeInteger(cents) || cents > MAX_AMOUNT_CENTS) throw new Error('Valor monetário fora do limite.')
  return cents
}

export function centsToDecimal(cents: number): string {
  if (!Number.isSafeInteger(cents) || cents < 0 || cents > MAX_AMOUNT_CENTS) throw new Error('Valor monetário inválido.')
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`
}

export type PayableRegistration = {
  id: string; eventId: string; amount: string | number; status: string
}

/** Input must be loaded and authorized by the server; never accept client prices. */
export function preparePaymentBatch(registrations: PayableRegistration[], authorizedIds: ReadonlySet<string>) {
  if (!registrations.length) throw new Error('Selecione ao menos uma inscrição.')
  const ids = new Set<string>()
  let totalCents = 0
  const eventId = registrations[0].eventId
  for (const r of registrations) {
    if (ids.has(r.id)) throw new Error('Inscrição duplicada no lote.')
    if (!authorizedIds.has(r.id)) throw new Error('Inscrição sem permissão.')
    if (r.eventId !== eventId) throw new Error('Selecione inscrições do mesmo evento.')
    if (r.status !== 'pendente_pagamento') throw new Error('Inscrição não está pendente de pagamento.')
    ids.add(r.id)
    totalCents += toCents(r.amount)
    if (!Number.isSafeInteger(totalCents) || totalCents > MAX_AMOUNT_CENTS) throw new Error('Total fora do limite.')
  }
  if (totalCents <= 0) throw new Error('Cobrança deve possuir valor positivo.')
  return { eventId, registrationIds: Array.from(ids), totalCents }
}

/** A decision only. Persistence, deduplication and registration updates must be atomic in SQL. */
export function decidePaymentState(current: PaymentState, observation: PaymentObservation): { state: PaymentState; reconcile: boolean } {
  if (observation === 'review') return { state: current, reconcile: true }
  if (current === 'estornado') return { state: current, reconcile: observation === 'received' }
  if (observation === 'refunded') return current === 'pago'
    ? { state: 'estornado', reconcile: false } : { state: current, reconcile: true }
  if (current === 'pago') return { state: current, reconcile: false }
  if (observation === 'received') return current === 'aguardando'
    ? { state: 'pago', reconcile: false } : { state: current, reconcile: true }
  if (current !== 'aguardando') return { state: current, reconcile: false }
  if (observation === 'overdue') return { state: 'expirado', reconcile: false }
  if (observation === 'deleted') return { state: 'cancelado', reconcile: false }
  return { state: current, reconcile: false }
}
