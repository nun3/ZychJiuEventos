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
import {
  MC_SIM_SPRINT9_PREFIX,
  type McSimSprint9Identity,
  type McSimSprint9Report,
} from '../tests/support/mc-sim-sprint9';

type AdminClient = Awaited<ReturnType<typeof createCleanupClients>>['admin'];
type JsonObject = { [key: string]: Json | undefined };
type CategoryKey = keyof McSimSprint9Identity['categoryIds'];

const categorySpecs: Record<CategoryKey, { label: string; count: number }> = {
  semi4: { label: 'Semi 4', count: 4 },
  final2: { label: 'Final 2', count: 2 },
};

function isJsonObject(value: Json | undefined): value is JsonObject {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function requiredText(value: Json | undefined, label: string) {
  if (typeof value !== 'string' || !value) throw new Error(`${label} ausente.`);
  return value;
}

async function checked(label: string, result: PromiseLike<{ error: { message: string } | null }>) {
  const { error } = await result;
  if (error) throw new Error(`${label}: ${error.message}`);
}

function publicMatches(payload: Json | null): JsonObject[] {
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

async function cleanup(admin: AdminClient, identity: McSimSprint9Identity, ownerId: string) {
  await checked('cleanup schedule', admin.from('event_schedules').delete().eq('event_id', identity.eventId));
  const { data: brackets } = await admin.from('category_brackets').select('id').eq('event_id', identity.eventId);
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
  await checked('cleanup audits', admin.from('event_audit_logs').delete().eq('event_id', identity.eventId));
  await checked('cleanup registrations', admin.from('registrations').delete().in('id', identity.registrationIds));
  await checked('cleanup categories', admin.from('event_categories').delete().in('id', Object.values(identity.categoryIds)));
  await checked('cleanup rule set', admin.from('category_rule_sets').delete().eq('id', identity.ruleSetId));
  await checked('cleanup event', admin.from('events').delete().eq('id', identity.eventId));
  await checked('cleanup athletes', admin.from('athletes').delete().in('id', identity.athleteIds));
  await checked('cleanup teams', admin.from('teams').delete().in('id', identity.teamIds));
  await checked('cleanup membership', admin.from('organization_members').delete().eq('organization_id', identity.organizationId).eq('user_id', ownerId));
  await checked('cleanup organization', admin.from('organizations').delete().eq('id', identity.organizationId));
  const [{ data: event }, { data: organization }, { data: schedule }, { data: athletes }, { data: teams }] = await Promise.all([
    admin.from('events').select('id').eq('id', identity.eventId).maybeSingle(),
    admin.from('organizations').select('id').eq('id', identity.organizationId).maybeSingle(),
    admin.from('event_schedules').select('id').eq('event_id', identity.eventId).maybeSingle(),
    admin.from('athletes').select('id').in('id', identity.athleteIds),
    admin.from('teams').select('id').in('id', identity.teamIds),
  ]);
  if (event || organization || schedule || (athletes || []).length || (teams || []).length) {
    throw new Error('Cleanup do MC-SIM Sprint 9 deixou massa principal.');
  }
}

async function seed(
  admin: AdminClient,
  ownerId: string,
  identity: McSimSprint9Identity,
  names: Record<CategoryKey, string>,
  teamNames: string[],
) {
  await checked('organization', admin.from('organizations').insert({
    id: identity.organizationId,
    nome: identity.eventName,
    slug: `mc-sim-sprint-9-${identity.runId}`,
    created_by: ownerId,
  }));
  await checked('membership', admin.from('organization_members').insert({
    organization_id: identity.organizationId,
    user_id: ownerId,
    role: 'owner',
  }));
  await checked('teams', admin.from('teams').insert(identity.teamIds.map((id, index) => ({
    id,
    organization_id: identity.organizationId,
    nome: teamNames[index],
    created_by: ownerId,
  }))));
  await checked('event', admin.from('events').insert({
    id: identity.eventId,
    organization_id: identity.organizationId,
    nome: identity.eventName,
    slug: `mc-sim-sprint-9-${identity.runId}`,
    data_evento: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
    local: 'Sandbox MC-SIM Sprint 9',
    status: 'chaves',
    checagem_travada_em: new Date().toISOString(),
    created_by: ownerId,
    valor_inscricao: 80,
  }));
  await checked('rule set', admin.from('category_rule_sets').insert({
    id: identity.ruleSetId,
    event_id: identity.eventId,
    nome: `${MC_SIM_SPRINT9_PREFIX} Regras ${identity.runId}`,
    versao: 1,
    ativo: true,
  }));
  await checked('categories', admin.from('event_categories').insert(
    (Object.keys(categorySpecs) as CategoryKey[]).map((key, index) => ({
      id: identity.categoryIds[key],
      rule_set_id: identity.ruleSetId,
      nome: names[key],
      idade_min: 18,
      idade_max: 99,
      faixa_min_ordem: 1,
      faixa_max_ordem: 1,
      peso_min_kg: index * 20,
      peso_max_kg: index * 20 + 19.99,
      genero: 'M',
      ordem: index + 1,
    })),
  ));

  const categorySequence = (Object.keys(categorySpecs) as CategoryKey[])
    .flatMap((key) => Array.from({ length: categorySpecs[key].count }, () => key));
  await checked('athletes', admin.from('athletes').insert(identity.athleteIds.map((id, index) => {
    const key = categorySequence[index];
    return {
      id,
      organization_id: identity.organizationId,
      team_id: identity.teamIds[index % identity.teamIds.length],
      nome_completo: `${MC_SIM_SPRINT9_PREFIX} Atleta ${String(index + 1).padStart(2, '0')} ${identity.runId}`,
      data_nascimento: '1995-01-01',
      genero: 'M',
      faixa: 'Branca',
      peso_kg: 10 + (Object.keys(categorySpecs) as CategoryKey[]).indexOf(key) * 20,
    };
  })));
  await checked('registrations', admin.from('registrations').insert(identity.registrationIds.map((id, index) => {
    const key = categorySequence[index];
    const teamIndex = index % identity.teamIds.length;
    return {
      id,
      event_id: identity.eventId,
      athlete_id: identity.athleteIds[index],
      category_id: identity.categoryIds[key],
      registered_by: ownerId,
      status: 'efetivada' as Database['public']['Enums']['registration_status'],
      valor: 80,
      athlete_snapshot: {
        nome_completo: `${MC_SIM_SPRINT9_PREFIX} Atleta ${String(index + 1).padStart(2, '0')} ${identity.runId}`,
        data_nascimento: '1995-01-01',
        genero: 'M',
        faixa: 'Branca',
        peso_kg: 10 + (Object.keys(categorySpecs) as CategoryKey[]).indexOf(key) * 20,
        team_id: identity.teamIds[teamIndex],
        team_name: teamNames[teamIndex],
      },
      category_snapshot: { nome: names[key] },
      rule_set_version: 1,
      terms_version: 'MC-SIM-SPRINT-9',
      terms_accepted_at: new Date().toISOString(),
    };
  })));
}

async function run() {
  loadCleanupEnv();
  if (process.env.E2E_ALLOW_WRITES !== 'true') throw new Error('MC-SIM Sprint 9 exige E2E_ALLOW_WRITES=true no Sandbox.');

  const baseURL = process.env.BASE_URL || 'http://localhost:3102';
  const { admin, actor } = await createCleanupClients();
  const ownerId = await resolveOwnerId(actor);
  const runId = randomUUID().slice(0, 8);
  const totalAthletes = Object.values(categorySpecs).reduce((total, spec) => total + spec.count, 0);
  const identity: McSimSprint9Identity = {
    revision: 'sprint9',
    runId,
    eventId: randomUUID(),
    eventName: `${MC_SIM_SPRINT9_PREFIX} — Jornada completa ${runId}`,
    organizationId: randomUUID(),
    ruleSetId: randomUUID(),
    teamIds: [randomUUID(), randomUUID()],
    categoryIds: { semi4: randomUUID(), final2: randomUUID() },
    athleteIds: Array.from({ length: totalAthletes }, () => randomUUID()),
    registrationIds: Array.from({ length: totalAthletes }, () => randomUUID()),
  };
  const names = {
    semi4: `${MC_SIM_SPRINT9_PREFIX} ${categorySpecs.semi4.label} ${runId}`,
    final2: `${MC_SIM_SPRINT9_PREFIX} ${categorySpecs.final2.label} ${runId}`,
  };
  const teamNames = identity.teamIds.map((_, index) => `${MC_SIM_SPRINT9_PREFIX} Equipe ${index + 1} ${runId}`);
  const scenarios: string[] = [];
  const failuresFoundAndFixed: string[] = [];
  const browser = await chromium.launch({ headless: true });
  const adminContext = await browser.newContext({ baseURL, viewport: { width: 1440, height: 1000 } });
  const publicContext = await browser.newContext({ baseURL, viewport: { width: 1440, height: 1000 } });

  try {
    await seed(admin, ownerId, identity, names, teamNames);

    for (const key of Object.keys(identity.categoryIds) as CategoryKey[]) {
      const generated = await actor.rpc('generate_category_bracket', {
        target_event_id: identity.eventId,
        target_category_id: identity.categoryIds[key],
      });
      if (generated.error || !isJsonObject(generated.data)) {
        throw new Error(`generate ${key}: ${generated.error?.message || 'retorno inválido'}`);
      }
      const published = await actor.rpc('publish_category_bracket', {
        target_bracket_id: requiredText(generated.data.bracketId, 'bracketId'),
      });
      if (published.error) throw published.error;
    }

    const anon = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    await applyOwnerSession(adminContext, baseURL);
    const adminPage = await adminContext.newPage();
    await adminPage.goto(`/admin/eventos/${identity.eventId}/programacao`);
    await adminPage.getByRole('heading', { name: `Programação — ${identity.eventName}` }).waitFor();

    await adminPage.getByLabel('Número').first().fill('1');
    await adminPage.getByLabel('Nome ou cor').first().fill('Verde');
    await adminPage.getByRole('button', { name: 'Adicionar área' }).click();
    await adminPage.getByText('Área criada.').waitFor();
    await adminPage.getByLabel('Número').first().fill('2');
    await adminPage.getByLabel('Nome ou cor').first().fill('Azul');
    await adminPage.getByRole('button', { name: 'Adicionar área' }).click();
    await adminPage.getByText('Área criada.').waitFor();
    scenarios.push('criacao-configuracao-areas');

    const groupSelect = (category: string) => adminPage
      .getByText(`${category} — Subchave A`, { exact: true })
      .locator('xpath=../..')
      .getByLabel('Área da subchave A');
    await groupSelect(names.semi4).selectOption({ label: 'Área 1 — Verde' });
    await adminPage.getByText('Subchave e todas as suas lutas foram atribuídas.').waitFor();
    await expect(adminPage.getByLabel('Luta 1', { exact: true })).toBeVisible();
    await expect(adminPage.getByLabel('Luta 2', { exact: true })).toBeVisible();
    await expect(adminPage.getByLabel('Luta 3', { exact: true })).toBeVisible();
    await groupSelect(names.final2).selectOption({ label: 'Área 2 — Azul' });
    await adminPage.getByText('Subchave e todas as suas lutas foram atribuídas.').waitFor();
    await expect(adminPage.getByLabel('Luta 4', { exact: true })).toBeVisible();
    scenarios.push('atribuicao-integral-subchave-fight-number-global');

    await adminPage.getByRole('button', { name: 'Mover luta 1 para baixo' }).click();
    await adminPage.getByText('Fila global reordenada e números recalculados.').waitFor();
    scenarios.push('reordenacao-draft');

    const publicPage = await publicContext.newPage();
    await publicPage.goto(`/eventos/${identity.eventId}/programacao`);
    await publicPage.getByRole('heading', { name: 'Nenhuma programação publicada' }).waitFor();
    const draftPublic = await anon.rpc('get_public_event_schedule', { target_event_id: identity.eventId });
    if (draftPublic.error || publicMatches(draftPublic.data).length !== 0) {
      throw new Error('DRAFT vazou para a consulta pública.');
    }
    scenarios.push('draft-invisivel-publico');

    await adminPage.getByRole('button', { name: 'Publicar programação' }).click();
    await adminPage.getByText('Programação publicada. Áreas e números estão congelados.').waitFor();
    await adminPage.getByText('Programação congelada').waitFor();
    const { data: scheduleRow, error: scheduleError } = await admin
      .from('event_schedules')
      .select('id')
      .eq('event_id', identity.eventId)
      .single();
    if (scheduleError || !scheduleRow) throw scheduleError || new Error('Programação publicada ausente.');
    const { data: scheduledMatches, error: scheduledError } = await admin
      .from('event_schedule_matches')
      .select('match_id')
      .eq('schedule_id', scheduleRow.id)
      .order('fight_number');
    if (scheduledError || !scheduledMatches?.length) throw scheduledError || new Error('Fila publicada vazia.');
    const frozen = await actor.rpc('reorder_event_schedule', {
      target_event_id: identity.eventId,
      ordered_match_ids: [...scheduledMatches.map((row) => row.match_id)].reverse(),
    });
    if (!frozen.error || frozen.error.message !== 'Programacao publicada nao pode ser alterada') {
      throw new Error('Programação publicada aceitou reordenação.');
    }
    scenarios.push('publicacao-congelamento');

    await publicPage.reload();
    await publicPage.getByRole('heading', { name: `Programação — ${identity.eventName}` }).waitFor();
    await expect(publicPage.getByRole('article', { name: 'Luta 1' })).toBeVisible();
    await expect(publicPage.getByRole('article', { name: 'Luta 4' })).toBeVisible();
    await publicPage.getByText(/Vencedor da luta \d+/).first().waitFor();
    const publishedPublic = await anon.rpc('get_public_event_schedule', { target_event_id: identity.eventId });
    if (publishedPublic.error) throw publishedPublic.error;
    const matchesBefore = publicMatches(publishedPublic.data);
    const numbersBefore = matchesBefore.map((match) => Number(match.fightNumber));
    if (numbersBefore.join(',') !== [...numbersBefore].sort((a, b) => a - b).join(',')) {
      throw new Error('Consulta pública fora da ordem global.');
    }
    if (/(matchId|areaId|scheduleId|entryId|groupId|publishedBy|actorId)/i.test(JSON.stringify(publishedPublic.data))) {
      throw new Error('Projeção pública expôs dado administrativo.');
    }
    scenarios.push('programacao-publica-ordem-global-dependente');

    await publicPage.getByLabel('Área').selectOption('2');
    await publicPage.getByRole('button', { name: 'Filtrar' }).click();
    await expect(publicPage.getByRole('article', { name: 'Luta 4' })).toBeVisible();
    await expect(publicPage.getByRole('article', { name: 'Luta 1' })).toHaveCount(0);
    await publicPage.getByLabel('Área').selectOption('');
    await publicPage.getByLabel('Categoria').selectOption(names.final2);
    await publicPage.getByRole('button', { name: 'Filtrar' }).click();
    await expect(publicPage.getByRole('article', { name: 'Luta 4' })).toBeVisible();
    await expect(publicPage.getByRole('article', { name: 'Luta 1' })).toHaveCount(0);
    await publicPage.getByLabel('Categoria').selectOption('');
    await publicPage.getByLabel('Equipe').selectOption(teamNames[0]);
    await publicPage.getByRole('button', { name: 'Filtrar' }).click();
    await publicPage.getByRole('heading', { name: `Lutas da equipe ${teamNames[0]}` }).waitFor();
    if (await publicPage.getByRole('article').count() < 1) throw new Error('Filtro por equipe não mostrou lutas.');
    scenarios.push('filtros-area-categoria-equipe');

    const { data: firstScheduled, error: firstScheduledError } = await admin
      .from('event_schedule_matches')
      .select('match_id')
      .eq('schedule_id', scheduleRow.id)
      .eq('fight_number', 1)
      .single();
    if (firstScheduledError || !firstScheduled) throw firstScheduledError || new Error('Luta 1 ausente.');
    const { data: firstMatch, error: firstMatchError } = await admin
      .from('bracket_matches')
      .select('id, group_id, side_a_entry_id')
      .eq('id', firstScheduled.match_id)
      .single();
    if (firstMatchError || !firstMatch?.side_a_entry_id) throw firstMatchError || new Error('Lado A da luta 1 ausente.');
    const { data: firstGroup, error: firstGroupError } = await admin
      .from('bracket_groups')
      .select('bracket_id')
      .eq('id', firstMatch.group_id)
      .single();
    if (firstGroupError || !firstGroup) throw firstGroupError || new Error('Grupo da luta 1 ausente.');
    const started = await actor.rpc('start_category_bracket', { target_bracket_id: firstGroup.bracket_id });
    if (started.error) throw started.error;
    const walkover = await actor.rpc('record_bracket_match_outcome', {
      target_match_id: firstMatch.id,
      target_winner_entry_id: firstMatch.side_a_entry_id,
      outcome: 'wo',
    });
    if (walkover.error) throw walkover.error;
    const afterWo = publicMatches((await anon.rpc('get_public_event_schedule', { target_event_id: identity.eventId })).data);
    const fightOne = afterWo.find((match) => Number(match.fightNumber) === 1);
    if (!fightOne || fightOne.isWalkover !== true || !fightOne.winner) {
      throw new Error('WO não apareceu na consulta pública.');
    }
    if (afterWo.map((match) => Number(match.fightNumber)).join(',') !== numbersBefore.join(',')) {
      throw new Error('WO alterou fight_number.');
    }
    const dependentBefore = matchesBefore.find((match) => {
      const sides = [match.sideA, match.sideB].filter(isJsonObject);
      return sides.some((side) => side.name === 'Vencedor da luta 1');
    });
    const dependentAfter = dependentBefore
      ? afterWo.find((match) => Number(match.fightNumber) === Number(dependentBefore.fightNumber))
      : null;
    const resolvedSide = [dependentAfter?.sideA, dependentAfter?.sideB].find((side) => isJsonObject(side) && side.name !== 'Vencedor da luta 1' && side.resolved === true);
    if (!dependentBefore || !resolvedSide) {
      throw new Error('Resultado posterior não resolveu o lado dependente.');
    }
    scenarios.push('wo-preserva-numero-resultado-refletido');

    await publicPage.goto(`/eventos/${identity.eventId}/programacao?equipe=${encodeURIComponent(teamNames[0])}`);
    await publicPage.getByRole('heading', { name: `Lutas da equipe ${teamNames[0]}` }).waitFor();
    scenarios.push('visao-por-equipe');

    const protectedReads = await Promise.all([
      anon.from('event_schedules').select('*').limit(1),
      anon.from('event_areas').select('*').limit(1),
      anon.from('event_schedule_groups').select('*').limit(1),
      anon.from('event_schedule_matches').select('*').limit(1),
    ]);
    if (protectedReads.some((result) => !result.error && (result.data || []).length > 0)) {
      throw new Error('Anônimo leu tabelas administrativas da programação.');
    }
    scenarios.push('seguranca-publica');

    await adminPage.setViewportSize({ width: 390, height: 844 });
    await publicPage.setViewportSize({ width: 390, height: 844 });
    await adminPage.goto(`/admin/eventos/${identity.eventId}/programacao`);
    await publicPage.goto(`/eventos/${identity.eventId}/programacao`);
    const [adminOverflow, publicOverflow] = await Promise.all([
      adminPage.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
      publicPage.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
    ]);
    if (adminOverflow || publicOverflow) {
      throw new Error(`Overflow mobile: admin=${adminOverflow}, público=${publicOverflow}.`);
    }
    scenarios.push('mobile-admin-publico-390');
  } finally {
    await adminContext.close();
    await publicContext.close();
    await browser.close();
    await cleanup(admin, identity, ownerId);
  }

  const report: McSimSprint9Report = {
    identity: { revision: identity.revision, runId: identity.runId, eventName: identity.eventName },
    ok: true,
    scenarios,
    failuresFoundAndFixed,
    cleanup: 'completed',
  };
  console.log(JSON.stringify(report, null, 2));
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
