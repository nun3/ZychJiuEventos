import { chromium, expect, type BrowserContext } from '@playwright/test';
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

function isJsonObject(value: Json): value is JsonObject {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

async function checked(label: string, result: PromiseLike<{ error: { message: string } | null }>) {
  const { error } = await result;
  if (error) throw new Error(`${label}: ${error.message}`);
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
  if (process.env.E2E_ALLOW_WRITES !== 'true') throw new Error('Smoke de programação exige E2E_ALLOW_WRITES=true no Sandbox.');

  const baseURL = process.env.BASE_URL || 'http://localhost:3100';
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
  const eventName = `Sprint 9 Programação ${suffix}`;
  const categoryName = `Programação semi 4 ${suffix}`;
  const fixture = { eventId, organizationId, teamIds, ruleSetId, categoryId, athleteIds, registrationIds, ownerId };
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 1000 } });
  const evidence: string[] = [];

  try {
    await checked('organization', admin.from('organizations').insert({
      id: organizationId,
      nome: eventName,
      slug: `sprint-9-programacao-${suffix}`,
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
      nome: `Programação Equipe ${index + 1} ${suffix}`,
      created_by: ownerId,
    }))));
    await checked('event', admin.from('events').insert({
      id: eventId,
      organization_id: organizationId,
      nome: eventName,
      slug: `sprint-9-programacao-${suffix}`,
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
      nome_completo: `Programação Atleta ${index + 1} ${suffix}`,
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
        nome_completo: `Programação Atleta ${index + 1} ${suffix}`,
        data_nascimento: '1995-01-01',
        genero: 'M',
        faixa: 'Branca',
        peso_kg: 80,
        team_id: teamIds[index % 2],
        team_name: `Programação Equipe ${(index % 2) + 1} ${suffix}`,
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
    if (generated.error || !generated.data || typeof generated.data !== 'object' || Array.isArray(generated.data)) {
      throw new Error(`generate: ${generated.error?.message || 'retorno inválido'}`);
    }
    const bracketId = String(generated.data.bracketId || '');
    const published = await actor.rpc('publish_category_bracket', { target_bracket_id: bracketId });
    if (published.error) throw published.error;
    const scheduleProbe = await actor.rpc('get_event_schedule_operation', { target_event_id: eventId });
    if (scheduleProbe.error) throw new Error(`schedule projection: ${scheduleProbe.error.message}`);

    await applyOwnerSession(context, baseURL);
    const page = await context.newPage();
    const response = await page.goto(`/admin/eventos/${eventId}/programacao`);
    try {
      await page.getByRole('heading', { name: `Programação — ${eventName}` }).waitFor({ timeout: 10_000 });
    } catch {
      const pageText = (await page.locator('body').innerText()).replace(/\s+/g, ' ').slice(0, 600);
      throw new Error(`Programação não abriu (${response?.status() || 'sem status'}, ${page.url()}): ${pageText}`);
    }

    const numberInput = page.getByLabel('Número').first();
    const nameInput = page.getByLabel('Nome ou cor').first();
    await numberInput.fill('1');
    await nameInput.fill('Verde');
    await page.getByRole('button', { name: 'Adicionar área' }).click();
    await page.getByText('Área criada.').waitFor();
    evidence.push('area-numero-nome');

    await page.getByLabel('Número').first().fill('2');
    await page.getByLabel('Nome ou cor').first().fill('Azul');
    await page.getByRole('button', { name: 'Adicionar área' }).click();
    await page.getByText('Área criada.').waitFor();

    const groupArea = page.getByLabel('Área da subchave A');
    await groupArea.selectOption({ label: 'Área 1 — Verde' });
    await page.getByText('Subchave e todas as suas lutas foram atribuídas.').waitFor();
    await expect(page.getByLabel('Luta 1', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Luta 2', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Luta 3', { exact: true })).toBeVisible();
    evidence.push('subchave-area-numeracao-global');

    await page.getByRole('button', { name: 'Mover luta 1 para baixo' }).click();
    await page.getByText('Fila global reordenada e números recalculados.').waitFor();
    evidence.push('reordenacao-atomica');

    await groupArea.selectOption({ label: 'Área 2 — Azul' });
    await page.getByText('Subchave e todas as suas lutas foram atribuídas.').waitFor();
    await expect(page.getByRole('heading', { name: 'Área 2 — Azul' }).locator('..').getByText('3 lutas')).toBeVisible();
    evidence.push('movimentacao-subchave-inteira');

    await page.getByRole('button', { name: 'Publicar programação' }).click();
    await page.getByText('Programação publicada. Áreas e números estão congelados.').waitFor();
    await page.getByText('Programação congelada').waitFor();
    await expect(page.getByRole('button', { name: 'Publicar programação' })).toHaveCount(0);
    evidence.push('publicacao-congelamento');

    const operation = await actor.rpc('get_event_schedule_operation', { target_event_id: eventId });
    if (operation.error || !operation.data || typeof operation.data !== 'object' || Array.isArray(operation.data)) {
      throw new Error(`operation: ${operation.error?.message || 'retorno inválido'}`);
    }
    const groups = Array.isArray(operation.data.groups) ? operation.data.groups : [];
    const firstGroup = groups[0];
    const matches = firstGroup && typeof firstGroup === 'object' && !Array.isArray(firstGroup) && Array.isArray(firstGroup.matches)
      ? firstGroup.matches
      : [];
    const matchIds = matches
      .filter(isJsonObject)
      .sort((a, b) => Number(a.fightNumber) - Number(b.fightNumber))
      .map((match) => String(match.matchId));
    const frozenAttempt = await actor.rpc('reorder_event_schedule', {
      target_event_id: eventId,
      ordered_match_ids: [...matchIds].reverse(),
    });
    if (!frozenAttempt.error || frozenAttempt.error.message !== 'Programacao publicada nao pode ser alterada') {
      throw new Error('Programação publicada aceitou reordenação autenticada.');
    }
    evidence.push('rpc-autenticada-congelada');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await page.getByRole('heading', { name: `Programação — ${eventName}` }).waitFor();
    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    if (hasHorizontalOverflow) throw new Error('Programação administrativa possui overflow horizontal em 390px.');
    evidence.push('admin-mobile-390');

    const { data: audits, error: auditsError } = await admin
      .from('event_audit_logs')
      .select('action')
      .eq('event_id', eventId)
      .in('action', ['event_area_created', 'schedule_group_assigned', 'schedule_group_moved', 'event_schedule_reordered', 'event_schedule_published']);
    if (auditsError) throw auditsError;
    const actions = new Set((audits || []).map((audit) => audit.action));
    if (actions.size !== 5) throw new Error('Trilha de auditoria da programação incompleta.');
    evidence.push('auditoria');

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
