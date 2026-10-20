import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ASAAS_URLS, isAsaasWebhookAuthorized, resolveAsaasConfig, resolveAthleteAsaasConfig } from '../../lib/payments/asaas-config'
import { AsaasSandboxGateway } from '../../lib/payments/asaas'
import { GatewayError } from '../../lib/payments/gateway'
import { readSettlementConfig } from '../../lib/payments/settlement-config'

const SANDBOX_KEY = 'sandbox-key'
const PRODUCTION_KEY = 'production-key'
const SANDBOX_TOKEN = 's'.repeat(32)
const PRODUCTION_TOKEN = 'p'.repeat(32)
const SANDBOX_WALLET = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
const PRODUCTION_WALLET = 'ffffffff-1111-2222-3333-444444444444'

function env(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    ASAAS_ENVIRONMENT: 'sandbox',
    ASAAS_SANDBOX_API_KEY: SANDBOX_KEY,
    ASAAS_WEBHOOK_TOKEN: SANDBOX_TOKEN,
    ASAAS_SPLIT_RECIPIENT_WALLET_ID: SANDBOX_WALLET,
    ASAAS_PRODUCTION_API_KEY: PRODUCTION_KEY,
    ASAAS_PRODUCTION_WEBHOOK_TOKEN: PRODUCTION_TOKEN,
    ASAAS_PRODUCTION_SPLIT_RECIPIENT_WALLET_ID: PRODUCTION_WALLET,
    ASAAS_SPLIT_RECIPIENT_PERCENT: '50',
    PLATFORM_SETTLEMENT_ASAAS_ENABLED: 'true',
    PAYMENTS_MANUAL_ONLY: 'true',
    ...overrides,
  }
}

test('Sandbox resolve URL, chave, token e carteira de Sandbox', () => {
  const config = resolveAsaasConfig(env())
  assert.equal(config.baseUrl, 'https://api-sandbox.asaas.com/v3')
  assert.equal(config.apiKey, SANDBOX_KEY)
  assert.equal(config.webhookToken, SANDBOX_TOKEN)
  assert.equal(config.splitRecipientWalletId, SANDBOX_WALLET)
  assert.equal(readSettlementConfig(env()).split[0]?.walletId, SANDBOX_WALLET)
})

test('Production resolve URL, chave, token e carteira de Production', () => {
  const config = resolveAsaasConfig(env({ ASAAS_ENVIRONMENT: 'production' }))
  assert.equal(config.baseUrl, 'https://api.asaas.com/v3')
  assert.equal(config.baseUrl, ASAAS_URLS.production)
  assert.equal(config.apiKey, PRODUCTION_KEY)
  assert.equal(config.webhookToken, PRODUCTION_TOKEN)
  assert.equal(config.splitRecipientWalletId, PRODUCTION_WALLET)
  assert.equal(readSettlementConfig(env({ ASAAS_ENVIRONMENT: 'production' })).split[0]?.walletId, PRODUCTION_WALLET)
})

test('Production sem API key, token ou carteira falha e não usa Sandbox', () => {
  const production = env({ ASAAS_ENVIRONMENT: 'production' })
  assert.throws(() => resolveAsaasConfig({ ...production, ASAAS_PRODUCTION_API_KEY: '' }), GatewayError)
  assert.equal(isAsaasWebhookAuthorized(PRODUCTION_TOKEN, { ...production, ASAAS_PRODUCTION_WEBHOOK_TOKEN: '' }), false)
  assert.equal(isAsaasWebhookAuthorized(SANDBOX_TOKEN, { ...production, ASAAS_PRODUCTION_WEBHOOK_TOKEN: '' }), false)
  assert.throws(() => readSettlementConfig({ ...production, ASAAS_PRODUCTION_SPLIT_RECIPIENT_WALLET_ID: '' }), GatewayError)
  assert.throws(() => resolveAsaasConfig({ ...production, ASAAS_PRODUCTION_API_KEY: '', ASAAS_PRODUCTION_WEBHOOK_TOKEN: '', ASAAS_PRODUCTION_SPLIT_RECIPIENT_WALLET_ID: '' }), GatewayError)
})

test('ambiente inválido e percentual diferente de 50 falham', () => {
  assert.throws(() => resolveAsaasConfig(env({ ASAAS_ENVIRONMENT: 'live' })), GatewayError)
  assert.throws(() => readSettlementConfig(env({ ASAAS_SPLIT_RECIPIENT_PERCENT: '40' })), GatewayError)
  assert.throws(() => readSettlementConfig(env({ ASAAS_ENVIRONMENT: 'production', ASAAS_SPLIT_RECIPIENT_PERCENT: '40' })), GatewayError)
})

test('flags de atleta e fechamento continuam fechando cada fluxo', () => {
  assert.throws(() => resolveAthleteAsaasConfig(env({ PAYMENTS_MANUAL_ONLY: 'true', ASAAS_ENVIRONMENT: 'production' })), GatewayError)
  assert.throws(() => readSettlementConfig(env({ PLATFORM_SETTLEMENT_ASAAS_ENABLED: 'false', ASAAS_ENVIRONMENT: 'production' })), GatewayError)
})

test('gateway de Production consulta o host de Production', async () => {
  const urls: string[] = []
  const transport = (async (url: string | URL | Request) => {
    urls.push(String(url))
    return new Response(JSON.stringify({ id: 'pay_1', externalReference: 'ref', value: 8, billingType: 'PIX', status: 'PENDING' }))
  }) as typeof fetch
  await new AsaasSandboxGateway('key', transport, ASAAS_URLS.production).getCharge('pay_1')
  assert.deepEqual(urls, ['https://api.asaas.com/v3/payments/pay_1'])
  assert.throws(() => new AsaasSandboxGateway('key', transport, 'https://example.test'), GatewayError)
})
