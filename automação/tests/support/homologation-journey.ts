import { expect, type Browser, type BrowserContext, type Locator, type Page, type TestInfo } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import type { Database, Json } from '../../../lib/supabase/database.types';
import {
  applyAuthSession,
  createCleanupClients,
  deleteEventOperationalGraph,
  loadCleanupEnv,
  SANDBOX_HOST,
} from './e2e-cleanup';
import {
  RELEASE_ORG_NAME,
  assertHomologationEnvironment,
  buildHomologationRunId,
} from './homologation-guard';

type AdminClient = Awaited<ReturnType<typeof createCleanupClients>>['admin'];
type ActorClient = Awaited<ReturnType<typeof createCleanupClients>>['actor'];
type JsonRecord = Record<string, Json | undefined>;

const FEE = 80;
const DURATION_MINUTES = 5;
const WEIGHT = 70;
const ADULT_BIRTH = '1996-04-12';
const MINOR_BIRTH = '2012-06-15';
const PROFESSOR_BIRTH = '1988-03-15';
const RESPONSAVEL_BIRTH = '1985-09-03';
const INDEPENDENT_BIRTH = '1995-01-20';
const SETTLE_REASON = 'Baixa manual da homologação ponta a ponta no Sandbox, sem emissão Asaas.';
const PASSWORD = 'Homolog#E2E-19';
const EVIDENCE = {
  protecao: '01-protecao-ambiente',
  dashboard: '02-owner-dashboard',
  equipes: '03-equipes',
  atletas: '04-atletas',
  evento: '05-evento',
  categorias: '06-categorias',
  inscricoes: '07-inscricoes',
  reserva: '08-reserva-persistida',
  baixa: '09-baixa-manual',
  checagem: '10-checagem',
  correcao: '11-correcao-auditada',
  lock: '12-checking-lock',
  draft: '13-chave-draft',
  publicada: '14-chave-publicada',
  programacao: '15-area-programacao',
  andamento: '16-evento-em-andamento',
  pesagem: '17-pesagem',
  semifinais: '18-semifinais',
  final: '19-final',
  colocacoes: '20-colocacoes',
  premiacao: '21-premiacao',
  financeiro: '22-financeiro',
  concluido: '23-evento-concluido',
} as const;

export type HomologationStage =
  | 'protecao'
  | 'usuarios'
  | 'equipes'
  | 'atletas'
  | 'evento'
  | 'categoria'
  | 'inscricoes'
  | 'reserva'
  | 'baixa-manual'
  | 'checagem'
  | 'correction-request'
  | 'lock'
  | 'brackets'
  | 'areas'
  | 'programacao'
  | 'inicio'
  | 'pesagem'
  | 'semifinais'
  | 'wo-resultado'
  | 'final'
  | 'colocacoes'
  | 'premiacao'
  | 'financeiro'
  | 'conclusao'
  | 'isolamento'
  | 'cleanup';

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
  const row = page.getByRole('row').filter({ hasText: name });
  return row;
}

async function waitEventStatus(admin: AdminClient, eventId: string, status: string) {
  await expect.poll(async () => {
    const opened = await admin.from('events').select('status').eq('id', eventId).single();
    return opened.data?.status || '';
  }, { timeout: 20000 }).toBe(status);
}

function dateOffset(offset: number) {
  return new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);
}

function hoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 3600_000).toISOString();
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
    throw new Error(`Publicação do evento não navegou. alerta="${alert.trim()}" url=${page.url()}`);
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

export type HomologationJourneyDeps = {
  page: Page;
  context: BrowserContext;
  browser: Browser;
  baseURL: string;
  testInfo: TestInfo;
};

export class HomologationJourney {
  readonly startedAt = Date.now();
  readonly runId = buildHomologationRunId();
  readonly stages: Record<HomologationStage, 'OK' | string> = {
    protecao: 'pendente',
    usuarios: 'pendente',
    equipes: 'pendente',
    atletas: 'pendente',
    evento: 'pendente',
    categoria: 'pendente',
    inscricoes: 'pendente',
    reserva: 'pendente',
    'baixa-manual': 'pendente',
    checagem: 'pendente',
    'correction-request': 'pendente',
    lock: 'pendente',
    brackets: 'pendente',
    areas: 'pendente',
    programacao: 'pendente',
    inicio: 'pendente',
    pesagem: 'pendente',
    semifinais: 'pendente',
    'wo-resultado': 'pendente',
    final: 'pendente',
    colocacoes: 'pendente',
    premiacao: 'pendente',
    financeiro: 'pendente',
    conclusao: 'pendente',
    isolamento: 'pendente',
    cleanup: 'pendente',
  };

  eventId = '';
  eventName = '';
  organizationId = '';
  ruleSetId = '';
  categoryId = '';
  categoryName = '';
  bracketId = '';
  groupId = '';
  paymentIds: string[] = [];
  registrationIds: string[] = [];
  teamIds: string[] = [];
  athleteIds: string[] = [];
  userIds: string[] = [];
  cleanupResidual = -1;
  failedStep: string | null = null;

  private admin!: AdminClient;
  private actor!: ActorClient;
  private anon!: ReturnType<typeof createClient<Database>>;
  private ownerId = '';
  private ownerEmail = '';
  private publicContext: BrowserContext | null = null;
  private publicPage: Page | null = null;
  private professor = { id: '', email: '', name: '' };
  private responsavel = { id: '', email: '', name: '' };
  private independent = { id: '', email: '', name: '', athleteId: '' };
  private teamNames: string[] = [];
  private athleteNames: string[] = [];
  private a1Name = '';
  private a2Name = '';
  private a3Name = '';
  private a4Name = '';
  private pendingCorrectionId = '';
  private approvedCorrectionId = '';
  private rejectedCorrectionId = '';
  private a1RegistrationId = '';

  constructor(private readonly deps: HomologationJourneyDeps) {
    this.eventName = `${this.runId} — Evento Ponta a Ponta`;
    this.categoryName = `${this.runId} Adulto Leve`;
    this.teamNames = [`${this.runId} Equipe Norte`, `${this.runId} Equipe Sul`];
    this.a1Name = `${this.runId} A1 Independente`;
    this.a2Name = `${this.runId} A2 Menor`;
    this.a3Name = `${this.runId} A3 Professor`;
    this.a4Name = `${this.runId} A4 Responsavel`;
    this.athleteNames = [this.a1Name, this.a2Name, this.a3Name, this.a4Name];
    this.professor = { id: '', email: `homolog.prof.${this.runId.toLowerCase()}@example.invalid`, name: `${this.runId} Professor` };
    this.responsavel = { id: '', email: `homolog.resp.${this.runId.toLowerCase()}@example.invalid`, name: `${this.runId} Responsavel` };
    this.independent = { id: '', email: `homolog.atleta.${this.runId.toLowerCase()}@example.invalid`, name: this.a1Name, athleteId: '' };
  }

  private get page() {
    return this.deps.page;
  }

  private ok(stage: HomologationStage) {
    this.stages[stage] = 'OK';
  }

  private fail(stage: HomologationStage, error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    this.stages[stage] = `FALHA: ${message}`;
    this.failedStep = stage;
  }

  async attach(name: string) {
    const passwordVisible = await this.page.locator('input[type="password"]').count();
    if (passwordVisible > 0 && /login|senha|password/i.test(this.page.url() + name)) {
      throw new Error(`Screenshot recusado: ${name} não pode capturar campo de senha.`);
    }
    const body = await this.page.screenshot({ fullPage: true });
    await this.deps.testInfo.attach(name, { body, contentType: 'image/png' });
  }

  private async publicSurface() {
    if (!this.publicPage) throw new Error('Página pública ainda não foi aberta.');
    return this.publicPage;
  }

  private async signInOwnerActor() {
    const link = await this.admin.auth.admin.generateLink({ type: 'magiclink', email: this.ownerEmail });
    if (link.error || !link.data.properties?.hashed_token) {
      throw new Error(`Sessão owner: ${link.error?.message || 'link ausente'}`);
    }
    const verified = await this.actor.auth.verifyOtp({
      token_hash: link.data.properties.hashed_token,
      type: 'email',
    });
    if (verified.error || !verified.data.user || !verified.data.session) {
      throw new Error(`Sessão owner: ${verified.error?.message || 'falhou'}`);
    }
    this.ownerId = verified.data.user.id;
    return verified.data.session;
  }

  private async asOwner() {
    const session = await this.signInOwnerActor();
    await this.deps.context.clearCookies();
    await this.deps.context.addCookies([{
      name: `sb-${SANDBOX_HOST.split('.')[0]}-auth-token`,
      value: JSON.stringify(session),
      url: this.deps.baseURL,
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    }]);
  }

  private async asUser(email: string, password: string) {
    await applyAuthSession(this.deps.context, this.deps.baseURL, email, password);
  }

  private async assertIsolationSnapshot(label: string) {
    const org = await this.admin.from('organizations').select('id, nome').eq('id', this.organizationId).single();
    if (org.data?.nome !== RELEASE_ORG_NAME) throw new Error(`${label}: organização ativa não é MEU CAMP.`);
    if (this.eventId) {
      const event = await this.admin.from('events').select('organization_id, nome').eq('id', this.eventId).single();
      if (event.data?.organization_id !== this.organizationId) throw new Error(`${label}: evento fora da MEU CAMP.`);
      if (event.data?.nome.includes('MC-SIM') || /^Evento E2E /.test(event.data?.nome || '')) {
        throw new Error(`${label}: evento da execução colidiu com massa anterior.`);
      }
    }
    if (this.teamIds.length) {
      const teams = await this.admin.from('teams').select('nome, organization_id').in('id', this.teamIds);
      if ((teams.data || []).some((team) => team.organization_id !== this.organizationId || /ricardo/i.test(team.nome))) {
        throw new Error(`${label}: equipe fora da MEU CAMP ou com nome Ricardo.`);
      }
    }
    if (this.athleteIds.length) {
      const athletes = await this.admin.from('athletes').select('nome_completo, organization_id').in('id', this.athleteIds);
      if ((athletes.data || []).some((athlete) => athlete.organization_id !== this.organizationId || athlete.nome_completo.includes('MC-SIM'))) {
        throw new Error(`${label}: atleta fora da MEU CAMP ou MC-SIM.`);
      }
    }
  }

  async prepare() {
    loadCleanupEnv();
    const env = assertHomologationEnvironment(process.env);
    const clients = await createCleanupClients();
    this.admin = clients.admin;
    this.actor = clients.actor;
    this.anon = createClient<Database>(env.supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '', {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const org = await this.admin.from('organizations').select('id, nome, slug').eq('id', env.organizationId).maybeSingle();
    if (org.error || org.data?.nome !== RELEASE_ORG_NAME) {
      throw new Error(`Organização ativa não é MEU CAMP (${org.data?.nome || org.error?.message || 'ausente'}). Nenhuma escrita foi feita.`);
    }
    this.organizationId = org.data.id;
    this.ownerEmail = process.env.E2E_OWNER_EMAIL || '';
    if (!this.ownerEmail) throw new Error('E2E_OWNER_EMAIL ausente. Nenhuma escrita foi feita.');
    await this.asOwner();
    const membership = await this.admin
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', this.ownerId)
      .eq('organization_id', this.organizationId)
      .maybeSingle();
    if (membership.data?.role !== 'owner') {
      throw new Error('Owner da MEU CAMP não resolvido pelo contexto ativo. Nenhuma escrita foi feita.');
    }
    this.ok('protecao');
    await this.page.setViewportSize({ width: 1440, height: 1000 });
    this.publicContext = await this.deps.browser.newContext({
      baseURL: this.deps.baseURL,
      viewport: { width: 1440, height: 1000 },
    });
    this.publicPage = await this.publicContext.newPage();
    await this.page.goto('/dashboard');
    await this.page.getByRole('heading', { name: /Olá,|Painel do organizador/ }).waitFor();
    await this.attach(EVIDENCE.protecao);
    await this.attach(EVIDENCE.dashboard);
  }

  private async createDisposableUser(role: 'professor' | 'responsavel' | 'atleta', name: string, email: string, birth: string) {
    const created = await this.admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { nome_completo: name, tipo_cadastro: role, data_nascimento: birth },
    });
    if (created.error || !created.data.user) throw new Error(`Criação de ${role}: ${created.error?.message || 'sem usuário'}`);
    this.userIds.push(created.data.user.id);
    const profile = await this.admin.from('profiles').select('id').eq('id', created.data.user.id).maybeSingle();
    if (!profile.data) {
      await checked(`perfil ${role}`, this.admin.from('profiles').insert({
        id: created.data.user.id,
        nome_completo: name,
        data_nascimento: birth,
      }));
    }
    return created.data.user.id;
  }

  private async signUpIndependentViaUi() {
    await this.deps.context.clearCookies();
    await this.page.goto('/login?mode=register');
    await this.page.getByRole('button', { name: /^Atleta\b/ }).click();
    await this.page.getByLabel('Nome completo').fill(this.independent.name);
    await this.page.getByLabel('Data de nascimento').fill(INDEPENDENT_BIRTH);
    await this.page.keyboard.press('Escape');
    await this.page.getByLabel('E-mail').fill(this.independent.email);
    await this.page.getByLabel('E-mail').click();
    await this.page.locator('#signup-password').fill(PASSWORD);
    await this.page.locator('#signup-confirm').fill(PASSWORD);
    await this.page.locator('form').getByRole('button', { name: 'Criar conta' }).click();
    await this.page.getByRole('status').getByText(/Cadastro recebido/).waitFor();
    const profile = await this.admin.from('profiles').select('id').eq('nome_completo', this.independent.name).maybeSingle();
    if (!profile.data?.id) throw new Error('Perfil do atleta independente não apareceu após o cadastro.');
    const confirmed = await this.admin.auth.admin.updateUserById(profile.data.id, { email_confirm: true });
    if (confirmed.error) throw new Error(`Confirmação do atleta: ${confirmed.error.message}`);
    this.userIds.push(profile.data.id);
    return profile.data.id;
  }

  async createUsers() {
    try {
      this.professor.id = await this.createDisposableUser('professor', this.professor.name, this.professor.email, PROFESSOR_BIRTH);
      this.responsavel.id = await this.createDisposableUser('responsavel', this.responsavel.name, this.responsavel.email, RESPONSAVEL_BIRTH);
      this.independent.id = await this.signUpIndependentViaUi();
      const athletesAfterSignup = await this.admin.from('athletes').select('id').eq('user_id', this.independent.id);
      if ((athletesAfterSignup.data || []).length !== 0) throw new Error('SignUp de atleta independente já criou athletes.');
      const memberships = await this.admin.from('organization_members').select('user_id').in('user_id', [this.professor.id, this.responsavel.id, this.independent.id]);
      if ((memberships.data || []).length) throw new Error('Usuário descartável recebeu organization_role.');
      this.ok('usuarios');
    } catch (error) {
      this.fail('usuarios', error);
      throw error;
    }
  }

  async createTeams() {
    try {
      await this.asOwner();
      await this.page.goto('/dashboard/meus-atletas');
      for (const teamName of this.teamNames) {
        await expand(this.page, 'Nova equipe');
        await this.page.getByLabel('Nome da equipe').fill(teamName);
        await this.page.getByRole('button', { name: 'Cadastrar equipe' }).click();
        await this.page.getByText('Equipe cadastrada com sucesso.').waitFor();
      }
      const teams = await this.admin.from('teams').select('id, nome, organization_id').eq('organization_id', this.organizationId).in('nome', this.teamNames);
      if ((teams.data || []).length !== 2) throw new Error('Equipes da homologação não persistiram na MEU CAMP.');
      this.teamIds = this.teamNames.map((nome) => teams.data!.find((team) => team.nome === nome)!.id);
      await checked('custódia Norte', this.admin.from('teams').update({ created_by: this.professor.id }).eq('id', this.teamIds[0]));
      await checked('custódia Sul', this.admin.from('teams').update({ created_by: this.responsavel.id }).eq('id', this.teamIds[1]));
      await this.assertIsolationSnapshot('equipes');
      await this.attach(EVIDENCE.equipes);
      this.ok('equipes');
    } catch (error) {
      this.fail('equipes', error);
      throw error;
    }
  }

  private async registerManagedAthlete(name: string, birth: string, teamName: string, relationship: 'professor' | 'responsavel') {
    await expand(this.page, /Novo atleta/i);
    const form = this.page.locator('#athlete-form');
    await form.waitFor();
    await form.getByLabel('Nome completo').fill(name);
    await form.getByLabel('Nascimento').fill(birth);
    await this.page.keyboard.press('Escape');
    await form.getByLabel('Gênero').selectOption('M');
    await form.getByLabel('Equipe').selectOption({ label: teamName });
    await form.getByLabel('Vínculo').selectOption(relationship);
    await form.getByLabel('Faixa').fill('Branca');
    await form.getByLabel('Peso (kg)').fill(String(WEIGHT));
    await form.getByRole('button', { name: 'Cadastrar atleta' }).click();
    await this.page.getByText('Atleta cadastrado com sucesso.').waitFor();
    const row = await this.admin.from('athletes').select('id, user_id').eq('organization_id', this.organizationId).eq('nome_completo', name).single();
    if (!row.data) throw new Error(`Atleta ${name} não persistiu.`);
    if (row.data.user_id) throw new Error(`Atleta gerenciado ${name} nasceu com login.`);
    this.athleteIds.push(row.data.id);
    return row.data.id;
  }

  async createAthletes() {
    try {
      await this.asUser(this.independent.email, PASSWORD);
      await this.page.goto('/dashboard');
      await expect(this.page).toHaveURL(/completar-cadastro-esportivo/);
      await this.page.getByLabel('Equipe').selectOption({ label: this.teamNames[0] });
      await this.page.getByLabel('Gênero').selectOption('M');
      await this.page.getByLabel('Faixa').fill('Branca');
      await this.page.getByLabel('Peso (kg)').fill(String(WEIGHT));
      await this.page.setViewportSize({ width: 390, height: 844 });
      await this.page.getByRole('heading', { name: 'Completar cadastro esportivo' }).waitFor();
      await this.page.setViewportSize({ width: 1440, height: 1000 });
      await this.attach(EVIDENCE.atletas);
      await this.page.getByRole('button', { name: 'Concluir cadastro esportivo' }).click();
      await this.page.waitForURL(/\/dashboard(?:\?|$)/, { timeout: 25000 }).catch(async () => {
        await this.page.getByRole('status').filter({ hasText: 'Cadastro esportivo concluído' }).waitFor({ timeout: 10000 });
        await this.page.goto('/dashboard');
      });
      await expect(this.page).not.toHaveURL(/completar-cadastro-esportivo/);
      const self = await this.admin.from('athletes').select('id, user_id, organization_id').eq('user_id', this.independent.id);
      if ((self.data || []).length !== 1) throw new Error(`Atleta independente nasceu ${(self.data || []).length} vez(es).`);
      if (self.data![0].organization_id !== this.organizationId) throw new Error('Atleta independente fora da MEU CAMP.');
      this.independent.athleteId = self.data![0].id;
      this.athleteIds.push(this.independent.athleteId);
      const selfManagers = await this.admin.from('athlete_managers').select('id').eq('athlete_id', this.independent.athleteId).eq('manager_id', this.independent.id);
      if ((selfManagers.data || []).length) throw new Error('Atleta independente recebeu athlete_managers para si mesmo.');

      await this.asUser(this.responsavel.email, PASSWORD);
      await this.page.goto('/dashboard/meus-atletas');
      const a2 = await this.registerManagedAthlete(this.a2Name, MINOR_BIRTH, this.teamNames[1], 'responsavel');
      const a4 = await this.registerManagedAthlete(this.a4Name, ADULT_BIRTH, this.teamNames[1], 'responsavel');
      const minorAuth = await this.admin.from('athletes').select('user_id').eq('id', a2).single();
      if (minorAuth.data?.user_id) throw new Error('Menor nasceu com user_id.');

      await this.asUser(this.professor.email, PASSWORD);
      await this.page.goto('/dashboard/meus-atletas');
      await this.registerManagedAthlete(this.a3Name, ADULT_BIRTH, this.teamNames[0], 'professor');
      void a4;
      await this.assertIsolationSnapshot('atletas');
      this.ok('atletas');
    } catch (error) {
      this.fail('atletas', error);
      throw error;
    }
  }

  async createEventAndCategory() {
    try {
      await this.asOwner();
      await this.page.goto('/admin/eventos/novo');
      await this.page.getByRole('heading', { name: 'Criar evento' }).waitFor();
      await this.page.getByLabel('Nome do evento').fill(this.eventName);
      await this.page.getByLabel('Data do evento').fill(dateOffset(30));
      await this.page.keyboard.press('Escape');
      await this.page.getByLabel('Local', { exact: true }).fill('Ginásio Homologação MEU CAMP');
      await this.page.getByLabel('Valor da inscrição (R$)').fill(String(FEE));
      await fillPhase(this.page, 'Inscrição', -1, 5);
      await fillPhase(this.page, 'Pagamento', 6, 10);
      await fillPhase(this.page, 'Checagem', 11, 15);
      await fillPhase(this.page, 'Chaves', 16, 20);
      await waitForPublishedEvent(this.page);
      const created = await this.admin.from('events').select('id, organization_id, status').eq('nome', this.eventName).single();
      if (!created.data || created.data.organization_id !== this.organizationId || created.data.status !== 'publicado') {
        throw new Error('Evento de homologação não persistiu na MEU CAMP como publicado.');
      }
      this.eventId = created.data.id;
      await this.attach(EVIDENCE.evento);

      await eventCard(this.page, this.eventName).getByRole('link', { name: 'Configurar' }).click();
      await this.page.getByLabel('Nome do conjunto').fill(`${this.runId} Regras`);
      await this.page.getByLabel('Nome da categoria').fill(this.categoryName);
      await this.page.getByLabel('Idade mínima').fill('10');
      await this.page.getByLabel('Idade máxima').fill('99');
      await this.page.getByLabel('Peso mínimo').fill('60');
      await this.page.getByLabel('Peso máximo').fill('80');
      await this.page.getByLabel('Duração da luta (minutos)').fill(String(DURATION_MINUTES));
      await this.page.getByRole('button', { name: 'Criar versão' }).click();
      await this.page.getByText('Versão 1 criada com sucesso.', { exact: true }).waitFor();
      const rule = await this.admin.from('category_rule_sets').select('id').eq('event_id', this.eventId).eq('ativo', true).single();
      const category = await this.admin.from('event_categories').select('id, fight_duration_minutes, idade_min, idade_max, peso_min_kg, peso_max_kg, genero').eq('rule_set_id', rule.data?.id || '').eq('nome', this.categoryName).single();
      if (!rule.data || !category.data) throw new Error('Categoria da homologação não persistiu.');
      if (Number(category.data.fight_duration_minutes) !== DURATION_MINUTES) throw new Error('Duração oficial não persistiu.');
      this.ruleSetId = rule.data.id;
      this.categoryId = category.data.id;
      await this.attach(EVIDENCE.categorias);
      this.ok('evento');
      this.ok('categoria');
    } catch (error) {
      this.fail('evento', error);
      this.fail('categoria', error);
      throw error;
    }
  }

  private async inscribeCurrentAthlete(athleteName: string, professorName: string, linkSelf = false) {
    await this.page.goto(`/eventos/${this.eventId}/inscricao/cadastrar-atleta`);
    await this.page.getByRole('heading', { name: 'Atletas disponíveis' }).waitFor();
    await this.page.getByRole('checkbox', { name: `Selecionar ${athleteName}` }).check();
    const professorField = this.page.getByRole('textbox', { name: 'Professor operacional' });
    await professorField.waitFor();
    await professorField.fill(professorName);
    if (linkSelf) {
      const selfBox = this.page.getByRole('checkbox', { name: /Sou o professor operacional desta inscrição/ });
      if (await selfBox.count()) await selfBox.check();
    }
    await this.page.getByLabel(/Li e aceito os termos/).check();
    await this.page.getByRole('button', { name: 'Confirmar inscrições' }).click();
    await expect(this.page.getByRole('status')).toContainText('1 inscrição(ões) criada(s). Pendente de pagamento.');
  }

  async registerAthletes() {
    try {
      await this.asOwner();
      await this.page.goto('/admin/eventos');
      await eventCard(this.page, this.eventName).getByRole('button', { name: 'Abrir inscrições' }).click();
      await waitEventStatus(this.admin, this.eventId, 'inscricao');
      await expect(eventCard(this.page, this.eventName).getByRole('button', { name: 'Abrir pagamento' })).toBeVisible();

      await this.asUser(this.independent.email, PASSWORD);
      await this.page.setViewportSize({ width: 390, height: 844 });
      await this.page.goto('/dashboard');
      await this.page.getByRole('link', { name: 'Fazer minha inscrição' }).first().waitFor();
      await this.page.setViewportSize({ width: 1440, height: 1000 });
      await this.page.goto(`/eventos/${this.eventId}/inscricao/cadastrar-atleta`);
      await expect(this.page.getByRole('checkbox', { name: `Selecionar ${this.a3Name}` })).toHaveCount(0);
      await this.inscribeCurrentAthlete(this.a1Name, 'Treinador Homologacao');
      const selfReg = await this.admin.from('registrations').select('id, registered_by, athlete_id').eq('event_id', this.eventId).eq('athlete_id', this.independent.athleteId).single();
      if (selfReg.data?.registered_by !== this.independent.id) throw new Error('Inscrição A1 não usou o próprio usuário.');
      this.a1RegistrationId = selfReg.data.id;

      await this.asUser(this.responsavel.email, PASSWORD);
      await this.inscribeCurrentAthlete(this.a2Name, this.responsavel.name);
      await this.inscribeCurrentAthlete(this.a4Name, this.responsavel.name);

      await this.asUser(this.professor.email, PASSWORD);
      await this.inscribeCurrentAthlete(this.a3Name, this.professor.name, true);
      await this.page.goto('/dashboard/inscricoes');
      await this.page.getByText(this.a3Name, { exact: true }).first().waitFor();
      await this.attach(EVIDENCE.inscricoes);

      const pending = await this.admin.from('registrations').select('id, status, category_id, athlete_snapshot, operational_professor_name').eq('event_id', this.eventId);
      this.registrationIds = (pending.data || []).map((row) => row.id);
      if (this.registrationIds.length !== 4 || (pending.data || []).some((row) => row.status !== 'pendente_pagamento')) {
        throw new Error('As quatro inscrições não ficaram pendentes de pagamento.');
      }
      if ((pending.data || []).some((row) => row.category_id !== this.categoryId)) throw new Error('Categorização automática não alocou a categoria única.');
      if ((pending.data || []).some((row) => !row.operational_professor_name)) throw new Error('Professor operacional ausente.');
      this.ok('inscricoes');
    } catch (error) {
      this.fail('inscricoes', error);
      throw error;
    }
  }

  private correctionForm() {
    return this.page
      .getByRole('row')
      .filter({ hasText: this.a1Name })
      .locator('form')
      .filter({ has: this.page.getByLabel('Campo') });
  }

  private async submitCorrection(
    field: 'peso' | 'faixa' | 'nome',
    value: string,
    reason?: string,
  ) {
    const form = this.correctionForm();
    await form.getByLabel('Campo').selectOption(field);
    if (field === 'peso') {
      const input = form.getByLabel('Peso solicitado (kg)');
      await input.fill(value);
      await expect(input).toHaveValue(value);
    } else if (field === 'faixa') {
      await form.getByLabel('Faixa solicitada').selectOption(value);
    } else {
      const input = form.getByLabel('Nome solicitado');
      await input.fill(value);
      await expect(input).toHaveValue(value);
    }
    if (reason) await form.getByLabel('Motivo (opcional)').fill(reason);
    await form.getByRole('button', { name: 'Enviar solicitação' }).click();
    const feedback = form.getByRole('status').or(form.getByRole('alert'));
    await expect(feedback).toBeVisible({ timeout: 20000 });
    const text = (await feedback.textContent())?.trim() || '';
    if (!text.includes('Solicitação enviada')) {
      throw new Error(`Correção de ${field} recusada na UI: ${text}`);
    }
  }

  private async waitCorrectionRequest(registrationId: string, field: string, status: string) {
    await expect.poll(async () => {
      const row = await this.admin
        .from('registration_correction_requests')
        .select('id, status')
        .eq('registration_id', registrationId)
        .eq('requested_field', field)
        .eq('status', status)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (row.error) throw new Error(`Leitura de correção ${field}: ${row.error.message}`);
      return row.data?.id || '';
    }, { timeout: 25000 }).not.toBe('');
    const row = await this.admin
      .from('registration_correction_requests')
      .select('*')
      .eq('registration_id', registrationId)
      .eq('requested_field', field)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (!row.data) throw new Error(`Pedido de ${field} não persistiu como ${status}.`);
    return row.data;
  }

  private async reserveAs(email: string, expectedCount: number) {
    await this.asUser(email, PASSWORD);
    await this.page.goto('/dashboard/inscricoes');
    await this.page.getByRole('heading', { name: 'Reservar pagamento' }).waitFor();
    const checkout = this.page.locator('form').filter({ has: this.page.locator('select#checkout-event') });
    await checkout.locator('select#checkout-event').selectOption(this.eventId, { timeout: 20000 });
    const boxes = checkout.getByRole('checkbox');
    await expect(boxes).toHaveCount(expectedCount);
    for (let index = 0; index < expectedCount; index += 1) await boxes.nth(index).check();
    const registrationIds = await boxes.evaluateAll((nodes) => nodes.map((node) => (node as HTMLInputElement).value).filter(Boolean));
    if (registrationIds.length !== expectedCount) throw new Error('IDs das inscrições da reserva não foram capturados.');
    await checkout.getByRole('radio', { name: 'PIX', exact: true }).check();
    await expect(this.page.getByText(/Não emite cobrança no Asaas/)).toBeVisible();
    await expect(this.page.getByRole('button', { name: /Emitir cobrança/i })).toHaveCount(0);
    await expect(this.page.getByText(/QR Code|linha digitável|boleto gerado/i)).toHaveCount(0);
    await checkout.getByRole('button', { name: 'Reservar pagamento', exact: true }).click();
    let paymentId = '';
    await expect.poll(async () => {
      const links = await this.admin.from('payment_registrations').select('payment_id, registration_id').in('registration_id', registrationIds);
      const rows = links.data || [];
      if (rows.length !== expectedCount) return 0;
      const ids = [...new Set(rows.map((row) => row.payment_id))];
      if (ids.length !== 1) throw new Error('Reserva gerou pagamentos duplicados para as mesmas inscrições.');
      const payment = await this.admin.from('payments').select('id, status, valor_total, paid_at, event_id').eq('id', ids[0]).single();
      if (
        !payment.data
        || payment.data.event_id !== this.eventId
        || payment.data.status !== 'aguardando'
        || payment.data.paid_at
        || Number(payment.data.valor_total) !== expectedCount * FEE
      ) return 0;
      const jobs = await this.admin.from('payment_issuance_jobs').select('payment_id, state').eq('payment_id', payment.data.id);
      if (jobs.error) throw new Error(`Consulta de emissão: ${jobs.error.message}`);
      if ((jobs.data || []).length) {
        throw new Error(`Reserva disparou job de emissão (${(jobs.data || []).map((job) => job.state).join(',')}).`);
      }
      paymentId = payment.data.id;
      return 1;
    }, { timeout: 25000 }).toBe(1);
    this.paymentIds.push(paymentId);
    await expect(this.page.getByRole('status').filter({ hasText: 'Reserva persistida.' })).toBeVisible();
    await expect(this.page.getByRole('button', { name: /Reservando/ })).toHaveCount(0);
    await expect(this.page.getByRole('button', { name: /Emitir cobrança/i })).toHaveCount(0);
    await expect(this.page.getByText(/QR Code|linha digitável|boleto gerado/i)).toHaveCount(0);
  }

  async reserveAndSettle() {
    try {
      await this.asOwner();
      await this.page.goto('/admin/eventos');
      await eventCard(this.page, this.eventName).getByRole('button', { name: 'Abrir pagamento' }).click();
      await waitEventStatus(this.admin, this.eventId, 'pagamento');
      await expect(eventCard(this.page, this.eventName).getByRole('button', { name: 'Abrir checagem' })).toBeVisible();
      await activatePhaseWindow(this.admin, this.eventId, 'pagamento', 'inscricao');
      await this.reserveAs(this.independent.email, 1);
      await this.reserveAs(this.professor.email, 1);
      await this.reserveAs(this.responsavel.email, 2);
      const payments = await this.admin.from('payments').select('id, status, valor_total').eq('event_id', this.eventId);
      const reserved = (payments.data || []).filter((row) => row.status === 'aguardando');
      if (reserved.length !== 3 || this.paymentIds.length !== 3) {
        throw new Error(`Esperado 3 reservas, persistiram ${reserved.length} / capturadas ${this.paymentIds.length}.`);
      }
      const links = await this.admin.from('payment_registrations').select('payment_id, registration_id').in('payment_id', this.paymentIds);
      if ((links.data || []).length !== 4) throw new Error('Vínculos payment_registrations incompletos após a reserva.');
      await this.attach(EVIDENCE.reserva);
      this.ok('reserva');
      await this.asOwner();
      await this.page.goto(`/admin/eventos/${this.eventId}/financeiro`);
      await this.page.getByRole('heading', { name: /^Financeiro/ }).waitFor();
      for (const paymentId of this.paymentIds) {
        const current = await this.admin.from('payments').select('status').eq('id', paymentId).single();
        if (current.data?.status === 'pago') continue;
        const form = this.page.locator('form').filter({ has: this.page.locator(`input[name="payment_id"][value="${paymentId}"]`) });
        await form.getByLabel('Justificativa da baixa manual').fill(SETTLE_REASON);
        await form.getByRole('checkbox', { name: /Confirmo que conferi/ }).check();
        await form.getByRole('button', { name: 'Confirmar baixa manual' }).click();
        await expect.poll(async () => {
          const paid = await this.admin.from('payments').select('status').eq('id', paymentId).single();
          return paid.data?.status || '';
        }, { timeout: 25000 }).toBe('pago');
      }
      const efetivadas = await this.admin.from('registrations').select('id, status').eq('event_id', this.eventId);
      if ((efetivadas.data || []).some((row) => row.status !== 'efetivada') || (efetivadas.data || []).length !== 4) {
        throw new Error('Baixa manual não efetivou as quatro inscrições.');
      }
      const settledLinks = await this.admin.from('payment_registrations').select('payment_id, registration_id').in('payment_id', this.paymentIds);
      if ((settledLinks.data || []).length !== 4) throw new Error('Vínculos payment_registrations incompletos após a baixa.');
      const settled = await this.admin.from('payments').select('id, status').in('id', this.paymentIds);
      if ((settled.data || []).some((row) => row.status !== 'pago') || (settled.data || []).length !== 3) {
        throw new Error('Baixa manual não marcou os pagamentos como pago.');
      }
      await this.attach(EVIDENCE.baixa);
      this.ok('baixa-manual');
    } catch (error) {
      if (this.stages.reserva !== 'OK') this.fail('reserva', error);
      this.fail('baixa-manual', error);
      throw error;
    }
  }

  async openCheckingAndAssert() {
    try {
      await activatePhaseWindow(this.admin, this.eventId, 'checagem', 'pagamento');
      await this.asOwner();
      await this.page.goto('/admin/eventos');
      await eventCard(this.page, this.eventName).getByRole('button', { name: 'Abrir checagem' }).click();
      await waitEventStatus(this.admin, this.eventId, 'checagem');
      const publicPage = await this.publicSurface();
      await publicPage.goto(`/eventos/${this.eventId}/checagem`);
      await publicPage.getByRole('heading', { name: /^Checagem/ }).waitFor();
      for (const name of this.athleteNames) await publicPage.getByText(name, { exact: true }).first().waitFor();
      await expect(publicPage.getByText('Ricardo')).toHaveCount(0);
      await expect(publicPage.getByText('MC-SIM')).toHaveCount(0);
      await expect(publicPage.getByText(/cpf|e-mail|senha/i)).toHaveCount(0);
      await publicPage.getByLabel('Filtrar por equipe').selectOption(this.teamNames[0]);
      await publicPage.getByRole('button', { name: 'Filtrar' }).click();
      await publicPage.getByText(this.a1Name, { exact: true }).first().waitFor();
      await this.page.goto(`/admin/eventos/${this.eventId}/checagem`);
      await this.page.getByRole('heading', { name: `Checagem — ${this.eventName}` }).waitFor();
      await this.attach(EVIDENCE.checagem);
      this.ok('checagem');
    } catch (error) {
      this.fail('checagem', error);
      throw error;
    }
  }

  async exerciseAuditedCorrection() {
    try {
      const a1Reg = await this.admin.from('registrations').select('id, athlete_snapshot, category_id, current_category_id').eq('event_id', this.eventId).eq('athlete_id', this.independent.athleteId).single();
      if (!a1Reg.data) throw new Error('Inscrição A1 ausente para correção.');
      const registrationId = a1Reg.data.id;
      await this.asUser(this.independent.email, PASSWORD);
      await this.page.goto('/dashboard/inscricoes');
      await expect(this.page.getByText('Solicitar correção').first()).toBeVisible();
      await this.submitCorrection('peso', '70.5', `${this.runId} correcao de peso homologacao`);
      const pendingPeso = await this.waitCorrectionRequest(registrationId, 'peso', 'pendente');
      this.approvedCorrectionId = pendingPeso.id;
      if (Number(object(pendingPeso.previous_value as Json).peso_kg) !== WEIGHT) throw new Error('previous_value de peso incorreto.');

      await this.asOwner();
      await this.page.goto(`/admin/eventos/${this.eventId}/checagem`);
      await this.page.getByRole('heading', { name: 'Correções pendentes' }).waitFor();
      await this.page.getByRole('button', { name: 'Aprovar' }).click();
      await expect.poll(async () => {
        const approved = await this.admin.from('registration_correction_requests').select('status').eq('id', this.approvedCorrectionId).single();
        return approved.data?.status || '';
      }, { timeout: 20000 }).toBe('aprovada');
      const approved = await this.admin.from('registration_correction_requests').select('*').eq('id', this.approvedCorrectionId).single();
      if (approved.data?.status !== 'aprovada' || approved.data.reviewed_by !== this.ownerId || !approved.data.reviewed_at) {
        throw new Error('Aprovação da correção não gravou reviewer/timestamps.');
      }
      if (approved.data.category_compatible !== true) throw new Error('Correção compatível não sinalizou category_compatible=true.');
      const after = await this.admin.from('registrations').select('athlete_snapshot, category_id, current_category_id').eq('id', registrationId).single();
      if (after.data?.category_id !== a1Reg.data.category_id || after.data?.current_category_id !== a1Reg.data.current_category_id) {
        throw new Error('Correção recategorizou silenciosamente.');
      }

      await this.asUser(this.independent.email, PASSWORD);
      await this.page.goto('/dashboard/inscricoes');
      await this.submitCorrection('faixa', 'Azul');
      const pendingFaixa = await this.waitCorrectionRequest(registrationId, 'faixa', 'pendente');
      this.rejectedCorrectionId = pendingFaixa.id;
      await this.asOwner();
      await this.page.goto(`/admin/eventos/${this.eventId}/checagem`);
      await this.page.getByRole('button', { name: 'Rejeitar' }).click();
      await expect.poll(async () => {
        const rejected = await this.admin.from('registration_correction_requests').select('status').eq('id', this.rejectedCorrectionId).single();
        return rejected.data?.status || '';
      }, { timeout: 20000 }).toBe('recusada');

      await this.asUser(this.independent.email, PASSWORD);
      await this.page.goto('/dashboard/inscricoes');
      await this.submitCorrection('nome', `${this.a1Name} Corrigido`);
      const pendingNome = await this.waitCorrectionRequest(registrationId, 'nome', 'pendente');
      this.pendingCorrectionId = pendingNome.id;
      await this.asOwner();
      await this.page.goto(`/admin/eventos/${this.eventId}/checagem`);
      await this.attach(EVIDENCE.correcao);
      this.ok('correction-request');
    } catch (error) {
      this.fail('correction-request', error);
      throw error;
    }
  }

  async lockChecking() {
    try {
      await this.asOwner();
      await this.page.goto(`/admin/eventos/${this.eventId}/checagem`);
      await this.page.getByLabel(/Confirmo que a lista oficial/).check();
      await this.page.getByRole('button', { name: 'Travar checagem' }).click();
      await expect(this.page.getByRole('button', { name: 'Abrir chaves' })).toBeVisible();
      const locked = await this.admin.from('events').select('checagem_travada_em').eq('id', this.eventId).single();
      if (!locked.data?.checagem_travada_em) throw new Error('Checagem não ficou travada.');
      if (this.pendingCorrectionId) {
        await this.signInOwnerActor();
        const review = await this.actor.rpc('review_registration_correction', {
          target_request_id: this.pendingCorrectionId,
          approve_request: true,
        });
        if (!review.error) throw new Error('Aprovação pendente atravessou o lock.');
      }
      await this.actor.auth.signInWithPassword({ email: this.independent.email, password: PASSWORD });
      const afterLock = await this.actor.rpc('request_registration_correction', {
        target_registration_id: this.a1RegistrationId,
        requested_field: 'peso',
        requested_text: '71',
      });
      if (!afterLock.error) throw new Error('Novo correction request atravessou o lock.');
      await this.attach(EVIDENCE.lock);
      this.ok('lock');
    } catch (error) {
      this.fail('lock', error);
      throw error;
    }
  }

  async generateAndPublishBracket() {
    try {
      await activatePhaseWindow(this.admin, this.eventId, 'chaves', 'checagem');
      await this.asOwner();
      await this.page.goto(`/admin/eventos/${this.eventId}/checagem`);
      await this.page.getByRole('button', { name: 'Abrir chaves' }).click();
      await expect.poll(async () => {
        const opened = await this.admin.from('events').select('status').eq('id', this.eventId).single();
        return opened.data?.status;
      }, { timeout: 20000 }).toBe('chaves');
      await this.page.reload();
      await this.page.getByRole('link', { name: 'Ir para as chaves' }).click();
      await this.page.getByRole('heading', { name: `Chaves — ${this.eventName}` }).waitFor();
      await this.page.getByRole('button', { name: new RegExp(this.categoryName) }).click();
      await this.page.getByRole('button', { name: 'Gerar chave' }).click();
      await this.page.getByText('Chave gerada em rascunho.').waitFor();
      await this.page.getByText('Semifinais com 4 atletas').waitFor();
      const draft = await this.admin.from('category_brackets').select('id, status').eq('event_id', this.eventId).eq('category_id', this.categoryId).eq('status', 'draft').single();
      if (!draft.data) throw new Error('Draft semi4 não persistiu.');
      this.bracketId = draft.data.id;
      const participants = await this.admin.from('bracket_participants').select('id, source_order').eq('bracket_id', this.bracketId).order('source_order');
      const orders = (participants.data || []).map((row) => row.source_order);
      if (orders.length !== 4 || new Set(orders).size !== 4) throw new Error('source_order da chave semi4 não é determinístico.');
      const groups = await this.admin.from('bracket_groups').select('id, topology').eq('bracket_id', this.bracketId);
      if ((groups.data || []).length !== 1 || groups.data?.[0].topology !== 'semi_4') throw new Error('Topologia semi_4 ausente.');
      this.groupId = groups.data![0].id;
      const originalSignature = await compositionSignature(this.admin, this.bracketId);
      await this.attach(EVIDENCE.draft);
      const firstSlot = this.page.locator('label').filter({ hasText: 'Slot 01' }).first().locator('select');
      await chooseDifferentOption(firstSlot);
      await this.page.getByRole('button', { name: 'Salvar composição' }).click();
      await this.page.getByText('Composição salva.').waitFor();
      if (await compositionSignature(this.admin, this.bracketId) === originalSignature) {
        throw new Error('Ajuste manual em DRAFT não alterou a persistência.');
      }
      this.page.once('dialog', (dialog) => dialog.accept());
      await this.page.getByRole('button', { name: 'Publicar' }).click();
      await this.page.getByText('Chave publicada. Ela agora está somente para leitura.').waitFor();
      const publicPage = await this.publicSurface();
      await publicPage.goto(`/eventos/${this.eventId}/chaves`);
      await publicPage.getByRole('heading', { name: this.categoryName }).waitFor();
      await this.asOwner();
      await this.page.goto(`/admin/eventos/${this.eventId}/chaves`);
      await this.page.getByRole('button', { name: new RegExp(this.categoryName) }).click();
      await this.attach(EVIDENCE.publicada);
      this.ok('brackets');
    } catch (error) {
      this.fail('brackets', error);
      throw error;
    }
  }

  async configureAreaAndSchedule() {
    try {
      await this.asOwner();
      await this.page.goto(`/admin/eventos/${this.eventId}/programacao`);
      await this.page.getByLabel('Número').first().fill('1');
      await this.page.getByLabel('Nome ou cor').first().fill('Tatame');
      await this.page.getByRole('button', { name: 'Adicionar área' }).click();
      await this.page.getByText('Área criada.').waitFor();
      this.ok('areas');
      await this.page.getByText(`${this.categoryName} — Subchave A`, { exact: true }).locator('xpath=../..').getByLabel('Área da subchave A').selectOption({ label: 'Área 1 — Tatame' });
      await this.page.getByText('Subchave e todas as suas lutas foram atribuídas.').waitFor();
      await expect(this.page.getByLabel('Luta 1', { exact: true })).toBeVisible();
      await expect(this.page.getByLabel('Luta 2', { exact: true })).toBeVisible();
      await expect(this.page.getByLabel('Luta 3', { exact: true })).toBeVisible();
      await this.page.getByRole('button', { name: 'Mover luta 1 para baixo' }).click();
      await this.page.getByText('Fila global reordenada e números recalculados.').waitFor();
      await this.page.getByRole('button', { name: 'Publicar programação' }).click();
      await this.page.getByText('Programação publicada. Áreas e números estão congelados.').waitFor();
      await this.attach(EVIDENCE.programacao);
      this.ok('programacao');
    } catch (error) {
      this.fail('areas', error);
      this.fail('programacao', error);
      throw error;
    }
  }

  async weighInStartAndResults() {
    try {
      await this.asOwner();
      await this.page.goto(`/admin/eventos/${this.eventId}/resultados`);
      await this.page.getByRole('button', { name: new RegExp(this.categoryName) }).click();
      await this.page.getByRole('button', { name: 'Marcar pesagem como realizada' }).click();
      await this.page.getByText('Pesagem marcada como realizada.').waitFor();
      await expect(this.page.getByRole('button', { name: 'Marcar premiação como realizada' })).toBeDisabled();
      await this.attach(EVIDENCE.pesagem);
      this.ok('pesagem');
      await this.page.getByRole('button', { name: 'Iniciar operação' }).click();
      await this.page.getByText('Operação iniciada. O evento está em andamento.').waitFor();
      const started = await this.admin.from('events').select('status').eq('id', this.eventId).single();
      if (started.data?.status !== 'em_andamento') throw new Error(`Início não avançou para em_andamento (${started.data?.status}).`);
      await this.attach(EVIDENCE.andamento);
      this.ok('inicio');

      const winnerSelect = this.page.getByLabel('Vencedor').first();
      await expect(winnerSelect).toBeEnabled();
      await winnerSelect.selectOption({ index: 1 });
      await this.page.getByRole('button', { name: 'Registrar vitória' }).first().click();
      await this.page.getByText('Resultado registrado e vencedor avançado.').waitFor();
      await this.attach(EVIDENCE.semifinais);
      this.ok('semifinais');
      const woSelect = this.page.getByLabel('Vencedor').first();
      await expect(woSelect).toBeEnabled();
      await woSelect.selectOption({ index: 1 });
      this.page.once('dialog', (dialog) => dialog.accept());
      await this.page.getByRole('button', { name: 'Registrar WO' }).first().click();
      await this.page.getByText('WO registrado e vencedor avançado.').waitFor();
      this.ok('wo-resultado');
      const finalSelect = this.page.getByLabel('Vencedor').first();
      await expect(finalSelect).toBeEnabled();
      await finalSelect.selectOption({ index: 1 });
      await this.page.getByRole('button', { name: 'Registrar vitória' }).first().click();
      await this.page.getByText('Grupo concluído').waitFor();
      await this.attach(EVIDENCE.final);
      this.ok('final');

      const operation = await rpcPayload('operação semi4', this.actor.rpc('get_category_bracket_operation', { target_bracket_id: this.bracketId }));
      const places = list(list(operation.groups)[0].placements).map((placement) => Number(placement.place));
      if (JSON.stringify(places) !== JSON.stringify([1, 2, 3, 3])) throw new Error(`Colocações inválidas: ${places.join(',')}.`);
      if (allMatches(operation).filter((match) => match.status === 'wo').length !== 1) throw new Error('Semi4 não preservou exatamente um WO.');
      await this.attach(EVIDENCE.colocacoes);
      this.ok('colocacoes');
      await this.page.getByRole('button', { name: 'Marcar premiação como realizada' }).click();
      await this.page.getByText('Premiação marcada como realizada.').waitFor();
      await this.attach(EVIDENCE.premiacao);
      this.ok('premiacao');
    } catch (error) {
      if (this.stages.pesagem !== 'OK') this.fail('pesagem', error);
      if (this.stages.inicio !== 'OK') this.fail('inicio', error);
      if (this.stages.semifinais !== 'OK') this.fail('semifinais', error);
      if (this.stages['wo-resultado'] !== 'OK') this.fail('wo-resultado', error);
      if (this.stages.final !== 'OK') this.fail('final', error);
      if (this.stages.colocacoes !== 'OK') this.fail('colocacoes', error);
      if (this.stages.premiacao !== 'OK') this.fail('premiacao', error);
      throw error;
    }
  }

  async financeAndConclude() {
    try {
      await this.asOwner();
      await this.page.goto(`/admin/eventos/${this.eventId}/financeiro`);
      const metric = (label: string) => this.page.locator('dt', { hasText: new RegExp(`^${label}$`) }).locator('xpath=following-sibling::dd');
      await expect(metric('Inscrições realizadas')).toHaveText('4');
      await expect(metric('Inscrições canceladas')).toHaveText('0');
      await expect(metric('Inscrições efetivadas')).toHaveText('4');
      await expect(metric('Receita bruta')).toHaveText('R$ 320,00');
      await expect(metric('Taxa MEU CAMP')).toHaveText('R$ 0,00');
      await expect(metric('Receita líquida')).toHaveText('R$ 320,00');
      await this.attach(EVIDENCE.financeiro);
      this.ok('financeiro');

      await this.page.goto(`/admin/eventos/${this.eventId}/resultados`);
      await this.page.getByRole('button', { name: 'Concluir evento' }).click();
      await this.page.getByText('Evento concluído').waitFor();
      const finished = await this.admin.from('events').select('status').eq('id', this.eventId).single();
      if (finished.data?.status !== 'concluido') throw new Error(`Estado final foi ${finished.data?.status}.`);
      const publicPage = await this.publicSurface();
      await publicPage.goto(`/eventos/${this.eventId}`);
      await publicPage.getByRole('heading', { name: this.eventName }).waitFor();
      await expect(publicPage.getByText('concluido', { exact: true })).toBeVisible();
      await expect(publicPage.getByRole('link', { name: 'Inscrever atletas' })).toHaveCount(0);
      await publicPage.goto(`/eventos/${this.eventId}/chaves`);
      await publicPage.getByRole('heading', { name: this.categoryName }).waitFor();
      await this.asOwner();
      await this.page.goto(`/admin/eventos/${this.eventId}/resultados`);
      await this.attach(EVIDENCE.concluido);
      this.ok('conclusao');
      await this.assertIsolationSnapshot('conclusao');
      await this.page.setViewportSize({ width: 390, height: 844 });
      await this.page.goto('/dashboard');
      await this.page.getByRole('heading', { name: /Olá,|Painel/ }).waitFor();
      await this.page.goto('/admin/eventos');
      await this.page.getByRole('heading', { name: 'Eventos', exact: true }).waitFor();
      await this.page.setViewportSize({ width: 1440, height: 1000 });
      this.ok('isolamento');
    } catch (error) {
      if (this.stages.financeiro !== 'OK') this.fail('financeiro', error);
      if (this.stages.conclusao !== 'OK') this.fail('conclusao', error);
      if (this.stages.isolamento !== 'OK') this.fail('isolamento', error);
      throw error;
    }
  }

  async attachIdentity() {
    const report = this.identityReport();
    await this.deps.testInfo.attach('homologation-identity.json', {
      body: Buffer.from(JSON.stringify(report, null, 2)),
      contentType: 'application/json',
    });
    return report;
  }

  identityReport() {
    return {
      runId: this.runId,
      eventId: this.eventId,
      eventName: this.eventName,
      usersCreated: this.userIds.length,
      teamsCreated: this.teamIds.length,
      athletesCreated: this.athleteIds.length,
      registrationIds: this.registrationIds,
      paymentIds: this.paymentIds,
      bracketId: this.bracketId,
      groupId: this.groupId,
      correctionIds: {
        approved: this.approvedCorrectionId,
        rejected: this.rejectedCorrectionId,
        pendingAtLock: this.pendingCorrectionId,
      },
      stages: this.stages,
      durationMs: Date.now() - this.startedAt,
      failedStep: this.failedStep,
      cleanupResidual: this.cleanupResidual,
    };
  }

  async cleanup() {
    try {
      await this.publicContext?.close();
    } catch {
      /* contexto público já encerrado pelo timeout */
    }
    this.publicContext = null;
    this.publicPage = null;
    if (!this.admin) {
      this.cleanupResidual = 0;
      this.ok('cleanup');
      return;
    }
    try {
      const report = await purgeHomologationRun(this.admin, {
        runId: this.runId,
        organizationId: this.organizationId,
        ownerId: this.ownerId,
        userIds: this.userIds,
        eventId: this.eventId,
        athleteIds: this.athleteIds,
        teamIds: this.teamIds,
      });
      this.cleanupResidual = report.residual;
      if (report.leftovers.length) throw new Error(`Cleanup incompleto: ${report.leftovers.join('; ')}`);
      this.ok('cleanup');
    } catch (error) {
      this.fail('cleanup', error);
      throw error;
    }
  }
}

export async function purgeHomologationRun(
  admin: AdminClient,
  input: {
    runId: string;
    organizationId: string;
    ownerId?: string;
    userIds?: string[];
    eventId?: string;
    athleteIds?: string[];
    teamIds?: string[];
  },
) {
  if (!input.runId.startsWith('MC-E2E-') || input.runId.length < 20) {
    throw new Error('Cleanup abortado: RUN_ID inválido.');
  }
  if (!input.organizationId) throw new Error('Cleanup abortado: organização ausente.');

  const unique = (ids: Array<string | undefined>) => [...new Set(ids.filter((id): id is string => Boolean(id)))];
  const leftovers: string[] = [];

  const events = await admin.from('events').select('id, nome, organization_id').eq('organization_id', input.organizationId).like('nome', `${input.runId}%`);
  if (events.error) leftovers.push(`events lookup: ${events.error.message}`);
  const eventIds = unique(
    (events.data || [])
      .filter((event) => event.nome.startsWith(input.runId) && event.organization_id === input.organizationId)
      .map((event) => event.id),
  );
  if (input.eventId && !eventIds.includes(input.eventId)) {
    const captured = await admin.from('events').select('id, nome, organization_id').eq('id', input.eventId).maybeSingle();
    if (captured.data) {
      if (!captured.data.nome.startsWith(input.runId) || captured.data.organization_id !== input.organizationId) {
        throw new Error('Cleanup abortado: evento capturado não pertence ao RUN_ID.');
      }
      eventIds.push(captured.data.id);
    }
  }

  const athletes = await admin.from('athletes').select('id, nome_completo, organization_id').eq('organization_id', input.organizationId).like('nome_completo', `${input.runId}%`);
  if (athletes.error) leftovers.push(`athletes lookup: ${athletes.error.message}`);
  const athleteIds = unique(
    (athletes.data || []).filter((athlete) => athlete.nome_completo.startsWith(input.runId)).map((athlete) => athlete.id),
  );
  for (const athleteId of input.athleteIds || []) {
    if (athleteIds.includes(athleteId)) continue;
    const captured = await admin.from('athletes').select('id, nome_completo, organization_id').eq('id', athleteId).maybeSingle();
    if (!captured.data) continue;
    if (!captured.data.nome_completo.startsWith(input.runId) || captured.data.organization_id !== input.organizationId) {
      throw new Error('Cleanup abortado: atleta capturado não pertence ao RUN_ID.');
    }
    athleteIds.push(captured.data.id);
  }

  const teams = await admin.from('teams').select('id, nome, organization_id').eq('organization_id', input.organizationId).like('nome', `${input.runId}%`);
  if (teams.error) leftovers.push(`teams lookup: ${teams.error.message}`);
  const teamIds = unique(
    (teams.data || []).filter((team) => team.nome.startsWith(input.runId)).map((team) => team.id),
  );
  for (const teamId of input.teamIds || []) {
    if (teamIds.includes(teamId)) continue;
    const captured = await admin.from('teams').select('id, nome, organization_id').eq('id', teamId).maybeSingle();
    if (!captured.data) continue;
    if (!captured.data.nome.startsWith(input.runId) || captured.data.organization_id !== input.organizationId) {
      throw new Error('Cleanup abortado: equipe capturada não pertence ao RUN_ID.');
    }
    teamIds.push(captured.data.id);
  }

  if (eventIds.length) {
    await deleteEventOperationalGraph(admin, eventIds);
    await checked('cleanup audits', admin.from('event_audit_logs').delete().in('event_id', eventIds));
    const { data: payments, error: paymentError } = await admin.from('payments').select('id').in('event_id', eventIds);
    if (paymentError) leftovers.push(`payments lookup: ${paymentError.message}`);
    const paymentIds = unique((payments || []).map((row) => row.id));
    const { data: registrations, error: registrationError } = await admin.from('registrations').select('id').in('event_id', eventIds);
    if (registrationError) leftovers.push(`registrations lookup: ${registrationError.message}`);
    const registrationIds = unique((registrations || []).map((row) => row.id));
    if (registrationIds.length) {
      await checked('cleanup corrections', admin.from('registration_correction_requests').delete().in('registration_id', registrationIds));
      await checked('cleanup category requests', admin.from('category_change_requests').delete().in('registration_id', registrationIds));
      await checked('cleanup payment links', admin.from('payment_registrations').delete().in('registration_id', registrationIds));
    }
    if (paymentIds.length) {
      await checked('cleanup attempts', admin.from('payment_attempts').delete().in('payment_id', paymentIds));
      await checked('cleanup issuance', admin.from('payment_issuance_jobs').delete().in('payment_id', paymentIds));
      await checked('cleanup payments', admin.from('payments').delete().in('id', paymentIds));
    }
    if (registrationIds.length) await checked('cleanup registrations', admin.from('registrations').delete().in('id', registrationIds));
    const { data: ruleSets } = await admin.from('category_rule_sets').select('id').in('event_id', eventIds);
    const ruleSetIds = unique((ruleSets || []).map((row) => row.id));
    if (ruleSetIds.length) {
      await checked('cleanup categories', admin.from('event_categories').delete().in('rule_set_id', ruleSetIds));
      await checked('cleanup rule sets', admin.from('category_rule_sets').delete().in('id', ruleSetIds));
    }
    await checked('cleanup phases', admin.from('event_phases').delete().in('event_id', eventIds));
    await checked('cleanup fees', admin.from('event_platform_fees').delete().in('event_id', eventIds));
    await checked('cleanup events', admin.from('events').delete().in('id', eventIds));
  }

  if (athleteIds.length) {
    await checked('cleanup managers', admin.from('athlete_managers').delete().in('athlete_id', athleteIds));
    await checked('cleanup athletes', admin.from('athletes').delete().in('id', athleteIds));
  }
  if (teamIds.length) await checked('cleanup teams', admin.from('teams').delete().in('id', teamIds));

  const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const discoveredUsers = (listed.data.users || [])
    .filter((user) => (user.email || '').includes(input.runId.toLowerCase()) && (user.email || '').includes('homolog.'))
    .map((user) => user.id);
  const userIds = unique([...(input.userIds || []), ...discoveredUsers]);
  for (const userId of userIds) {
    if (userId && userId === input.ownerId) continue;
    const removed = await admin.auth.admin.deleteUser(userId);
    if (removed.error) leftovers.push(`user:${userId}:${removed.error.message}`);
  }

  const remainingEvent = eventIds.length ? await admin.from('events').select('id').in('id', eventIds) : { data: [] };
  const remainingAthletes = athleteIds.length ? await admin.from('athletes').select('id').in('id', athleteIds) : { data: [] };
  const remainingTeams = teamIds.length ? await admin.from('teams').select('id').in('id', teamIds) : { data: [] };
  const remainingUsers: string[] = [];
  for (const userId of userIds) {
    if (userId === input.ownerId) continue;
    const { data } = await admin.auth.admin.getUserById(userId);
    if (data.user) remainingUsers.push(userId);
  }
  const residual = (remainingEvent.data || []).length + (remainingAthletes.data || []).length + (remainingTeams.data || []).length + remainingUsers.length;
  if (residual !== 0) leftovers.push(`residual=${residual}`);
  return { residual, leftovers, eventIds, athleteIds, teamIds };
}

export async function createHomologationJourney(deps: HomologationJourneyDeps) {
  return new HomologationJourney(deps);
}
