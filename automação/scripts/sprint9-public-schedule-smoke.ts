import { chromium, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import type { Database, Json } from '../../lib/supabase/database.types';
import {
  createCleanupClients,
  loadCleanupEnv,
  resolveOwnerId,
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
  if (process.env.E2E_ALLOW_WRITES !== 'true') throw new Error('Smoke público de programação exige E2E_ALLOW_WRITES=true no Sandbox.');

  const baseURL = process.env.BASE_URL || 'http://localhost:3100';
  const { admin, actor } = await createCleanupClients();
  const ownerId = await resolveOwnerId(actor);
  const suffix = randomUUID().slice(0, 8);
  const organizationId = randomUUID();
  const teamIds = [randomUUID(), randomUUID()];
  const eventId = randomUUID();
  const ruleSetId = randomUUID();
  const categoryId = randomUUID();
  const athleteIds = Array.from({ length: 6 }, () => randomUUID());
  const registrationIds = athleteIds.map(() => randomUUID());
  const eventName = `Sprint 9 Público ${suffix}`;
  const categoryName = `Programação pública ${suffix}`;
  const teamNames = [`Equipe Pública 1 ${suffix}`, `Equipe Pública 2 ${suffix}`];
  const fixture = { eventId, organizationId, teamIds, ruleSetId, categoryId, athleteIds, registrationIds, ownerId };
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 1000 } });
  const evidence: string[] = [];

  try {
    await checked('organization', admin.from('organizations').insert({
      id: organizationId,
      nome: eventName,
      slug: `sprint-9-publico-${suffix}`,
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
      slug: `sprint-9-publico-${suffix}`,
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
      nome_completo: `Público Prog Atleta ${index + 1} ${suffix}`,
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
        nome_completo: `Público Prog Atleta ${index + 1} ${suffix}`,
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
    if (groupsError || !groups || groups.length !== 2) throw new Error('Esperava duas subchaves oficiais.');
    const groupA = groups.find((group) => group.label === 'A')?.id;
    const groupB = groups.find((group) => group.label === 'B')?.id;
    if (!groupA || !groupB) throw new Error('Subchaves A e B ausentes.');

    const areaOne = await actor.rpc('save_event_area', {
      target_event_id: eventId,
      target_area_id: null,
      area_number: 1,
      area_name: 'Verde',
    });
    const areaTwo = await actor.rpc('save_event_area', {
      target_event_id: eventId,
      target_area_id: null,
      area_number: 2,
      area_name: 'Azul',
    });
    if (areaOne.error || !isJsonObject(areaOne.data) || areaTwo.error || !isJsonObject(areaTwo.data)) {
      throw new Error(areaOne.error?.message || areaTwo.error?.message || 'Áreas não criadas.');
    }
    const assignedA = await actor.rpc('assign_schedule_group', { target_group_id: groupA, target_area_id: String(areaOne.data.areaId) });
    const assignedB = await actor.rpc('assign_schedule_group', { target_group_id: groupB, target_area_id: String(areaTwo.data.areaId) });
    if (assignedA.error || assignedB.error) throw assignedA.error || assignedB.error;

    const anon = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const page = await context.newPage();
    await page.goto(`/eventos/${eventId}`);
    await page.getByRole('link', { name: 'Consultar programação' }).click();
    await page.getByRole('heading', { name: 'Nenhuma programação publicada' }).waitFor();
    const draftPublic = await anon.rpc('get_public_event_schedule', { target_event_id: eventId });
    if (draftPublic.error || matchesFrom(draftPublic.data).length !== 0) {
      throw new Error('DRAFT apareceu na consulta pública da programação.');
    }
    evidence.push('draft-invisivel');

    const publishedSchedule = await actor.rpc('publish_event_schedule', { target_event_id: eventId });
    if (publishedSchedule.error) throw publishedSchedule.error;

    await page.reload();
    await page.getByRole('heading', { name: `Programação — ${eventName}` }).waitFor();
    await expect(page.getByRole('article', { name: 'Luta 1' })).toBeVisible();
    await expect(page.getByRole('article', { name: 'Luta 2' })).toBeVisible();
    await expect(page.getByRole('article', { name: 'Luta 3' })).toBeVisible();
    await expect(page.getByRole('article', { name: 'Luta 4' })).toBeVisible();
    await page.getByText(/Vencedor da luta \d+/).first().waitFor();
    evidence.push('publicada-ordem-global-dependente');

    await page.getByLabel('Área').selectOption('2');
    await page.getByRole('button', { name: 'Filtrar' }).click();
    await page.getByRole('heading', { name: `Programação — ${eventName}` }).waitFor();
    await expect(page.getByRole('article', { name: 'Luta 4' })).toBeVisible();
    await expect(page.getByRole('article', { name: 'Luta 1' })).toHaveCount(0);
    evidence.push('filtro-area');

    await page.getByLabel('Área').selectOption('');
    await page.getByLabel('Equipe').selectOption(teamNames[0]);
    await page.getByRole('button', { name: 'Filtrar' }).click();
    await page.getByRole('heading', { name: `Lutas da equipe ${teamNames[0]}` }).waitFor();
    const teamArticles = page.getByRole('article');
    if (await teamArticles.count() < 1) throw new Error('Filtro por equipe não mostrou lutas.');
    evidence.push('filtro-equipe');

    const publicResult = await anon.rpc('get_public_event_schedule', { target_event_id: eventId });
    if (publicResult.error) throw publicResult.error;
    const publicMatches = matchesFrom(publicResult.data);
    const numbers = publicMatches.map((match) => Number(match.fightNumber));
    if (numbers.join(',') !== [...numbers].sort((a, b) => a - b).join(',')) {
      throw new Error('A programação pública não veio em fight_number crescente.');
    }
    const serializedPublic = JSON.stringify(publicResult.data);
    if (/(matchId|areaId|scheduleId|entryId|groupId|publishedBy|actorId|audit)/i.test(serializedPublic)) {
      throw new Error('A projeção pública da programação expôs campo administrativo.');
    }

    const { data: scheduleRow, error: scheduleError } = await admin
      .from('event_schedules')
      .select('id')
      .eq('event_id', eventId)
      .single();
    if (scheduleError || !scheduleRow) throw scheduleError || new Error('Programação ausente.');
    const { data: firstMatchRows, error: firstMatchError } = await admin
      .from('event_schedule_matches')
      .select('match_id')
      .eq('schedule_id', scheduleRow.id)
      .eq('fight_number', 1)
      .maybeSingle();
    if (firstMatchError || !firstMatchRows) throw firstMatchError || new Error('Luta 1 ausente.');
    const { data: matchRow, error: matchError } = await admin
      .from('bracket_matches')
      .select('id, side_a_entry_id')
      .eq('id', firstMatchRows.match_id)
      .single();
    if (matchError || !matchRow?.side_a_entry_id) throw matchError || new Error('Lado A da luta 1 ausente.');
    const started = await actor.rpc('start_category_bracket', { target_bracket_id: bracketId });
    if (started.error) throw started.error;
    const walkover = await actor.rpc('record_bracket_match_outcome', {
      target_match_id: matchRow.id,
      target_winner_entry_id: matchRow.side_a_entry_id,
      outcome: 'wo',
    });
    if (walkover.error) throw walkover.error;

    const afterWoResult = await anon.rpc('get_public_event_schedule', { target_event_id: eventId });
    if (afterWoResult.error) throw afterWoResult.error;
    const afterWo = matchesFrom(afterWoResult.data);
    const fightOne = afterWo.find((match) => Number(match.fightNumber) === 1);
    const fightThree = afterWo.find((match) => Number(match.fightNumber) === 3);
    if (!fightOne || fightOne.isWalkover !== true || !fightOne.winner) {
      throw new Error('WO não apareceu na luta 1 pública.');
    }
    if (afterWo.map((match) => Number(match.fightNumber)).join(',') !== numbers.join(',')) {
      throw new Error('WO alterou a numeração pública.');
    }
    const finalSide = fightThree && isJsonObject(fightThree.sideA) ? fightThree.sideA : null;
    if (!finalSide || finalSide.resolved !== true) {
      throw new Error('Resultado posterior não resolveu o lado dependente.');
    }
    evidence.push('resultado-wo-preserva-numero');

    const protectedReads = await Promise.all([
      anon.from('event_schedules').select('*').limit(1),
      anon.from('event_areas').select('*').limit(1),
      anon.from('event_schedule_groups').select('*').limit(1),
      anon.from('event_schedule_matches').select('*').limit(1),
    ]);
    if (protectedReads.some((result) => !result.error && (result.data || []).length > 0)) {
      throw new Error('Usuário anônimo obteve leitura administrativa da programação.');
    }
    evidence.push('anon-sem-acesso-tabelas-administrativas');

    await page.goto(`/eventos/${eventId}/programacao`);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('heading', { name: `Programação — ${eventName}` }).waitFor();
    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    if (hasHorizontalOverflow) throw new Error('Programação pública possui overflow horizontal em 390px.');
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
