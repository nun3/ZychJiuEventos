import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Database } from '../../../lib/supabase/database.types';

// Node-only fixture provisioning. Never inject the private client/key into the page.
export function paymentFixture() {
  if (process.env.E2E_ALLOW_WRITES !== 'true') throw new Error('Pagamentos E2E exigem E2E_ALLOW_WRITES=true no Sandbox.');
  const envPath = path.resolve(__dirname, '../../../.env.local');
  const local = Object.fromEntries((existsSync(envPath) ? readFileSync(envPath, 'utf8') : '')
    .split(/\r?\n/).filter(line => /^[A-Z_]+=/.test(line)).map(line => {
      const i = line.indexOf('=');
      return [line.slice(0, i), line.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')];
    }));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || local.NEXT_PUBLIC_SUPABASE_URL;
  if (new URL(url).hostname !== 'kfvypacjzlzwwblsbpwj.supabase.co') throw new Error('Fixture restrita ao Sandbox autorizado.');
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  const admin = createClient<Database>(url, process.env.SUPABASE_SECRET_KEY || local.SUPABASE_SECRET_KEY, options);
  const actor = createClient<Database>(url, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || local.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);
  const org = randomUUID(), team = randomUUID();
  const events = [randomUUID(), randomUUID()];
  const rules = [randomUUID(), randomUUID()], categories = [randomUUID(), randomUUID()];
  const athletes = [randomUUID(), randomUUID(), randomUUID()];
  const registrations = [randomUUID(), randomUUID(), randomUUID(), randomUUID()];
  const eventNames = events.map((id, i) => `Checkout E2E ${i + 1} ${id}`);
  const athleteNames = athletes.map((id, i) => `Pagador atleta ${i + 1} ${id}`);
  const webhookEventIds: string[] = [];
  let owner = '';
  let originalCpf: string | null | undefined;
  let customerExisted = false;
  const asaasKey = String(process.env.ASAAS_SANDBOX_API_KEY || local.ASAAS_SANDBOX_API_KEY || '').replace(/\\\$/g, '$');
  async function checked(result: PromiseLike<{ error: { message: string } | null }>) {
    const { error } = await result;
    if (error) throw new Error(`Fixture de pagamento: ${error.message}`);
  }
  return {
    admin, events, eventNames, registrations, athleteNames, webhookEventIds,
    async setup() {
      const { data, error } = await actor.auth.signInWithPassword({ email: process.env.E2E_OWNER_EMAIL || '', password: process.env.E2E_OWNER_PASSWORD || '' });
      if (error || !data.user) throw new Error('Credenciais OWNER E2E ausentes ou inválidas.');
      owner = data.user.id;
      await checked(admin.from('organizations').insert({ id: org, nome: 'Checkout E2E', slug: org, created_by: owner }));
      await checked(admin.from('teams').insert({ id: team, organization_id: org, nome: 'Checkout E2E', created_by: owner }));
      // No organization membership is granted: payment authorization must use athlete management.
      await checked(admin.from('athletes').insert(athletes.map((id, i) => ({ id, organization_id: org, team_id: team, nome_completo: athleteNames[i], data_nascimento: '1995-01-01', genero: 'M', faixa: 'Branca', peso_kg: 70 }))));
      await checked(admin.from('athlete_managers').insert(athletes.slice(0, 2).map(id => ({ manager_id: owner, athlete_id: id, relationship_type: 'professor' as const }))));
      for (let i = 0; i < 2; i++) {
        await checked(admin.from('events').insert({ id: events[i], organization_id: org, nome: eventNames[i], slug: events[i], data_evento: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10), local: 'Sandbox E2E', status: 'pagamento', created_by: owner, valor_inscricao: 999 }));
        await checked(admin.from('event_phases').insert({ event_id: events[i], tipo: 'pagamento', inicio: new Date(Date.now() - 86400000).toISOString(), fim: new Date(Date.now() + 86400000).toISOString() }));
        await checked(admin.from('category_rule_sets').insert({ id: rules[i], event_id: events[i], nome: 'Checkout E2E', versao: 1, ativo: true }));
        await checked(admin.from('event_categories').insert({ id: categories[i], rule_set_id: rules[i], nome: 'Adulto E2E', idade_min: 18, idade_max: 99, faixa_min_ordem: 1, faixa_max_ordem: 1, peso_max_kg: 120, genero: 'M' }));
      }
      await checked(admin.from('registrations').insert(registrations.map((id, i) => ({
        id, event_id: events[i === 2 ? 1 : 0], athlete_id: athletes[i === 2 ? 0 : i === 3 ? 2 : i], category_id: categories[i === 2 ? 1 : 0],
        registered_by: owner, status: 'pendente_pagamento' as const, valor: 123.45,
        athlete_snapshot: { nome_completo: athleteNames[i === 2 ? 0 : i === 3 ? 2 : i] }, category_snapshot: { nome: 'Adulto E2E' },
        rule_set_version: 1, terms_version: 'MVP-2026-09', terms_accepted_at: new Date().toISOString(),
      }))));
    },
    async preparePayer() {
      const { data: profile, error } = await admin.from('profiles').select('cpf').eq('id', owner).single();
      if (error) throw new Error('Não foi possível preparar o perfil E2E.');
      originalCpf = profile.cpf;
      const existing = await admin.from('payment_customers').select('user_id', { count: 'exact', head: true }).eq('user_id', owner);
      if (existing.error) throw new Error('Não foi possível verificar o pagador E2E.');
      customerExisted = Boolean(existing.count);
      if (customerExisted) throw new Error('A conta E2E já possui cliente Asaas; use uma conta de teste limpa para a homologação destrutiva.');
      // CPF válido reservado exclusivamente para esta conta de teste durante o cenário.
      await checked(admin.from('profiles').update({ cpf: '52998224725' }).eq('id', owner));
    },
    async payments() {
      const { data, error } = await admin.from('payments').select('id, external_reference, created_by, valor_total, metodo, status, payment_registrations(registration_id, amount), payment_attempts(id, gateway_payment_id, status, pix_copia_cola, boleto_url)').in('event_id', events);
      if (error) throw new Error('Falha ao verificar pagamentos persistidos.');
      return data;
    },
    async expire() {
      await checked(admin.from('event_phases').update({ inicio: new Date(Date.now() - 172800000).toISOString(), fim: new Date(Date.now() - 86400000).toISOString() }).eq('event_id', events[0]));
    },
    async grantEventRole(role: 'owner' | 'organizer' | 'finance' = 'owner') {
      await checked(admin.from('organization_members').insert({ organization_id: org, user_id: owner, role }));
    },
    async auditFor(paymentId: string) {
      const { data, error } = await admin.from('event_audit_logs').select('action, actor_id, reason, before_data, after_data').eq('resource_id', paymentId).order('created_at');
      if (error) throw new Error('Falha ao consultar auditoria financeira.');
      return data;
    },
    async cleanup() {
      // Exact IDs allocated by this fixture only; never erase historical E2E/user data.
      const payments = await this.payments();
      const gatewayPaymentIds = new Set(payments.flatMap(payment => payment.payment_attempts.map(attempt => attempt.gateway_payment_id)).filter((id): id is string => Boolean(id)));
      const customer = await admin.from('payment_customers').select('gateway_customer_id').eq('user_id', owner).maybeSingle();
      if (customer.error) throw new Error('Falha ao consultar limpeza do pagador E2E.');
      async function findSandbox(resource: 'payments' | 'customers', externalReference: string) {
        if (!asaasKey) throw new Error('Chave Asaas Sandbox ausente para limpeza.');
        const query = new URLSearchParams({ externalReference, limit: '100' });
        const response = await fetch(`https://api-sandbox.asaas.com/v3/${resource}?${query}`, {
          headers: { access_token: asaasKey, accept: 'application/json', 'User-Agent': 'MeuCamp-E2E/1.0' },
          redirect: 'error', signal: AbortSignal.timeout(15000),
        });
        if (!response.ok) throw new Error(`Falha HTTP ${response.status} na consulta de limpeza Asaas Sandbox.`);
        const body = await response.json() as { data?: Array<{ id?: unknown }> };
        return (body.data ?? []).map(item => String(item.id ?? ''));
      }
      async function removeSandbox(resource: 'payments' | 'customers', id: string) {
        if (!asaasKey || !/^(pay|cus)_[A-Za-z0-9]+$/.test(id)) throw new Error('Identificador ou chave Sandbox inválidos para limpeza.');
        const response = await fetch(`https://api-sandbox.asaas.com/v3/${resource}/${encodeURIComponent(id)}`, {
          method: 'DELETE', headers: { access_token: asaasKey, accept: 'application/json', 'User-Agent': 'MeuCamp-E2E/1.0' },
          redirect: 'error', signal: AbortSignal.timeout(15000),
        });
        if (!response.ok && response.status !== 404) throw new Error(`Falha HTTP ${response.status} na limpeza Asaas Sandbox.`);
      }
      // A consulta pela referência também encontra cobranças aceitas pelo Asaas cuja
      // resposta tenha falhado antes de a tentativa ser persistida localmente.
      for (const payment of payments) {
        if (payment.external_reference) {
          for (const id of await findSandbox('payments', payment.external_reference)) gatewayPaymentIds.add(id);
        }
      }
      for (const id of Array.from(gatewayPaymentIds)) await removeSandbox('payments', id);
      if (webhookEventIds.length) await checked(admin.from('webhook_events').delete().in('external_event_id', webhookEventIds));
      await checked(admin.from('event_audit_logs').delete().in('event_id', events));
      if (payments.length) await checked(admin.from('payment_issuance_jobs').delete().in('payment_id', payments.map(payment => payment.id)));
      await checked(admin.from('payments').delete().in('event_id', events));
      if (!customerExisted && originalCpf !== undefined) {
        const gatewayCustomerIds = new Set(await findSandbox('customers', `meucamp:user:${owner}`));
        if (customer.data?.gateway_customer_id) gatewayCustomerIds.add(customer.data.gateway_customer_id);
        for (const id of Array.from(gatewayCustomerIds)) await removeSandbox('customers', id);
        await checked(admin.from('payment_customers').delete().eq('user_id', owner));
        await checked(admin.from('payment_customer_provisioning').delete().eq('user_id', owner));
      }
      await checked(admin.from('registrations').delete().in('id', registrations));
      await checked(admin.from('event_categories').delete().in('id', categories));
      await checked(admin.from('events').delete().in('id', events));
      await checked(admin.from('athletes').delete().in('id', athletes));
      await checked(admin.from('teams').delete().eq('id', team));
      await checked(admin.from('organizations').delete().eq('id', org));
      if (originalCpf !== undefined) await checked(admin.from('profiles').update({ cpf: originalCpf }).eq('id', owner));
    },
  };
}

export type PaymentFixture = ReturnType<typeof paymentFixture>;
