import { chromium, expect, type BrowserContext } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import type { Database, Json } from '../../lib/supabase/database.types';
import {
  createCleanupClients,
  loadCleanupEnv,
  resolveOwnerId,
  SANDBOX_HOST,
} from '../tests/support/e2e-cleanup';

type AdminClient = Awaited<ReturnType<typeof createCleanupClients>>['admin'];
type JsonObject = { [key: string]: Json | undefined };

function isJsonObject(value: Json | undefined): value is JsonObject {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

async function checked(label: string, result: PromiseLike<{ error: { message: string } | null }>) {
  const { error } = await result;
  if (error) throw new Error(`${label}: ${error.message}`);
}

function matchesFrom(payload: Json): JsonObject[] {
  if (!isJsonObject(payload) || payload.kind !== 'public_schedule' || !Array.isArray(payload.matches)) {
    throw new Error('A consulta pública da programação não retornou a projeção esperada.');
  }
  return payload.matches.filter(isJsonObject);
}

async function applyOwnerSession(context: BrowserContext, baseURL: string) {
  const { actor } = await createCleanupClients();
  await resolveOwnerId(actor);
  const { data: { session } } = await actor.auth.getSession();
  if (!session) throw new Error('Sessão owner ausente.');
  await context.addCookies([{
    name: `sb-${SANDBOX_HOST.split('.')[0]}-auth-token`,
    value: JSON.stringify(session),
    url: baseURL,
    httpOnly: false,
    secure: false,
    sameSite: 'Lax',
  }]);
}

async function cleanup(
  admin: AdminClient,
  fixture: {
    eventId: string
    organizationId: string
    teamIds: string[]
    ruleSetId: string
    categoryId: string
    athleteIds: string[]
    registrationIds: string[]
    ownerId: string
  },
) {
  await checked('cleanup schedule', admin.from('event_schedules').delete().eq('event_id', fixture.eventId));
  const { data: brackets } = await admin.from('category_brackets').select('id').eq('event_id', fixture.eventId);
  const bracketIds = (brackets || []).map((row) => row.id);
  if (bracketIds.length) {
    const { data: groups } = await admin.from('bracket_groups').select('id').in('bracket_id', bracketIds);
    const groupIds = (groups || []).map((row) => row.id);
    if (groupIds.length) await checked('cleanup matches', admin.from('bracket_matches').delete().in('group_id', groupIds));
    await checked('cleanup entries', admin.from('bracket_entries').delete().in('bracket_id', bracketIds));
    if (groupIds.length) await checked('cleanup groups', admin.from('bracket_groups').delete().in('id', groupIds));
    await checked('cleanup participants', admin.from('bracket_participants').delete().in('bracket_id', bracketIds));
    await checked('cleanup brackets', admin.from('category_brackets').delete().in('id', bracketIds));
  }
  await checked('cleanup audits', admin.from('event_audit_logs').delete().eq('event_id', fixture.eventId));
  await checked('cleanup registrations', admin.from('registrations').delete().in('id', fixture.registrationIds));
  await checked('cleanup category', admin.from('event_categories').delete().eq('id', fixture.categoryId));
  await checked('cleanup rule set', admin.from('category_rule_sets').delete().eq('id', fixture.ruleSetId));
  await checked('cleanup event', admin.from('events').delete().eq('id', fixture.eventId));
  await checked('cleanup athletes', admin.from('athletes').delete().in('id', fixture.athleteIds));
  await checked('cleanup teams', admin.from('teams').delete().in('id', fixture.teamIds));
  await checked('cleanup membership', admin.from('organization_members').delete().eq('organization_id', fixture.organizationId).eq('user_id', fixture.ownerId));
  await checked('cleanup organization', admin.from('organizations').delete().eq('id', fixture.organizationId));
}

async function main() {
  loadCleanupEnv();
  if (process.env.E2E_ALLOW_WRITES !== 'true') throw new Error('Smoke de duração exige E2E_ALLOW_WRITES=true no Sandbox.');

  const baseURL = process.env.BASE_URL || 'http://localhost:3102';
  const { admin, actor } = await createCleanupClients();
  const ownerId = await resolveOwnerId(actor);
  const suffix = randomUUID().slice(0, 8);
  const organizationId = randomUUID();
  const teamIds = [randomUUID(), randomUUID()];
  const eventId = randomUUID();
  const ruleSetId = randomUUID();
  const categoryId = randomUUID();
  const athleteIds = Array.from({ length: 4 }, () => randomUUID());
  const registrationIds = athleteIds.map(() => randomUUID());
  const eventName = `Sprint 11 Duração ${suffix}`;
  const categoryName = `Duração ${suffix}`;
  const teamNames = [`Equipe Duração 1 ${suffix}`, `Equipe Duração 2 ${suffix}`];
  const fixture = { eventId, organizationId, teamIds, ruleSetId, categoryId, athleteIds, registrationIds, ownerId };
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 1000 } });
  const evidence: string[] = [];

  try {
    await checked('organization', admin.from('organizations').insert({
      id: organizationId,
      nome: eventName,
      slug: `sprint-11-duracao-${suffix}`,
      created_by: ownerId,
    }));
    await checked('membership', admin.from('organization_members').insert({
      organization_id: organizationId,
      user_id: ownerId,
      role: 'owner',
    }));
    await checked('teams', admin.from('teams').insert(teamIds.map((id, index) => ({
      id,
      organization_id: organizationId,
      nome: teamNames[index],
      created_by: ownerId,
    }))));
    await checked('event', admin.from('events').insert({
      id: eventId,
      organization_id: organizationId,
      nome: eventName,
      slug: `sprint-11-duracao-${suffix}`,
      data_evento: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
      local: 'Sandbox E2E',
      status: 'chaves',
      checagem_travada_em: new Date().toISOString(),
      created_by: ownerId,
      valor_inscricao: 80,
    }));
    await checked('rule set', admin.from('category_rule_sets').insert({
      id: ruleSetId,
      event_id: eventId,
      nome: eventName,
      versao: 1,
      ativo: true,
    }));
    await checked('category', admin.from('event_categories').insert({
      id: categoryId,
      rule_set_id: ruleSetId,
      nome: categoryName,
      idade_min: 18,
      idade_max: 99,
      faixa_min_ordem: 1,
      faixa_max_ordem: 1,
      peso_min_kg: 0,
      peso_max_kg: 100,
      genero: 'M',
    }));
    await checked('athletes', admin.from('athletes').insert(athleteIds.map((id, index) => ({
      id,
      organization_id: organizationId,
      team_id: teamIds[index % 2],
      nome_completo: `Duração Atleta ${index + 1} ${suffix}`,
      data_nascimento: '1995-01-01',
      genero: 'M',
      faixa: 'Branca',
      peso_kg: 80,
    }))));
    await checked('registrations', admin.from('registrations').insert(registrationIds.map((id, index) => ({
      id,
      event_id: eventId,
      athlete_id: athleteIds[index],
      category_id: categoryId,
      registered_by: ownerId,
      status: 'efetivada' as Database['public']['Enums']['registration_status'],
      valor: 80,
      athlete_snapshot: {
        nome_completo: `Duração Atleta ${index + 1} ${suffix}`,
        data_nascimento: '1995-01-01',
        genero: 'M',
        faixa: 'Branca',
        peso_kg: 80,
        team_id: teamIds[index % 2],
        team_name: teamNames[index % 2],
      },
      category_snapshot: { nome: categoryName },
      rule_set_version: 1,
      terms_version: 'MVP-2026-09',
      terms_accepted_at: new Date().toISOString(),
    }))));

    const { data: categoryBefore, error: categoryBeforeError } = await admin
      .from('event_categories')
      .select('fight_duration_minutes')
      .eq('id', categoryId)
      .single();
    if (categoryBeforeError) throw categoryBeforeError;
    if (categoryBefore?.fight_duration_minutes != null) {
      throw new Error('Categoria sem duração deveria permanecer nula.');
    }

    const generated = await actor.rpc('generate_category_bracket', {
      target_event_id: eventId,
      target_category_id: categoryId,
    });
    if (generated.error || !isJsonObject(generated.data)) throw new Error(`generate: ${generated.error?.message || 'retorno inválido'}`);
    const bracketId = String(generated.data.bracketId || '');
    const published = await actor.rpc('publish_category_bracket', { target_bracket_id: bracketId });
    if (published.error) throw published.error;

    const { data: groups, error: groupsError } = await admin
      .from('bracket_groups')
      .select('id, label')
      .eq('bracket_id', bracketId)
      .order('sort_order');
    if (groupsError || !groups?.length) throw groupsError || new Error('Subchave oficial ausente.');
    const groupA = groups.find((group) => group.label === 'A')?.id || groups[0].id;
    const areaOne = await actor.rpc('save_event_area', {
      target_event_id: eventId,
      target_area_id: null,
      area_number: 1,
      area_name: 'Verde',
    });
    if (areaOne.error || !isJsonObject(areaOne.data)) throw new Error(areaOne.error?.message || 'Área não criada.');
    const assigned = await actor.rpc('assign_schedule_group', { target_group_id: groupA, target_area_id: String(areaOne.data.areaId) });
    if (assigned.error) throw assigned.error;
    const publishedSchedule = await actor.rpc('publish_event_schedule', { target_event_id: eventId });
    if (publishedSchedule.error) throw publishedSchedule.error;

    const anon = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const beforePublic = await anon.rpc('get_public_event_schedule', { target_event_id: eventId });
    if (beforePublic.error) throw beforePublic.error;
    const beforeMatches = matchesFrom(beforePublic.data);
    if (!beforeMatches.length) throw new Error('Programação pública vazia antes da duração.');
    if (beforeMatches.some((match) => match.durationMinutes != null)) {
      throw new Error('Categoria sem duração vazou Tempo na programação pública.');
    }
    const beforeBrackets = await anon.rpc('get_public_event_brackets', { target_event_id: eventId });
    if (beforeBrackets.error || !Array.isArray(beforeBrackets.data)) throw beforeBrackets.error || new Error('Chaves públicas ausentes.');
    const beforeBracket = isJsonObject(beforeBrackets.data[0]) ? beforeBrackets.data[0] : null;
    if (beforeBracket?.durationMinutes != null) {
      throw new Error('Categoria sem duração vazou Tempo nas chaves públicas.');
    }
    evidence.push('categoria-sem-duracao');

    await applyOwnerSession(context, baseURL);
    const page = await context.newPage();
    await page.goto(`/admin/eventos/${eventId}/configuracao`);
    await page.getByRole('heading', { name: `Categorias — ${eventName}` }).waitFor();
    await expect(page.getByLabel('Duração oficial da luta em minutos')).toHaveValue('');
    await page.getByLabel('Duração oficial da luta em minutos').fill('2.5');
    await page.getByRole('button', { name: 'Salvar' }).click();
    await page.getByText('Duração salva: 2,5 min.').waitFor();
    const { data: categoryAfter, error: categoryAfterError } = await admin
      .from('event_categories')
      .select('fight_duration_minutes')
      .eq('id', categoryId)
      .single();
    if (categoryAfterError) throw categoryAfterError;
    if (Number(categoryAfter?.fight_duration_minutes) !== 2.5) {
      throw new Error(`Duração não persistiu: ${categoryAfter?.fight_duration_minutes}`);
    }
    evidence.push('duracao-persistida');

    await page.goto(`/admin/eventos/${eventId}/chaves`);
    await page.getByRole('heading', { name: categoryName, exact: true }).waitFor();
    await expect(page.getByText('2,5 min').first()).toBeVisible();
    await page.goto(`/admin/eventos/${eventId}/programacao`);
    await page.getByRole('heading', { name: `Programação — ${eventName}` }).waitFor();
    await expect(page.getByText('2,5 min').first()).toBeVisible();
    await page.goto(`/admin/eventos/${eventId}/resultados`);
    await page.getByRole('heading', { name: `Resultados — ${eventName}` }).waitFor();
    await expect(page.getByText('2,5 min').first()).toBeVisible();
    evidence.push('projecao-admin');

    const publicPage = await context.newPage();
    await publicPage.goto(`/eventos/${eventId}/programacao`);
    await publicPage.getByRole('heading', { name: `Programação — ${eventName}` }).waitFor();
    await expect(publicPage.getByText('Tempo: 2,5 minutos').first()).toBeVisible();
    await publicPage.getByLabel('Equipe').selectOption(teamNames[0]);
    await publicPage.getByRole('button', { name: 'Filtrar' }).click();
    await publicPage.getByRole('heading', { name: `Lutas da equipe ${teamNames[0]}` }).waitFor();
    await expect(publicPage.getByText('Tempo: 2,5 minutos').first()).toBeVisible();
    evidence.push('programacao-e-equipe');

    await publicPage.goto(`/eventos/${eventId}/chaves`);
    await publicPage.getByRole('heading', { name: categoryName, exact: true }).waitFor();
    await expect(publicPage.getByText('Tempo: 2,5 minutos').first()).toBeVisible();
    evidence.push('chaves-publicas');

    const publicSchedule = await anon.rpc('get_public_event_schedule', { target_event_id: eventId });
    if (publicSchedule.error) throw publicSchedule.error;
    const publicMatches = matchesFrom(publicSchedule.data);
    if (publicMatches.some((match) => Number(match.durationMinutes) !== 2.5)) {
      throw new Error('Programação pública não projetou 2,5 minutos.');
    }
    const serializedPublic = JSON.stringify(publicSchedule.data);
    if (/(matchId|areaId|scheduleId|entryId|groupId|categoryId|publishedBy|actorId|audit)/i.test(serializedPublic)) {
      throw new Error('A projeção pública da programação expôs campo administrativo.');
    }
    const publicBrackets = await anon.rpc('get_public_event_brackets', { target_event_id: eventId });
    if (publicBrackets.error) throw publicBrackets.error;
    const serializedBrackets = JSON.stringify(publicBrackets.data);
    if (/(matchId|bracketId|categoryId|entryId|groupId|actorId|audit)/i.test(serializedBrackets)) {
      throw new Error('A projeção pública das chaves expôs campo administrativo.');
    }
    const anonWrite = await anon.rpc('set_event_category_duration', {
      target_category_id: categoryId,
      duration_minutes: 4,
    });
    if (!anonWrite.error) throw new Error('Público alterou a duração.');
    const protectedReads = await Promise.all([
      anon.from('event_schedules').select('*').limit(1),
      anon.from('event_areas').select('*').limit(1),
      anon.from('bracket_group_operations').select('*').limit(1),
    ]);
    if (protectedReads.some((result) => !result.error && (result.data || []).length > 0)) {
      throw new Error('Usuário anônimo obteve leitura administrativa.');
    }
    evidence.push('publico-somente-projecao');

    const checklist = await actor.rpc('get_event_group_checklists', { target_event_id: eventId });
    if (checklist.error || !isJsonObject(checklist.data) || checklist.data.kind !== 'group_checklists') {
      throw new Error('Checklist da Sprint 10 regressou.');
    }
    evidence.push('sem-regressao-sprint-10');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/admin/eventos/${eventId}/configuracao`);
    await page.getByRole('heading', { name: `Categorias — ${eventName}` }).waitFor();
    const configOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    if (configOverflow) throw new Error('Configuração possui overflow horizontal em 390px.');
    await publicPage.setViewportSize({ width: 390, height: 844 });
    await publicPage.goto(`/eventos/${eventId}/programacao`);
    await publicPage.getByRole('heading', { name: `Programação — ${eventName}` }).waitFor();
    await expect(publicPage.getByText('Tempo: 2,5 minutos').first()).toBeVisible();
    const scheduleOverflow = await publicPage.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    if (scheduleOverflow) throw new Error('Programação pública possui overflow horizontal em 390px.');
    evidence.push('mobile-390-sem-overflow');

    console.log(JSON.stringify({ ok: true, evidence }, null, 2));
  } finally {
    await context.close();
    await browser.close();
    await cleanup(admin, fixture);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
