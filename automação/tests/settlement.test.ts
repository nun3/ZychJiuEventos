import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  buildSettlementSplit,
  computeSettlementTotals,
  isSettlementReference,
  maskIdentifier,
  SETTLEMENT_POLICY_V1,
  settlementReference,
} from '../../lib/finance/settlement'
import { calculatePlatformFeeCents, DEFAULT_PLATFORM_RATE_BPS } from '../../lib/finance/commercial-fee'
import { AsaasSandboxGateway } from '../../lib/payments/asaas'
import { GatewayError, type ChargeInput, type GatewayCharge } from '../../lib/payments/gateway'
import type { CustomerProvisioningStore } from '../../lib/payments/customer-provisioning'
import type { IssuanceStore } from '../../lib/payments/issuance'
import { readSettlementConfig } from '../../lib/payments/settlement-config'
import { assertSettlementSplit, issueSettlementCharge, type SettlementGateway } from '../../lib/payments/settlement-issuance'
import { dispatchAsaasWebhook } from '../../lib/payments/webhook'

const RECIPIENT = '11111111-2222-3333-4444-555555555555'
const ISSUER = '99999999-8888-7777-6666-555555555555'
const SETTLEMENT_ID = '0f8fad5b-d9cb-469f-a165-70867728950e'

test('política v1 congelada: R$ 8,00 fixo por inscrição paga', () => {
  assert.equal(SETTLEMENT_POLICY_V1.type, 'FIXED_PER_PAID_REGISTRATION')
  assert.equal(SETTLEMENT_POLICY_V1.valueCents, 800)
  assert.equal(computeSettlementTotals(1).feePerRegistrationCents, 800)
})

test('totais para 0, 1, 100 e 125 inscrições', () => {
  assert.equal(computeSettlementTotals(0).totalCents, 0)
  assert.equal(computeSettlementTotals(1).totalCents, 800)
  assert.equal(computeSettlementTotals(100).totalCents, 80_000)
  assert.equal(computeSettlementTotals(125).totalCents, 100_000)
  assert.throws(() => computeSettlementTotals(-1))
  assert.throws(() => computeSettlementTotals(1.5))
})

test('motor percentual antigo permanece intacto', () => {
  assert.equal(calculatePlatformFeeCents(10_000, DEFAULT_PLATFORM_RATE_BPS), 1_000)
})

test('split envia somente a conta recebedora com 50%', () => {
  const split = buildSettlementSplit({ recipientWalletId: RECIPIENT, percent: '50', issuerWalletId: ISSUER })
  assert.deepEqual(split, [{ walletId: RECIPIENT, percentualValue: 50 }])
  assert.ok(!split.some(item => item.walletId === ISSUER))
})

test('split recusa conta emissora, wallet inválida e percentual fora da política', () => {
  assert.throws(() => buildSettlementSplit({ recipientWalletId: ISSUER, percent: 50, issuerWalletId: ISSUER }))
  assert.throws(() => buildSettlementSplit({ recipientWalletId: '', percent: 50 }))
  assert.throws(() => buildSettlementSplit({ recipientWalletId: 'wallet com espaço', percent: 50 }))
  assert.throws(() => buildSettlementSplit({ recipientWalletId: RECIPIENT, percent: 60 }))
  assert.throws(() => buildSettlementSplit({ recipientWalletId: RECIPIENT, percent: undefined }))
})

test('configuração do fechamento independe de PAYMENTS_MANUAL_ONLY e exige Sandbox', () => {
  const env = {
    PAYMENTS_MANUAL_ONLY: 'true', PLATFORM_SETTLEMENT_ASAAS_ENABLED: 'true', ASAAS_ENVIRONMENT: 'sandbox',
    ASAAS_SANDBOX_API_KEY: 'test-key', ASAAS_SPLIT_RECIPIENT_WALLET_ID: RECIPIENT, ASAAS_SPLIT_RECIPIENT_PERCENT: '50',
  } as NodeJS.ProcessEnv
  assert.deepEqual(readSettlementConfig(env).split, [{ walletId: RECIPIENT, percentualValue: 50 }])
  assert.throws(() => readSettlementConfig({ ...env, PLATFORM_SETTLEMENT_ASAAS_ENABLED: 'false' }), GatewayError)
  assert.throws(() => readSettlementConfig({ ...env, ASAAS_ENVIRONMENT: 'production' }), GatewayError)
  assert.throws(() => readSettlementConfig({ ...env, ASAAS_SPLIT_RECIPIENT_PERCENT: '40' }), GatewayError)
})

test('referência e máscara do fechamento', () => {
  assert.equal(settlementReference(SETTLEMENT_ID), `meucamp:settlement:${SETTLEMENT_ID}`)
  assert.ok(isSettlementReference(settlementReference(SETTLEMENT_ID)))
  assert.ok(!isSettlementReference('meucamp:payment:abc'))
  assert.throws(() => settlementReference('abc'))
  assert.equal(maskIdentifier(RECIPIENT), '1111…5555')
  assert.equal(maskIdentifier(null), '—')
})

test('adapter Asaas envia split no POST e valida o split devolvido', async () => {
  let body: Record<string, unknown> = {}
  const input: ChargeInput = {
    customerId: 'cus_org', reference: settlementReference(SETTLEMENT_ID), totalCents: 1600, method: 'pix',
    dueDate: '2027-01-10', description: 'Fechamento', split: [{ walletId: RECIPIENT, percentualValue: 50 }],
  }
  const respond = (split: unknown[]) => async (_url: string | URL | Request, init?: RequestInit) => {
    body = JSON.parse(String(init?.body))
    return new Response(JSON.stringify({ id: 'pay_1', externalReference: input.reference, value: 16, netValue: 15.01, billingType: 'PIX', status: 'PENDING', split }))
  }
  const ok = new AsaasSandboxGateway('key', respond([{ id: 'spl_1', walletId: RECIPIENT, percentualValue: 50, status: 'PENDING' }]) as typeof fetch)
  const charge = await ok.createCharge(input)
  assert.deepEqual(body.split, [{ walletId: RECIPIENT, percentualValue: 50 }])
  assert.equal(charge.netValueCents, 1501)
  assert.equal(charge.split?.[0].id, 'spl_1')
  const wrong = new AsaasSandboxGateway('key', respond([{ walletId: ISSUER, percentualValue: 50 }]) as typeof fetch)
  await assert.rejects(wrong.createCharge(input), (e: unknown) => e instanceof GatewayError && e.reconciliationRequired)
  await assert.rejects(ok.createCharge({ ...input, split: [{ walletId: RECIPIENT, percentualValue: 150 }] }), (e: unknown) => e instanceof GatewayError && e.code === 'request')
})

function settlementFixture() {
  const calls: string[] = []
  const input: ChargeInput = {
    customerId: 'cus_org', reference: settlementReference(SETTLEMENT_ID), totalCents: 1600, method: 'pix',
    dueDate: '2027-01-10', description: 'Fechamento', split: [{ walletId: RECIPIENT, percentualValue: 50 }],
  }
  const charge: GatewayCharge = { id: 'pay_1', reference: input.reference, totalCents: 1600, method: 'pix', observation: 'awaiting', boletoUrl: null, split: [{ id: 'spl_1', walletId: RECIPIENT, percentualValue: 50, status: 'PENDING' }] }
  const customerStore: CustomerProvisioningStore = {
    claim: async () => { calls.push('customer-claim'); return { kind: 'ready', customerId: 'cus_org' } },
    complete: async () => { calls.push('customer-complete') },
    requireReconciliation: async () => { calls.push('customer-reconcile') },
  }
  const issuanceStore: IssuanceStore = {
    claim: async () => { calls.push('claim'); return { kind: 'claimed', token: 'lock', input } },
    complete: async (_id, _token, persisted) => { assertSettlementSplit(persisted, input.split!); calls.push('persist') },
    release: async () => { calls.push('release') },
    requireReconciliation: async () => { calls.push('reconcile') },
  }
  const gateway: SettlementGateway = {
    findCustomers: async () => [],
    createCustomer: async () => ({ id: 'cus_org', reference: 'meucamp:org:x' }),
    createCharge: async (sent) => { calls.push('create'); assert.deepEqual(sent.split, input.split); return charge },
    findCharges: async () => { calls.push('find'); return [] },
    getCharge: async () => { calls.push('get'); return charge },
    getPixInstructions: async () => { calls.push('pix'); return { imageBase64: 'img', copyPaste: 'code', expiresAt: '2027-01-10 23:59:59' } },
  }
  const args = { settlementId: SETTLEMENT_ID, organizationId: 'org', actorId: 'actor', customerName: 'Org Teste', customerCpfCnpj: '12345678909' }
  return { calls, charge, customerStore, issuanceStore, gateway, args }
}

test('emissão do fechamento cria cobrança com split e não marca pago', async () => {
  const f = settlementFixture()
  const result = await issueSettlementCharge(f, f.args)
  assert.equal(result.kind, 'issued')
  assert.deepEqual(f.calls, ['customer-claim', 'claim', 'find', 'create', 'persist', 'pix'])
  assert.ok(!f.calls.includes('paid'))
})

test('emissão idempotente: cobrança existente pela referência não gera novo POST', async () => {
  const f = settlementFixture()
  f.gateway.findCharges = async () => { f.calls.push('find'); return [f.charge] }
  await issueSettlementCharge(f, f.args)
  assert.ok(!f.calls.includes('create'))
  const again = settlementFixture()
  again.issuanceStore.claim = async () => ({ kind: 'issued', gatewayId: 'pay_1', input: { ...again.charge, customerId: 'cus_org', dueDate: '2027-01-10', description: 'x' } as unknown as ChargeInput })
  await issueSettlementCharge(again, again.args)
  assert.ok(!again.calls.includes('create'))
  assert.ok(again.calls.includes('get'))
})

test('split divergente devolvido pelo Asaas exige conciliação', async () => {
  const f = settlementFixture()
  f.gateway.findCharges = async () => [{ ...f.charge, split: [{ id: null, status: null, walletId: ISSUER, percentualValue: 50 }] }]
  assert.equal((await issueSettlementCharge(f, f.args)).kind, 'reconcile')
  assert.ok(f.calls.includes('reconcile'))
})

test('cliente da organização ocupado ou incerto não emite cobrança', async () => {
  for (const kind of ['busy', 'reconcile'] as const) {
    const f = settlementFixture()
    f.customerStore.claim = async () => kind === 'busy' ? { kind } : { kind, token: 't', reference: 'r' }
    f.gateway.findCustomers = async () => { throw new Error('incerto') }
    const result = await issueSettlementCharge(f, f.args)
    assert.equal(result.kind, kind === 'busy' ? 'customer_busy' : 'customer_reconcile')
    assert.ok(!f.calls.includes('create'))
  }
})

const settlementPayment = { id: 'pay_1', externalReference: `meucamp:settlement:${SETTLEMENT_ID}`, value: 16, netValue: 15.01, billingType: 'PIX', status: 'RECEIVED' }

test('dispatch por evento não exige payment globalmente', () => {
  const result = dispatchAsaasWebhook({ id: 'evt_1', event: 'TRANSFER_DONE', transfer: { id: 'tra_1' } })
  assert.equal(result.route, 'ignored')
  assert.throws(() => dispatchAsaasWebhook({ event: 'PAYMENT_RECEIVED' }))
  assert.throws(() => dispatchAsaasWebhook([]))
})

test('PAYMENT_RECEIVED de fechamento vai ao handler de fechamento com netValue real', () => {
  const result = dispatchAsaasWebhook({ id: 'evt_2', event: 'PAYMENT_RECEIVED', payment: settlementPayment })
  assert.equal(result.route, 'settlement')
  if (result.route === 'settlement') assert.equal(result.event.payment.netValue, 15.01)
})

test('PAYMENT_SPLIT_DONE correlaciona splitId e nunca vira erro de cliente', () => {
  const result = dispatchAsaasWebhook({ id: 'evt_3', event: 'PAYMENT_SPLIT_DONE', additionalInfo: { splitId: 'spl_1' }, payment: settlementPayment })
  assert.equal(result.route, 'settlement')
  if (result.route === 'settlement') assert.deepEqual(result.event.additionalInfo, { splitId: 'spl_1' })
  const unrelated = dispatchAsaasWebhook({ id: 'evt_4', event: 'PAYMENT_SPLIT_DONE', additionalInfo: { splitId: 'spl_2' }, payment: { ...settlementPayment, externalReference: 'meucamp:payment:x' } })
  assert.equal(unrelated.route, 'ignored')
  const withoutPayment = dispatchAsaasWebhook({ id: 'evt_5', event: 'PAYMENT_SPLIT_DONE', additionalInfo: { splitId: 'spl_3' } })
  assert.equal(withoutPayment.route, 'ignored')
})

test('cobrança do atleta continua no fluxo existente; payload fora do contrato é ignorado com 200', () => {
  const athlete = dispatchAsaasWebhook({ id: 'evt_6', event: 'PAYMENT_RECEIVED', payment: { ...settlementPayment, externalReference: 'meucamp:payment:abc' } })
  assert.equal(athlete.route, 'athlete')
  const card = dispatchAsaasWebhook({ id: 'evt_7', event: 'PAYMENT_RECEIVED', payment: { ...settlementPayment, externalReference: 'meucamp:payment:abc', billingType: 'CREDIT_CARD' } })
  assert.equal(card.route, 'ignored')
})

test('webhook duplicado produz o mesmo dispatch determinístico', () => {
  const body = { id: 'evt_8', event: 'PAYMENT_SPLIT_DONE', additionalInfo: { splitId: 'spl_1' }, payment: settlementPayment }
  assert.deepEqual(dispatchAsaasWebhook(body), dispatchAsaasWebhook(structuredClone(body)))
})
