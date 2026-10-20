import { buildSettlementSplit } from '../finance/settlement'
import { asaasEnvironment, ASAAS_URLS } from './asaas-config'
import { GatewayError, type ChargeSplit } from './gateway'

export type SettlementConfig = { apiKey: string; baseUrl: string; split: ChargeSplit[] }

/** Platform settlement is independent of PAYMENTS_MANUAL_ONLY, which only governs the athlete checkout. */
export function isPlatformSettlementEnabled(env: NodeJS.ProcessEnv = process.env) {
  return env.PLATFORM_SETTLEMENT_ASAAS_ENABLED === 'true'
}

function present(value: string | undefined) {
  const text = value?.trim()
  return text || undefined
}

export function readSettlementConfig(env: NodeJS.ProcessEnv = process.env): SettlementConfig {
  const environment = asaasEnvironment(env)
  const apiKey = environment === 'production' ? present(env.ASAAS_PRODUCTION_API_KEY) : present(env.ASAAS_SANDBOX_API_KEY)
  const walletId = environment === 'production' ? present(env.ASAAS_PRODUCTION_SPLIT_RECIPIENT_WALLET_ID) : present(env.ASAAS_SPLIT_RECIPIENT_WALLET_ID)
  if (!isPlatformSettlementEnabled(env) || !apiKey || !walletId) throw new GatewayError('configuration')
  let split: ChargeSplit[]
  try {
    split = buildSettlementSplit({ recipientWalletId: walletId, percent: env.ASAAS_SPLIT_RECIPIENT_PERCENT })
  } catch {
    throw new GatewayError('configuration')
  }
  return { apiKey, baseUrl: ASAAS_URLS[environment], split }
}
