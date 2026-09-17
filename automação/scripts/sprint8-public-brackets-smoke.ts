import { chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import type { Database, Json } from '../../lib/supabase/database.types';
import {
  createCleanupClients,
  loadCleanupEnv,
  resolveOwnerId,
} from '../tests/support/e2e-cleanup';

type AdminClient = Awaited<ReturnType<typeof createCleanupClients>>['admin'];

async function checked(label: string, result: PromiseLike<{ error: { message: string } | null }>) {
  const { error } = await result;
  if (error) throw new Error(`${label}: ${error.message}`);
}

function jsonArray(value: Json): Array<Record<string, Json | undefined>> {
  if (!Array.isArray(value)) throw new Error('A consulta pública não retornou uma lista.');
  return value.filter((item): item is Record<string, Json | undefined> => Boolean(item && typeof item === 'object' && !Array.isArray(item)));
}

async function cleanup(
  admin: AdminClient,
  fixture: {
    eventId: string
    organizationId: string
    teamIds: string[]
    ruleSetId: string
    categoryIds: string[]
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
  await checked('cleanup categories', admin.from('event_categories').delete().in('id', fixture.categoryIds));
  await checked('cleanup rule set', admin.from('category_rule_sets').delete().eq('id', fixture.ruleSetId));
  await checked('cleanup event', admin.from('events').delete().eq('id', fixture.eventId));
  await checked('cleanup athletes', admin.from('athletes').delete().in('id', fixture.athleteIds));
  await checked('cleanup teams', admin.from('teams').delete().in('id', fixture.teamIds));
  await checked('cleanup membership', admin.from('organization_members').delete().eq('organization_id', fixture.organizationId).eq('user_id', fixture.ownerId));
  await checked('cleanup organization', admin.from('organizations').delete().eq('id', fixture.organizationId));
}

async function main() {
  loadCleanupEnv();
  if (process.env.E2E_ALLOW_WRITES !== 'true') throw new Error('Smoke público exige E2E_ALLOW_WRITES=true no Sandbox.');

  const baseURL = process.env.BASE_URL || 'http://localhost:3000';
  const { admin, actor } = await createCleanupClients();
  const ownerId = await resolveOwnerId(actor);
  const suffix = randomUUID().slice(0, 8);
  const organizationId = randomUUID();
  const teamIds = [randomUUID(), randomUUID()];
  const eventId = randomUUID();
  const ruleSetId = randomUUID();
  const categoryIds = [randomUUID(), randomUUID()];
  const athleteIds = Array.from({ length: 10 }, () => randomUUID());
  const registrationIds = athleteIds.map(() => randomUUID());
  const competitionName = `Publico grupos 2 3 4 ${suffix}`;
  const soloName = `Publico sem confronto ${suffix}`;
  const fixture = { eventId, organizationId, teamIds, ruleSetId, categoryIds, athleteIds, registrationIds, ownerId };
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 1000 } });
  const evidence: string[] = [];

  try {
    await checked('organization', admin.from('organizations').insert({
      id: organizationId,
      nome: `Sprint 8 Público ${suffix}`,
      slug: `sprint-8-publico-${suffix}`,
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
      nome: `Equipe Pública ${index + 1} ${suffix}`,
      created_by: ownerId,
    }))));
    await checked('event', admin.from('events').insert({
      id: eventId,
      organization_id: organizationId,
      nome: `Sprint 8 Público ${suffix}`,
      slug: `sprint-8-publico-${suffix}`,
      data_evento: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
      local: 'Sandbox E2E',
      status: 'checagem',
      checagem_travada_em: new Date().toISOString(),
      created_by: ownerId,
      valor_inscricao: 80,
    }));
    await checked('rule set', admin.from('category_rule_sets').insert({
      id: ruleSetId,
      event_id: eventId,
      nome: `Sprint 8 Público ${suffix}`,
      versao: 1,
      ativo: true,
    }));
    await checked('categories', admin.from('event_categories').insert([
      {
        id: categoryIds[0],
        rule_set_id: ruleSetId,
        nome: competitionName,
        idade_min: 18,
        idade_max: 99,
        faixa_min_ordem: 1,
        faixa_max_ordem: 1,
        peso_min_kg: 0,
        peso_max_kg: 100,
        genero: 'M',
      },
      {
        id: categoryIds[1],
        rule_set_id: ruleSetId,
        nome: soloName,
        idade_min: 18,
        idade_max: 99,
        faixa_min_ordem: 1,
        faixa_max_ordem: 1,
        peso_min_kg: 100.01,
        peso_max_kg: 150,
        genero: 'M',
      },
    ]));
    await checked('athletes', admin.from('athletes').insert(athleteIds.map((id, index) => ({
      id,
      organization_id: organizationId,
      team_id: teamIds[index % 2],
      nome_completo: `Público Atleta ${String(index + 1).padStart(2, '0')} ${suffix}`,
      data_nascimento: '1995-01-01',
      genero: 'M',
      faixa: 'Branca',
      peso_kg: index === 9 ? 110 : 80,
    }))));
    await checked('registrations', admin.from('registrations').insert(registrationIds.map((id, index) => ({
      id,
      event_id: eventId,
      athlete_id: athleteIds[index],
      category_id: index === 9 ? categoryIds[1] : categoryIds[0],
      registered_by: ownerId,
      status: 'efetivada' as Database['public']['Enums']['registration_status'],
      valor: 80,
      athlete_snapshot: {
        nome_completo: `Público Atleta ${String(index + 1).padStart(2, '0')} ${suffix}`,
        data_nascimento: '1995-01-01',
        genero: 'M',
        faixa: 'Branca',
        peso_kg: index === 9 ? 110 : 80,
        team_id: teamIds[index % 2],
        team_name: `Equipe Pública ${(index % 2) + 1} ${suffix}`,
      },
      category_snapshot: { nome: index === 9 ? soloName : competitionName },
      rule_set_version: 1,
      terms_version: 'MVP-2026-09',
      terms_accepted_at: new Date().toISOString(),
    }))));

    const anon = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const page = await context.newPage();

    await page.goto(`/eventos/${eventId}`);
    await page.getByRole('link', { name: 'Consultar chaves' }).click();
    await page.getByRole('heading', { name: 'Nenhuma chave publicada' }).waitFor();
    evidence.push('evento-sem-publicada-vazio');

    const generated = await actor.rpc('generate_category_bracket', {
      target_event_id: eventId,
      target_category_id: categoryIds[0],
    });
    if (generated.error) throw generated.error;

    const draftPublic = await anon.rpc('get_public_event_brackets', { target_event_id: eventId });
    if (draftPublic.error || jsonArray(draftPublic.data).length !== 0) throw new Error('DRAFT apareceu na consulta pública.');
    await page.reload();
    await page.getByRole('heading', { name: 'Nenhuma chave publicada' }).waitFor();
    evidence.push('draft-invisivel');

    const draftId = (generated.data && typeof generated.data === 'object' && !Array.isArray(generated.data))
      ? String(generated.data.bracketId || '')
      : '';
    if (!draftId) throw new Error('Geração não retornou bracketId.');
    const published = await actor.rpc('publish_category_bracket', { target_bracket_id: draftId });
    if (published.error) throw published.error;

    await page.reload();
    await page.getByRole('heading', { name: competitionName }).waitFor();
    await page.getByRole('heading', { name: 'Grupo A' }).waitFor();
    await page.getByRole('heading', { name: 'Grupo B' }).waitFor();
    await page.getByRole('heading', { name: 'Grupo C' }).waitFor();
    await page.getByText('Semifinais com 4 atletas').waitFor();
    await page.getByText('Copo com 3 atletas').waitFor();
    await page.getByText('Final direta').waitFor();
    await page.getByText('Copo', { exact: true }).waitFor();
    evidence.push('publicada-grupos-4-3-2-copo-confrontos');

    const soloGenerated = await actor.rpc('generate_category_bracket', {
      target_event_id: eventId,
      target_category_id: categoryIds[1],
    });
    if (soloGenerated.error) throw soloGenerated.error;
    const soloDraftId = (soloGenerated.data && typeof soloGenerated.data === 'object' && !Array.isArray(soloGenerated.data))
      ? String(soloGenerated.data.bracketId || '')
      : '';
    const soloPublished = await actor.rpc('publish_category_bracket', { target_bracket_id: soloDraftId });
    if (soloPublished.error) throw soloPublished.error;
    await page.reload();
    await page.getByRole('heading', { name: soloName }).waitFor();
    await page.getByText('Sem confronto', { exact: true }).waitFor();
    await page.getByText('A categoria não possui confronto nem campeão automático.').waitFor();
    evidence.push('sem-confronto-publico');

    const regenerated = await actor.rpc('regenerate_category_bracket', {
      target_bracket_id: draftId,
      reason: 'Validar substituição na consulta pública',
    });
    if (regenerated.error) throw regenerated.error;
    const newDraftId = (regenerated.data && typeof regenerated.data === 'object' && !Array.isArray(regenerated.data))
      ? String(regenerated.data.bracketId || '')
      : '';
    const republished = await actor.rpc('publish_category_bracket', { target_bracket_id: newDraftId });
    if (republished.error) throw republished.error;

    const publicResult = await anon.rpc('get_public_event_brackets', { target_event_id: eventId });
    if (publicResult.error) throw publicResult.error;
    const publicBrackets = jsonArray(publicResult.data);
    if (publicBrackets.filter((item) => item.category === competitionName).length !== 1) {
      throw new Error('Versão substituída apareceu como oficial.');
    }
    const serializedPublic = JSON.stringify(publicResult.data);
    if (/(bracketId|participantId|registrationId|cpf|email|telefone|payment|generatedBy|publishedBy)/i.test(serializedPublic)) {
      throw new Error('A projeção pública expôs campo administrativo.');
    }
    evidence.push('substituida-invisivel-projecao-segura');

    const protectedReads = await Promise.all([
      anon.from('category_brackets').select('*').limit(1),
      anon.from('bracket_participants').select('*').limit(1),
      anon.from('bracket_groups').select('*').limit(1),
      anon.from('bracket_entries').select('*').limit(1),
      anon.from('bracket_matches').select('*').limit(1),
    ]);
    if (protectedReads.some((result) => !result.error && (result.data || []).length > 0)) {
      throw new Error('Usuário anônimo obteve leitura administrativa das tabelas de chaves.');
    }
    evidence.push('anon-sem-acesso-tabelas-administrativas');

    await page.reload();
    await page.setViewportSize({ width: 390, height: 844 });
    const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    if (hasHorizontalOverflow) throw new Error('Chaves públicas possuem overflow horizontal em 390px.');
    evidence.push('mobile-390-sem-overflow');

    console.log(JSON.stringify({ ok: true, evidence }, null, 2));
  } finally {
    await browser.close();
    await cleanup(admin, fixture);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
