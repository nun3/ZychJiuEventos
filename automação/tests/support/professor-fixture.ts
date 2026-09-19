import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Database } from '../../../lib/supabase/database.types';

function uniqueCpf(seed: string) {
  const digits = `8${seed.replace(/\D/g, '1').padEnd(8, '1')}`.slice(0, 9).split('').map(Number);
  const check = (slice: number[], factor: number) => {
    const total = slice.reduce((sum, digit, index) => sum + digit * (factor - index), 0);
    const remainder = (total * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  const first = check(digits, 10);
  const second = check([...digits, first], 11);
  const raw = `${digits.join('')}${first}${second}`;
  return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9)}`;
}

export function professorFixture() {
  if (process.env.E2E_ALLOW_WRITES !== 'true') throw new Error('Fixture de professor exige E2E_ALLOW_WRITES=true no Sandbox.');
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
  const suffix = eventId.slice(0, 8);
  const email = `professor.e2e.${suffix}@example.invalid`;
  const password = 'Professor#E2E-13';
  const professorName = `Professor E2E ${suffix}`;
  const teamName = `E2E Equipe professor ${suffix}`;
  const athleteName = `Atleta E2E professor ${suffix}`;
  const eventName = `Evento E2E professor ${suffix}`;
  const categoryName = `Leve professor ${suffix}`;
  const professorCpf = uniqueCpf(suffix);
  let owner = '';
  let professorId = '';

  async function checked(result: PromiseLike<{ error: { message: string } | null }>) {
    const { error } = await result;
    if (error) throw new Error(`Fixture de professor: ${error.message}`);
  }

  return {
    email,
    password,
    professorCpf,
    professorName,
    teamName,
    athleteName,
    eventId,
    eventName,
    categoryName,
    async confirmSignup() {
      const { data } = await admin.from('profiles').select('id').eq('nome_completo', professorName).maybeSingle();
      if (!data?.id) throw new Error('Perfil do professor não apareceu após o cadastro.');
      professorId = data.id;
      const { error } = await admin.auth.admin.updateUserById(professorId, { email_confirm: true });
      if (error) throw new Error(`Confirmação do professor: ${error.message}`);
    },
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
      await checked(admin.from('organizations').insert({ id: org, nome: 'Professor E2E evento', slug: org, created_by: owner }));
      await checked(admin.from('organization_members').insert({ organization_id: org, user_id: owner, role: 'owner' }));
      const eventDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
      await checked(admin.from('events').insert({
        id: eventId,
        organization_id: org,
        nome: eventName,
        slug: eventId,
        data_evento: eventDate,
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
      await checked(admin.from('category_rule_sets').insert({ id: ruleId, event_id: eventId, nome: 'Professor E2E', versao: 1, ativo: true }));
      await checked(admin.from('event_categories').insert({
        id: categoryId,
        rule_set_id: ruleId,
        nome: categoryName,
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
      const { data: profile } = await admin.from('profiles').select('id').eq('nome_completo', professorName).maybeSingle();
      professorId = professorId || profile?.id || '';
      if (professorId) {
        const { data: teams } = await admin.from('teams').select('id, organization_id').eq('created_by', professorId);
        const teamIds = (teams || []).map((team) => team.id);
        const orgIds = Array.from(new Set((teams || []).map((team) => team.organization_id)));
        if (teamIds.length) {
          const { data: athletes } = await admin.from('athletes').select('id').in('team_id', teamIds);
          const athleteIds = (athletes || []).map((athlete) => athlete.id);
          if (athleteIds.length) {
            await admin.from('registrations').delete().in('athlete_id', athleteIds);
            await admin.from('athlete_managers').delete().in('athlete_id', athleteIds);
            await admin.from('athletes').delete().in('id', athleteIds);
          }
          await admin.from('teams').delete().in('id', teamIds);
        }
        if (orgIds.length) await admin.from('organizations').delete().in('id', orgIds);
        await admin.auth.admin.deleteUser(professorId);
      }
      await admin.from('registrations').delete().eq('event_id', eventId);
      await admin.from('event_categories').delete().eq('id', categoryId);
      await admin.from('category_rule_sets').delete().eq('id', ruleId);
      await admin.from('event_phases').delete().eq('event_id', eventId);
      await admin.from('events').delete().eq('id', eventId);
      await admin.from('organization_members').delete().eq('organization_id', org);
      await admin.from('organizations').delete().eq('id', org);
    },
  };
}

export type ProfessorFixture = ReturnType<typeof professorFixture>;
