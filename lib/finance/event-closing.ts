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
}

export type ClosingLine = ClosingRegistrationInput & {
  consideredCents: number
  consideredAmount: string
}

export type EventClosingReport = {
  totals: {
    performedCount: number
    cancelledCount: number
    settledCount: number
    grossRevenueCents: number
    grossRevenue: string
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

export function formatClosingAmount(cents: number) {
  const [whole, fraction] = centsToDecimal(cents).split('.')
  return `R$ ${Number(whole).toLocaleString('pt-BR')},${fraction}`
}

export function settlementOriginLabel(origin: SettlementOrigin) {
  if (origin === 'baixa_manual') return 'Baixa manual'
  if (origin === 'pagamento_confirmado') return 'Pagamento confirmado'
  return '—'
}

export function buildEventClosing(rows: ClosingRegistrationInput[]): EventClosingReport {
  const performed = rows.filter((row) => isPerformedRegistration(row.status))
  let grossRevenueCents = 0
  const lines = performed.map((row) => {
    const cents = consideredCents(row)
    grossRevenueCents += cents
    if (!Number.isSafeInteger(grossRevenueCents)) throw new Error('Total fora do limite.')
    return {
      ...row,
      consideredCents: cents,
      consideredAmount: centsToDecimal(cents),
    }
  })
  return {
    totals: {
      performedCount: performed.length,
      cancelledCount: performed.filter((row) => row.status === 'cancelada').length,
      settledCount: performed.filter((row) => row.status === 'efetivada').length,
      grossRevenueCents,
      grossRevenue: centsToDecimal(grossRevenueCents),
    },
    lines,
  }
}
