import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { randomUUID } from 'node:crypto';
import { test } from '../support/fixtures';

const { When, Then } = createBdd(test);
const endpoint = '/api/payments/webhook';
const token = () => process.env.E2E_ASAAS_WEBHOOK_TOKEN || '';

When('envia um webhook com credencial {string}', async ({ request, webhookState }, credential: string) => {
  const headers = credential === 'incorreta' ? { 'asaas-access-token': 'credencial-incorreta' } : undefined;
  webhookState.response = await request.post(endpoint, { headers, data: {} });
});

When('envia um webhook incompleto com credencial correta', async ({ request, webhookState }) => {
  expect(token().length).toBeGreaterThanOrEqual(32);
  webhookState.response = await request.post(endpoint, { headers: { 'asaas-access-token': token() }, data: {} });
});

When('envia um webhook autenticado acima do limite', async ({ request, webhookState }) => {
  expect(token().length).toBeGreaterThanOrEqual(32);
  webhookState.response = await request.post(endpoint, {
    headers: { 'asaas-access-token': token(), 'content-type': 'application/json' },
    data: 'x'.repeat(64 * 1024 + 1),
  });
});

Then('o webhook deve responder {int} sem aceitar o evento', async ({ webhookState }, status: number) => {
  expect(webhookState.response).toBeDefined();
  expect(webhookState.response?.status()).toBe(status);
  const body = await webhookState.response?.json();
  expect(body?.accepted).not.toBe(true);
});

When('o Asaas envia duas vezes o recebimento autenticado dessa cobrança', async ({ request, paymentData, webhookState }) => {
  expect(token().length).toBeGreaterThanOrEqual(32);
  const payments = await paymentData.payments();
  expect(payments).toHaveLength(1);
  const attempt = payments[0].payment_attempts[0];
  expect(attempt?.gateway_payment_id).toMatch(/^pay_[A-Za-z0-9]+$/);
  const eventId = `evt_e2e_${randomUUID().replace(/-/g, '')}`;
  paymentData.webhookEventIds.push(eventId);
  const payload = {
    id: eventId,
    event: 'PAYMENT_RECEIVED',
    payment: {
      id: attempt.gateway_payment_id,
      externalReference: payments[0].external_reference,
      value: payments[0].valor_total,
      billingType: payments[0].metodo === 'boleto' ? 'BOLETO' : 'PIX',
      status: 'RECEIVED',
    },
  };
  const headers = { 'asaas-access-token': token() };
  const first = await request.post(endpoint, { headers, data: payload });
  expect(first.status()).toBe(200);
  expect((await first.json()).accepted).toBe(true);
  webhookState.response = await request.post(endpoint, { headers, data: payload });
});

Then('o pagamento e a inscrição devem ser efetivados uma única vez', async ({ paymentData, webhookState }) => {
  expect(webhookState.response?.status()).toBe(200);
  expect(await webhookState.response?.json()).toMatchObject({ accepted: true, duplicate: true });
  const payments = await paymentData.payments();
  expect(payments[0].status).toBe('pago');
  expect(payments[0].payment_attempts).toHaveLength(1);
  expect(payments[0].payment_attempts[0].status).toBe('pago');
  const { data: registrations, error } = await paymentData.admin.from('registrations').select('id, status').in('id', paymentData.registrations);
  expect(error).toBeNull();
  expect(registrations?.find(item => item.id === paymentData.registrations[0])?.status).toBe('efetivada');
  const { data: events, error: eventError } = await paymentData.admin.from('webhook_events').select('status, attempts').in('external_event_id', paymentData.webhookEventIds);
  expect(eventError).toBeNull();
  expect(events).toEqual([{ status: 'processado', attempts: 1 }]);
});
