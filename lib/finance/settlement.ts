import type { ChargeSplit } from '../payments/gateway'

/** Politica comercial v1 congelada. O valor oficial vive na RPC create_event_financial_settlement. */
export const SETTLEMENT_POLICY_V1 = {
  type: 'FIXED_PER_PAID_REGISTRATION',
  version: 'v1',
  valueCents: 800,
  currency: 'BRL',
} as const

export const SETTLEMENT_SPLIT_PERCENT = 50
export const SETTLEMENT_REFERENCE_PREFIX = 'meucamp:settlement:'

export type SettlementStatus =
  | 'pendente_emissao' | 'emitindo' | 'aguardando_pagamento' | 'reconciliacao' | 'pago' | 'cancelado'
export type SettlementDistributionStatus = 'pendente' | 'concluido' | 'falhou'

export function computeSettlementTotals(registrationCount: number, feePerRegistrationCents: number = SETTLEMENT_POLICY_V1.valueCents) {
  if (!Number.isSafeInteger(registrationCount) || registrationCount < 0) throw new Error('Quantidade de inscrições inválida.')
  if (!Number.isSafeInteger(feePerRegistrationCents) || feePerRegistrationCents <= 0) throw new Error('Taxa por inscrição inválida.')
  const totalCents = registrationCount * feePerRegistrationCents
  if (!Number.isSafeInteger(totalCents)) throw new Error('Total fora do limite.')
  return { registrationCount, feePerRegistrationCents, totalCents }
}

export type SettlementSplitConfig = {
  recipientWalletId: string | undefined
  percent: string | number | undefined
  issuerWalletId?: string | null
}

/** Somente a conta recebedora entra no array; a conta emissora fica com o restante por definicao do Asaas. */
export function buildSettlementSplit(config: SettlementSplitConfig): ChargeSplit[] {
  const walletId = config.recipientWalletId?.trim() || ''
  if (!/^[A-Za-z0-9-]{8,64}$/.test(walletId)) throw new Error('Wallet recebedora inválida.')
  if (config.issuerWalletId && config.issuerWalletId.trim() === walletId) throw new Error('A conta emissora não pode receber split de si mesma.')
  const percent = Number(config.percent)
  if (percent !== SETTLEMENT_SPLIT_PERCENT) throw new Error('Percentual de split fora da política aprovada.')
  return [{ walletId, percentualValue: percent }]
}

export function settlementReference(settlementId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(settlementId)) throw new Error('Fechamento inválido.')
  return SETTLEMENT_REFERENCE_PREFIX + settlementId
}

export function isSettlementReference(reference: unknown): reference is string {
  return typeof reference === 'string' && reference.startsWith(SETTLEMENT_REFERENCE_PREFIX)
}

export function maskIdentifier(value: string | null | undefined) {
  if (!value) return '—'
  const text = value.trim()
  if (text.length <= 8) return '••••'
  return `${text.slice(0, 4)}…${text.slice(-4)}`
}

export const settlementStatusLabel: Record<SettlementStatus, string> = {
  pendente_emissao: 'Aguardando emissão',
  emitindo: 'Emitindo cobrança',
  aguardando_pagamento: 'Aguardando pagamento',
  reconciliacao: 'Em conciliação',
  pago: 'Pago',
  cancelado: 'Cancelado',
}

export const distributionStatusLabel: Record<SettlementDistributionStatus, string> = {
  pendente: 'Split pendente',
  concluido: 'Split concluído',
  falhou: 'Split com falha',
}
