import assert from 'node:assert/strict';
import { test } from 'node:test';
import { issueReservedPayment, type IssuanceStore } from '../../lib/payments/issuance';
import { AsaasSandboxGateway } from '../../lib/payments/asaas';
import { MAX_WEBHOOK_BODY_BYTES, parseAsaasWebhook, readLimitedText } from '../../lib/payments/webhook';
import { GatewayError, type ChargeInput, type GatewayCharge, type PaymentGateway } from '../../lib/payments/gateway';
import { provisionPaymentCustomer, type CustomerProvisioningStore } from '../../lib/payments/customer-provisioning';
const input: ChargeInput = { customerId: 'cus_test', reference: 'meucamp:test', totalCents: 24690, method: 'pix', dueDate: '2027-01-10', description: 'Teste' };
const charge: GatewayCharge = { id: 'pay_test', reference: input.reference, totalCents: 24690, method: 'pix', observation: 'awaiting', boletoUrl: null };
function fixture() {
  const calls: string[] = [];
  const store: IssuanceStore = {
    claim: async () => { calls.push('claim'); return { kind: 'claimed', token: 'lock', input }; },
    complete: async () => { calls.push('persist'); },
    release: async () => { calls.push('release'); },
    requireReconciliation: async () => { calls.push('reconcile'); },
  };
  const gateway: PaymentGateway = {
    createCharge: async () => { calls.push('create'); return charge; },
    findCharges: async () => { calls.push('find'); return []; },
    getCharge: async () => { calls.push('get'); return charge; },
    getPixInstructions: async () => { calls.push('pix'); return { imageBase64: 'image', copyPaste: 'payload', expiresAt: '2027-01-10' }; },
  };
  return { calls, store, gateway };
}
test('emissão persiste identidade antes de buscar QR e não efetiva inscrição', async () => {
  const f = fixture();
  const result = await issueReservedPayment(f.store, f.gateway, 'payment', 'actor');
  assert.equal(result.kind, 'issued');
  assert.deepEqual(f.calls, ['claim', 'find', 'create', 'persist', 'pix']);
});
test('reserva ocupada ou em conciliação não faz chamadas externas', async () => {
  for (const kind of ['busy', 'reconcile'] as const) {
    const f = fixture();
    f.store.claim = async () => ({ kind });
    assert.equal((await issueReservedPayment(f.store, f.gateway, 'payment', 'actor')).kind, kind);
    assert.deepEqual(f.calls, []);
  }
});
test('cobrança existente pela referência é reutilizada sem POST', async () => {
  const f = fixture();
  f.gateway.findCharges = async () => [charge];
  await issueReservedPayment(f.store, f.gateway, 'payment', 'actor');
  assert.ok(!f.calls.includes('create'));
  assert.ok(f.calls.includes('persist'));
});
test('timeout e falha ao persistir exigem conciliação sem novo POST', async () => {
  for (const step of ['create', 'persist']) {
    const f = fixture();
    if (step === 'create') f.gateway.createCharge = async () => { f.calls.push('create'); throw new Error(); };
    else f.store.complete = async () => { throw new Error(); };
    assert.equal((await issueReservedPayment(f.store, f.gateway, 'payment', 'actor')).kind, 'reconcile');
    assert.equal(f.calls.filter(c => c === 'create').length, 1);
    assert.ok(f.calls.includes('reconcile'));
  }
});
test('recusa HTTP definitiva libera o claim e não exige conciliação', async () => {
  const f = fixture();
  f.gateway.createCharge = async () => { f.calls.push('create'); throw new GatewayError('request', false, 400); };
  await assert.rejects(issueReservedPayment(f.store, f.gateway, 'payment', 'actor'));
  assert.deepEqual(f.calls, ['claim', 'find', 'create', 'release']);
});
test('QR indisponível não invalida emissão nem cria outra cobrança', async () => {
  const f = fixture();
  f.gateway.getPixInstructions = async () => { throw new Error(); };
  const result = await issueReservedPayment(f.store, f.gateway, 'payment', 'actor');
  assert.equal(result.kind, 'issued');
  if (result.kind === 'issued') assert.equal(result.instructionsPending, true);
  assert.equal(f.calls.filter(c => c === 'create').length, 1);
  assert.ok(!f.calls.includes('reconcile'));
});
test('nova consulta de cobrança emitida nunca cria pagamento', async () => {
  const f = fixture();
  f.store.claim = async () => ({ kind: 'issued', gatewayId: charge.id, input });
  await issueReservedPayment(f.store, f.gateway, 'payment', 'actor');
  assert.deepEqual(f.calls, ['get', 'pix']);
});
test('múltiplas cobranças ou valor divergente bloqueiam a emissão', async () => {
  for (const existing of [[charge, charge], [{ ...charge, totalCents: 1 }]]) {
    const f = fixture();
    f.gateway.findCharges = async () => existing;
    assert.equal((await issueReservedPayment(f.store, f.gateway, 'payment', 'actor')).kind, 'reconcile');
    assert.ok(!f.calls.includes('create'));
  }
});
test('pagador é criado sem notificações e não expõe dados no retorno', async () => {
  const gateway = new AsaasSandboxGateway('test', async (url, init) => {
    assert.equal(url, 'https://api-sandbox.asaas.com/v3/customers');
    const body = JSON.parse(String(init?.body));
    assert.equal(body.notificationDisabled, true);
    assert.equal(body.externalReference, 'actor:test');
    return new Response(JSON.stringify({ id: 'cus_test', externalReference: 'actor:test', cpfCnpj: body.cpfCnpj }));
  });
  const result = await gateway.createCustomer({ name: 'Pagador fictício', cpfCnpj: '12345678909', reference: 'actor:test' });
  assert.deepEqual(result, { id: 'cus_test', reference: 'actor:test' });
});
test('busca pagador pela referência e recusa resultados divergentes', async () => {
  const gateway = new AsaasSandboxGateway('test', async url => {
    assert.match(String(url), /externalReference=actor%3Atest/);
    return new Response(JSON.stringify({ data: [{ id: 'cus_test', externalReference: 'other' }], hasMore: false }));
  });
  await assert.rejects(gateway.findCustomers('actor:test'));
});
test('parser de webhook aceita somente cobrança Asaas completa', () => {
  const event = parseAsaasWebhook({
    id: 'evt_test', event: 'PAYMENT_RECEIVED',
    payment: { id: 'pay_test', externalReference: 'meucamp:test', value: 246.9, billingType: 'PIX', status: 'RECEIVED' },
  });
  assert.equal(event.payment.id, 'pay_test');
  assert.equal(event.payment.value, 246.9);
  assert.throws(() => parseAsaasWebhook({ id: 'evt_test', event: 'PAYMENT_RECEIVED' }));
  assert.throws(() => parseAsaasWebhook({
    id: 'evt_test', event: 'PAYMENT_RECEIVED',
    payment: { id: 'pay_test', externalReference: 'meucamp:test', value: 246.9, billingType: 'CARD', status: 'RECEIVED' },
  }));
  for (const value of [0, -1, '1.001', 'NaN', Number.POSITIVE_INFINITY]) {
    assert.throws(() => parseAsaasWebhook({
      id: 'evt_test', event: 'PAYMENT_RECEIVED',
      payment: { id: 'pay_test', externalReference: 'meucamp:test', value, billingType: 'PIX', status: 'RECEIVED' },
    }));
  }
});
test('leitor de webhook limita o corpo antes do parser', async () => {
  const small = new Blob(['{"ok":true}']).stream();
  assert.equal(await readLimitedText(small, 20), '{"ok":true}');
  const large = new Blob(['x'.repeat(MAX_WEBHOOK_BODY_BYTES + 1)]).stream();
  await assert.rejects(readLimitedText(large), /limite/);
});
test('claim concorrente de pagador não consulta nem cria cliente externo', async () => {
  let calls = 0;
  const store: CustomerProvisioningStore = {
    claim: async () => ({ kind: 'busy' }), complete: async () => {}, requireReconciliation: async () => {},
  };
  const gateway = { findCustomers: async () => { calls++; return []; }, createCustomer: async () => { calls++; return { id: 'cus', reference: 'ref' }; } };
  assert.deepEqual(await provisionPaymentCustomer(store, gateway, 'user', 'Pagador Teste', '52998224725'), { kind: 'busy' });
  assert.equal(calls, 0);
});
test('claim novo cria e persiste exatamente um pagador', async () => {
  const calls: string[] = [];
  const store: CustomerProvisioningStore = {
    claim: async () => ({ kind: 'claimed', token: 'token', reference: 'ref' }),
    complete: async (_user, _token, id) => { calls.push(`complete:${id}`); },
    requireReconciliation: async () => { calls.push('reconcile'); },
  };
  const gateway = {
    findCustomers: async () => { calls.push('find'); return []; },
    createCustomer: async () => { calls.push('create'); return { id: 'cus_new', reference: 'ref' }; },
  };
  assert.deepEqual(await provisionPaymentCustomer(store, gateway, 'user', 'Pagador Teste', '52998224725'), { kind: 'ready', customerId: 'cus_new' });
  assert.deepEqual(calls, ['find', 'create', 'complete:cus_new']);
});
test('pagador em conciliação reutiliza cliente encontrado sem novo POST', async () => {
  const calls: string[] = [];
  const store: CustomerProvisioningStore = {
    claim: async () => ({ kind: 'reconcile', token: 'token', reference: 'ref' }),
    complete: async () => { calls.push('complete'); }, requireReconciliation: async () => { calls.push('reconcile'); },
  };
  const gateway = {
    findCustomers: async () => { calls.push('find'); return [{ id: 'cus_existing', reference: 'ref' }]; },
    createCustomer: async () => { calls.push('create'); return { id: 'never', reference: 'ref' }; },
  };
  assert.equal((await provisionPaymentCustomer(store, gateway, 'user', 'Pagador Teste', '52998224725')).kind, 'ready');
  assert.deepEqual(calls, ['find', 'complete']);
});
test('resultado incerto no cadastro exige conciliação e não repete criação', async () => {
  const calls: string[] = [];
  const store: CustomerProvisioningStore = {
    claim: async () => ({ kind: 'claimed', token: 'token', reference: 'ref' }), complete: async () => {},
    requireReconciliation: async () => { calls.push('reconcile'); },
  };
  const gateway = {
    findCustomers: async () => [], createCustomer: async () => { calls.push('create'); throw new Error('timeout'); },
  };
  assert.deepEqual(await provisionPaymentCustomer(store, gateway, 'user', 'Pagador Teste', '52998224725'), { kind: 'reconcile' });
  assert.deepEqual(calls, ['create', 'reconcile']);
});
