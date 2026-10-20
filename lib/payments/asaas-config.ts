import { authenticateAsaasWebhook } from './webhook'
import { GatewayError } from './gateway'
import { isPaymentsManualOnly } from './manual-only'

export const ASAAS_URLS = {
  sandbox: 'https://api-sandbox.asaas.com/v3',
  production: 'https://api.asaas.com/v3',
} as const

export type AsaasEnvironment = keyof typeof ASAAS_URLS

export type AsaasConfig = {
  environment: AsaasEnvironment
  baseUrl: (typeof ASAAS_URLS)[AsaasEnvironment]
  apiKey: string
  webhookToken: string
  splitRecipientWalletId: string
}

function present(value: string | undefined) {
  const text = value?.trim()
  return text || undefined
}

export function asaasEnvironment(env: NodeJS.ProcessEnv = process.env): AsaasEnvironment {
  if (env.ASAAS_ENVIRONMENT === 'sandbox' || env.ASAAS_ENVIRONMENT === 'production') return env.ASAAS_ENVIRONMENT
  throw new GatewayError('configuration')
}

function accountValue(env: NodeJS.ProcessEnv, sandboxName: string, productionName: string) {
  const environment = asaasEnvironment(env)
  return environment === 'production' ? present(env[productionName]) : present(env[sandboxName])
}

/** Conta completa. Produção nunca lê chave, token ou carteira de Sandbox. */
export function resolveAsaasConfig(env: NodeJS.ProcessEnv = process.env): AsaasConfig {
  const environment = asaasEnvironment(env)
  const apiKey = accountValue(env, 'ASAAS_SANDBOX_API_KEY', 'ASAAS_PRODUCTION_API_KEY')
  const webhookToken = accountValue(env, 'ASAAS_WEBHOOK_TOKEN', 'ASAAS_PRODUCTION_WEBHOOK_TOKEN')
  const splitRecipientWalletId = accountValue(env, 'ASAAS_SPLIT_RECIPIENT_WALLET_ID', 'ASAAS_PRODUCTION_SPLIT_RECIPIENT_WALLET_ID')
  if (!apiKey || !webhookToken || !splitRecipientWalletId) throw new GatewayError('configuration')
  return { environment, baseUrl: ASAAS_URLS[environment], apiKey, webhookToken, splitRecipientWalletId }
}

export function resolveAthleteAsaasConfig(env: NodeJS.ProcessEnv = process.env): AsaasConfig {
  if (isPaymentsManualOnly(env)) throw new GatewayError('configuration')
  return resolveAsaasConfig(env)
}

export function isAsaasWebhookAuthorized(provided: string | null, env: NodeJS.ProcessEnv = process.env) {
  try {
    return authenticateAsaasWebhook(provided, resolveAsaasConfig(env).webhookToken)
  } catch {
    return false
  }
}
