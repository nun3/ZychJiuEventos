import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Database } from '../../../lib/supabase/database.types';

type RegistrationStatus = Database['public']['Enums']['registration_status'];
type PaymentStatus = Database['public']['Enums']['payment_status'];

export function financialClosingFixture() {
  if (process.env.E2E_ALLOW_WRITES !== 'true') throw new Error('Fixture de fechamento exige E2E_ALLOW_WRITES=true no Sandbox.');
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
  const org = randomUUID();
  const team = randomUUID();
  const eventId = randomUUID();
  const ruleId = randomUUID();
  const categoryId = randomUUID();
  const athletes = Array.from({ length: 4 }, () => randomUUID());
  const registrations = athletes.map(() => randomUUID());
  const payments = [randomUUID(), randomUUID(), randomUUID()];
  const athleteNames = [
    `Atleta E2E fechamento pendente ${eventId.slice(0, 8)}`,
    `Atleta E2E fechamento efetivada ${eventId.slice(0, 8)}`,
    `Atleta E2E fechamento cancelada ${eventId.slice(0, 8)}`,
    `Atleta E2E fechamento estornada ${eventId.slice(0, 8)}`,
  ];
  const eventName = `Evento E2E fechamento ${eventId.slice(0, 8)}`;
  const categoryName = `Adulto Fechamento ${eventId.slice(0, 8)}`;
  let owner = '';

  async function checked(result: PromiseLike<{ error: { message: string } | null }>) {
    const { error } = await result;
    if (error) throw new Error(`Fixture de fechamento: ${error.message}`);
  }

  return {
    eventId,
    eventName,
    athleteNames,
    expected: {
      performedCount: 4,
      cancelledCount: 1,
      settledCount: 1,
      grossRevenue: 'R$ 80,00',
    },
    async setup() {
      const { data, error } = await actor.auth.signInWithPassword({ email: process.env.E2E_OWNER_EMAIL || '', password: process.env.E2E_OWNER_PASSWORD || '' });
      if (error || !data.user) throw new Error('Credenciais OWNER E2E ausentes ou inválidas.');
      owner = data.user.id;
      await checked(admin.from('organizations').insert({ id: org, nome: 'Fechamento E2E', slug: org, created_by: owner }));
      await checked(admin.from('organization_members').insert({ organization_id: org, user_id: owner, role: 'owner' }));
      await checked(admin.from('teams').insert({ id: team, organization_id: org, nome: `E2E Equipe fechamento ${eventId.slice(0, 8)}`, created_by: owner }));
      await checked(admin.from('events').insert({
        id: eventId,
        organization_id: org,
        nome: eventName,
        slug: eventId,
        data_evento: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        local: 'Sandbox E2E',
        status: 'pagamento',
        created_by: owner,
        valor_inscricao: 80,
      }));
      await checked(admin.from('category_rule_sets').insert({ id: ruleId, event_id: eventId, nome: 'Fechamento E2E', versao: 1, ativo: true }));
      await checked(admin.from('event_categories').insert({
        id: categoryId,
        rule_set_id: ruleId,
        nome: categoryName,
        idade_min: 18,
        idade_max: 99,
        faixa_min_ordem: 1,
        faixa_max_ordem: 1,
        peso_min_kg: 0,
        peso_max_kg: 120,
        genero: 'M',
      }));
      await checked(admin.from('athletes').insert(athletes.map((id, index) => ({
        id,
        organization_id: org,
        team_id: team,
        nome_completo: athleteNames[index],
        data_nascimento: '1995-01-01',
        genero: 'M',
        faixa: 'Branca',
        peso_kg: 70,
      }))));
      const statuses: RegistrationStatus[] = ['pendente_pagamento', 'efetivada', 'cancelada', 'estornada'];
      await checked(admin.from('registrations').insert(registrations.map((id, index) => ({
        id,
        event_id: eventId,
        athlete_id: athletes[index],
        category_id: categoryId,
        registered_by: owner,
        status: statuses[index],
        valor: 80,
        athlete_snapshot: { nome_completo: athleteNames[index] },
        category_snapshot: { nome: categoryName },
        rule_set_version: 1,
        terms_version: 'MVP-2026-09',
        terms_accepted_at: new Date().toISOString(),
      }))));
      const paymentStatuses: PaymentStatus[] = ['aguardando', 'pago', 'estornado'];
      await checked(admin.from('payments').insert([
        { id: payments[0], event_id: eventId, created_by: owner, valor_total: 80, metodo: 'pix', status: paymentStatuses[0], gateway: 'asaas' },
        { id: payments[1], event_id: eventId, created_by: owner, valor_total: 80, metodo: 'pix', status: paymentStatuses[1], gateway: 'asaas', paid_at: new Date().toISOString() },
        { id: payments[2], event_id: eventId, created_by: owner, valor_total: 80, metodo: 'pix', status: paymentStatuses[2], gateway: 'asaas' },
      ]));
      await checked(admin.from('payment_registrations').insert([
        { payment_id: payments[0], registration_id: registrations[0], amount: 80 },
        { payment_id: payments[1], registration_id: registrations[1], amount: 80 },
        { payment_id: payments[2], registration_id: registrations[3], amount: 80 },
      ]));
      await checked(admin.from('payment_attempts').insert({
        payment_id: payments[2],
        gateway_payment_id: `pay_closing_${eventId.slice(0, 8)}`,
        status: 'estornado',
      }));
      await checked(admin.from('event_audit_logs').insert({
        organization_id: org,
        event_id: eventId,
        actor_id: owner,
        action: 'payment_manually_settled',
        resource_type: 'payment',
        resource_id: payments[1],
        before_data: { status: 'aguardando' },
        after_data: { status: 'pago', registrationStatus: 'efetivada', source: 'manual' },
        reason: 'Baixa manual da massa de fechamento financeiro.',
      }));
    },
    async cleanup() {
      await admin.from('event_audit_logs').delete().eq('event_id', eventId);
      await admin.from('payment_attempts').delete().in('payment_id', payments);
      await admin.from('payment_registrations').delete().in('payment_id', payments);
      await admin.from('payments').delete().in('id', payments);
      await admin.from('registrations').delete().in('id', registrations);
      await admin.from('event_categories').delete().eq('id', categoryId);
      await admin.from('category_rule_sets').delete().eq('id', ruleId);
      await admin.from('events').delete().eq('id', eventId);
      await admin.from('athletes').delete().in('id', athletes);
      await admin.from('teams').delete().eq('id', team);
      await admin.from('organization_members').delete().eq('organization_id', org).eq('user_id', owner);
      await admin.from('organizations').delete().eq('id', org);
    },
  };
}

export type FinancialClosingFixture = ReturnType<typeof financialClosingFixture>;
