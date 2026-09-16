import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Database } from '../../../lib/supabase/database.types';

type RegistrationStatus = Database['public']['Enums']['registration_status'];

export function checagemFixture() {
  if (process.env.E2E_ALLOW_WRITES !== 'true') throw new Error('Checagem E2E exige E2E_ALLOW_WRITES=true no Sandbox.');
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
  const categories = [randomUUID(), randomUUID()];
  const athletes = Array.from({ length: 7 }, () => randomUUID());
  const registrations = athletes.map(() => randomUUID());
  const teamNames = [`Checagem Alfa ${org.slice(0, 8)}`, `Checagem Beta ${org.slice(0, 8)}`];
  const categoryNames = [`Leve Checagem ${org.slice(0, 8)}`, `Pesado Checagem ${org.slice(0, 8)}`];
  const athleteNames = athletes.map((id, index) => `Checagem atleta ${index + 1} ${id.slice(0, 8)}`);
  const hiddenNames = [athleteNames[3], athleteNames[4], athleteNames[5], athleteNames[6]];
  const eventName = `Checagem E2E ${eventId.slice(0, 8)}`;
  let owner = '';

  async function checked(result: PromiseLike<{ error: { message: string } | null }>) {
    const { error } = await result;
    if (error) throw new Error(`Fixture de checagem: ${error.message}`);
  }

  return {
    eventId,
    eventName,
    teamNames,
    categoryNames,
    athleteNames,
    hiddenNames,
    aloneAthleteName: athleteNames[2],
    async setup() {
      const { data, error } = await actor.auth.signInWithPassword({ email: process.env.E2E_OWNER_EMAIL || '', password: process.env.E2E_OWNER_PASSWORD || '' });
      if (error || !data.user) throw new Error('Credenciais OWNER E2E ausentes ou inválidas.');
      owner = data.user.id;
      await checked(admin.from('organizations').insert({ id: org, nome: 'Checagem E2E', slug: org, created_by: owner }));
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
        peso_kg: index === 2 ? 90 : 70,
      }))));
      await checked(admin.from('athlete_managers').insert(athletes.map(id => ({ manager_id: owner, athlete_id: id, relationship_type: 'professor' as const }))));
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
      await checked(admin.from('event_phases').insert({
        event_id: eventId,
        tipo: 'checagem',
        inicio: new Date(Date.now() - 86400000).toISOString(),
        fim: new Date(Date.now() + 86400000).toISOString(),
      }));
      await checked(admin.from('category_rule_sets').insert({ id: ruleId, event_id: eventId, nome: 'Checagem E2E', versao: 1, ativo: true }));
      await checked(admin.from('event_categories').insert([
        { id: categories[0], rule_set_id: ruleId, nome: categoryNames[0], idade_min: 18, idade_max: 99, faixa_min_ordem: 1, faixa_max_ordem: 1, peso_min_kg: 0, peso_max_kg: 80, genero: 'M' },
        { id: categories[1], rule_set_id: ruleId, nome: categoryNames[1], idade_min: 18, idade_max: 99, faixa_min_ordem: 1, faixa_max_ordem: 1, peso_min_kg: 80.01, peso_max_kg: 120, genero: 'M' },
      ]));
      const statuses: RegistrationStatus[] = ['efetivada', 'efetivada', 'efetivada', 'pendente_pagamento', 'expirada', 'cancelada', 'estornada'];
      await checked(admin.from('registrations').insert(registrations.map((id, index) => {
        const teamIndex = index === 1 ? 1 : 0;
        const categoryIndex = index === 2 ? 1 : 0;
        return {
          id,
          event_id: eventId,
          athlete_id: athletes[index],
          category_id: categories[categoryIndex],
          registered_by: owner,
          status: statuses[index],
          valor: 80,
          athlete_snapshot: {
            nome_completo: athleteNames[index],
            data_nascimento: '1995-01-01',
            genero: 'M',
            faixa: 'Branca',
            peso_kg: index === 2 ? 90 : 70,
            team_id: teams[teamIndex],
            team_name: teamNames[teamIndex],
          },
          category_snapshot: { nome: categoryNames[categoryIndex] },
          rule_set_version: 1,
          terms_version: 'MVP-2026-09',
          terms_accepted_at: new Date().toISOString(),
        };
      })));
    },
    async cleanup() {
      await admin.from('registrations').delete().in('id', registrations);
      await admin.from('event_categories').delete().in('id', categories);
      await admin.from('category_rule_sets').delete().eq('id', ruleId);
      await admin.from('event_phases').delete().eq('event_id', eventId);
      await admin.from('events').delete().eq('id', eventId);
      await admin.from('athlete_managers').delete().in('athlete_id', athletes);
      await admin.from('athletes').delete().in('id', athletes);
      await admin.from('teams').delete().in('id', teams);
      await admin.from('organization_members').delete().eq('organization_id', org).eq('user_id', owner);
      await admin.from('organizations').delete().eq('id', org);
    },
  };
}

export type ChecagemFixture = ReturnType<typeof checagemFixture>;
