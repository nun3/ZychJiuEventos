import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Database } from '../../../lib/supabase/database.types';

export function publicCheckingFixture() {
  if (process.env.E2E_ALLOW_WRITES !== 'true') throw new Error('Fixture de checagem pública exige E2E_ALLOW_WRITES=true no Sandbox.');
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
  const teams = [randomUUID(), randomUUID()];
  const eventId = randomUUID();
  const ruleId = randomUUID();
  const categories = [randomUUID(), randomUUID(), randomUUID()];
  const athletes = Array.from({ length: 6 }, () => randomUUID());
  const registrations = athletes.map(() => randomUUID());
  const suffix = eventId.slice(0, 8);
  const teamNames = [`Equipe pública Alfa ${suffix}`, `Equipe pública Beta ${suffix}`];
  const categoryNames = [`Leve pública ${suffix}`, `Médio público ${suffix}`, `Pesado público ${suffix}`];
  const athleteNames = [
    `Atleta E2E pública leve A ${suffix}`,
    `Atleta E2E pública leve B ${suffix}`,
    `Atleta E2E pública médio sozinho ${suffix}`,
    `Atleta E2E pública pendente ${suffix}`,
    `Atleta E2E pública cancelada ${suffix}`,
    `Atleta E2E pública realocada ${suffix}`,
  ];
  const eventName = `Evento E2E checagem pública ${suffix}`;
  const privateTokens = ['5299822472', '1995-01-01', '77.77 kg', 'checagem.publica@example.invalid'];
  let owner = '';

  async function checked(result: PromiseLike<{ error: { message: string } | null }>) {
    const { error } = await result;
    if (error) throw new Error(`Fixture de checagem pública: ${error.message}`);
  }

  return {
    eventId,
    eventName,
    teamNames,
    categoryNames,
    athleteNames,
    visibleNames: [athleteNames[0], athleteNames[1], athleteNames[2], athleteNames[5]],
    hiddenNames: [athleteNames[3], athleteNames[4]],
    aloneAthleteName: athleteNames[2],
    reallocatedAthleteName: athleteNames[5],
    privateTokens,
    async setup() {
      const { data, error } = await actor.auth.signInWithPassword({ email: process.env.E2E_OWNER_EMAIL || '', password: process.env.E2E_OWNER_PASSWORD || '' });
      if (error || !data.user) throw new Error('Credenciais OWNER E2E ausentes ou inválidas.');
      owner = data.user.id;
      await checked(admin.from('organizations').insert({ id: org, nome: 'Checagem Pública E2E', slug: org, created_by: owner }));
      await checked(admin.from('organization_members').insert({ organization_id: org, user_id: owner, role: 'owner' }));
      await checked(admin.from('teams').insert([
        { id: teams[0], organization_id: org, nome: teamNames[0], created_by: owner },
        { id: teams[1], organization_id: org, nome: teamNames[1], created_by: owner },
      ]));
      await checked(admin.from('athletes').insert(athletes.map((id, index) => ({
        id,
        organization_id: org,
        team_id: index === 1 ? teams[1] : teams[0],
        nome_completo: athleteNames[index],
        data_nascimento: '1995-01-01',
        genero: 'M',
        faixa: 'Branca',
        peso_kg: 77.77,
        cpf: `5299822472${index}`,
      }))));
      await checked(admin.from('events').insert({
        id: eventId,
        organization_id: org,
        nome: eventName,
        slug: eventId,
        data_evento: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        local: 'Sandbox E2E',
        status: 'checagem',
        created_by: owner,
        valor_inscricao: 80,
      }));
      await checked(admin.from('category_rule_sets').insert({ id: ruleId, event_id: eventId, nome: 'Checagem pública E2E', versao: 1, ativo: true }));
      await checked(admin.from('event_categories').insert([
        { id: categories[0], rule_set_id: ruleId, nome: categoryNames[0], idade_min: 18, idade_max: 99, faixa_min_ordem: 1, faixa_max_ordem: 1, peso_min_kg: 0, peso_max_kg: 70, genero: 'M' },
        { id: categories[1], rule_set_id: ruleId, nome: categoryNames[1], idade_min: 18, idade_max: 99, faixa_min_ordem: 1, faixa_max_ordem: 1, peso_min_kg: 70.01, peso_max_kg: 85, genero: 'M' },
        { id: categories[2], rule_set_id: ruleId, nome: categoryNames[2], idade_min: 18, idade_max: 99, faixa_min_ordem: 1, faixa_max_ordem: 1, peso_min_kg: 85.01, peso_max_kg: 120, genero: 'M' },
      ]));
      const statuses: Array<Database['public']['Enums']['registration_status']> = [
        'efetivada', 'efetivada', 'efetivada', 'pendente_pagamento', 'cancelada', 'efetivada',
      ];
      await checked(admin.from('registrations').insert(registrations.map((id, index) => ({
        id,
        event_id: eventId,
        athlete_id: athletes[index],
        category_id: index === 2 ? categories[1] : categories[0],
        current_category_id: index === 5 ? categories[2] : null,
        registered_by: owner,
        status: statuses[index],
        valor: 80,
        athlete_snapshot: {
          nome_completo: athleteNames[index],
          data_nascimento: '1995-01-01',
          genero: 'M',
          faixa: 'Branca',
          peso_kg: 77.77,
          cpf: `5299822472${index}`,
          email: 'checagem.publica@example.invalid',
          team_id: index === 1 ? teams[1] : teams[0],
          team_name: index === 1 ? teamNames[1] : teamNames[0],
        },
        category_snapshot: { nome: index === 2 ? categoryNames[1] : categoryNames[0] },
        rule_set_version: 1,
        terms_version: 'MVP-2026-09',
        terms_accepted_at: new Date().toISOString(),
      }))));
    },
    async cleanup() {
      await admin.from('registrations').delete().in('id', registrations);
      await admin.from('event_categories').delete().in('id', categories);
      await admin.from('category_rule_sets').delete().eq('id', ruleId);
      await admin.from('events').delete().eq('id', eventId);
      await admin.from('athletes').delete().in('id', athletes);
      await admin.from('teams').delete().in('id', teams);
      await admin.from('organization_members').delete().eq('organization_id', org).eq('user_id', owner);
      await admin.from('organizations').delete().eq('id', org);
    },
  };
}

export type PublicCheckingFixture = ReturnType<typeof publicCheckingFixture>;
