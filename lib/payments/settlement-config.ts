import { buildSettlementSplit } from '../finance/settlement'
import type { AsaasEnvironment } from './asaas'
import { GatewayError, type ChargeSplit } from './gateway'

export type SettlementConfig = { apiKey: string; environment: AsaasEnvironment; split: ChargeSplit[] }

/** Platform settlement is independent of PAYMENTS_MANUAL_ONLY, which only governs the athlete checkout. */
export function isPlatformSettlementEnabled(env: NodeJS.ProcessEnv = process.env) {
  return env.PLATFORM_SETTLEMENT_ASAAS_ENABLED === 'true'
}

function settlementCredentials(env: NodeJS.ProcessEnv): { environment: AsaasEnvironment; apiKey: string } | null {
  if (env.ASAAS_ENVIRONMENT === 'sandbox' && env.ASAAS_SANDBOX_API_KEY?.trim()) return { environment: 'sandbox', apiKey: env.ASAAS_SANDBOX_API_KEY.trim() }
  if (env.ASAAS_ENVIRONMENT === 'production' && env.ASAAS_PRODUCTION_API_KEY?.trim()) return { environment: 'production', apiKey: env.ASAAS_PRODUCTION_API_KEY.trim() }
  return null
}

export function readSettlementConfig(env: NodeJS.ProcessEnv = process.env): SettlementConfig {
  const credentials = settlementCredentials(env)
  if (!isPlatformSettlementEnabled(env) || !credentials) throw new GatewayError('configuration')
  let split: ChargeSplit[]
  try {
    split = buildSettlementSplit({ recipientWalletId: env.ASAAS_SPLIT_RECIPIENT_WALLET_ID, percent: env.ASAAS_SPLIT_RECIPIENT_PERCENT })
  } catch {
    throw new GatewayError('configuration')
  }
  return { ...credentials, split }
}
