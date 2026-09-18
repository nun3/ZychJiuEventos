import { chromium, expect, type BrowserContext, type Page } from '@playwright/test';
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
  MC_SIM_SPRINT8_PREFIX,
  type McSimSprint8Identity,
  type McSimSprint8Report,
} from '../tests/support/mc-sim-sprint8';

type AdminClient = Awaited<ReturnType<typeof createCleanupClients>>['admin'];
type ActorClient = Awaited<ReturnType<typeof createCleanupClients>>['actor'];
type CategoryKey = keyof McSimSprint8Identity['categoryIds'];
type JsonRecord = Record<string, Json | undefined>;

const categorySpecs: Record<CategoryKey, { label: string; count: number }> = {
  semConfronto: { label: 'Sem confronto', count: 1 },
  final2: { label: 'Final 2 mesma equipe', count: 2 },
  copo3: { label: 'Copo 3', count: 3 },
  semi4: { label: 'Semi 4', count: 4 },
  agrupada9: { label: 'Agrupada 9', count: 9 },
};

function object(value: Json | null): JsonRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('RPC retornou payload inválido.');
  return value as JsonRecord;
}

function list(value: Json | undefined): JsonRecord[] {
  return Array.isArray(value)
    ? value.filter((item): item is JsonRecord => Boolean(item && typeof item === 'object' && !Array.isArray(item)))
    : [];
}

function requiredText(value: Json | undefined, label: string) {
  if (typeof value !== 'string' || !value) throw new Error(`${label} ausente.`);
  return value;
}

async function checked(label: string, result: PromiseLike<{ error: { message: string } | null }>) {
  const { error } = await result;
  if (error) throw new Error(`${label}: ${error.message}`);
}

async function rpcPayload(
  label: string,
  result: PromiseLike<{ data: Json | null; error: { message: string } | null }>,
) {
  const { data, error } = await result;
  if (error) throw new Error(`${label}: ${error.message}`);
  return object(data);
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

async function compositionSignature(admin: AdminClient, bracketId: string) {
  const { data: groups, error: groupError } = await admin
    .from('bracket_groups')
    .select('id, label, topology, sort_order')
    .eq('bracket_id', bracketId)
    .order('sort_order');
  if (groupError) throw groupError;
  const ids = (groups || []).map((group) => group.id);
  const { data: entries, error: entryError } = await admin
    .from('bracket_entries')
    .select('group_id, participant_id, slot')
    .eq('bracket_id', bracketId)
    .order('slot');
  if (entryError) throw entryError;
  return JSON.stringify((groups || []).map((group) => ({
    label: group.label,
    topology: group.topology,
    slots: (entries || [])
      .filter((entry) => entry.group_id === group.id)
      .sort((a, b) => a.slot - b.slot)
      .map((entry) => [entry.slot, entry.participant_id]),
  })));
}

async function cleanup(admin: AdminClient, identity: McSimSprint8Identity, ownerId: string) {
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
  const [{ data: event }, { data: organization }] = await Promise.all([
    admin.from('events').select('id').eq('id', identity.eventId).maybeSingle(),
    admin.from('organizations').select('id').eq('id', identity.organizationId).maybeSingle(),
  ]);
  if (event || organization) throw new Error('Cleanup do MC-SIM Sprint 8 deixou massa principal.');
}

async function seed(
  admin: AdminClient,
  ownerId: string,
  identity: McSimSprint8Identity,
  names: Record<CategoryKey, string>,
) {
  await checked('organization', admin.from('organizations').insert({
    id: identity.organizationId,
    nome: identity.eventName,
    slug: `mc-sim-sprint-8-${identity.runId}`,
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
    nome: `${MC_SIM_SPRINT8_PREFIX} Equipe ${index + 1} ${identity.runId}`,
    created_by: ownerId,
  }))));
  await checked('event', admin.from('events').insert({
    id: identity.eventId,
    organization_id: identity.organizationId,
    nome: identity.eventName,
    slug: `mc-sim-sprint-8-${identity.runId}`,
    data_evento: new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10),
    local: 'Sandbox MC-SIM Sprint 8',
    status: 'checagem',
    created_by: ownerId,
    valor_inscricao: 80,
  }));
  await checked('rule set', admin.from('category_rule_sets').insert({
    id: identity.ruleSetId,
    event_id: identity.eventId,
    nome: `${MC_SIM_SPRINT8_PREFIX} Regras ${identity.runId}`,
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
    const forceSameTeam = key === 'final2';
    const teamIndex = forceSameTeam ? 0 : index % identity.teamIds.length;
    return {
      id,
      organization_id: identity.organizationId,
      team_id: identity.teamIds[teamIndex],
      nome_completo: `${MC_SIM_SPRINT8_PREFIX} Atleta ${String(index + 1).padStart(2, '0')} ${identity.runId}`,
      data_nascimento: '1995-01-01',
      genero: 'M',
      faixa: 'Branca',
      peso_kg: 10 + (Object.keys(categorySpecs) as CategoryKey[]).indexOf(key) * 20,
    };
  })));
  await checked('registrations', admin.from('registrations').insert(identity.registrationIds.map((id, index) => {
    const key = categorySequence[index];
    const forceSameTeam = key === 'final2';
    const teamIndex = forceSameTeam ? 0 : index % identity.teamIds.length;
    const athleteName = `${MC_SIM_SPRINT8_PREFIX} Atleta ${String(index + 1).padStart(2, '0')} ${identity.runId}`;
    const teamName = `${MC_SIM_SPRINT8_PREFIX} Equipe ${teamIndex + 1} ${identity.runId}`;
    return {
      id,
      event_id: identity.eventId,
      athlete_id: identity.athleteIds[index],
      category_id: identity.categoryIds[key],
      registered_by: ownerId,
      status: 'efetivada' as Database['public']['Enums']['registration_status'],
      valor: 80,
      athlete_snapshot: {
        nome_completo: athleteName,
        data_nascimento: '1995-01-01',
        genero: 'M',
        faixa: 'Branca',
        peso_kg: 10 + (Object.keys(categorySpecs) as CategoryKey[]).indexOf(key) * 20,
        team_id: identity.teamIds[teamIndex],
        team_name: teamName,
      },
      category_snapshot: { nome: names[key] },
      rule_set_version: 1,
      terms_version: 'MC-SIM-SPRINT-8',
      terms_accepted_at: new Date().toISOString(),
    };
  })));
}

async function generateViaRpc(actor: ActorClient, eventId: string, categoryId: string) {
  const payload = await rpcPayload('gerar chave', actor.rpc('generate_category_bracket', {
    target_event_id: eventId,
    target_category_id: categoryId,
  }));
  return { id: requiredText(payload.bracketId, 'bracketId'), payload };
}

async function publish(actor: ActorClient, bracketId: string) {
  await rpcPayload('publicar chave', actor.rpc('publish_category_bracket', { target_bracket_id: bracketId }));
}

async function chooseDifferentOption(select: ReturnType<Page['locator']>) {
  const current = await select.inputValue();
  const values = await select.locator('option').evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value));
  const target = values.find((value) => value && value !== current);
  if (!target) throw new Error('Slot sem segundo atleta para casamento manual.');
  await select.selectOption(target);
}

function allMatches(operation: JsonRecord) {
  return list(operation.groups).flatMap((group) => list(group.matches));
}

async function completeBracket(
  actor: ActorClient,
  bracketId: string,
  outcomes: Array<'concluido' | 'wo'> = [],
) {
  await rpcPayload('iniciar chave', actor.rpc('start_category_bracket', { target_bracket_id: bracketId }));
  let outcomeIndex = 0;
  for (let step = 0; step < 20; step += 1) {
    const operation = await rpcPayload('ler operação', actor.rpc('get_category_bracket_operation', { target_bracket_id: bracketId }));
    if (operation.status === 'concluida') return operation;
    const match = allMatches(operation).find((item) => item.canRecord === true);
    if (!match) throw new Error('Chave em andamento sem confronto liberado.');
    const sideA = object(match.sideA && typeof match.sideA === 'object' && !Array.isArray(match.sideA) ? match.sideA : null);
    await rpcPayload('registrar resultado', actor.rpc('record_bracket_match_outcome', {
      target_match_id: requiredText(match.matchId, 'matchId'),
      target_winner_entry_id: requiredText(sideA.entryId, 'winnerEntryId'),
      outcome: outcomes[outcomeIndex] || 'concluido',
    }));
    outcomeIndex += 1;
  }
  throw new Error('Chave não concluiu dentro do limite de confrontos.');
}

function assertPlacements(operation: JsonRecord, expectedByTopology: Record<string, number[]>) {
  for (const group of list(operation.groups)) {
    const topology = requiredText(group.topology, 'topologia');
    const actual = list(group.placements).map((placement) => Number(placement.place));
    const expected = expectedByTopology[topology];
    if (!expected || JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`Colocações inválidas em ${topology}: ${actual.join(',')}.`);
    }
  }
}

async function run() {
  loadCleanupEnv();
  if (process.env.E2E_ALLOW_WRITES !== 'true') throw new Error('MC-SIM Sprint 8 exige E2E_ALLOW_WRITES=true no Sandbox.');

  const baseURL = process.env.BASE_URL || 'http://localhost:3102';
  const { admin, actor } = await createCleanupClients();
  const ownerId = await resolveOwnerId(actor);
  const runId = randomUUID().slice(0, 8);
  const totalAthletes = Object.values(categorySpecs).reduce((total, spec) => total + spec.count, 0);
  const identity: McSimSprint8Identity = {
    revision: 'sprint8',
    runId,
    eventId: randomUUID(),
    eventName: `${MC_SIM_SPRINT8_PREFIX} — Jornada completa ${runId}`,
    organizationId: randomUUID(),
    ruleSetId: randomUUID(),
    teamIds: [randomUUID(), randomUUID(), randomUUID()],
    categoryIds: {
      semConfronto: randomUUID(),
      final2: randomUUID(),
      copo3: randomUUID(),
      semi4: randomUUID(),
      agrupada9: randomUUID(),
    },
    athleteIds: Array.from({ length: totalAthletes }, () => randomUUID()),
    registrationIds: Array.from({ length: totalAthletes }, () => randomUUID()),
  };
  const names = Object.fromEntries(
    (Object.keys(categorySpecs) as CategoryKey[]).map((key) => [key, `${MC_SIM_SPRINT8_PREFIX} ${categorySpecs[key].label} ${runId}`]),
  ) as Record<CategoryKey, string>;
  const scenarios: string[] = [];
  const bracketIds = {} as Record<CategoryKey, string>;
  const browser = await chromium.launch({ headless: true });
  const adminContext = await browser.newContext({ baseURL, viewport: { width: 1440, height: 1000 } });
  const publicContext = await browser.newContext({ baseURL, viewport: { width: 1440, height: 1000 } });

  try {
    await seed(admin, ownerId, identity, names);
    const locked = await rpcPayload('travar checagem', actor.rpc('lock_event_checagem', { target_event_id: identity.eventId }));
    if (!locked.lockedAt) throw new Error('Travamento não retornou instante.');
    const lockedEvent = await admin.from('events').select('checagem_travada_em').eq('id', identity.eventId).single();
    if (!lockedEvent.data?.checagem_travada_em) throw new Error('Checagem não ficou travada.');
    scenarios.push('checagem-travada');

    await applyOwnerSession(adminContext, baseURL);
    const adminPage = await adminContext.newPage();
    await adminPage.goto(`/admin/eventos/${identity.eventId}/chaves`);
    await adminPage.getByRole('heading', { name: `Chaves — ${identity.eventName}` }).waitFor();
    await adminPage.getByRole('button', { name: new RegExp(names.agrupada9) }).click();
    await adminPage.getByRole('button', { name: 'Gerar chave' }).click();
    await adminPage.getByText('Chave gerada em rascunho.').waitFor();
    await adminPage.getByRole('heading', { name: 'Grupo A' }).waitFor();
    await adminPage.getByRole('heading', { name: 'Grupo B' }).waitFor();
    await adminPage.getByRole('heading', { name: 'Grupo C' }).waitFor();
    await adminPage.getByText('Semifinais com 4 atletas').waitFor();
    await adminPage.getByText('Copo com 3 atletas').waitFor();
    await adminPage.getByText('Final direta').waitFor();
    const groupedDraft = await admin.from('category_brackets').select('id').eq('event_id', identity.eventId).eq('category_id', identity.categoryIds.agrupada9).eq('status', 'draft').single();
    if (!groupedDraft.data) throw new Error('Draft agrupado não persistiu.');
    bracketIds.agrupada9 = groupedDraft.data.id;
    const originalSignature = await compositionSignature(admin, bracketIds.agrupada9);
    scenarios.push('geracao-grupos-subchaves-4-3-2');

    const firstSlot = adminPage.locator('label').filter({ hasText: 'Slot 01' }).first().locator('select');
    await chooseDifferentOption(firstSlot);
    await adminPage.getByRole('button', { name: 'Salvar composição' }).click();
    await adminPage.getByText('Composição salva.').waitFor();
    const manualSignature = await compositionSignature(admin, bracketIds.agrupada9);
    if (manualSignature === originalSignature) throw new Error('Casamento manual não alterou a persistência.');
    scenarios.push('casamento-manual-persistido');

    adminPage.once('dialog', (dialog) => dialog.accept());
    await adminPage.getByRole('button', { name: 'Restaurar sugestão' }).click();
    await adminPage.getByText('Sugestão automática restaurada.').waitFor();
    if (await compositionSignature(admin, bracketIds.agrupada9) !== originalSignature) {
      throw new Error('Restore não recompôs a sugestão original.');
    }
    scenarios.push('restore-sugestao');

    for (const key of ['semConfronto', 'final2', 'copo3', 'semi4'] as CategoryKey[]) {
      const generated = await generateViaRpc(actor, identity.eventId, identity.categoryIds[key]);
      bracketIds[key] = generated.id;
      if (key === 'semConfronto' && generated.payload.mode !== 'sem_confronto') {
        throw new Error('N=1 não gerou sem_confronto.');
      }
      if (key === 'final2' && list(generated.payload.warnings).length === 0) {
        throw new Error('Same-team inevitável não gerou warning.');
      }
    }
    await adminPage.getByRole('button', { name: new RegExp(names.final2) }).click();
    await adminPage.getByText('Atletas da mesma equipe se enfrentam', { exact: true }).waitFor();
    scenarios.push('sem-confronto-final2-copo3-semi4-same-team');

    for (const key of Object.keys(bracketIds) as CategoryKey[]) await publish(actor, bracketIds[key]);
    const anon = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const beforePublic = await anon.rpc('get_public_event_brackets', { target_event_id: identity.eventId });
    if (beforePublic.error || !Array.isArray(beforePublic.data)) throw new Error(`Consulta pública falhou: ${beforePublic.error?.message || 'lista ausente'}.`);
    const publicSerialized = JSON.stringify(beforePublic.data);
    if (/(bracketId|participantId|registrationId|generatedBy|publishedBy)/i.test(publicSerialized)) {
      throw new Error('Consulta pública expôs identificador administrativo.');
    }
    const publicPage = await publicContext.newPage();
    await publicPage.goto(`/eventos/${identity.eventId}/chaves`);
    await publicPage.getByRole('heading', { name: names.semConfronto }).waitFor();
    await publicPage.getByText('A categoria não possui confronto nem campeão automático.').waitFor();
    scenarios.push('publicacao-consulta-publica-sem-confronto');

    const regenerated = await rpcPayload('regenerar antes de resultado', actor.rpc('regenerate_category_bracket', {
      target_bracket_id: bracketIds.agrupada9,
      reason: 'MC-SIM Sprint 8 valida versionamento antes de resultado',
    }));
    const regeneratedId = requiredText(regenerated.bracketId, 'bracketId regenerado');
    await publish(actor, regeneratedId);
    const versions = await admin.from('category_brackets').select('id, version, status').eq('event_id', identity.eventId).eq('category_id', identity.categoryIds.agrupada9).order('version');
    if (
      versions.error
      || versions.data?.length !== 2
      || versions.data[0].status !== 'substituida'
      || versions.data[1].status !== 'publicada'
      || versions.data[1].version !== 2
    ) throw new Error('Versionamento/regeneração não preservou v1 substituída e v2 publicada.');
    bracketIds.agrupada9 = regeneratedId;
    scenarios.push('versionamento-regeneracao-antes-resultado');

    await checked('avançar evento para chaves', actor.from('events').update({ status: 'chaves' }).eq('id', identity.eventId));
    await adminPage.goto(`/admin/eventos/${identity.eventId}/resultados`);
    await adminPage.getByRole('heading', { name: `Resultados — ${identity.eventName}` }).waitFor();
    await adminPage.getByRole('button', { name: new RegExp(names.semi4) }).click();
    await adminPage.getByRole('button', { name: 'Iniciar operação' }).click();
    await adminPage.getByText('Operação iniciada. O evento está em andamento.').waitFor();

    let winnerSelect = adminPage.getByLabel('Vencedor').first();
    await expect(winnerSelect).toBeEnabled();
    await winnerSelect.selectOption({ index: 1 });
    let victoryButton = adminPage.getByRole('button', { name: 'Registrar vitória' }).first();
    await expect(victoryButton).toBeEnabled();
    await victoryButton.click();
    await adminPage.getByText('Resultado registrado e vencedor avançado.').waitFor();

    winnerSelect = adminPage.getByLabel('Vencedor').first();
    await expect(winnerSelect).toBeEnabled();
    await winnerSelect.selectOption({ index: 1 });
    const woButton = adminPage.getByRole('button', { name: 'Registrar WO' }).first();
    await expect(woButton).toBeEnabled();
    adminPage.once('dialog', (dialog) => dialog.accept());
    await woButton.click();
    await adminPage.getByText('WO registrado e vencedor avançado.').waitFor();

    winnerSelect = adminPage.getByLabel('Vencedor').first();
    await expect(winnerSelect).toBeEnabled();
    await winnerSelect.selectOption({ index: 1 });
    victoryButton = adminPage.getByRole('button', { name: 'Registrar vitória' }).first();
    await expect(victoryButton).toBeEnabled();
    await victoryButton.click();
    await adminPage.getByText('Grupo concluído').waitFor();
    const semiOperation = await rpcPayload('operação semi4', actor.rpc('get_category_bracket_operation', { target_bracket_id: bracketIds.semi4 }));
    assertPlacements(semiOperation, { semi_4: [1, 2, 3, 3] });
    if (allMatches(semiOperation).filter((match) => match.status === 'wo').length !== 1) {
      throw new Error('Semi4 não preservou exatamente um WO explícito.');
    }
    scenarios.push('inicio-resultado-normal-wo-avanco-final-semi4-colocacoes');

    const copoBefore = await rpcPayload('iniciar copo3', actor.rpc('start_category_bracket', { target_bracket_id: bracketIds.copo3 }));
    const copoMatches = allMatches(copoBefore);
    if (copoMatches.length !== 2 || copoMatches.some((match) => match.status === 'wo')) {
      throw new Error('Bye/copo foi persistido como WO ou gerou quantidade incorreta de confrontos.');
    }
    let copoOperation = copoBefore;
    for (let step = 0; copoOperation.status !== 'concluida' && step < 3; step += 1) {
      const match = allMatches(copoOperation).find((item) => item.canRecord === true);
      if (!match) throw new Error('Copo sem confronto liberado.');
      const sideA = object(match.sideA && typeof match.sideA === 'object' && !Array.isArray(match.sideA) ? match.sideA : null);
      copoOperation = await rpcPayload('resultado copo', actor.rpc('record_bracket_match_outcome', {
        target_match_id: requiredText(match.matchId, 'match copo'),
        target_winner_entry_id: requiredText(sideA.entryId, 'vencedor copo'),
        outcome: 'concluido',
      }));
    }
    assertPlacements(copoOperation, { copo_3: [1, 2, 3] });
    scenarios.push('copo-bye-nao-wo-colocacoes');

    const finalOperation = await completeBracket(actor, bracketIds.final2);
    assertPlacements(finalOperation, { final_2: [1, 2] });
    const groupedOperation = await completeBracket(actor, bracketIds.agrupada9);
    assertPlacements(groupedOperation, {
      final_2: [1, 2],
      copo_3: [1, 2, 3],
      semi_4: [1, 2, 3, 3],
    });
    scenarios.push('final2-e-subchaves-concluidas-com-colocacoes');

    const entry = await admin.from('bracket_entries').select('id, slot').eq('bracket_id', bracketIds.final2).limit(1).single();
    if (!entry.data) throw new Error('Entrada final2 ausente.');
    const directStructuralChange = await actor.from('bracket_entries').update({ slot: entry.data.slot === 1 ? 2 : 1 }).eq('id', entry.data.id);
    const regenerateAfterResult = await actor.rpc('regenerate_category_bracket', {
      target_bracket_id: bracketIds.final2,
      reason: 'MC-SIM tentativa estrutural depois de resultado',
    });
    const winnerRows = await admin.from('bracket_matches').select('winner_entry_id').eq('group_id', list(finalOperation.groups)[0].groupId as string);
    if (!directStructuralChange.error || !regenerateAfterResult.error || !(winnerRows.data || []).some((row) => row.winner_entry_id)) {
      throw new Error('Bloqueio estrutural depois de resultado não foi comprovado.');
    }
    scenarios.push('bloqueio-estrutural-depois-resultado');

    await publicPage.reload();
    await publicPage.getByText(/Vitória por WO:/).waitFor();
    await publicPage.getByRole('heading', { name: 'Colocações' }).first().waitFor();
    const afterPublic = await anon.rpc('get_public_event_brackets', { target_event_id: identity.eventId });
    if (afterPublic.error || !Array.isArray(afterPublic.data)) throw new Error('Consulta pública final falhou.');
    const completed = list(afterPublic.data).filter((bracket) => bracket.status === 'concluida');
    if (completed.length !== 4 || JSON.stringify(afterPublic.data).match(/"isWalkover":true/g)?.length !== 1) {
      throw new Error('Consulta pública final não refletiu quatro chaves concluídas e um WO.');
    }
    scenarios.push('consulta-publica-atualizada');

    await adminPage.setViewportSize({ width: 390, height: 844 });
    await publicPage.setViewportSize({ width: 390, height: 844 });
    const [adminOverflow, publicOverflow] = await Promise.all([
      adminPage.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
      publicPage.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth),
    ]);
    if (adminOverflow || publicOverflow) throw new Error(`Overflow mobile: admin=${adminOverflow}, público=${publicOverflow}.`);
    scenarios.push('mobile-admin-publico-390');

    const audits = await admin.from('event_audit_logs').select('action').eq('event_id', identity.eventId);
    const actions = new Set((audits.data || []).map((audit) => audit.action));
    for (const action of ['checagem_locked', 'bracket_generated', 'bracket_composition_saved', 'bracket_suggestion_restored', 'bracket_published', 'bracket_regenerated', 'bracket_operation_started', 'bracket_match_outcome_recorded']) {
      if (!actions.has(action)) throw new Error(`Auditoria ausente: ${action}.`);
    }
    scenarios.push('auditoria-da-jornada');
  } finally {
    await adminContext.close();
    await publicContext.close();
    await browser.close();
    await cleanup(admin, identity, ownerId);
  }

  const report: McSimSprint8Report = {
    identity: { revision: identity.revision, runId: identity.runId, eventName: identity.eventName },
    ok: true,
    scenarios,
    failuresFoundAndFixed: [],
    cleanup: 'completed',
  };
  console.log(JSON.stringify(report, null, 2));
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
