import { chromium, expect, type Locator, type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import type { Database, Json } from '../../lib/supabase/database.types';
import {
  applyOwnerSession,
  createCleanupClients,
  deleteEventOperationalGraph,
  loadCleanupEnv,
  resolveOwnerId,
} from '../tests/support/e2e-cleanup';
import {
  MC_SIM_FULL_EVENT_PREFIX,
  type McSimFullEventIdentity,
  type McSimFullEventReport,
} from '../tests/support/mc-sim-full-event';

type AdminClient = Awaited<ReturnType<typeof createCleanupClients>>['admin'];
type ActorClient = Awaited<ReturnType<typeof createCleanupClients>>['actor'];
type CategoryKey = keyof McSimFullEventIdentity['categoryIds'];
type JsonRecord = Record<string, Json | undefined>;

const FEE = 80;
const DURATION_MINUTES = 5;
const SETTLE_REASON = 'Baixa manual da jornada Full Event no Sandbox, sem emissão Asaas.';
const categoryOrder: CategoryKey[] = ['final2', 'copo3', 'semi4'];
const categorySpecs: Record<CategoryKey, { label: string; count: number; pesoMin: number; pesoMax: number; peso: number }> = {
  final2: { label: 'Final 2', count: 2, pesoMin: 0, pesoMax: 19.99, peso: 10 },
  copo3: { label: 'Copo 3', count: 3, pesoMin: 20, pesoMax: 39.99, peso: 30 },
  semi4: { label: 'Semi 4', count: 4, pesoMin: 40, pesoMax: 59.99, peso: 50 },
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

function allMatches(operation: JsonRecord) {
  return list(operation.groups).flatMap((group) => list(group.matches));
}

function eventCard(page: Page, name: string) {
  return page.locator('tr:visible, article:visible').filter({ hasText: name }).first();
}

function dateOffset(offset: number) {
  return new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);
}

function hoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 3600_000).toISOString();
}

async function activatePhaseWindow(
  admin: AdminClient,
  eventId: string,
  tipo: 'pagamento' | 'checagem' | 'chaves',
  previous: 'inscricao' | 'pagamento' | 'checagem',
) {
  const prior = await admin.from('event_phases').select('id').eq('event_id', eventId).eq('tipo', previous).single();
  if (prior.data?.id) {
    await checked(`fechar ${previous}`, admin.from('event_phases').update({
      inicio: hoursFromNow(-48),
      fim: hoursFromNow(-1),
    }).eq('id', prior.data.id));
  }
  const current = await admin.from('event_phases').select('id').eq('event_id', eventId).eq('tipo', tipo).single();
  if (!current.data) throw new Error(`Fase ${tipo} ausente.`);
  await checked(`abrir janela ${tipo}`, admin.from('event_phases').update({
    inicio: hoursFromNow(-2),
    fim: hoursFromNow(24 * 14),
  }).eq('id', current.data.id));
}

async function fillPhase(page: Page, label: string, startOffset: number, endOffset: number) {
  const group = page.getByText(label, { exact: true }).locator('..');
  await group.getByLabel('Início').fill(`${dateOffset(startOffset)}T00:00`);
  await group.getByLabel('Término').fill(`${dateOffset(endOffset)}T23:00`);
}

async function waitForPublishedEvent(page: Page) {
  await page.getByRole('button', { name: 'Publicar', exact: true }).click();
  try {
    await page.waitForURL(/\/admin\/eventos$/, { timeout: 20000 });
  } catch {
    const alert = (await page.getByRole('alert').textContent().catch(() => '')) || '';
    const invalid = await page.evaluate(() => {
      const form = document.querySelector('form');
      if (!form) return 'form ausente';
      return Array.from(form.elements)
        .filter((element) => element instanceof HTMLInputElement && element.willValidate && !element.checkValidity())
        .map((element) => (element as HTMLInputElement).name || (element as HTMLInputElement).labels?.[0]?.textContent || 'campo')
        .join(', ');
    });
    throw new Error(`Publicação do evento não navegou. alerta="${alert.trim()}" invalidos=${invalid || 'nenhum'} url=${page.url()}`);
  }
}

async function expand(page: Page, name: string | RegExp) {
  const button = page.getByRole('button', { name });
  if (await button.getAttribute('aria-expanded') !== 'true') await button.click();
}

async function chooseDifferentOption(select: Locator) {
  const current = await select.inputValue();
  const values = await select.locator('option').evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value));
  const target = values.find((value) => value && value !== current);
  if (!target) throw new Error('Slot sem segundo atleta para casamento manual.');
  await select.selectOption(target);
}

async function compositionSignature(admin: AdminClient, bracketId: string) {
  const { data: groups, error: groupError } = await admin
    .from('bracket_groups')
    .select('id, label, topology, sort_order')
    .eq('bracket_id', bracketId)
    .order('sort_order');
  if (groupError) throw groupError;
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

async function completeBracket(actor: ActorClient, bracketId: string) {
  await rpcPayload('iniciar chave', actor.rpc('start_category_bracket', { target_bracket_id: bracketId }));
  let operation = await rpcPayload('ler operação', actor.rpc('get_category_bracket_operation', { target_bracket_id: bracketId }));
  for (let step = 0; step < 20 && operation.status !== 'concluida'; step += 1) {
    const match = allMatches(operation).find((item) => item.canRecord === true);
    if (!match) throw new Error('Chave em andamento sem confronto liberado.');
    const sideA = object(match.sideA && typeof match.sideA === 'object' && !Array.isArray(match.sideA) ? match.sideA : null);
    operation = await rpcPayload('registrar resultado', actor.rpc('record_bracket_match_outcome', {
      target_match_id: requiredText(match.matchId, 'matchId'),
      target_winner_entry_id: requiredText(sideA.entryId, 'winnerEntryId'),
      outcome: 'concluido',
    }));
  }
  if (operation.status !== 'concluida') throw new Error('Chave não concluiu dentro do limite de confrontos.');
  return operation;
}

async function leftoverIds(admin: AdminClient) {
  const [{ data: events }, { data: athletes }, { data: teams }] = await Promise.all([
    admin.from('events').select('id').like('nome', `${MC_SIM_FULL_EVENT_PREFIX} —%`),
    admin.from('athletes').select('id').like('nome_completo', `${MC_SIM_FULL_EVENT_PREFIX} Atleta%`),
    admin.from('teams').select('id').like('nome', `${MC_SIM_FULL_EVENT_PREFIX} Equipe%`),
  ]);
  return {
    eventIds: (events || []).map((row) => row.id),
    athleteIds: (athletes || []).map((row) => row.id),
    teamIds: (teams || []).map((row) => row.id),
  };
}

async function cleanupMass(
  admin: AdminClient,
  tracked: {
    eventId?: string;
    athleteIds: string[];
    teamIds: string[];
    registrationIds: string[];
    categoryIds: string[];
    ruleSetId?: string;
  },
) {
  const eventIds = tracked.eventId ? [tracked.eventId] : [];
  if (eventIds.length) {
    await deleteEventOperationalGraph(admin, eventIds);
    await checked('cleanup audits', admin.from('event_audit_logs').delete().in('event_id', eventIds));
    const { data: payments } = await admin.from('payments').select('id').in('event_id', eventIds);
    const paymentIds = (payments || []).map((row) => row.id);
    if (paymentIds.length) {
      await checked('cleanup payment links', admin.from('payment_registrations').delete().in('payment_id', paymentIds));
      await checked('cleanup attempts', admin.from('payment_attempts').delete().in('payment_id', paymentIds));
      await checked('cleanup issuance', admin.from('payment_issuance_jobs').delete().in('payment_id', paymentIds));
      await checked('cleanup payments', admin.from('payments').delete().in('id', paymentIds));
    }
    if (tracked.registrationIds.length) {
      await checked('cleanup change requests', admin.from('category_change_requests').delete().in('registration_id', tracked.registrationIds));
      await checked('cleanup registration links', admin.from('payment_registrations').delete().in('registration_id', tracked.registrationIds));
      await checked('cleanup registrations', admin.from('registrations').delete().in('id', tracked.registrationIds));
    } else {
      const { data: registrations } = await admin.from('registrations').select('id').in('event_id', eventIds);
      const registrationIds = (registrations || []).map((row) => row.id);
      if (registrationIds.length) {
        await checked('cleanup change requests by event', admin.from('category_change_requests').delete().in('registration_id', registrationIds));
        await checked('cleanup registration links by event', admin.from('payment_registrations').delete().in('registration_id', registrationIds));
        await checked('cleanup registrations by event', admin.from('registrations').delete().in('id', registrationIds));
      }
    }
    if (tracked.categoryIds.length) await checked('cleanup categories', admin.from('event_categories').delete().in('id', tracked.categoryIds));
    if (tracked.ruleSetId) await checked('cleanup rule set', admin.from('category_rule_sets').delete().eq('id', tracked.ruleSetId));
    else await checked('cleanup rule sets by event', admin.from('category_rule_sets').delete().in('event_id', eventIds));
    await checked('cleanup phases', admin.from('event_phases').delete().in('event_id', eventIds));
    await checked('cleanup events', admin.from('events').delete().in('id', eventIds));
  }
  if (tracked.athleteIds.length) {
    await checked('cleanup managers', admin.from('athlete_managers').delete().in('athlete_id', tracked.athleteIds));
    await checked('cleanup athletes', admin.from('athletes').delete().in('id', tracked.athleteIds));
  }
  if (tracked.teamIds.length) await checked('cleanup teams', admin.from('teams').delete().in('id', tracked.teamIds));
}

async function residualCount(admin: AdminClient, tracked: { eventId?: string; athleteIds: string[]; teamIds: string[] }) {
  const leftover = await leftoverIds(admin);
  const [{ data: eventRow }, { data: scheduleRows }, { data: athletes }, { data: teams }] = await Promise.all([
    tracked.eventId ? admin.from('events').select('id').eq('id', tracked.eventId).maybeSingle() : Promise.resolve({ data: null }),
    tracked.eventId ? admin.from('event_schedules').select('id').eq('event_id', tracked.eventId) : Promise.resolve({ data: [] }),
    tracked.athleteIds.length ? admin.from('athletes').select('id').in('id', tracked.athleteIds) : Promise.resolve({ data: [] }),
    tracked.teamIds.length ? admin.from('teams').select('id').in('id', tracked.teamIds) : Promise.resolve({ data: [] }),
  ]);
  return (
    leftover.eventIds.length
    + leftover.athleteIds.length
    + leftover.teamIds.length
    + (eventRow ? 1 : 0)
    + (scheduleRows || []).length
    + (athletes || []).length
    + (teams || []).length
  );
}

async function run() {
  loadCleanupEnv();
  if (process.env.E2E_ALLOW_WRITES !== 'true') throw new Error('MC-SIM Full Event exige E2E_ALLOW_WRITES=true no Sandbox.');

  const startedAt = Date.now();
  const baseURL = process.env.BASE_URL || 'http://localhost:3102';
  const { admin, actor } = await createCleanupClients();
  const ownerId = await resolveOwnerId(actor);
  const runId = randomUUID().slice(0, 8);
  const steps: string[] = [];
  const failuresFoundAndFixed: string[] = [];
  const mark = (name: string) => { steps.push(name); };

  const previous = await leftoverIds(admin);
  if (previous.eventIds.length || previous.athleteIds.length || previous.teamIds.length) {
    for (const eventId of previous.eventIds) {
      await cleanupMass(admin, { eventId, athleteIds: [], teamIds: [], registrationIds: [], categoryIds: [] });
    }
    await cleanupMass(admin, { athleteIds: previous.athleteIds, teamIds: previous.teamIds, registrationIds: [], categoryIds: [] });
    failuresFoundAndFixed.push('massa Full Event residual de execução anterior removida no início');
  }

  const identity: McSimFullEventIdentity = {
    revision: 'full-event',
    runId,
    eventId: '',
    eventName: `${MC_SIM_FULL_EVENT_PREFIX} — ${runId}`,
    organizationId: '',
    ruleSetId: '',
    teamIds: [],
    teamNames: [
      `${MC_SIM_FULL_EVENT_PREFIX} Equipe 1 ${runId}`,
      `${MC_SIM_FULL_EVENT_PREFIX} Equipe 2 ${runId}`,
    ],
    categoryIds: { final2: '', copo3: randomUUID(), semi4: randomUUID() },
    categoryNames: {
      final2: `${MC_SIM_FULL_EVENT_PREFIX} Final 2 ${runId}`,
      copo3: `${MC_SIM_FULL_EVENT_PREFIX} Copo 3 ${runId}`,
      semi4: `${MC_SIM_FULL_EVENT_PREFIX} Semi 4 ${runId}`,
    },
    athleteIds: [],
    athleteNames: [],
    registrationIds: [],
  };

  const bracketIds = {} as Record<CategoryKey, string>;
  const browser = await chromium.launch({ headless: true });
  const adminContext = await browser.newContext({ baseURL, viewport: { width: 1440, height: 1000 } });
  const publicContext = await browser.newContext({ baseURL, viewport: { width: 1440, height: 1000 } });
  let cleanupStatus: McSimFullEventReport['cleanup'] = { status: 'failed', residualCount: -1 };
  let journeyError: unknown;

  try {
    await applyOwnerSession(adminContext, baseURL);
    const page = await adminContext.newPage();
    await page.goto('/admin/eventos');
    await page.getByRole('heading', { name: 'Eventos', exact: true }).waitFor();
    await page.goto('/admin/eventos/novo');
    await page.getByRole('heading', { name: 'Criar evento' }).waitFor();
    await page.getByLabel('Nome do evento').fill(identity.eventName);
    await page.getByLabel('Data do evento').fill(dateOffset(30));
    await page.getByLabel('Local', { exact: true }).fill('Ginásio Full Event');
    await page.getByLabel('Valor da inscrição (R$)').fill(String(FEE));
    await fillPhase(page, 'Inscrição', -1, 5);
    await fillPhase(page, 'Pagamento', 6, 10);
    await fillPhase(page, 'Checagem', 11, 15);
    await fillPhase(page, 'Chaves', 16, 20);
    await waitForPublishedEvent(page);
    const createdCard = eventCard(page, identity.eventName);
    await expect(createdCard.getByText('Publicado', { exact: true })).toBeVisible();
    const created = await admin.from('events').select('id, organization_id, status, nome').eq('nome', identity.eventName).single();
    if (created.error || !created.data) throw new Error(created.error?.message || 'Evento não persistiu.');
    identity.eventId = created.data.id;
    identity.organizationId = created.data.organization_id;
    if (created.data.status !== 'publicado') throw new Error(`Evento ficou em ${created.data.status}.`);
    mark('evento-criado-publicado');

    await createdCard.getByRole('link', { name: 'Configurar' }).click();
    await expect(page).toHaveURL(new RegExp(`/admin/eventos/${identity.eventId}/configuracao$`));
    await page.getByRole('heading', { name: `Categorias — ${identity.eventName}` }).waitFor();
    await page.getByLabel('Nome do conjunto').fill(`${MC_SIM_FULL_EVENT_PREFIX} Regras ${runId}`);
    await page.getByLabel('Nome da categoria').fill(identity.categoryNames.final2);
    await page.getByLabel('Idade máxima').fill('99');
    await page.getByLabel('Peso mínimo').fill(String(categorySpecs.final2.pesoMin));
    await page.getByLabel('Peso máximo').fill(String(categorySpecs.final2.pesoMax));
    await page.getByLabel('Duração da luta (minutos)').fill(String(DURATION_MINUTES));
    await page.getByRole('button', { name: 'Criar versão' }).click();
    await page.getByText('Versão 1 criada com sucesso.', { exact: true }).waitFor();
    const rule = await admin.from('category_rule_sets').select('id').eq('event_id', identity.eventId).eq('ativo', true).single();
    const firstCategory = await admin.from('event_categories').select('id, fight_duration_minutes').eq('rule_set_id', rule.data?.id || '').eq('nome', identity.categoryNames.final2).single();
    if (rule.error || !rule.data || firstCategory.error || !firstCategory.data) throw new Error('Categoria inicial não persistiu.');
    identity.ruleSetId = rule.data.id;
    identity.categoryIds.final2 = firstCategory.data.id;
    if (Number(firstCategory.data.fight_duration_minutes) !== DURATION_MINUTES) {
      throw new Error('Duração da categoria criada pela UI não persistiu.');
    }
    mark('categoria-final2-duracao-ui');

    await checked('categorias auxiliares', admin.from('event_categories').insert(
      (['copo3', 'semi4'] as CategoryKey[]).map((key, index) => ({
        id: identity.categoryIds[key],
        rule_set_id: identity.ruleSetId,
        nome: identity.categoryNames[key],
        idade_min: 18,
        idade_max: 99,
        faixa_min_ordem: 1,
        faixa_max_ordem: 1,
        peso_min_kg: categorySpecs[key].pesoMin,
        peso_max_kg: categorySpecs[key].pesoMax,
        genero: 'M',
        ordem: index + 2,
        ativa: true,
        fight_duration_minutes: null,
      })),
    ));
    await page.reload();
    await page.getByRole('heading', { name: `Categorias — ${identity.eventName}` }).waitFor();
    for (const key of ['copo3', 'semi4'] as CategoryKey[]) {
      const input = page.locator(`#fight-duration-${identity.categoryIds[key]}`).first();
      await input.fill(String(DURATION_MINUTES));
      const form = input.locator('xpath=ancestor::form');
      await form.getByRole('button', { name: 'Salvar' }).click();
      await form.getByRole('status').filter({ hasText: 'Duração salva: 5 min.' }).waitFor();
    }
    const durations = await admin.from('event_categories').select('id, fight_duration_minutes').in('id', Object.values(identity.categoryIds));
    if ((durations.data || []).some((row) => Number(row.fight_duration_minutes) !== DURATION_MINUTES)) {
      throw new Error('Duração oficial não persistiu em todas as categorias.');
    }
    mark('categorias-topologias-duracao-persistida');

    await page.goto('/dashboard/meus-atletas');
    for (const teamName of identity.teamNames) {
      await expand(page, 'Nova equipe');
      await page.getByLabel('Nome da equipe').fill(teamName);
      await page.getByRole('button', { name: 'Cadastrar equipe' }).click();
      await page.getByText('Equipe cadastrada com sucesso.').waitFor();
    }
    const teams = await admin.from('teams').select('id, nome').eq('organization_id', identity.organizationId).in('nome', identity.teamNames);
    if ((teams.data || []).length !== 2) throw new Error('Equipes da jornada não persistiram.');
    identity.teamIds = identity.teamNames.map((nome) => teams.data!.find((team) => team.nome === nome)!.id);

    const firstAthleteName = `${MC_SIM_FULL_EVENT_PREFIX} Atleta 01 ${runId}`;
    await expand(page, /Novo atleta/i);
    await page.getByLabel('Nome completo').fill(firstAthleteName);
    await page.getByLabel('Nascimento').fill('1995-01-01');
    await page.getByLabel('Gênero').selectOption('M');
    await page.getByLabel('Equipe').selectOption({ label: identity.teamNames[0] });
    await page.getByLabel('Vínculo').selectOption('professor');
    await page.getByLabel('Faixa').fill('Branca');
    await page.getByLabel('Peso (kg)').fill(String(categorySpecs.final2.peso));
    await page.getByRole('button', { name: 'Cadastrar atleta' }).click();
    await page.getByText('Atleta cadastrado com sucesso.').waitFor();
    const firstAthlete = await admin.from('athletes').select('id').eq('organization_id', identity.organizationId).eq('nome_completo', firstAthleteName).single();
    if (firstAthlete.error || !firstAthlete.data) throw new Error('Atleta criado pela UI não persistiu.');
    identity.athleteNames = [firstAthleteName];
    identity.athleteIds = [firstAthlete.data.id];
    mark('equipes-e-atleta-ui');

    const remaining: Array<{ key: CategoryKey; id: string; name: string }> = [];
    let athleteNumber = 2;
    for (const key of categoryOrder) {
      const alreadyCreated = key === 'final2' ? 1 : 0;
      for (let index = alreadyCreated; index < categorySpecs[key].count; index += 1) {
        remaining.push({
          key,
          id: randomUUID(),
          name: `${MC_SIM_FULL_EVENT_PREFIX} Atleta ${String(athleteNumber).padStart(2, '0')} ${runId}`,
        });
        athleteNumber += 1;
      }
    }
    await checked('atletas auxiliares', admin.from('athletes').insert(remaining.map((item, index) => ({
      id: item.id,
      organization_id: identity.organizationId,
      team_id: item.key === 'final2' ? identity.teamIds[0] : identity.teamIds[index % identity.teamIds.length],
      nome_completo: item.name,
      data_nascimento: '1995-01-01',
      genero: 'M',
      faixa: 'Branca',
      peso_kg: categorySpecs[item.key].peso,
    }))));
    await checked('managers auxiliares', admin.from('athlete_managers').insert(remaining.map((item) => ({
      manager_id: ownerId,
      athlete_id: item.id,
      relationship_type: 'professor' as const,
    }))));
    identity.athleteIds.push(...remaining.map((item) => item.id));
    identity.athleteNames.push(...remaining.map((item) => item.name));
    mark('massa-atletas-completa');

    await page.goto('/admin/eventos');
    await eventCard(page, identity.eventName).getByRole('button', { name: 'Abrir inscrições' }).click();
    await expect(eventCard(page, identity.eventName).getByRole('button', { name: 'Abrir pagamento' })).toBeVisible();
    mark('transicao-inscricao');

    await page.goto(`/eventos/${identity.eventId}`);
    await page.getByRole('link', { name: 'Inscrever atletas' }).click();
    await page.getByRole('heading', { name: 'Atletas disponíveis' }).waitFor();
    for (const name of identity.athleteNames) {
      await page.getByRole('checkbox', { name: `Selecionar ${name}` }).check();
    }
    await page.getByLabel(/Li e aceito os termos/).check();
    await page.getByRole('button', { name: 'Confirmar inscrições' }).click();
    await expect(page.getByRole('status')).toContainText(`${identity.athleteNames.length} inscrição(ões) criada(s). Pendente de pagamento.`);
    const pending = await admin.from('registrations').select('id, status').eq('event_id', identity.eventId);
    identity.registrationIds = (pending.data || []).map((row) => row.id);
    if (identity.registrationIds.length !== identity.athleteNames.length || (pending.data || []).some((row) => row.status !== 'pendente_pagamento')) {
      throw new Error('Inscrições pendentes não persistiram como esperado.');
    }
    mark('inscricoes-pendentes-ui');

    await page.goto('/admin/eventos');
    await eventCard(page, identity.eventName).getByRole('button', { name: 'Abrir pagamento' }).click();
    await expect(eventCard(page, identity.eventName).getByRole('button', { name: 'Abrir checagem' })).toBeVisible();
    await activatePhaseWindow(admin, identity.eventId, 'pagamento', 'inscricao');
    mark('transicao-pagamento');

    await page.goto('/dashboard/inscricoes');
    const checkout = page.getByRole('region', { name: 'Reservar pagamento', exact: true });
    await checkout.getByLabel('Evento', { exact: true }).selectOption(identity.eventId);
    const boxes = checkout.getByRole('checkbox');
    await expect(boxes).toHaveCount(identity.athleteNames.length);
    for (let index = 0; index < identity.athleteNames.length; index += 1) await boxes.nth(index).check();
    await checkout.getByRole('radio', { name: 'PIX', exact: true }).check();
    await checkout.getByRole('button', { name: 'Reservar pagamento', exact: true }).click();
    const reservationFeedback = checkout.locator('[role="status"], [role="alert"]');
    await reservationFeedback.waitFor({ timeout: 20000 });
    await expect(reservationFeedback).toContainText('Reserva persistida.');
    mark('reserva-sem-asaas');

    await page.goto(`/admin/eventos/${identity.eventId}/financeiro`);
    await page.getByRole('heading', { name: /^Financeiro/ }).waitFor();
    await page.getByLabel('Justificativa da baixa manual').fill(SETTLE_REASON);
    await page.getByRole('checkbox', { name: /Confirmo que conferi/ }).check();
    await page.getByRole('button', { name: 'Confirmar baixa manual' }).click();
    await expect(page.getByRole('status')).toContainText('Baixa manual registrada e auditada.');
    const efetivadas = await admin.from('registrations').select('id, status').eq('event_id', identity.eventId);
    if ((efetivadas.data || []).length !== identity.athleteNames.length || (efetivadas.data || []).some((row) => row.status !== 'efetivada')) {
      throw new Error('Baixa manual não efetivou todas as inscrições.');
    }
    mark('inscricoes-efetivadas-baixa-manual');

    await activatePhaseWindow(admin, identity.eventId, 'checagem', 'pagamento');
    await page.goto('/admin/eventos');
    await eventCard(page, identity.eventName).getByRole('button', { name: 'Abrir checagem' }).click();
    await page.goto(`/admin/eventos/${identity.eventId}/checagem`);
    await page.getByRole('heading', { name: `Checagem — ${identity.eventName}` }).waitFor();
    for (const name of identity.athleteNames) await page.getByText(name, { exact: true }).first().waitFor();
    await expect(page.getByText('Pagamento confirmado').first()).toBeVisible();
    await expect(page.getByText('Atleta sozinho')).toHaveCount(0);
    mark('lista-checagem-validada-sem-realocacao');

    await page.getByLabel(/Confirmo que a lista oficial/).check();
    await page.getByRole('button', { name: 'Travar checagem' }).click();
    await expect(page.getByRole('button', { name: 'Abrir chaves' })).toBeVisible();
    const locked = await admin.from('events').select('checagem_travada_em, status').eq('id', identity.eventId).single();
    if (!locked.data?.checagem_travada_em) throw new Error('Checagem não ficou travada.');
    mark('checagem-travada');

    await activatePhaseWindow(admin, identity.eventId, 'chaves', 'checagem');
    await page.getByRole('button', { name: 'Abrir chaves' }).click();
    await expect(page.getByRole('link', { name: 'Ir para as chaves' })).toBeVisible();
    await expect(page.getByText('Fase de chaves aberta')).toBeVisible();
    await page.getByRole('link', { name: 'Ir para as chaves' }).click();
    await expect(page).toHaveURL(new RegExp(`/admin/eventos/${identity.eventId}/chaves$`));
    await page.getByRole('heading', { name: `Chaves — ${identity.eventName}` }).waitFor();
    mark('transicao-chaves-pela-ui');

    const topologyLabels: Record<CategoryKey, string> = {
      final2: 'Final direta',
      copo3: 'Copo com 3 atletas',
      semi4: 'Semifinais com 4 atletas',
    };
    for (const key of categoryOrder) {
      await page.getByRole('button', { name: new RegExp(identity.categoryNames[key]) }).click();
      await page.getByRole('button', { name: 'Gerar chave' }).click();
      await page.getByText('Chave gerada em rascunho.').waitFor();
      await page.getByText(topologyLabels[key]).waitFor();
      const draft = await admin.from('category_brackets').select('id, status').eq('event_id', identity.eventId).eq('category_id', identity.categoryIds[key]).eq('status', 'draft').single();
      if (!draft.data) throw new Error(`Draft ${key} não persistiu.`);
      bracketIds[key] = draft.data.id;
    }
    await page.getByRole('button', { name: new RegExp(identity.categoryNames.final2) }).click();
    await page.getByText('Atletas da mesma equipe se enfrentam', { exact: true }).waitFor();
    mark('chaves-geradas-final2-copo3-semi4');

    await page.getByRole('button', { name: new RegExp(identity.categoryNames.semi4) }).click();
    const originalSignature = await compositionSignature(admin, bracketIds.semi4);
    const firstSlot = page.locator('label').filter({ hasText: 'Slot 01' }).first().locator('select');
    await chooseDifferentOption(firstSlot);
    await page.getByRole('button', { name: 'Salvar composição' }).click();
    await page.getByText('Composição salva.').waitFor();
    if (await compositionSignature(admin, bracketIds.semi4) === originalSignature) {
      throw new Error('Ajuste manual em DRAFT não alterou a persistência.');
    }
    mark('draft-editavel-ajuste-manual');

    for (const key of categoryOrder) {
      await page.getByRole('button', { name: new RegExp(identity.categoryNames[key]) }).click();
      page.once('dialog', (dialog) => dialog.accept());
      await page.getByRole('button', { name: 'Publicar' }).click();
      await page.getByText('Chave publicada. Ela agora está somente para leitura.').waitFor();
      await page.getByText('Versão publicada — somente leitura').waitFor();
    }
    const publishedRows = await admin.from('category_brackets').select('id, status').eq('event_id', identity.eventId).eq('status', 'publicada');
    if ((publishedRows.data || []).length !== 3) throw new Error('Publicação não congelou as três chaves.');
    mark('publicacao-congela-chaves');

    const anon = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const publicBrackets = await anon.rpc('get_public_event_brackets', { target_event_id: identity.eventId });
    if (publicBrackets.error || !Array.isArray(publicBrackets.data)) throw new Error(publicBrackets.error?.message || 'Consulta pública de chaves ausente.');
    if (/(bracketId|participantId|registrationId|generatedBy|publishedBy)/i.test(JSON.stringify(publicBrackets.data))) {
      throw new Error('Chave pública expôs identificador administrativo.');
    }
    const publicPage = await publicContext.newPage();
    await publicPage.goto(`/eventos/${identity.eventId}/chaves`);
    await publicPage.getByRole('heading', { name: identity.categoryNames.final2 }).waitFor();
    await publicPage.getByRole('heading', { name: identity.categoryNames.copo3 }).waitFor();
    await publicPage.getByRole('heading', { name: identity.categoryNames.semi4 }).waitFor();
    mark('chave-publica-sem-dado-admin');

    await page.goto(`/admin/eventos/${identity.eventId}/programacao`);
    await page.getByRole('heading', { name: `Programação — ${identity.eventName}` }).waitFor();
    await page.getByLabel('Número').first().fill('1');
    await page.getByLabel('Nome ou cor').first().fill('Verde');
    await page.getByRole('button', { name: 'Adicionar área' }).click();
    await page.getByText('Área criada.').waitFor();
    await page.getByLabel('Número').first().fill('2');
    await page.getByLabel('Nome ou cor').first().fill('Azul');
    await page.getByRole('button', { name: 'Adicionar área' }).click();
    await page.getByText('Área criada.').waitFor();
    const groupSelect = (category: string) => page
      .getByText(`${category} — Subchave A`, { exact: true })
      .locator('xpath=../..')
      .getByLabel('Área da subchave A');
    await groupSelect(identity.categoryNames.semi4).selectOption({ label: 'Área 1 — Verde' });
    await page.getByText('Subchave e todas as suas lutas foram atribuídas.').waitFor();
    await expect(page.getByLabel('Luta 1', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Luta 2', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Luta 3', { exact: true })).toBeVisible();
    await groupSelect(identity.categoryNames.copo3).selectOption({ label: 'Área 2 — Azul' });
    await page.getByText('Subchave e todas as suas lutas foram atribuídas.').waitFor();
    await expect(page.getByLabel('Luta 4', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Luta 5', { exact: true })).toBeVisible();
    await groupSelect(identity.categoryNames.final2).selectOption({ label: 'Área 2 — Azul' });
    await page.getByText('Subchave e todas as suas lutas foram atribuídas.').waitFor();
    await expect(page.getByLabel('Luta 6', { exact: true })).toBeVisible();
    mark('areas-e-fight-number-global');

    await page.getByRole('button', { name: 'Mover luta 1 para baixo' }).click();
    await page.getByText('Fila global reordenada e números recalculados.').waitFor();
    mark('reordenacao-draft');

    await publicPage.goto(`/eventos/${identity.eventId}/programacao`);
    await publicPage.getByRole('heading', { name: 'Nenhuma programação publicada' }).waitFor();
    await page.getByRole('button', { name: 'Publicar programação' }).click();
    await page.getByText('Programação publicada. Áreas e números estão congelados.').waitFor();
    await page.getByText('Programação congelada').waitFor();
    mark('programacao-publicada-congelada');

    await publicPage.reload();
    await publicPage.getByRole('heading', { name: `Programação — ${identity.eventName}` }).waitFor();
    await expect(publicPage.getByRole('article', { name: 'Luta 1' })).toBeVisible();
    const publishedSchedule = await anon.rpc('get_public_event_schedule', { target_event_id: identity.eventId });
    if (publishedSchedule.error) throw publishedSchedule.error;
    if (/(matchId|areaId|scheduleId|entryId|groupId|publishedBy|actorId)/i.test(JSON.stringify(publishedSchedule.data))) {
      throw new Error('Programação pública expôs dado administrativo.');
    }
    await publicPage.getByLabel('Equipe').selectOption(identity.teamNames[0]);
    await publicPage.getByRole('button', { name: 'Filtrar' }).click();
    await publicPage.getByRole('heading', { name: `Lutas da equipe ${identity.teamNames[0]}` }).waitFor();
    if (await publicPage.getByRole('article').count() < 1) throw new Error('Filtro por equipe não mostrou lutas.');
    mark('programacao-publica-visao-equipe');

    await page.goto(`/admin/eventos/${identity.eventId}/resultados`);
    await page.getByRole('heading', { name: `Resultados — ${identity.eventName}` }).waitFor();
    await page.getByRole('button', { name: new RegExp(identity.categoryNames.semi4) }).click();
    await page.getByRole('button', { name: 'Marcar pesagem como realizada' }).click();
    await page.getByText('Pesagem marcada como realizada.').waitFor();
    await expect(page.getByRole('button', { name: 'Marcar premiação como realizada' })).toBeDisabled();
    mark('pesagem-e-premiacao-bloqueada');

    await page.getByRole('button', { name: 'Iniciar operação' }).click();
    await page.getByText('Operação iniciada. O evento está em andamento.').waitFor();
    let winnerSelect = page.getByLabel('Vencedor').first();
    await expect(winnerSelect).toBeEnabled();
    await winnerSelect.selectOption({ index: 1 });
    await page.getByRole('button', { name: 'Registrar vitória' }).first().click();
    await page.getByText('Resultado registrado e vencedor avançado.').waitFor();
    winnerSelect = page.getByLabel('Vencedor').first();
    await expect(winnerSelect).toBeEnabled();
    await winnerSelect.selectOption({ index: 1 });
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Registrar WO' }).first().click();
    await page.getByText('WO registrado e vencedor avançado.').waitFor();
    winnerSelect = page.getByLabel('Vencedor').first();
    await expect(winnerSelect).toBeEnabled();
    await winnerSelect.selectOption({ index: 1 });
    await page.getByRole('button', { name: 'Registrar vitória' }).first().click();
    await page.getByText('Grupo concluído').waitFor();
    const semiOperation = await rpcPayload('operação semi4', actor.rpc('get_category_bracket_operation', { target_bracket_id: bracketIds.semi4 }));
    assertPlacements(semiOperation, { semi_4: [1, 2, 3, 3] });
    if (allMatches(semiOperation).filter((match) => match.status === 'wo').length !== 1) {
      throw new Error('Semi4 não preservou exatamente um WO explícito.');
    }
    mark('inicio-resultado-normal-wo-avanco-final-semi4');

    await page.getByRole('button', { name: 'Marcar premiação como realizada' }).click();
    await page.getByText('Premiação marcada como realizada.').waitFor();
    mark('premiacao-apos-resultado');

    let copoOperation = await rpcPayload('iniciar copo3', actor.rpc('start_category_bracket', { target_bracket_id: bracketIds.copo3 }));
    const copoMatches = allMatches(copoOperation);
    if (copoMatches.length !== 2 || copoMatches.some((match) => match.status === 'wo')) {
      throw new Error('Bye/copo foi persistido como WO ou gerou quantidade incorreta de confrontos.');
    }
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
    const finalOperation = await completeBracket(actor, bracketIds.final2);
    assertPlacements(finalOperation, { final_2: [1, 2] });
    mark('copo-bye-nao-wo-final2-colocacoes');

    await publicPage.goto(`/eventos/${identity.eventId}/chaves`);
    await publicPage.getByText(/Vitória por WO:/).waitFor();
    await publicPage.getByRole('heading', { name: 'Colocações' }).first().waitFor();
    await expect(publicPage.getByRole('button', { name: 'Marcar pesagem como realizada' })).toHaveCount(0);
    await expect(publicPage.getByRole('button', { name: 'Marcar premiação como realizada' })).toHaveCount(0);
    mark('publico-atualizado-sem-controles-admin');

    await page.goto(`/admin/eventos/${identity.eventId}/resultados`);
    await page.getByRole('button', { name: 'Concluir evento' }).click();
    await page.getByText('Evento concluído').waitFor();
    await expect(page.getByText('Evento: concluido')).toBeVisible();
    const finished = await admin.from('events').select('status').eq('id', identity.eventId).single();
    if (finished.data?.status !== 'concluido') throw new Error(`Estado final administrativo foi ${finished.data?.status}.`);
    mark('evento-concluido');

    await publicPage.goto(`/eventos/${identity.eventId}`);
    await publicPage.getByRole('heading', { name: identity.eventName }).waitFor();
    await expect(publicPage.getByText('concluido', { exact: true })).toBeVisible();
    await expect(publicPage.getByRole('link', { name: 'Inscrever atletas' })).toHaveCount(0);
    mark('estado-final-publico-e-admin');
  } catch (error) {
    journeyError = error;
    const adminPage = adminContext.pages()[0];
    if (adminPage) {
      await adminPage.screenshot({ path: `test-results/full-event-${runId}-error.png`, fullPage: true }).catch(() => undefined);
    }
  } finally {
    await adminContext.close();
    await publicContext.close();
    await browser.close();
    try {
      await cleanupMass(admin, {
        eventId: identity.eventId || undefined,
        athleteIds: identity.athleteIds,
        teamIds: identity.teamIds,
        registrationIds: identity.registrationIds,
        categoryIds: Object.values(identity.categoryIds).filter(Boolean),
        ruleSetId: identity.ruleSetId || undefined,
      });
      const leftover = await leftoverIds(admin);
      if (leftover.eventIds.length || leftover.athleteIds.length || leftover.teamIds.length) {
        for (const eventId of leftover.eventIds) {
          await cleanupMass(admin, { eventId, athleteIds: [], teamIds: [], registrationIds: [], categoryIds: [] });
        }
        await cleanupMass(admin, { athleteIds: leftover.athleteIds, teamIds: leftover.teamIds, registrationIds: [], categoryIds: [] });
      }
      const remaining = await residualCount(admin, identity);
      cleanupStatus = { status: remaining === 0 ? 'completed' : 'failed', residualCount: remaining };
      if (remaining !== 0) throw new Error(`Cleanup deixou residualCount=${remaining}.`);
    } catch (error) {
      cleanupStatus = { status: 'failed', residualCount: cleanupStatus.residualCount };
      if (!journeyError) journeyError = error;
      else {
        console.error(error instanceof Error ? error.message : error);
      }
    }
  }

  if (journeyError) throw journeyError;
  if (cleanupStatus.status !== 'completed' || cleanupStatus.residualCount !== 0) {
    throw new Error(`Cleanup incompleto: residualCount=${cleanupStatus.residualCount}.`);
  }

  const report: McSimFullEventReport = {
    identity: { revision: identity.revision, runId: identity.runId, eventName: identity.eventName },
    ok: true,
    durationMs: Date.now() - startedAt,
    steps,
    failuresFoundAndFixed,
    cleanup: cleanupStatus,
  };
  console.log(JSON.stringify(report, null, 2));
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
