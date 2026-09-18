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

function isJsonObject(value: Json | undefined): value is { [key: string]: Json | undefined } {
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
  if (process.env.E2E_ALLOW_WRITES !== 'true') throw new Error('Smoke de pesagem/premiação exige E2E_ALLOW_WRITES=true no Sandbox.');

  const baseURL = process.env.BASE_URL || 'http://localhost:3102';
  const { admin, actor } = await createCleanupClients();
  const ownerId = await resolveOwnerId(actor);
  const suffix = randomUUID().slice(0, 8);
  const organizationId = randomUUID();
  const teamIds = [randomUUID(), randomUUID()];
  const eventId = randomUUID();
  const ruleSetId = randomUUID();
  const categoryId = randomUUID();
  const athleteIds = [randomUUID(), randomUUID()];
  const registrationIds = athleteIds.map(() => randomUUID());
  const eventName = `Sprint 10 Checklist ${suffix}`;
  const categoryName = `Checklist final 2 ${suffix}`;
  const fixture = { eventId, organizationId, teamIds, ruleSetId, categoryId, athleteIds, registrationIds, ownerId };
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 1000 } });
  const evidence: string[] = [];

  try {
    await checked('organization', admin.from('organizations').insert({
      id: organizationId,
      nome: eventName,
      slug: `sprint-10-checklist-${suffix}`,
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
      nome: `Checklist Equipe ${index + 1} ${suffix}`,
      created_by: ownerId,
    }))));
    await checked('event', admin.from('events').insert({
      id: eventId,
      organization_id: organizationId,
      nome: eventName,
      slug: `sprint-10-checklist-${suffix}`,
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
      team_id: teamIds[index],
      nome_completo: `Checklist Atleta ${index + 1} ${suffix}`,
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
        nome_completo: `Checklist Atleta ${index + 1} ${suffix}`,
        data_nascimento: '1995-01-01',
        genero: 'M',
        faixa: 'Branca',
        peso_kg: 80,
        team_id: teamIds[index],
        team_name: `Checklist Equipe ${index + 1} ${suffix}`,
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
    const published = await actor.rpc('publish_category_bracket', { target_bracket_id: String(generated.data.bracketId || '') });
    if (published.error) throw published.error;

    const { data: groupRow, error: groupError } = await admin
      .from('bracket_groups')
      .select('id')
      .eq('bracket_id', String(generated.data.bracketId))
      .single();
    if (groupError || !groupRow) throw groupError || new Error('Subchave ausente.');
    const { data: matchRow, error: matchError } = await admin
      .from('bracket_matches')
      .select('id, status, winner_entry_id')
      .eq('group_id', groupRow.id)
      .single();
    if (matchError || !matchRow) throw matchError || new Error('Confronto ausente.');

    await applyOwnerSession(context, baseURL);
    const page = await context.newPage();
    await page.goto(`/admin/eventos/${eventId}/resultados`);
    await page.getByRole('heading', { name: `Resultados — ${eventName}` }).waitFor();
    await expect(page.getByText('Pesagem', { exact: true })).toBeVisible();
    await expect(page.getByText('Premiação', { exact: true })).toBeVisible();
    await expect(page.getByText('Resultado', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Marcar pesagem como realizada' }).click();
    await page.getByText('Pesagem marcada como realizada.').waitFor();
    const afterWeighIn = await admin.from('bracket_matches').select('status, winner_entry_id').eq('id', matchRow.id).single();
    if (
      afterWeighIn.data?.status !== matchRow.status
      || afterWeighIn.data?.winner_entry_id !== matchRow.winner_entry_id
    ) {
      throw new Error('Confirmar pesagem alterou o resultado persistido.');
    }
    const { data: schedules } = await admin.from('event_schedules').select('id').eq('event_id', eventId);
    if ((schedules || []).length) throw new Error('Checklist criou programação.');
    evidence.push('pesagem-pendente-depois-confirmada');

    await expect(page.getByRole('button', { name: 'Marcar premiação como realizada' })).toBeDisabled();
    evidence.push('premiacao-bloqueada-sem-resultado');

    await page.getByRole('button', { name: 'Iniciar operação' }).click();
    await page.getByText('Operação iniciada. O evento está em andamento.').waitFor();
    await page.getByLabel('Vencedor').selectOption({ index: 1 });
    await page.getByRole('button', { name: 'Registrar vitória' }).click();
    await page.getByText('Resultado registrado e vencedor avançado.').waitFor();
    await page.getByRole('button', { name: 'Marcar premiação como realizada' }).click();
    await page.getByText('Premiação marcada como realizada.').waitFor();
    evidence.push('resultado-libera-premiacao');

    const anon = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const anonWrite = await anon.rpc('confirm_bracket_group_weigh_in', { target_group_id: groupRow.id });
    if (!anonWrite.error) throw new Error('Público confirmou pesagem.');
    const publicPage = await context.newPage();
    await publicPage.goto(`/eventos/${eventId}/chaves`);
    await publicPage.getByRole('heading', { name: categoryName }).waitFor();
    await expect(publicPage.getByRole('button', { name: 'Marcar pesagem como realizada' })).toHaveCount(0);
    await expect(publicPage.getByRole('button', { name: 'Marcar premiação como realizada' })).toHaveCount(0);
    evidence.push('publico-nao-altera');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload();
    await page.getByRole('heading', { name: `Resultados — ${eventName}` }).waitFor();
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    if (hasOverflow) throw new Error('Checklist operacional possui overflow horizontal em 390px.');
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
