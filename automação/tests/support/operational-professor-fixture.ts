import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Database } from '../../../lib/supabase/database.types';

export function operationalProfessorFixture() {
  if (process.env.E2E_ALLOW_WRITES !== 'true') throw new Error('Fixture de professor operacional exige E2E_ALLOW_WRITES=true no Sandbox.');
  const envPath = path.resolve(__dirname, '../../../.env.local');
  const local = Object.fromEntries((existsSync(envPath) ? readFileSync(envPath, 'utf8') : '')
    .split(/\r?\n/).filter((line) => /^[A-Z_]+=/.test(line)).map((line) => {
      const i = line.indexOf('=');
      return [line.slice(0, i), line.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')];
    }));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || local.NEXT_PUBLIC_SUPABASE_URL;
  if (new URL(url).hostname !== 'kfvypacjzlzwwblsbpwj.supabase.co') throw new Error('Fixture restrita ao Sandbox autorizado.');
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  const admin = createClient<Database>(url, process.env.SUPABASE_SECRET_KEY || local.SUPABASE_SECRET_KEY, options);
  const actor = createClient<Database>(url, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || local.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, options);
  const org = randomUUID();
  const eventId = randomUUID();
  const ruleId = randomUUID();
  const categoryId = randomUUID();
  const teamId = randomUUID();
  const athleteIds = [randomUUID(), randomUUID()] as const;
  const suffix = eventId.slice(0, 8);
  const email = `operacional.e2e.${suffix}@example.invalid`;
  const password = 'Operacional#E2E-13';
  const managerName = `Gestor E2E operacional ${suffix}`;
  const eventName = `Evento E2E operacional ${suffix}`;
  const teamName = `E2E Equipe operacional ${suffix}`;
  const athleteNames = [`Atleta E2E operacional A ${suffix}`, `Atleta E2E operacional B ${suffix}`] as const;
  const professorNames = [`Treinador E2E Alfa ${suffix}`, `Treinador E2E Beta ${suffix}`] as const;
  let owner = '';
  let professorId = '';

  async function checked(result: PromiseLike<{ error: { message: string } | null }>) {
    const { error } = await result;
    if (error) throw new Error(`Fixture operacional: ${error.message}`);
  }

  return {
    email,
    password,
    eventId,
    eventName,
    athleteNames,
    professorNames,
    async openChecking() {
      await checked(admin.from('registrations').update({ status: 'efetivada' }).eq('event_id', eventId));
      await checked(admin.from('events').update({ status: 'pagamento' }).eq('id', eventId));
      await checked(admin.from('events').update({ status: 'checagem' }).eq('id', eventId));
    },
    async setup() {
      const { data, error } = await actor.auth.signInWithPassword({
        email: process.env.E2E_OWNER_EMAIL || '',
        password: process.env.E2E_OWNER_PASSWORD || '',
      });
      if (error || !data.user) throw new Error('Credenciais OWNER E2E ausentes ou inválidas.');
      owner = data.user.id;
      const created = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { nome_completo: managerName, tipo_cadastro: 'professor' },
      });
      if (created.error || !created.data.user) throw new Error(`Criação do gestor: ${created.error?.message || 'sem usuário'}`);
      professorId = created.data.user.id;
      const { data: profile } = await admin.from('profiles').select('id').eq('id', professorId).maybeSingle();
      if (!profile) await checked(admin.from('profiles').insert({ id: professorId, nome_completo: managerName }));
      await checked(admin.from('organizations').insert({ id: org, nome: 'Operacional E2E evento', slug: org, created_by: owner }));
      await checked(admin.from('organization_members').insert({ organization_id: org, user_id: owner, role: 'owner' }));
      await checked(admin.from('teams').insert({ id: teamId, organization_id: org, nome: teamName, created_by: owner }));
      await checked(admin.from('athletes').insert(athleteIds.map((id, index) => ({
        id,
        organization_id: org,
        team_id: teamId,
        nome_completo: athleteNames[index],
        data_nascimento: '1996-04-12',
        genero: 'M',
        faixa: 'Branca',
        peso_kg: 72,
      }))));
      await checked(admin.from('athlete_managers').insert(athleteIds.map((id) => ({
        athlete_id: id,
        manager_id: professorId,
        relationship_type: 'professor' as const,
      }))));
      await checked(admin.from('events').insert({
        id: eventId,
        organization_id: org,
        nome: eventName,
        slug: eventId,
        data_evento: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        local: 'Sandbox E2E',
        status: 'inscricao',
        created_by: owner,
        valor_inscricao: 80,
      }));
      await checked(admin.from('event_phases').insert({
        event_id: eventId,
        tipo: 'inscricao',
        inicio: new Date(Date.now() - 86400000).toISOString(),
        fim: new Date(Date.now() + 14 * 86400000).toISOString(),
      }));
      await checked(admin.from('category_rule_sets').insert({ id: ruleId, event_id: eventId, nome: 'Operacional E2E', versao: 1, ativo: true }));
      await checked(admin.from('event_categories').insert({
        id: categoryId,
        rule_set_id: ruleId,
        nome: `Leve operacional ${suffix}`,
        idade_min: 18,
        idade_max: 99,
        faixa_min_ordem: 1,
        faixa_max_ordem: 10,
        peso_min_kg: 0,
        peso_max_kg: 120,
        genero: 'M',
      }));
    },
    async cleanup() {
      await admin.from('registrations').delete().eq('event_id', eventId);
      await admin.from('athlete_managers').delete().in('athlete_id', [...athleteIds]);
      await admin.from('athletes').delete().in('id', [...athleteIds]);
      await admin.from('event_categories').delete().eq('id', categoryId);
      await admin.from('category_rule_sets').delete().eq('id', ruleId);
      await admin.from('event_phases').delete().eq('event_id', eventId);
      await admin.from('events').delete().eq('id', eventId);
      await admin.from('teams').delete().eq('id', teamId);
      await admin.from('organization_members').delete().eq('organization_id', org);
      await admin.from('organizations').delete().eq('id', org);
      if (professorId) await admin.auth.admin.deleteUser(professorId);
    },
  };
}

export type OperationalProfessorFixture = ReturnType<typeof operationalProfessorFixture>;
