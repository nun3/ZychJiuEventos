import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Database } from '../../../lib/supabase/database.types';

const CONTRACTED_FEE_CENTS = 500;

export function platformFeeFixture() {
  if (process.env.E2E_ALLOW_WRITES !== 'true') throw new Error('Fixture de taxa exige E2E_ALLOW_WRITES=true no Sandbox.');
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
  const suffix = eventId.slice(0, 8);
  const athletes = Array.from({ length: 5 }, () => randomUUID());
  const registrations = athletes.map(() => randomUUID());
  const payments = Array.from({ length: 4 }, () => randomUUID());
  const athleteNames = {
    pendingFirst: `Atleta E2E taxa pendente A ${suffix}`,
    confirmed: `Atleta E2E taxa confirmada ${suffix}`,
    cancelled: `Atleta E2E taxa cancelada ${suffix}`,
    refunded: `Atleta E2E taxa estornada ${suffix}`,
    pendingSecond: `Atleta E2E taxa pendente B ${suffix}`,
  };
  const references = {
    pendingFirst: `meucamp:taxa-a-${suffix}`,
    pendingSecond: `meucamp:taxa-b-${suffix}`,
  };
  const eventName = `Evento E2E taxa ${suffix}`;
  const categoryName = `Adulto Taxa ${suffix}`;
  let owner = '';
  let organizerId = '';

  async function checked(result: PromiseLike<{ error: { message: string } | null }>) {
    const { error } = await result;
    if (error) throw new Error(`Fixture de taxa: ${error.message}`);
  }

  return {
    eventId,
    eventName,
    athleteNames,
    references,
    contractedFee: 'R$ 5,00',
    async setup() {
      const { data, error } = await actor.auth.signInWithPassword({ email: process.env.E2E_OWNER_EMAIL || '', password: process.env.E2E_OWNER_PASSWORD || '' });
      if (error || !data.user) throw new Error('Credenciais OWNER E2E ausentes ou inválidas.');
      owner = data.user.id;
      await checked(admin.from('organizations').insert({ id: org, nome: 'Taxa E2E', slug: org, created_by: owner }));
      await checked(admin.from('organization_members').insert({ organization_id: org, user_id: owner, role: 'owner' }));
      await checked(admin.from('teams').insert({ id: team, organization_id: org, nome: `E2E Equipe taxa ${suffix}`, created_by: owner }));
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
      await checked(admin.from('event_platform_fees').insert({ event_id: eventId, fee_cents: CONTRACTED_FEE_CENTS }));
      await checked(admin.from('category_rule_sets').insert({ id: ruleId, event_id: eventId, nome: 'Taxa E2E', versao: 1, ativo: true }));
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
      const orderedNames = [
        athleteNames.pendingFirst,
        athleteNames.confirmed,
        athleteNames.cancelled,
        athleteNames.refunded,
        athleteNames.pendingSecond,
      ];
      await checked(admin.from('athletes').insert(athletes.map((id, index) => ({
        id,
        organization_id: org,
        team_id: team,
        nome_completo: orderedNames[index],
        data_nascimento: '1995-01-01',
        genero: 'M',
        faixa: 'Branca',
        peso_kg: 70,
      }))));
      const statuses: Array<Database['public']['Enums']['registration_status']> = [
        'pendente_pagamento', 'efetivada', 'cancelada', 'estornada', 'pendente_pagamento',
      ];
      await checked(admin.from('registrations').insert(registrations.map((id, index) => ({
        id,
        event_id: eventId,
        athlete_id: athletes[index],
        category_id: categoryId,
        registered_by: owner,
        status: statuses[index],
        valor: 80,
        athlete_snapshot: { nome_completo: orderedNames[index] },
        category_snapshot: { nome: categoryName },
        rule_set_version: 1,
        terms_version: 'MVP-2026-09',
        terms_accepted_at: new Date().toISOString(),
      }))));
      await checked(admin.from('payments').insert([
        { id: payments[0], event_id: eventId, created_by: owner, valor_total: 80, metodo: 'pix', status: 'aguardando', gateway: 'asaas', external_reference: references.pendingFirst },
        { id: payments[1], event_id: eventId, created_by: owner, valor_total: 80, metodo: 'pix', status: 'pago', gateway: 'asaas', paid_at: new Date().toISOString() },
        { id: payments[2], event_id: eventId, created_by: owner, valor_total: 80, metodo: 'pix', status: 'estornado', gateway: 'asaas' },
        { id: payments[3], event_id: eventId, created_by: owner, valor_total: 80, metodo: 'pix', status: 'aguardando', gateway: 'asaas', external_reference: references.pendingSecond },
      ]));
      // Efetivadas historicas ja carregam o snapshot gravado na epoca da efetivacao.
      await checked(admin.from('payment_registrations').insert([
        { payment_id: payments[0], registration_id: registrations[0], amount: 80 },
        { payment_id: payments[1], registration_id: registrations[1], amount: 80, platform_fee_cents: CONTRACTED_FEE_CENTS },
        { payment_id: payments[2], registration_id: registrations[3], amount: 80, platform_fee_cents: CONTRACTED_FEE_CENTS },
        { payment_id: payments[3], registration_id: registrations[4], amount: 80 },
      ]));
      await checked(admin.from('payment_attempts').insert([
        { payment_id: payments[1], gateway_payment_id: `pay_fee_paid_${suffix}`, status: 'pago' },
        { payment_id: payments[2], gateway_payment_id: `pay_fee_refunded_${suffix}`, status: 'estornado' },
      ]));
    },
    async contractFee(cents: number) {
      await checked(admin.from('event_platform_fees')
        .upsert({ event_id: eventId, fee_cents: cents, updated_at: new Date().toISOString() }));
    },
    async grantOrganizer() {
      if (organizerId) return;
      const email = process.env.E2E_UNAUTHORIZED_EMAIL || '';
      const password = process.env.E2E_UNAUTHORIZED_PASSWORD || '';
      if (!email || !password || email.toLowerCase() === (process.env.E2E_OWNER_EMAIL || '').toLowerCase()) {
        throw new Error('E2E_UNAUTHORIZED_EMAIL deve ser uma conta distinta do owner, sem papel de plataforma.');
      }
      const organizer = createClient<Database>(url, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || local.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);
      const { data, error } = await organizer.auth.signInWithPassword({ email, password });
      if (error || !data.user) throw new Error('Credenciais UNAUTHORIZED E2E ausentes ou inválidas.');
      organizerId = data.user.id;
      await checked(admin.from('organization_members').insert({ organization_id: org, user_id: organizerId, role: 'organizer' }));
    },
    async organizerFeeChangeAttempt(cents: number) {
      const email = process.env.E2E_UNAUTHORIZED_EMAIL || '';
      const password = process.env.E2E_UNAUTHORIZED_PASSWORD || '';
      const organizer = createClient<Database>(url, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || local.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);
      const { error: loginError } = await organizer.auth.signInWithPassword({ email, password });
      if (loginError) throw new Error('Credenciais UNAUTHORIZED E2E ausentes ou inválidas.');
      const { data, error } = await organizer.rpc('set_event_platform_fee', { target_event_id: eventId, fee_cents: cents });
      return { data, error };
    },
    async currentFeeCents() {
      const { data } = await admin.from('event_platform_fees').select('fee_cents').eq('event_id', eventId).maybeSingle();
      return data?.fee_cents ?? 0;
    },
    async feeSnapshotFor(athleteName: string) {
      const index = [
        athleteNames.pendingFirst,
        athleteNames.confirmed,
        athleteNames.cancelled,
        athleteNames.refunded,
        athleteNames.pendingSecond,
      ].indexOf(athleteName);
      if (index < 0) throw new Error(`Atleta fora da massa de taxa: ${athleteName}`);
      const { data } = await admin.from('payment_registrations')
        .select('platform_fee_cents')
        .eq('registration_id', registrations[index])
        .maybeSingle();
      return data?.platform_fee_cents ?? null;
    },
    async cleanup() {
      await admin.from('event_audit_logs').delete().eq('event_id', eventId);
      await admin.from('payment_attempts').delete().in('payment_id', payments);
      await admin.from('payment_registrations').delete().in('payment_id', payments);
      await admin.from('payments').delete().in('id', payments);
      await admin.from('registrations').delete().in('id', registrations);
      await admin.from('event_categories').delete().eq('id', categoryId);
      await admin.from('category_rule_sets').delete().eq('id', ruleId);
      await admin.from('event_platform_fees').delete().eq('event_id', eventId);
      await admin.from('events').delete().eq('id', eventId);
      await admin.from('athletes').delete().in('id', athletes);
      await admin.from('teams').delete().eq('id', team);
      if (organizerId) await admin.from('organization_members').delete().eq('organization_id', org).eq('user_id', organizerId);
      await admin.from('organization_members').delete().eq('organization_id', org).eq('user_id', owner);
      await admin.from('organizations').delete().eq('id', org);
    },
  };
}

export type PlatformFeeFixture = ReturnType<typeof platformFeeFixture>;
