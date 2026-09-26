import { expect, type BrowserContext, type Page, type TestInfo } from '@playwright/test';
import { buildOnboardingRunId } from '../../../lib/onboarding/run-id';
import { onboardingStorageKey } from '../../../lib/onboarding/storage';
import {
  createCleanupClients,
  deleteEventOperationalGraph,
  loadCleanupEnv,
  SANDBOX_HOST,
} from './e2e-cleanup';
import { assertHomologationEnvironment, RELEASE_ORG_NAME } from './homologation-guard';

type AdminClient = Awaited<ReturnType<typeof createCleanupClients>>['admin'];

const FEE = 80;
const WEIGHT = 70;
const DURATION = 5;
const SETTLE_REASON = 'Baixa manual onboarding visual';

function dateOffset(offset: number) {
  return new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);
}

function hoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 3600_000).toISOString();
}

async function checked(label: string, result: PromiseLike<{ error: { message: string } | null }>) {
  const { error } = await result;
  if (error) throw new Error(`${label}: ${error.message}`);
}

async function fillPhase(page: Page, label: string, startOffset: number, endOffset: number) {
  const group = page.getByText(label, { exact: true }).locator('..');
  await group.getByLabel('Início').fill(`${dateOffset(startOffset)}T00:00`);
  await group.getByLabel('Término').fill(`${dateOffset(endOffset)}T23:00`);
}

async function waitEventStatus(admin: AdminClient, eventId: string, status: string) {
  await expect.poll(async () => {
    const opened = await admin.from('events').select('status').eq('id', eventId).single();
    return opened.data?.status || '';
  }, { timeout: 20000 }).toBe(status);
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

function eventRow(page: Page, name: string) {
  return page.getByRole('row').filter({ hasText: name });
}

export type OnboardingVisualJourney = Awaited<ReturnType<typeof createOnboardingVisualJourney>>;

export async function createOnboardingVisualJourney(deps: {
  page: Page;
  context: BrowserContext;
  baseURL: string;
  testInfo: TestInfo;
}) {
  loadCleanupEnv();
  const env = assertHomologationEnvironment();
  const runId = buildOnboardingRunId();
  const { admin, actor } = await createCleanupClients();
  const eventName = `${runId} — Onboarding Homologação`;
  const categoryName = `${runId} Adulto Leve`;
  const teamName = `${runId} Equipe`;
  const athleteA = `${runId} Atleta A`;
  const athleteB = `${runId} Atleta B`;
  const athleteIds: string[] = [];
  const teamIds: string[] = [];
  let eventId = '';
  let ownerId = '';
  let cleaned = false;

  async function attach(name: string) {
    await deps.testInfo.attach(name, {
      body: await deps.page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  }

  async function signInOwnerActor() {
    const email = process.env.E2E_OWNER_EMAIL || '';
    if (!email) throw new Error('E2E_OWNER_EMAIL ausente.');
    const link = await admin.auth.admin.generateLink({ type: 'magiclink', email });
    if (link.error || !link.data.properties?.hashed_token) {
      throw new Error(`Sessão owner: ${link.error?.message || 'link ausente'}`);
    }
    const verified = await actor.auth.verifyOtp({
      token_hash: link.data.properties.hashed_token,
      type: 'email',
    });
    if (verified.error || !verified.data.user || !verified.data.session) {
      throw new Error(`Sessão owner: ${verified.error?.message || 'falhou'}`);
    }
    ownerId = verified.data.user.id;
    return verified.data.session;
  }

  async function asOwner() {
    const session = await signInOwnerActor();
    await deps.context.clearCookies();
    await deps.context.addCookies([{
      name: `sb-${SANDBOX_HOST.split('.')[0]}-auth-token`,
      value: JSON.stringify(session),
      url: deps.baseURL,
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    }]);
    await deps.page.setViewportSize({ width: 1440, height: 1000 });
  }

  async function expectGuidance(title: string, cta?: string) {
    await expect(deps.page.getByRole('navigation', { name: 'Progresso do evento' })).toBeVisible();
    await expect(deps.page.locator('#next-action-title')).toHaveText(title);
    if (cta) await expect(deps.page.getByRole('link', { name: cta })).toBeVisible();
  }

  async function checklistState(label: string, state: 'feito' | 'fazer') {
    const item = deps.page.getByRole('link').filter({ hasText: label }).first();
    await expect(item.getByText(state, { exact: true })).toBeVisible();
  }

  return {
    runId,
    env,
    async protect() {
      if (new URL(env.supabaseUrl).hostname !== SANDBOX_HOST) throw new Error('Host fora do Sandbox.');
      const org = await admin.from('organizations').select('id, nome').eq('id', env.organizationId).maybeSingle();
      if (org.data?.nome !== RELEASE_ORG_NAME) {
        throw new Error(`Organização ativa não é MEU CAMP (${org.data?.nome || 'ausente'}).`);
      }
      await asOwner();
      const membership = await admin
        .from('organization_members')
        .select('role')
        .eq('user_id', ownerId)
        .eq('organization_id', env.organizationId)
        .maybeSingle();
      if (membership.data?.role !== 'owner') throw new Error('Owner da MEU CAMP não resolvido.');
      await deps.page.goto('/dashboard');
      await deps.page.getByRole('heading', { name: /Olá,|Painel do organizador/ }).waitFor();
      await deps.page.evaluate((key) => window.localStorage.removeItem(key), onboardingStorageKey(ownerId));
      await deps.page.reload();
      await expect(deps.page.getByRole('heading', { name: 'Configure seu primeiro campeonato' })).toBeVisible();
      await attach('00-dashboard-antes');
    },
    async conduct() {
      await deps.page.goto('/admin/eventos/novo');
      await deps.page.getByRole('heading', { name: 'Criar evento' }).waitFor();
      await deps.page.getByLabel('Nome do evento').fill(eventName);
      await deps.page.getByLabel('Data do evento').fill(dateOffset(30));
      await deps.page.keyboard.press('Escape');
      await deps.page.getByLabel('Local', { exact: true }).fill('Ginásio Onboarding MEU CAMP');
      await deps.page.getByLabel('Valor da inscrição (R$)').fill(String(FEE));
      await fillPhase(deps.page, 'Inscrição', -1, 5);
      await fillPhase(deps.page, 'Pagamento', 6, 10);
      await fillPhase(deps.page, 'Checagem', 11, 15);
      await fillPhase(deps.page, 'Chaves', 16, 20);
      await deps.page.getByRole('button', { name: 'Salvar rascunho' }).click();
      await deps.page.waitForURL(/\/admin\/eventos$/, { timeout: 20000 });
      const created = await admin.from('events').select('id, status, organization_id').eq('nome', eventName).single();
      if (!created.data || created.data.organization_id !== env.organizationId || created.data.status !== 'rascunho') {
        throw new Error('Evento de onboarding não persistiu como rascunho na MEU CAMP.');
      }
      eventId = created.data.id;

      await deps.page.goto(`/admin/eventos/${eventId}/configuracao`);
      await expect(deps.page.getByRole('navigation', { name: 'Progresso do evento' }).getByText(/atual/)).toBeVisible();
      await expectGuidance('Evento em rascunho', 'Revisar evento');
      await attach('01-evento-rascunho');

      await deps.page.getByLabel('Nome do conjunto').fill(`${runId} Regras`);
      await deps.page.getByLabel('Nome da categoria').fill(categoryName);
      await deps.page.getByLabel('Idade mínima').fill('10');
      await deps.page.getByLabel('Idade máxima').fill('99');
      await deps.page.getByLabel('Peso mínimo').fill('60');
      await deps.page.getByLabel('Peso máximo').fill('80');
      await deps.page.getByLabel('Duração da luta (minutos)').fill(String(DURATION));
      await deps.page.getByRole('button', { name: 'Criar versão' }).click();
      await deps.page.getByText('Versão 1 criada com sucesso.', { exact: true }).waitFor();
      await deps.page.goto(`/admin/eventos/${eventId}/configuracao`);
      await expectGuidance('Evento em rascunho', 'Revisar evento');
      await attach('02-categoria-configurada');

      await deps.page.goto('/admin/eventos');
      await eventRow(deps.page, eventName).getByRole('button', { name: 'Publicar' }).click();
      await waitEventStatus(admin, eventId, 'publicado');
      await eventRow(deps.page, eventName).getByRole('button', { name: 'Abrir inscrições' }).click();
      await waitEventStatus(admin, eventId, 'inscricao');

      await deps.page.goto('/dashboard/meus-atletas');
      if (!(await deps.page.getByLabel('Nome da equipe').count())) {
        await deps.page.getByRole('button', { name: 'Nova equipe' }).click();
      }
      await deps.page.getByLabel('Nome da equipe').fill(teamName);
      await deps.page.getByRole('button', { name: 'Cadastrar equipe' }).click();
      await deps.page.getByText('Equipe cadastrada com sucesso.').waitFor();
      const team = await admin.from('teams').select('id').eq('nome', teamName).maybeSingle();
      if (!team.data) throw new Error('Equipe de onboarding não persistiu.');
      teamIds.push(team.data.id);

      for (const name of [athleteA, athleteB]) {
        const novoAtleta = deps.page.getByRole('button', { name: /Novo atleta/i });
        if (await novoAtleta.getAttribute('aria-expanded') !== 'true') await novoAtleta.click();
        const form = deps.page.locator('#athlete-form');
        await form.waitFor();
        await form.getByLabel('Nome completo').fill(name);
        await form.getByLabel('Nascimento').fill('1992-03-20');
        await deps.page.keyboard.press('Escape');
        await form.getByLabel('Gênero').selectOption('M');
        await form.getByLabel('Equipe').selectOption({ label: teamName });
        await form.getByLabel('Vínculo').selectOption('professor');
        await form.getByLabel('Faixa').fill('Branca');
        await form.getByLabel('Peso (kg)').fill(String(WEIGHT));
        await form.getByRole('button', { name: 'Cadastrar atleta' }).click();
        await deps.page.getByText('Atleta cadastrado com sucesso.').waitFor();
      }
      const athletes = await admin.from('athletes').select('id').in('nome_completo', [athleteA, athleteB]);
      athleteIds.push(...(athletes.data || []).map((row) => row.id));
      if (athleteIds.length !== 2) throw new Error('Atletas de onboarding não persistiram.');

      for (const name of [athleteA, athleteB]) {
        await deps.page.goto(`/eventos/${eventId}/inscricao/cadastrar-atleta`);
        await deps.page.getByRole('heading', { name: 'Atletas disponíveis' }).waitFor();
        await deps.page.getByRole('checkbox', { name: `Selecionar ${name}` }).check();
        await deps.page.getByRole('textbox', { name: 'Professor operacional' }).filter({ visible: true }).first().fill('Treinador Onboarding');
        await deps.page.getByLabel(/Li e aceito os termos/).filter({ visible: true }).first().check();
        await deps.page.getByRole('button', { name: 'Confirmar inscrições' }).click();
        await expect(deps.page.getByRole('status')).toContainText('1 inscrição(ões) criada(s)');
      }

      await deps.page.goto(`/admin/eventos/${eventId}/configuracao`);
      await expectGuidance('Inscrições abertas', 'Ver eventos');
      await attach('03-inscricoes');

      await deps.page.goto('/dashboard');
      await checklistState('Receber inscrições', 'feito');
      await attach('00-dashboard-durante');

      await deps.page.goto('/admin/eventos');
      await eventRow(deps.page, eventName).getByRole('button', { name: 'Abrir pagamento' }).click();
      await waitEventStatus(admin, eventId, 'pagamento');
      await activatePhaseWindow(admin, eventId, 'pagamento', 'inscricao');

      await deps.page.goto('/dashboard/inscricoes');
      await deps.page.getByRole('heading', { name: 'Reservar pagamento' }).waitFor();
      const checkout = deps.page.locator('form').filter({ has: deps.page.locator('select#checkout-event') });
      await checkout.locator('select#checkout-event').selectOption(eventId, { timeout: 20000 });
      const boxes = checkout.getByRole('checkbox');
      await expect(boxes).toHaveCount(2);
      await boxes.nth(0).check();
      await boxes.nth(1).check();
      await checkout.getByRole('radio', { name: 'PIX', exact: true }).check();
      await expect(deps.page.getByText(/Não emite cobrança no Asaas/)).toBeVisible();
      await expect(deps.page.getByRole('button', { name: /Emitir cobrança/i })).toHaveCount(0);
      await checkout.getByRole('button', { name: 'Reservar pagamento', exact: true }).click();
      await expect(deps.page.getByRole('status').filter({ hasText: 'Reserva persistida.' })).toBeVisible();
      const payment = await admin.from('payments').select('id').eq('event_id', eventId).single();
      if (!payment.data) throw new Error('Reserva de onboarding não persistiu.');
      await deps.page.goto(`/admin/eventos/${eventId}/financeiro`);
      const form = deps.page.locator('form').filter({ has: deps.page.locator(`input[name="payment_id"][value="${payment.data.id}"]`) });
      await form.getByLabel('Justificativa da baixa manual').fill(SETTLE_REASON);
      await form.getByRole('checkbox', { name: /Confirmo que conferi/ }).check();
      await form.getByRole('button', { name: 'Confirmar baixa manual' }).click();
      await expect.poll(async () => {
        const paid = await admin.from('payments').select('status').eq('id', payment.data.id).single();
        return paid.data?.status || '';
      }, { timeout: 20000 }).toBe('pago');

      await activatePhaseWindow(admin, eventId, 'checagem', 'pagamento');
      await deps.page.goto('/admin/eventos');
      await eventRow(deps.page, eventName).getByRole('button', { name: 'Abrir checagem' }).click();
      await waitEventStatus(admin, eventId, 'checagem');

      const registration = await admin.from('registrations').select('id').eq('event_id', eventId).eq('athlete_id', athleteIds[0]).single();
      if (!registration.data) throw new Error('Inscrição A ausente.');
      await signInOwnerActor();
      const requested = await actor.rpc('request_registration_correction', {
        target_registration_id: registration.data.id,
        requested_field: 'peso',
        requested_text: '70.5',
        reason_text: `${runId} peso`,
      });
      if (requested.error) throw new Error(`Pedido de correção: ${requested.error.message}`);

      await deps.page.goto(`/admin/eventos/${eventId}/checagem`);
      await expectGuidance('Checagem aberta', 'Revisar solicitações');
      await expect(deps.page.getByText('Revise as solicitações pendentes antes de travar a checagem.')).toBeVisible();
      await expect(deps.page.getByText('Depois de travar a checagem, alterações deixam de ser permitidas.')).toBeVisible();
      await attach('04-checagem-pendente');
      await deps.page.getByRole('button', { name: 'Entendi' }).click();
      await expect(deps.page.getByRole('button', { name: 'Ver guia novamente' })).toBeVisible();

      await deps.page.getByRole('button', { name: 'Aprovar' }).click();
      await expect.poll(async () => {
        const row = await admin
          .from('registration_correction_requests')
          .select('status')
          .eq('registration_id', registration.data.id)
          .eq('requested_field', 'peso')
          .maybeSingle();
        return row.data?.status || '';
      }, { timeout: 20000 }).toBe('aprovada');
      await deps.page.goto(`/admin/eventos/${eventId}/checagem`);
      await expectGuidance('Checagem aberta', 'Ir para checagem');
      await attach('05-checagem-pronta');

      await deps.page.getByLabel(/Confirmo que a lista oficial/).check();
      await deps.page.getByRole('button', { name: 'Travar checagem' }).click();
      await deps.page.getByText('Checagem travada. A lista oficial não aceita novas alterações.').waitFor();
      await expect.poll(async () => {
        const locked = await admin.from('events').select('checagem_travada_em').eq('id', eventId).single();
        return locked.data?.checagem_travada_em || '';
      }, { timeout: 20000 }).not.toBe('');
      await deps.page.goto(`/admin/eventos/${eventId}/checagem`);
      await expectGuidance('Checagem travada', 'Abrir chaves');
      await attach('06-checagem-travada');

      await activatePhaseWindow(admin, eventId, 'chaves', 'checagem');
      await deps.page.getByRole('button', { name: 'Abrir chaves' }).click();
      await waitEventStatus(admin, eventId, 'chaves');
      await deps.page.goto(`/admin/eventos/${eventId}/chaves`);
      await expect(deps.page.getByRole('status').filter({ hasText: 'A geração cria uma sugestão em rascunho.' })).toBeVisible();
      await deps.page.getByRole('button', { name: 'Agora não' }).click();
      await expect(deps.page.getByRole('button', { name: 'Ver guia novamente' })).toBeVisible();
      await expectGuidance('Gerar chaves', 'Gerar chaves');
      await deps.page.getByRole('button', { name: new RegExp(categoryName) }).click();
      await deps.page.getByRole('button', { name: 'Gerar chave' }).click();
      await deps.page.getByText('Chave gerada em rascunho.').waitFor();
      await attach('07-chave-draft');
      deps.page.once('dialog', (dialog) => dialog.accept());
      await deps.page.getByRole('button', { name: 'Publicar' }).click();
      await deps.page.getByText('Chave publicada. Ela agora está somente para leitura.').waitFor();
      await deps.page.goto(`/admin/eventos/${eventId}/chaves`);
      await expectGuidance('Programar lutas', 'Abrir programação');
      await attach('08-chave-publicada');

      await deps.page.goto(`/admin/eventos/${eventId}/programacao`);
      await expect(deps.page.getByRole('status').filter({ hasText: 'Áreas e números só congelam' })).toBeVisible();
      await deps.page.getByLabel('Número').first().fill('1');
      await deps.page.getByLabel('Nome ou cor').first().fill('Tatame');
      await deps.page.getByRole('button', { name: 'Adicionar área' }).click();
      await deps.page.getByText('Área criada.').waitFor();
      await deps.page.getByText(`${categoryName} — Subchave A`, { exact: true }).locator('xpath=../..').getByLabel('Área da subchave A').selectOption({ label: 'Área 1 — Tatame' });
      await deps.page.getByText('Subchave e todas as suas lutas foram atribuídas.').waitFor();
      await deps.page.getByRole('button', { name: 'Publicar programação' }).click();
      await deps.page.getByText('Programação publicada. Áreas e números estão congelados.').waitFor();
      await deps.page.goto(`/admin/eventos/${eventId}/programacao`);
      await expectGuidance('Iniciar operação', 'Abrir resultados');
      await attach('09-programacao');

      await deps.page.goto(`/admin/eventos/${eventId}/resultados`);
      await expect(deps.page.getByRole('status').filter({ hasText: 'A pesagem é por subchave.' })).toBeVisible();
      await deps.page.getByRole('button', { name: new RegExp(categoryName) }).click();
      await deps.page.getByRole('button', { name: 'Marcar pesagem como realizada' }).click();
      await deps.page.getByText('Pesagem marcada como realizada.').waitFor();
      await deps.page.getByRole('button', { name: 'Iniciar operação' }).click();
      await deps.page.getByText('Operação iniciada. O evento está em andamento.').waitFor();
      await waitEventStatus(admin, eventId, 'em_andamento');
      await deps.page.goto(`/admin/eventos/${eventId}/resultados`);
      await expectGuidance('Evento em andamento', 'Registrar resultados');
      await attach('10-evento-em-andamento');

      const winnerSelect = deps.page.getByLabel('Vencedor').first();
      await expect(winnerSelect).toBeEnabled();
      await winnerSelect.selectOption({ index: 1 });
      await deps.page.getByRole('button', { name: 'Registrar vitória' }).first().click();
      await deps.page.getByText(/Resultado registrado|Grupo concluído/).waitFor();
      await attach('11-resultados');

      await deps.page.goto(`/admin/eventos/${eventId}/financeiro`);
      await expect(deps.page.getByRole('status').filter({ hasText: 'A baixa é manual e auditada.' })).toBeVisible();
      await expect(deps.page.getByText(/PIX automático|boleto gerado|Asaas/i)).toHaveCount(0);
      await attach('12-financeiro');

      await deps.page.goto(`/admin/eventos/${eventId}/resultados`);
      await deps.page.getByRole('button', { name: 'Concluir evento' }).click();
      await waitEventStatus(admin, eventId, 'concluido');
      await deps.page.goto(`/admin/eventos/${eventId}/resultados`);
      await expect(deps.page.getByText('A operação esportiva permanece somente leitura. O relatório financeiro não faz parte deste encerramento.')).toBeVisible();
      await expectGuidance('Evento concluído', 'Ver financeiro');
      await attach('13-evento-concluido');

      await deps.page.goto('/dashboard');
      await checklistState('Resultados', 'feito');
      await attach('00-dashboard-depois');

      await deps.page.setViewportSize({ width: 390, height: 844 });
      await deps.page.goto('/dashboard');
      await expect(deps.page.getByRole('heading', { name: 'Configure seu primeiro campeonato' })).toBeVisible();
      await deps.page.goto(`/admin/eventos/${eventId}/configuracao`);
      await expect(deps.page.getByRole('navigation', { name: 'Progresso do evento' })).toBeVisible();
      await attach('14-mobile-timeline');
      await deps.page.goto(`/admin/eventos/${eventId}/checagem`);
      await expect(deps.page.locator('#next-action-title')).toBeVisible();
      await attach('15-mobile-checagem');
      await deps.page.setViewportSize({ width: 1440, height: 1000 });
    },
    async cleanup() {
      if (cleaned) return;
      cleaned = true;
      await purgeOnboardingRun(admin, {
        runId,
        organizationId: env.organizationId,
        eventId,
        athleteIds,
        teamIds,
      });
    },
  };
}

export async function purgeOnboardingRun(
  admin: AdminClient,
  input: { runId: string; organizationId: string; eventId?: string; athleteIds: string[]; teamIds: string[] },
) {
  if (!input.runId.startsWith('MC-ONBOARDING-') || input.runId.length < 20) {
    throw new Error('Cleanup recusou RUN_ID fora do prefixo.');
  }
  const unique = (ids: Array<string | undefined>) => [...new Set(ids.filter((id): id is string => Boolean(id)))];

  const events = await admin.from('events').select('id, nome, organization_id').eq('organization_id', input.organizationId).like('nome', `${input.runId}%`);
  const eventIds = unique(
    (events.data || [])
      .filter((event) => event.nome.startsWith(input.runId) && event.organization_id === input.organizationId)
      .map((event) => event.id),
  );
  if (input.eventId && !eventIds.includes(input.eventId)) {
    const captured = await admin.from('events').select('id, nome, organization_id').eq('id', input.eventId).maybeSingle();
    if (captured.data) {
      if (!captured.data.nome.startsWith(input.runId) || captured.data.organization_id !== input.organizationId) {
        throw new Error('Cleanup recusou evento protegido.');
      }
      eventIds.push(captured.data.id);
    }
  }

  const athletes = await admin.from('athletes').select('id, nome_completo, organization_id').eq('organization_id', input.organizationId).like('nome_completo', `${input.runId}%`);
  const athleteIds = unique(
    (athletes.data || []).filter((athlete) => athlete.nome_completo.startsWith(input.runId)).map((athlete) => athlete.id),
  );
  for (const athleteId of input.athleteIds) {
    if (athleteIds.includes(athleteId)) continue;
    const captured = await admin.from('athletes').select('id, nome_completo, organization_id').eq('id', athleteId).maybeSingle();
    if (!captured.data) continue;
    if (!captured.data.nome_completo.startsWith(input.runId) || captured.data.organization_id !== input.organizationId) {
      throw new Error('Cleanup recusou atleta protegido.');
    }
    athleteIds.push(captured.data.id);
  }

  const teams = await admin.from('teams').select('id, nome, organization_id').eq('organization_id', input.organizationId).like('nome', `${input.runId}%`);
  const teamIds = unique(
    (teams.data || []).filter((team) => team.nome.startsWith(input.runId)).map((team) => team.id),
  );
  for (const teamId of input.teamIds) {
    if (teamIds.includes(teamId)) continue;
    const captured = await admin.from('teams').select('id, nome, organization_id').eq('id', teamId).maybeSingle();
    if (!captured.data) continue;
    if (!captured.data.nome.startsWith(input.runId) || captured.data.organization_id !== input.organizationId) {
      throw new Error('Cleanup recusou equipe protegida.');
    }
    teamIds.push(captured.data.id);
  }

  if (eventIds.length) {
    await deleteEventOperationalGraph(admin, eventIds);
    await checked('cleanup audits', admin.from('event_audit_logs').delete().in('event_id', eventIds));
    const registrations = await admin.from('registrations').select('id').in('event_id', eventIds);
    const registrationIds = unique((registrations.data || []).map((row) => row.id));
    if (registrationIds.length) {
      await checked('cleanup corrections', admin.from('registration_correction_requests').delete().in('registration_id', registrationIds));
      await checked('cleanup category requests', admin.from('category_change_requests').delete().in('registration_id', registrationIds));
      await checked('cleanup payment links', admin.from('payment_registrations').delete().in('registration_id', registrationIds));
    }
    const payments = await admin.from('payments').select('id').in('event_id', eventIds);
    const paymentIds = unique((payments.data || []).map((row) => row.id));
    if (paymentIds.length) {
      await checked('cleanup attempts', admin.from('payment_attempts').delete().in('payment_id', paymentIds));
      await checked('cleanup issuance', admin.from('payment_issuance_jobs').delete().in('payment_id', paymentIds));
      await checked('cleanup payments', admin.from('payments').delete().in('id', paymentIds));
    }
    if (registrationIds.length) await checked('cleanup registrations', admin.from('registrations').delete().in('id', registrationIds));
    const rules = await admin.from('category_rule_sets').select('id').in('event_id', eventIds);
    const ruleIds = unique((rules.data || []).map((row) => row.id));
    if (ruleIds.length) {
      await checked('cleanup categories', admin.from('event_categories').delete().in('rule_set_id', ruleIds));
      await checked('cleanup rule sets', admin.from('category_rule_sets').delete().in('id', ruleIds));
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

  const leftover = await admin.from('events').select('id').eq('organization_id', input.organizationId).like('nome', `${input.runId}%`);
  if ((leftover.data || []).length) throw new Error('Evento de onboarding permaneceu após o cleanup.');
}
