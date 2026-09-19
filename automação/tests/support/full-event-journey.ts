import { expect, type Browser, type BrowserContext, type Locator, type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import type { Database, Json } from '../../../lib/supabase/database.types';
import {
  applyOwnerSession,
  createCleanupClients,
  deleteEventOperationalGraph,
  loadCleanupEnv,
  resolveOwnerId,
} from './e2e-cleanup';
import {
  MC_SIM_FULL_EVENT_PREFIX,
  type McSimFullEventIdentity,
  type McSimFullEventReport,
} from './mc-sim-full-event';

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

export type FullEventJourneyDeps = {
  page: Page;
  context: BrowserContext;
  browser: Browser;
  baseURL: string;
};

export class FullEventJourney {
  readonly startedAt = Date.now();
  readonly steps: string[] = [];
  cleanupStatus: McSimFullEventReport['cleanup'] = { status: 'failed', residualCount: -1 };
  private admin!: AdminClient;
  private actor!: ActorClient;
  private anon!: ReturnType<typeof createClient<Database>>;
  private ownerId = '';
  private publicContext: BrowserContext | null = null;
  private publicPage: Page | null = null;
  private identity: McSimFullEventIdentity;
  private readonly bracketIds = {} as Record<CategoryKey, string>;

  constructor(private readonly deps: FullEventJourneyDeps) {
    const runId = randomUUID().slice(0, 8);
    this.identity = {
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
  }

  get report(): McSimFullEventReport {
    return {
      identity: { revision: this.identity.revision, runId: this.identity.runId, eventName: this.identity.eventName },
      ok: this.cleanupStatus.status === 'completed' && this.cleanupStatus.residualCount === 0,
      durationMs: Date.now() - this.startedAt,
      steps: this.steps,
      failuresFoundAndFixed: [],
      cleanup: this.cleanupStatus,
    };
  }

  private mark(name: string) {
    this.steps.push(name);
  }

  private get page() {
    return this.deps.page;
  }

  private async publicSurface() {
    if (!this.publicPage) throw new Error('Página pública da jornada ainda não foi aberta.');
    return this.publicPage;
  }

  async prepare() {
    loadCleanupEnv();
    if (process.env.E2E_ALLOW_WRITES !== 'true') throw new Error('MC-SIM Full Event exige E2E_ALLOW_WRITES=true no Sandbox.');
    const clients = await createCleanupClients();
    this.admin = clients.admin;
    this.actor = clients.actor;
    this.anon = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    this.ownerId = await resolveOwnerId(this.actor);
    const previous = await leftoverIds(this.admin);
    if (previous.eventIds.length || previous.athleteIds.length || previous.teamIds.length) {
      for (const eventId of previous.eventIds) {
        await cleanupMass(this.admin, { eventId, athleteIds: [], teamIds: [], registrationIds: [], categoryIds: [] });
      }
      await cleanupMass(this.admin, { athleteIds: previous.athleteIds, teamIds: previous.teamIds, registrationIds: [], categoryIds: [] });
    }
    await applyOwnerSession(this.deps.context, this.deps.baseURL);
    await this.page.setViewportSize({ width: 1440, height: 1000 });
    this.publicContext = await this.deps.browser.newContext({
      baseURL: this.deps.baseURL,
      viewport: { width: 1440, height: 1000 },
    });
    this.publicPage = await this.publicContext.newPage();
    await this.page.goto('/admin/eventos');
    await this.page.getByRole('heading', { name: 'Eventos', exact: true }).waitFor();
  }

  async createAndPublishEvent() {
    await this.page.goto('/admin/eventos/novo');
    await this.page.getByRole('heading', { name: 'Criar evento' }).waitFor();
    await this.page.getByLabel('Nome do evento').fill(this.identity.eventName);
    await this.page.getByLabel('Data do evento').fill(dateOffset(30));
    await this.page.getByLabel('Local', { exact: true }).fill('Ginásio Full Event');
    await this.page.getByLabel('Valor da inscrição (R$)').fill(String(FEE));
    await fillPhase(this.page, 'Inscrição', -1, 5);
    await fillPhase(this.page, 'Pagamento', 6, 10);
    await fillPhase(this.page, 'Checagem', 11, 15);
    await fillPhase(this.page, 'Chaves', 16, 20);
    await waitForPublishedEvent(this.page);
    const createdCard = eventCard(this.page, this.identity.eventName);
    await expect(createdCard.getByText('Publicado', { exact: true })).toBeVisible();
    const created = await this.admin.from('events').select('id, organization_id, status, nome').eq('nome', this.identity.eventName).single();
    if (created.error || !created.data) throw new Error(created.error?.message || 'Evento não persistiu.');
    this.identity.eventId = created.data.id;
    this.identity.organizationId = created.data.organization_id;
    if (created.data.status !== 'publicado') throw new Error(`Evento ficou em ${created.data.status}.`);
    this.mark('evento-criado-publicado');
  }

  async configureCategoriesAndDuration() {
    await eventCard(this.page, this.identity.eventName).getByRole('link', { name: 'Configurar' }).click();
    await expect(this.page).toHaveURL(new RegExp(`/admin/eventos/${this.identity.eventId}/configuracao$`));
    await this.page.getByRole('heading', { name: `Categorias — ${this.identity.eventName}` }).waitFor();
    await this.page.getByLabel('Nome do conjunto').fill(`${MC_SIM_FULL_EVENT_PREFIX} Regras ${this.identity.runId}`);
    await this.page.getByLabel('Nome da categoria').fill(this.identity.categoryNames.final2);
    await this.page.getByLabel('Idade máxima').fill('99');
    await this.page.getByLabel('Peso mínimo').fill(String(categorySpecs.final2.pesoMin));
    await this.page.getByLabel('Peso máximo').fill(String(categorySpecs.final2.pesoMax));
    await this.page.getByLabel('Duração da luta (minutos)').fill(String(DURATION_MINUTES));
    await this.page.getByRole('button', { name: 'Criar versão' }).click();
    await this.page.getByText('Versão 1 criada com sucesso.', { exact: true }).waitFor();
    const rule = await this.admin.from('category_rule_sets').select('id').eq('event_id', this.identity.eventId).eq('ativo', true).single();
    const firstCategory = await this.admin.from('event_categories').select('id, fight_duration_minutes').eq('rule_set_id', rule.data?.id || '').eq('nome', this.identity.categoryNames.final2).single();
    if (rule.error || !rule.data || firstCategory.error || !firstCategory.data) throw new Error('Categoria inicial não persistiu.');
    this.identity.ruleSetId = rule.data.id;
    this.identity.categoryIds.final2 = firstCategory.data.id;
    if (Number(firstCategory.data.fight_duration_minutes) !== DURATION_MINUTES) {
      throw new Error('Duração da categoria criada pela UI não persistiu.');
    }
    await checked('categorias auxiliares', this.admin.from('event_categories').insert(
      (['copo3', 'semi4'] as CategoryKey[]).map((key, index) => ({
        id: this.identity.categoryIds[key],
        rule_set_id: this.identity.ruleSetId,
        nome: this.identity.categoryNames[key],
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
    await this.page.reload();
    await this.page.getByRole('heading', { name: `Categorias — ${this.identity.eventName}` }).waitFor();
    for (const key of ['copo3', 'semi4'] as CategoryKey[]) {
      const input = this.page.locator(`#fight-duration-${this.identity.categoryIds[key]}`).first();
      await input.fill(String(DURATION_MINUTES));
      const form = input.locator('xpath=ancestor::form');
      await form.getByRole('button', { name: 'Salvar' }).click();
      await form.getByRole('status').filter({ hasText: 'Duração salva: 5 min.' }).waitFor();
    }
    const durations = await this.admin.from('event_categories').select('id, fight_duration_minutes').in('id', Object.values(this.identity.categoryIds));
    if ((durations.data || []).some((row) => Number(row.fight_duration_minutes) !== DURATION_MINUTES)) {
      throw new Error('Duração oficial não persistiu em todas as categorias.');
    }
    this.mark('categorias-topologias-duracao-persistida');
  }

  async registerTeams() {
    await this.page.goto('/dashboard/meus-atletas');
    for (const teamName of this.identity.teamNames) {
      await expand(this.page, 'Nova equipe');
      await this.page.getByLabel('Nome da equipe').fill(teamName);
      await this.page.getByRole('button', { name: 'Cadastrar equipe' }).click();
      await this.page.getByText('Equipe cadastrada com sucesso.').waitFor();
    }
    const teams = await this.admin.from('teams').select('id, nome').eq('organization_id', this.identity.organizationId).in('nome', this.identity.teamNames);
    if ((teams.data || []).length !== 2) throw new Error('Equipes da jornada não persistiram.');
    this.identity.teamIds = this.identity.teamNames.map((nome) => teams.data!.find((team) => team.nome === nome)!.id);
    this.mark('equipes-ui');
  }

  async registerAthletes() {
    const firstAthleteName = `${MC_SIM_FULL_EVENT_PREFIX} Atleta 01 ${this.identity.runId}`;
    await expand(this.page, /Novo atleta/i);
    await this.page.getByLabel('Nome completo').fill(firstAthleteName);
    await this.page.getByLabel('Nascimento').fill('1995-01-01');
    await this.page.getByLabel('Gênero').selectOption('M');
    await this.page.getByLabel('Equipe').selectOption({ label: this.identity.teamNames[0] });
    await this.page.getByLabel('Vínculo').selectOption('professor');
    await this.page.getByLabel('Faixa').fill('Branca');
    await this.page.getByLabel('Peso (kg)').fill(String(categorySpecs.final2.peso));
    await this.page.getByRole('button', { name: 'Cadastrar atleta' }).click();
    await this.page.getByText('Atleta cadastrado com sucesso.').waitFor();
    const firstAthlete = await this.admin.from('athletes').select('id').eq('organization_id', this.identity.organizationId).eq('nome_completo', firstAthleteName).single();
    if (firstAthlete.error || !firstAthlete.data) throw new Error('Atleta criado pela UI não persistiu.');
    this.identity.athleteNames = [firstAthleteName];
    this.identity.athleteIds = [firstAthlete.data.id];
    const remaining: Array<{ key: CategoryKey; id: string; name: string }> = [];
    let athleteNumber = 2;
    for (const key of categoryOrder) {
      const alreadyCreated = key === 'final2' ? 1 : 0;
      for (let index = alreadyCreated; index < categorySpecs[key].count; index += 1) {
        remaining.push({
          key,
          id: randomUUID(),
          name: `${MC_SIM_FULL_EVENT_PREFIX} Atleta ${String(athleteNumber).padStart(2, '0')} ${this.identity.runId}`,
        });
        athleteNumber += 1;
      }
    }
    await checked('atletas auxiliares', this.admin.from('athletes').insert(remaining.map((item, index) => ({
      id: item.id,
      organization_id: this.identity.organizationId,
      team_id: item.key === 'final2' ? this.identity.teamIds[0] : this.identity.teamIds[index % this.identity.teamIds.length],
      nome_completo: item.name,
      data_nascimento: '1995-01-01',
      genero: 'M',
      faixa: 'Branca',
      peso_kg: categorySpecs[item.key].peso,
    }))));
    await checked('managers auxiliares', this.admin.from('athlete_managers').insert(remaining.map((item) => ({
      manager_id: this.ownerId,
      athlete_id: item.id,
      relationship_type: 'professor' as const,
    }))));
    this.identity.athleteIds.push(...remaining.map((item) => item.id));
    this.identity.athleteNames.push(...remaining.map((item) => item.name));
    this.mark('massa-atletas-completa');
  }

  async openInscriptions() {
    await this.page.goto('/admin/eventos');
    await eventCard(this.page, this.identity.eventName).getByRole('button', { name: 'Abrir inscrições' }).click();
    await expect(eventCard(this.page, this.identity.eventName).getByRole('button', { name: 'Abrir pagamento' })).toBeVisible();
    this.mark('transicao-inscricao');
  }

  async registerAthletesInEvent() {
    await this.page.goto(`/eventos/${this.identity.eventId}`);
    await this.page.getByRole('link', { name: 'Inscrever atletas' }).click();
    await this.page.getByRole('heading', { name: 'Atletas disponíveis' }).waitFor();
    for (const name of this.identity.athleteNames) {
      await this.page.getByRole('checkbox', { name: `Selecionar ${name}` }).check();
    }
    await this.page.getByLabel(/Li e aceito os termos/).check();
    await this.page.getByRole('button', { name: 'Confirmar inscrições' }).click();
    await expect(this.page.getByRole('status')).toContainText(`${this.identity.athleteNames.length} inscrição(ões) criada(s). Pendente de pagamento.`);
    const pending = await this.admin.from('registrations').select('id, status').eq('event_id', this.identity.eventId);
    this.identity.registrationIds = (pending.data || []).map((row) => row.id);
    if (this.identity.registrationIds.length !== this.identity.athleteNames.length || (pending.data || []).some((row) => row.status !== 'pendente_pagamento')) {
      throw new Error('Inscrições pendentes não persistiram como esperado.');
    }
    this.mark('inscricoes-pendentes-ui');
  }

  async openPayment() {
    await this.page.goto('/admin/eventos');
    await eventCard(this.page, this.identity.eventName).getByRole('button', { name: 'Abrir pagamento' }).click();
    await expect(eventCard(this.page, this.identity.eventName).getByRole('button', { name: 'Abrir checagem' })).toBeVisible();
    await activatePhaseWindow(this.admin, this.identity.eventId, 'pagamento', 'inscricao');
    this.mark('transicao-pagamento');
  }

  async reservePaymentWithoutAsaas() {
    await this.page.goto('/dashboard/inscricoes');
    const checkout = this.page.getByRole('region', { name: 'Reservar pagamento', exact: true });
    await checkout.getByLabel('Evento', { exact: true }).selectOption(this.identity.eventId);
    const boxes = checkout.getByRole('checkbox');
    await expect(boxes).toHaveCount(this.identity.athleteNames.length);
    for (let index = 0; index < this.identity.athleteNames.length; index += 1) await boxes.nth(index).check();
    await checkout.getByRole('radio', { name: 'PIX', exact: true }).check();
    await checkout.getByRole('button', { name: 'Reservar pagamento', exact: true }).click();
    await expect.poll(async () => {
      const payments = await this.admin.from('payments').select('id').eq('event_id', this.identity.eventId);
      return (payments.data || []).length;
    }, { timeout: 20000 }).toBe(1);
    this.mark('reserva-sem-asaas');
  }

  async settleManually() {
    await this.page.goto(`/admin/eventos/${this.identity.eventId}/financeiro`);
    await this.page.getByRole('heading', { name: /^Financeiro/ }).waitFor();
    await this.page.getByLabel('Justificativa da baixa manual').fill(SETTLE_REASON);
    await this.page.getByRole('checkbox', { name: /Confirmo que conferi/ }).check();
    await this.page.getByRole('button', { name: 'Confirmar baixa manual' }).click();
    await expect(this.page.getByRole('status')).toContainText('Baixa manual registrada e auditada.');
    const efetivadas = await this.admin.from('registrations').select('id, status').eq('event_id', this.identity.eventId);
    if ((efetivadas.data || []).length !== this.identity.athleteNames.length || (efetivadas.data || []).some((row) => row.status !== 'efetivada')) {
      throw new Error('Baixa manual não efetivou todas as inscrições.');
    }
    this.mark('inscricoes-efetivadas-baixa-manual');
  }

  async openChecking() {
    await activatePhaseWindow(this.admin, this.identity.eventId, 'checagem', 'pagamento');
    await this.page.goto('/admin/eventos');
    await eventCard(this.page, this.identity.eventName).getByRole('button', { name: 'Abrir checagem' }).click();
    await this.page.goto(`/admin/eventos/${this.identity.eventId}/checagem`);
    await this.page.getByRole('heading', { name: `Checagem — ${this.identity.eventName}` }).waitFor();
  }

  async assertCheckingList() {
    for (const name of this.identity.athleteNames) await this.page.getByText(name, { exact: true }).first().waitFor();
    await expect(this.page.getByText('Pagamento confirmado').first()).toBeVisible();
    await expect(this.page.getByText('Atleta sozinho')).toHaveCount(0);
    this.mark('lista-checagem-validada-sem-realocacao');
  }

  async lockChecking() {
    await this.page.getByLabel(/Confirmo que a lista oficial/).check();
    await this.page.getByRole('button', { name: 'Travar checagem' }).click();
    await expect(this.page.getByRole('button', { name: 'Abrir chaves' })).toBeVisible();
    const locked = await this.admin.from('events').select('checagem_travada_em, status').eq('id', this.identity.eventId).single();
    if (!locked.data?.checagem_travada_em) throw new Error('Checagem não ficou travada.');
    this.mark('checagem-travada');
  }

  async openBracketsPhase() {
    await activatePhaseWindow(this.admin, this.identity.eventId, 'chaves', 'checagem');
    await this.page.goto(`/admin/eventos/${this.identity.eventId}/checagem`);
    await this.page.getByRole('heading', { name: `Checagem — ${this.identity.eventName}` }).waitFor();
    await this.page.getByRole('button', { name: 'Abrir chaves' }).click();
    await expect.poll(async () => {
      const opened = await this.admin.from('events').select('status').eq('id', this.identity.eventId).single();
      return opened.data?.status;
    }, { timeout: 20000 }).toBe('chaves');
    await this.page.reload();
    await expect(this.page.getByRole('link', { name: 'Ir para as chaves' })).toBeVisible();
    await expect(this.page.getByText('Fase de chaves aberta')).toBeVisible();
    await this.page.getByRole('link', { name: 'Ir para as chaves' }).click();
    await expect(this.page).toHaveURL(new RegExp(`/admin/eventos/${this.identity.eventId}/chaves$`));
    await this.page.getByRole('heading', { name: `Chaves — ${this.identity.eventName}` }).waitFor();
    this.mark('transicao-chaves-pela-ui');
  }

  async generateOfficialBrackets() {
    const topologyLabels: Record<CategoryKey, string> = {
      final2: 'Final direta',
      copo3: 'Copo com 3 atletas',
      semi4: 'Semifinais com 4 atletas',
    };
    for (const key of categoryOrder) {
      await this.page.getByRole('button', { name: new RegExp(this.identity.categoryNames[key]) }).click();
      await this.page.getByRole('button', { name: 'Gerar chave' }).click();
      await this.page.getByText('Chave gerada em rascunho.').waitFor();
      await this.page.getByText(topologyLabels[key]).waitFor();
      const draft = await this.admin.from('category_brackets').select('id, status').eq('event_id', this.identity.eventId).eq('category_id', this.identity.categoryIds[key]).eq('status', 'draft').single();
      if (!draft.data) throw new Error(`Draft ${key} não persistiu.`);
      this.bracketIds[key] = draft.data.id;
    }
    await this.page.getByRole('button', { name: new RegExp(this.identity.categoryNames.final2) }).click();
    await this.page.getByText('Atletas da mesma equipe se enfrentam', { exact: true }).waitFor();
    this.mark('chaves-geradas-final2-copo3-semi4');
  }

  async adjustDraftBracket() {
    await this.page.getByRole('button', { name: new RegExp(this.identity.categoryNames.semi4) }).click();
    const originalSignature = await compositionSignature(this.admin, this.bracketIds.semi4);
    const firstSlot = this.page.locator('label').filter({ hasText: 'Slot 01' }).first().locator('select');
    await chooseDifferentOption(firstSlot);
    await this.page.getByRole('button', { name: 'Salvar composição' }).click();
    await this.page.getByText('Composição salva.').waitFor();
    if (await compositionSignature(this.admin, this.bracketIds.semi4) === originalSignature) {
      throw new Error('Ajuste manual em DRAFT não alterou a persistência.');
    }
    this.mark('draft-editavel-ajuste-manual');
  }

  async publishBrackets() {
    for (const key of categoryOrder) {
      await this.page.getByRole('button', { name: new RegExp(this.identity.categoryNames[key]) }).click();
      this.page.once('dialog', (dialog) => dialog.accept());
      await this.page.getByRole('button', { name: 'Publicar' }).click();
      await this.page.getByText('Chave publicada. Ela agora está somente para leitura.').waitFor();
      await this.page.getByText('Versão publicada — somente leitura').waitFor();
    }
    const publishedRows = await this.admin.from('category_brackets').select('id, status').eq('event_id', this.identity.eventId).eq('status', 'publicada');
    if ((publishedRows.data || []).length !== 3) throw new Error('Publicação não congelou as três chaves.');
    this.mark('publicacao-congela-chaves');
  }

  async assertPublicBrackets() {
    const publicBrackets = await this.anon.rpc('get_public_event_brackets', { target_event_id: this.identity.eventId });
    if (publicBrackets.error || !Array.isArray(publicBrackets.data)) throw new Error(publicBrackets.error?.message || 'Consulta pública de chaves ausente.');
    if (/(bracketId|participantId|registrationId|generatedBy|publishedBy)/i.test(JSON.stringify(publicBrackets.data))) {
      throw new Error('Chave pública expôs identificador administrativo.');
    }
    const publicPage = await this.publicSurface();
    await publicPage.goto(`/eventos/${this.identity.eventId}/chaves`);
    await publicPage.getByRole('heading', { name: this.identity.categoryNames.final2 }).waitFor();
    await publicPage.getByRole('heading', { name: this.identity.categoryNames.copo3 }).waitFor();
    await publicPage.getByRole('heading', { name: this.identity.categoryNames.semi4 }).waitFor();
    this.mark('chave-publica-sem-dado-admin');
  }

  async configureAreas() {
    await this.page.goto(`/admin/eventos/${this.identity.eventId}/programacao`);
    await this.page.getByRole('heading', { name: `Programação — ${this.identity.eventName}` }).waitFor();
    await this.page.getByLabel('Número').first().fill('1');
    await this.page.getByLabel('Nome ou cor').first().fill('Verde');
    await this.page.getByRole('button', { name: 'Adicionar área' }).click();
    await this.page.getByText('Área criada.').waitFor();
    await this.page.getByLabel('Número').first().fill('2');
    await this.page.getByLabel('Nome ou cor').first().fill('Azul');
    await this.page.getByRole('button', { name: 'Adicionar área' }).click();
    await this.page.getByText('Área criada.').waitFor();
  }

  async assignGroupsWithGlobalNumbers() {
    const groupSelect = (category: string) => this.page
      .getByText(`${category} — Subchave A`, { exact: true })
      .locator('xpath=../..')
      .getByLabel('Área da subchave A');
    await groupSelect(this.identity.categoryNames.semi4).selectOption({ label: 'Área 1 — Verde' });
    await this.page.getByText('Subchave e todas as suas lutas foram atribuídas.').waitFor();
    await expect(this.page.getByLabel('Luta 1', { exact: true })).toBeVisible();
    await expect(this.page.getByLabel('Luta 2', { exact: true })).toBeVisible();
    await expect(this.page.getByLabel('Luta 3', { exact: true })).toBeVisible();
    await groupSelect(this.identity.categoryNames.copo3).selectOption({ label: 'Área 2 — Azul' });
    await this.page.getByText('Subchave e todas as suas lutas foram atribuídas.').waitFor();
    await expect(this.page.getByLabel('Luta 4', { exact: true })).toBeVisible();
    await expect(this.page.getByLabel('Luta 5', { exact: true })).toBeVisible();
    await groupSelect(this.identity.categoryNames.final2).selectOption({ label: 'Área 2 — Azul' });
    await this.page.getByText('Subchave e todas as suas lutas foram atribuídas.').waitFor();
    await expect(this.page.getByLabel('Luta 6', { exact: true })).toBeVisible();
    this.mark('areas-e-fight-number-global');
  }

  async reorderDraftSchedule() {
    await this.page.getByRole('button', { name: 'Mover luta 1 para baixo' }).click();
    await this.page.getByText('Fila global reordenada e números recalculados.').waitFor();
    this.mark('reordenacao-draft');
  }

  async publishSchedule() {
    const publicPage = await this.publicSurface();
    await publicPage.goto(`/eventos/${this.identity.eventId}/programacao`);
    await publicPage.getByRole('heading', { name: 'Nenhuma programação publicada' }).waitFor();
    await this.page.getByRole('button', { name: 'Publicar programação' }).click();
    await this.page.getByText('Programação publicada. Áreas e números estão congelados.').waitFor();
    await this.page.getByText('Programação congelada').waitFor();
    this.mark('programacao-publicada-congelada');
  }

  async assertPublicSchedule() {
    const publicPage = await this.publicSurface();
    await publicPage.reload();
    await publicPage.getByRole('heading', { name: `Programação — ${this.identity.eventName}` }).waitFor();
    await expect(publicPage.getByRole('article', { name: 'Luta 1' })).toBeVisible();
    const publishedSchedule = await this.anon.rpc('get_public_event_schedule', { target_event_id: this.identity.eventId });
    if (publishedSchedule.error) throw publishedSchedule.error;
    if (/(matchId|areaId|scheduleId|entryId|groupId|publishedBy|actorId)/i.test(JSON.stringify(publishedSchedule.data))) {
      throw new Error('Programação pública expôs dado administrativo.');
    }
    this.mark('programacao-publica');
  }

  async assertTeamView() {
    const publicPage = await this.publicSurface();
    await publicPage.getByLabel('Equipe').selectOption(this.identity.teamNames[0]);
    await publicPage.getByRole('button', { name: 'Filtrar' }).click();
    await publicPage.getByRole('heading', { name: `Lutas da equipe ${this.identity.teamNames[0]}` }).waitFor();
    if (await publicPage.getByRole('article').count() < 1) throw new Error('Filtro por equipe não mostrou lutas.');
    this.mark('programacao-publica-visao-equipe');
  }

  async confirmWeighIn() {
    await this.page.goto(`/admin/eventos/${this.identity.eventId}/resultados`);
    await this.page.getByRole('heading', { name: `Resultados — ${this.identity.eventName}` }).waitFor();
    await this.page.getByRole('button', { name: new RegExp(this.identity.categoryNames.semi4) }).click();
    await this.page.getByRole('button', { name: 'Marcar pesagem como realizada' }).click();
    await this.page.getByText('Pesagem marcada como realizada.').waitFor();
  }

  async assertAwardsBlocked() {
    await expect(this.page.getByRole('button', { name: 'Marcar premiação como realizada' })).toBeDisabled();
    this.mark('pesagem-e-premiacao-bloqueada');
  }

  async startOperation() {
    await this.page.getByRole('button', { name: 'Iniciar operação' }).click();
    await this.page.getByText('Operação iniciada. O evento está em andamento.').waitFor();
  }

  async recordNormalResult() {
    const winnerSelect = this.page.getByLabel('Vencedor').first();
    await expect(winnerSelect).toBeEnabled();
    await winnerSelect.selectOption({ index: 1 });
    await this.page.getByRole('button', { name: 'Registrar vitória' }).first().click();
    await this.page.getByText('Resultado registrado e vencedor avançado.').waitFor();
  }

  async recordWalkover() {
    const winnerSelect = this.page.getByLabel('Vencedor').first();
    await expect(winnerSelect).toBeEnabled();
    await winnerSelect.selectOption({ index: 1 });
    this.page.once('dialog', (dialog) => dialog.accept());
    await this.page.getByRole('button', { name: 'Registrar WO' }).first().click();
    await this.page.getByText('WO registrado e vencedor avançado.').waitFor();
  }

  async finishSemiFinal() {
    const winnerSelect = this.page.getByLabel('Vencedor').first();
    await expect(winnerSelect).toBeEnabled();
    await winnerSelect.selectOption({ index: 1 });
    await this.page.getByRole('button', { name: 'Registrar vitória' }).first().click();
    await this.page.getByText('Grupo concluído').waitFor();
    this.mark('inicio-resultado-normal-wo-avanco-final-semi4');
  }

  async assertPlacementsAndWalkover() {
    const semiOperation = await rpcPayload('operação semi4', this.actor.rpc('get_category_bracket_operation', { target_bracket_id: this.bracketIds.semi4 }));
    assertPlacements(semiOperation, { semi_4: [1, 2, 3, 3] });
    if (allMatches(semiOperation).filter((match) => match.status === 'wo').length !== 1) {
      throw new Error('Semi4 não preservou exatamente um WO explícito.');
    }
    let copoOperation = await rpcPayload('iniciar copo3', this.actor.rpc('start_category_bracket', { target_bracket_id: this.bracketIds.copo3 }));
    const copoMatches = allMatches(copoOperation);
    if (copoMatches.length !== 2 || copoMatches.some((match) => match.status === 'wo')) {
      throw new Error('Bye/copo foi persistido como WO ou gerou quantidade incorreta de confrontos.');
    }
    for (let step = 0; copoOperation.status !== 'concluida' && step < 3; step += 1) {
      const match = allMatches(copoOperation).find((item) => item.canRecord === true);
      if (!match) throw new Error('Copo sem confronto liberado.');
      const sideA = object(match.sideA && typeof match.sideA === 'object' && !Array.isArray(match.sideA) ? match.sideA : null);
      copoOperation = await rpcPayload('resultado copo', this.actor.rpc('record_bracket_match_outcome', {
        target_match_id: requiredText(match.matchId, 'match copo'),
        target_winner_entry_id: requiredText(sideA.entryId, 'vencedor copo'),
        outcome: 'concluido',
      }));
    }
    assertPlacements(copoOperation, { copo_3: [1, 2, 3] });
    const finalOperation = await completeBracket(this.actor, this.bracketIds.final2);
    assertPlacements(finalOperation, { final_2: [1, 2] });
    this.mark('copo-bye-nao-wo-final2-colocacoes');
  }

  async confirmAwards() {
    await this.page.getByRole('button', { name: 'Marcar premiação como realizada' }).click();
    await this.page.getByText('Premiação marcada como realizada.').waitFor();
    this.mark('premiacao-apos-resultado');
  }

  async assertPublicResults() {
    const publicPage = await this.publicSurface();
    await publicPage.goto(`/eventos/${this.identity.eventId}/chaves`);
    await publicPage.getByText(/Vitória por WO:/).waitFor();
    await publicPage.getByRole('heading', { name: 'Colocações' }).first().waitFor();
    await expect(publicPage.getByRole('button', { name: 'Marcar pesagem como realizada' })).toHaveCount(0);
    await expect(publicPage.getByRole('button', { name: 'Marcar premiação como realizada' })).toHaveCount(0);
    this.mark('publico-atualizado-sem-controles-admin');
  }

  async concludeEvent() {
    await this.page.goto(`/admin/eventos/${this.identity.eventId}/resultados`);
    await this.page.getByRole('button', { name: 'Concluir evento' }).click();
    await this.page.getByText('Evento concluído').waitFor();
    await expect(this.page.getByText('Evento: concluido')).toBeVisible();
    const finished = await this.admin.from('events').select('status').eq('id', this.identity.eventId).single();
    if (finished.data?.status !== 'concluido') throw new Error(`Estado final administrativo foi ${finished.data?.status}.`);
    this.mark('evento-concluido');
  }

  async assertWalkoverDistinctFromBye() {
    const copoOperation = await rpcPayload('conferir copo3', this.actor.rpc('get_category_bracket_operation', { target_bracket_id: this.bracketIds.copo3 }));
    if (allMatches(copoOperation).some((match) => match.status === 'wo')) {
      throw new Error('Bye/copo foi persistido como WO.');
    }
    const semiOperation = await rpcPayload('conferir semi4', this.actor.rpc('get_category_bracket_operation', { target_bracket_id: this.bracketIds.semi4 }));
    if (allMatches(semiOperation).filter((match) => match.status === 'wo').length !== 1) {
      throw new Error('Semi4 não preservou exatamente um WO explícito.');
    }
  }

  async assertAdminConcluded() {
    const finished = await this.admin.from('events').select('status').eq('id', this.identity.eventId).single();
    if (finished.data?.status !== 'concluido') throw new Error(`Estado final administrativo foi ${finished.data?.status}.`);
  }

  async assertFinalPublicState() {
    const publicPage = await this.publicSurface();
    await publicPage.goto(`/eventos/${this.identity.eventId}`);
    await publicPage.getByRole('heading', { name: this.identity.eventName }).waitFor();
    await expect(publicPage.getByText('concluido', { exact: true })).toBeVisible();
    await expect(publicPage.getByRole('link', { name: 'Inscrever atletas' })).toHaveCount(0);
    this.mark('estado-final-publico-e-admin');
  }

  async runCanonical() {
    await this.createAndPublishEvent();
    await this.configureCategoriesAndDuration();
    await this.registerTeams();
    await this.registerAthletes();
    await this.openInscriptions();
    await this.registerAthletesInEvent();
    await this.openPayment();
    await this.reservePaymentWithoutAsaas();
    await this.settleManually();
    await this.openChecking();
    await this.assertCheckingList();
    await this.lockChecking();
    await this.openBracketsPhase();
    await this.generateOfficialBrackets();
    await this.adjustDraftBracket();
    await this.publishBrackets();
    await this.assertPublicBrackets();
    await this.configureAreas();
    await this.assignGroupsWithGlobalNumbers();
    await this.reorderDraftSchedule();
    await this.publishSchedule();
    await this.assertPublicSchedule();
    await this.assertTeamView();
    await this.confirmWeighIn();
    await this.assertAwardsBlocked();
    await this.startOperation();
    await this.recordNormalResult();
    await this.recordWalkover();
    await this.finishSemiFinal();
    await this.confirmAwards();
    await this.assertPlacementsAndWalkover();
    await this.assertPublicResults();
    await this.concludeEvent();
    await this.assertFinalPublicState();
  }

  async cleanup() {
    await this.publicContext?.close();
    this.publicContext = null;
    this.publicPage = null;
    if (!this.admin) {
      this.cleanupStatus = { status: 'completed', residualCount: 0 };
      return;
    }
    await cleanupMass(this.admin, {
      eventId: this.identity.eventId || undefined,
      athleteIds: this.identity.athleteIds,
      teamIds: this.identity.teamIds,
      registrationIds: this.identity.registrationIds,
      categoryIds: Object.values(this.identity.categoryIds).filter(Boolean),
      ruleSetId: this.identity.ruleSetId || undefined,
    });
    const leftover = await leftoverIds(this.admin);
    if (leftover.eventIds.length || leftover.athleteIds.length || leftover.teamIds.length) {
      for (const eventId of leftover.eventIds) {
        await cleanupMass(this.admin, { eventId, athleteIds: [], teamIds: [], registrationIds: [], categoryIds: [] });
      }
      await cleanupMass(this.admin, { athleteIds: leftover.athleteIds, teamIds: leftover.teamIds, registrationIds: [], categoryIds: [] });
    }
    const remaining = await residualCount(this.admin, this.identity);
    this.cleanupStatus = { status: remaining === 0 ? 'completed' : 'failed', residualCount: remaining };
    if (remaining !== 0) throw new Error(`Cleanup deixou residualCount=${remaining}.`);
  }
}

export async function createFullEventJourney(deps: FullEventJourneyDeps) {
  return new FullEventJourney(deps);
}
