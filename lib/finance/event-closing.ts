import { centsToDecimal, toCents } from '../payments/domain'
import type { Database } from '../supabase/database.types'

export type RegistrationStatus = Database['public']['Enums']['registration_status']
export type PaymentStatus = Database['public']['Enums']['payment_status']
export type SettlementOrigin = 'baixa_manual' | 'pagamento_confirmado' | null

export type ClosingRegistrationInput = {
  id: string
  status: RegistrationStatus
  athleteName: string
  categoryName: string
  paymentStatus: PaymentStatus | null
  paymentAmount: string | number | null
  settlementOrigin: SettlementOrigin
  platformFeeCents: number | null
}

export type ClosingLine = ClosingRegistrationInput & {
  consideredCents: number
  consideredAmount: string
  appliedFeeCents: number
  appliedFeeAmount: string
  netCents: number
  netAmount: string
}

export type EventClosingReport = {
  configuredFeeCents: number
  totals: {
    performedCount: number
    cancelledCount: number
    settledCount: number
    grossRevenueCents: number
    grossRevenue: string
    platformFeeCents: number
    platformFee: string
    netRevenueCents: number
    netRevenue: string
  }
  lines: ClosingLine[]
}

export function isPerformedRegistration(status: RegistrationStatus) {
  return status !== 'rascunho'
}

export function composesGrossRevenue(row: ClosingRegistrationInput) {
  return row.status === 'efetivada' && row.paymentStatus === 'pago' && row.paymentAmount != null
}

function moneyText(value: string | number) {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('Valor monetário inválido.')
    return value.toFixed(2)
  }
  return value
}

export function consideredCents(row: ClosingRegistrationInput) {
  if (!composesGrossRevenue(row)) return 0
  return toCents(moneyText(row.paymentAmount as string | number))
}

// A taxa vem do snapshot gravado na efetivação, nunca da configuração vigente do evento.
export function appliedFeeCents(row: ClosingRegistrationInput) {
  if (!composesGrossRevenue(row)) return 0
  const snapshot = row.platformFeeCents
  if (snapshot == null) return 0
  if (!Number.isSafeInteger(snapshot) || snapshot < 0) throw new Error('Snapshot de taxa inválido.')
  return snapshot
}

export function formatClosingAmount(cents: number) {
  const negative = cents < 0
  const [whole, fraction] = centsToDecimal(Math.abs(cents)).split('.')
  return `${negative ? '-' : ''}R$ ${Number(whole).toLocaleString('pt-BR')},${fraction}`
}

export function settlementOriginLabel(origin: SettlementOrigin) {
  if (origin === 'baixa_manual') return 'Baixa manual'
  if (origin === 'pagamento_confirmado') return 'Pagamento confirmado'
  return '—'
}

function signedDecimal(cents: number) {
  return cents < 0 ? `-${centsToDecimal(-cents)}` : centsToDecimal(cents)
}

export function buildEventClosing(
  rows: ClosingRegistrationInput[],
  options: { configuredFeeCents?: number } = {},
): EventClosingReport {
  const performed = rows.filter((row) => isPerformedRegistration(row.status))
  let grossRevenueCents = 0
  let platformFeeCents = 0
  const lines = performed.map((row) => {
    const cents = consideredCents(row)
    const fee = appliedFeeCents(row)
    grossRevenueCents += cents
    platformFeeCents += fee
    if (!Number.isSafeInteger(grossRevenueCents) || !Number.isSafeInteger(platformFeeCents)) {
      throw new Error('Total fora do limite.')
    }
    return {
      ...row,
      consideredCents: cents,
      consideredAmount: centsToDecimal(cents),
      appliedFeeCents: fee,
      appliedFeeAmount: centsToDecimal(fee),
      netCents: cents - fee,
      netAmount: signedDecimal(cents - fee),
    }
  })
  const netRevenueCents = grossRevenueCents - platformFeeCents
  return {
    configuredFeeCents: options.configuredFeeCents ?? 0,
    totals: {
      performedCount: performed.length,
      cancelledCount: performed.filter((row) => row.status === 'cancelada').length,
      settledCount: performed.filter((row) => row.status === 'efetivada').length,
      grossRevenueCents,
      grossRevenue: centsToDecimal(grossRevenueCents),
      platformFeeCents,
      platformFee: centsToDecimal(platformFeeCents),
      netRevenueCents,
      netRevenue: signedDecimal(netRevenueCents),
    },
    lines,
  }
}
