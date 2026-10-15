import { buildSettlementSplit } from '../finance/settlement'
import { GatewayError, type ChargeSplit } from './gateway'

export type SettlementConfig = { apiKey: string; split: ChargeSplit[] }

/** Platform settlement is independent of PAYMENTS_MANUAL_ONLY, which only governs the athlete checkout. */
export function isPlatformSettlementEnabled(env: NodeJS.ProcessEnv = process.env) {
  return env.PLATFORM_SETTLEMENT_ASAAS_ENABLED === 'true'
}

export function readSettlementConfig(env: NodeJS.ProcessEnv = process.env): SettlementConfig {
  if (!isPlatformSettlementEnabled(env) || env.ASAAS_ENVIRONMENT !== 'sandbox' || !env.ASAAS_SANDBOX_API_KEY?.trim()) {
    throw new GatewayError('configuration')
  }
  let split: ChargeSplit[]
  try {
    split = buildSettlementSplit({ recipientWalletId: env.ASAAS_SPLIT_RECIPIENT_WALLET_ID, percent: env.ASAAS_SPLIT_RECIPIENT_PERCENT })
  } catch {
    throw new GatewayError('configuration')
  }
  return { apiKey: env.ASAAS_SANDBOX_API_KEY, split }
}
