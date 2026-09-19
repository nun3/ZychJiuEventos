import assert from 'node:assert/strict';
import { test } from 'node:test';
import { toCents, centsToDecimal, preparePaymentBatch, decidePaymentState } from '../../lib/payments/domain';
import { AsaasSandboxGateway, asaasObservation } from '../../lib/payments/asaas';
import { GatewayError, type ChargeInput } from '../../lib/payments/gateway';
import { authenticateAsaasWebhook, webhookObservation } from '../../lib/payments/webhook';
import { isPaymentsManualOnly } from '../../lib/payments/manual-only';

const charge: ChargeInput = { customerId: 'cus_test', reference: 'internal-1', totalCents: 12345, method: 'pix', dueDate: '2027-01-10', description: 'Inscrições de teste' };
const payload = { id: 'pay_test', externalReference: 'internal-1', value: 123.45, billingType: 'PIX', status: 'PENDING' };
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status });
const registration = { id: '1', eventId: 'event-1', amount: '0.10', status: 'pendente_pagamento' };

test('dinheiro usa centavos inteiros e rejeita arredondamento implícito', () => {
  assert.equal(toCents('123.45'), 12345);
  assert.equal(centsToDecimal(12345), '123.45');
  assert.equal(toCents('0.1') + toCents('0.2'), 30);
  assert.equal(toCents('9999999999.99'), 999999999999);
  assert.throws(() => toCents('10000000000.00'));
  for (const value of ['1.001', '-1', 'NaN', '1e3', '12,50', '9007199254740992']) assert.throws(() => toCents(value));
});
test('lote soma os registros autorizados do mesmo evento', () => {
  const result = preparePaymentBatch([registration, { ...registration, id: '2', amount: '0.20' }], new Set(['1', '2']));
  assert.equal(result.totalCents, 30);
  assert.deepEqual(result.registrationIds, ['1', '2']);
});
test('lote rejeita mistura, duplicidade, ausência de permissão e estados inválidos', () => {
  const allowed = new Set(['1', '2']);
  assert.throws(() => preparePaymentBatch([], allowed));
  assert.throws(() => preparePaymentBatch([registration, registration], allowed), /duplicada/);
  assert.throws(() => preparePaymentBatch([registration], new Set()), /permissão/);
  assert.throws(() => preparePaymentBatch([registration, { ...registration, id: '2', eventId: 'outro' }], allowed), /mesmo evento/);
  assert.throws(() => preparePaymentBatch([{ ...registration, status: 'efetivada' }], allowed));
  assert.throws(() => preparePaymentBatch([{ ...registration, amount: '0' }], allowed));
});
test('pagamento confirmado não regride com notificações atrasadas', () => {
  for (const observation of ['awaiting', 'overdue', 'deleted', 'received'] as const) {
    assert.equal(decidePaymentState('pago', observation).state, 'pago');
  }
  assert.equal(decidePaymentState('aguardando', 'received').state, 'pago');
  assert.equal(decidePaymentState('pago', 'refunded').state, 'estornado');
  assert.deepEqual(decidePaymentState('expirado', 'received'), { state: 'expirado', reconcile: true });
  assert.equal(decidePaymentState('estornado', 'received').state, 'estornado');
});
test('CONFIRMED e estorno parcial exigem conciliação, sem efetivação automática', () => {
  assert.equal(asaasObservation('CONFIRMED'), 'review');
  assert.equal(webhookObservation('PAYMENT_PARTIALLY_REFUNDED'), 'review');
  assert.equal(asaasObservation('UNKNOWN'), 'review');
  assert.equal(webhookObservation('PAYMENT_RECEIVED'), 'received');
});
test('autenticação de webhook exige segredo correto e configuração válida', () => {
  const token = 'teste-aleatorio-' + 'a'.repeat(32);
  assert.equal(authenticateAsaasWebhook(token, token), true);
  assert.equal(authenticateAsaasWebhook('errado', token), false);
  assert.equal(authenticateAsaasWebhook(null, token), false);
  assert.equal(authenticateAsaasWebhook(token, undefined), false);
  assert.equal(authenticateAsaasWebhook('curto', 'curto'), false);
});
test('adaptador envia PIX exclusivamente ao Sandbox com valores e referência corretos', async () => {
  let calls = 0;
  const gateway = new AsaasSandboxGateway('test-secret', async (url, init) => {
    calls++;
    assert.equal(url, 'https://api-sandbox.asaas.com/v3/payments');
    assert.equal(init?.method, 'POST');
    assert.equal(init?.redirect, 'error');
    assert.equal((init?.headers as Record<string, string>).access_token, 'test-secret');
    const data = JSON.parse(String(init?.body));
    assert.equal(data.value, 123.45);
    assert.equal(data.billingType, 'PIX');
    assert.equal(data.externalReference, charge.reference);
    return json(payload);
  });
  assert.equal((await gateway.createCharge(charge)).observation, 'awaiting');
  assert.equal(calls, 1);
});
test('boleto preserva URL HTTPS e método', async () => {
  const gateway = new AsaasSandboxGateway('test', async () => json({ ...payload, billingType: 'BOLETO', bankSlipUrl: 'https://sandbox.asaas.com/b/test' }));
  assert.equal((await gateway.createCharge({ ...charge, method: 'boleto' })).boletoUrl, 'https://sandbox.asaas.com/b/test');
});
test('consulta PIX usa GET sem corpo e retorna instruções', async () => {
  const gateway = new AsaasSandboxGateway('test', async (url, init) => {
    assert.equal(url, 'https://api-sandbox.asaas.com/v3/payments/pay_test/pixQrCode');
    assert.equal(init?.method, 'GET');
    assert.equal(init?.body, undefined);
    return json({ encodedImage: 'base64', payload: 'copia-cola', expirationDate: '2027-01-10 23:59:00' });
  });
  assert.equal((await gateway.getPixInstructions('pay_test')).copyPaste, 'copia-cola');
});
test('timeout de criação exige conciliação e não repete o POST', async () => {
  let calls = 0;
  const gateway = new AsaasSandboxGateway('test', async () => { calls++; throw new Error('contains-secret'); });
  await assert.rejects(gateway.createCharge(charge), (error: unknown) => error instanceof GatewayError && error.reconciliationRequired && !error.message.includes('contains-secret'));
  assert.equal(calls, 1);
});
test('resposta inválida após criação e valores divergentes exigem conciliação', async () => {
  for (const data of [null, { ...payload, value: 1 }, { ...payload, externalReference: 'outro' }]) {
    const gateway = new AsaasSandboxGateway('test', async () => json(data));
    await assert.rejects(gateway.createCharge(charge), (e: unknown) => e instanceof GatewayError && e.reconciliationRequired);
  }
});
test('falhas HTTP não expõem corpo e erros 500 não provocam retry', async () => {
  const gateway = new AsaasSandboxGateway('test', async () => json({ secret: 'private', cpf: 'private' }, 500));
  await assert.rejects(gateway.createCharge(charge), (e: unknown) => e instanceof GatewayError && e.httpStatus === 500 && e.reconciliationRequired && !e.message.includes('private'));
});
test('consulta por referência não oculta múltiplas cobranças', async () => {
  const gateway = new AsaasSandboxGateway('test', async url => {
    assert.match(String(url), /externalReference=internal-1/);
    return json({ data: [payload, { ...payload, id: 'pay_second' }], hasMore: false });
  });
  assert.equal((await gateway.findCharges('internal-1')).length, 2);
});
test('configuração e entradas inválidas não fazem chamadas', async () => {
  assert.throws(() => new AsaasSandboxGateway(''));
  const gateway = new AsaasSandboxGateway('test', async () => { throw new Error('não deveria chamar'); });
  await assert.rejects(gateway.createCharge({ ...charge, totalCents: 1.2 }), (e: unknown) => e instanceof GatewayError && e.code === 'request');
  await assert.rejects(gateway.createCharge({ ...charge, dueDate: '2027-02-30' }), (e: unknown) => e instanceof GatewayError && e.code === 'request');
});
test('consulta valida identidade e recusa paginação incompleta', async () => {
  const gateway = new AsaasSandboxGateway('test', async () => json(payload));
  await assert.rejects(gateway.getCharge('pay_other'), (e: unknown) => e instanceof GatewayError && e.code === 'response');
  const paginated = new AsaasSandboxGateway('test', async () => json({ data: [payload], hasMore: true }));
  await assert.rejects(paginated.findCharges('internal-1'), (e: unknown) => e instanceof GatewayError && e.reconciliationRequired);
});
test('modo manual de go-live é explícito e não depende do Asaas', () => {
  assert.equal(isPaymentsManualOnly({ PAYMENTS_MANUAL_ONLY: 'true' }), true);
  assert.equal(isPaymentsManualOnly({ PAYMENTS_MANUAL_ONLY: 'false' }), false);
  assert.equal(isPaymentsManualOnly({}), false);
});
