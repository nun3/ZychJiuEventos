import { expect, type BrowserContext, type Page, type TestInfo } from '@playwright/test';
import { buildOrganizationRunId } from '../../../lib/organizations/membership';
import { applyAuthSession, createCleanupClients, loadCleanupEnv, SANDBOX_HOST } from './e2e-cleanup';
import { assertHomologationEnvironment } from './homologation-guard';

type AdminClient = Awaited<ReturnType<typeof createCleanupClients>>['admin'];
type ActorClient = Awaited<ReturnType<typeof createCleanupClients>>['actor'];

const PASSWORD = 'OrgMembers#E2E-25';
const ADULT_BIRTH = '1990-01-15';
const PROTECTED_ORG_NAMES = ['MEU CAMP', 'Organização Teste Ricardo'];

export async function createOrganizationMembersJourney(deps: {
  page: Page;
  context: BrowserContext;
  baseURL: string;
  testInfo: TestInfo;
}) {
  loadCleanupEnv();
  const env = assertHomologationEnvironment();
  const runId = buildOrganizationRunId();
  const { admin, actor } = await createCleanupClients();
  const users: Record<string, { id: string; email: string; name: string }> = {};
  const orgIds: string[] = [];
  let orgName = `${runId} Homolog`;
  let orgBName = `${runId} Cross`;
  const report: Record<string, 'OK' | 'FALHA'> = {};

  async function attach(name: string) {
    await deps.testInfo.attach(name, {
      body: await deps.page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  }

  async function createUser(key: string, role: 'organizador' | 'atleta', label: string) {
    const email = `${runId}-${key}@example.invalid`.toLowerCase();
    const name = `${runId} ${label}`;
    const created = await admin.auth.admin.createUser({
      email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { nome_completo: name, tipo_cadastro: role, data_nascimento: ADULT_BIRTH },
    });
    if (created.error || !created.data.user) throw new Error(`Criação ${key}: ${created.error?.message || 'sem usuário'}`);
    const profile = await admin.from('profiles').select('id').eq('id', created.data.user.id).maybeSingle();
    if (!profile.data) {
      const inserted = await admin.from('profiles').insert({
        id: created.data.user.id,
        nome_completo: name,
        data_nascimento: ADULT_BIRTH,
      });
      if (inserted.error) throw new Error(`Perfil ${key}: ${inserted.error.message}`);
    }
    users[key] = { id: created.data.user.id, email, name };
    return users[key];
  }

  async function signIn(key: string) {
    await applyAuthSession(deps.context, deps.baseURL, users[key].email, PASSWORD);
  }

  async function asUser(key: string): Promise<ActorClient> {
    const session = await actor.auth.signInWithPassword({ email: users[key].email, password: PASSWORD });
    if (session.error || !session.data.user) throw new Error(`Sessão ${key}: ${session.error?.message || 'falhou'}`);
    return actor;
  }

  async function mark(step: string, run: () => Promise<void>) {
    try {
      await run();
      report[step] = 'OK';
    } catch (error) {
      report[step] = 'FALHA';
      throw error;
    }
  }

  function listedText(value: string) {
    return deps.page.getByText(value, { exact: true }).filter({ visible: true });
  }

  return {
    runId,
    report,
    env,
    async protect() {
      await mark('Platform admin', async () => {
        if (new URL(env.supabaseUrl).hostname !== SANDBOX_HOST) throw new Error('Host fora do Sandbox.');
        await createUser('admin', 'organizador', 'Admin');
        await createUser('owner', 'organizador', 'Owner');
        await createUser('organizer', 'organizador', 'Organizer');
        await createUser('finance', 'organizador', 'Finance');
        await createUser('ownerB', 'organizador', 'Owner B');
        const granted = await admin.from('platform_user_roles').insert({ user_id: users.admin.id, role: 'admin' });
        if (granted.error) throw new Error(`platform role: ${granted.error.message}`);
        await signIn('admin');
        await deps.page.goto('/platform/organizacoes');
        await expect(deps.page.getByRole('heading', { name: 'Organizações', exact: true })).toBeVisible();
        await attach('01-platform-admin');
      });
    },
    async createOrganization() {
      await mark('Criar organização', async () => {
        await deps.page.goto('/platform/organizacoes');
        await deps.page.getByLabel('Nome da organização').fill(orgName);
        await deps.page.getByLabel('E-mail do proprietário').fill(users.owner.email);
        await deps.page.getByRole('button', { name: 'Criar organização' }).click();
        await expect(deps.page.getByRole('heading', { name: orgName })).toBeVisible({ timeout: 20000 });
        const created = await admin.from('organizations').select('id, nome').eq('nome', orgName).maybeSingle();
        if (!created.data) throw new Error('Organização de homologação não persistiu.');
        orgIds.push(created.data.id);
        await attach('02-organizacao-criada');
      });
    },
    async assertOwner() {
      await mark('Owner inicial', async () => {
        const membership = await admin
          .from('organization_members')
          .select('user_id, role')
          .eq('organization_id', orgIds[0])
          .eq('user_id', users.owner.id)
          .maybeSingle();
        if (membership.data?.role !== 'owner') throw new Error('Owner inicial não associado.');
        await expect(listedText(users.owner.email)).toBeVisible();
        await expect(listedText('Proprietário')).toBeVisible();
        await attach('03-owner-inicial');
      });
    },
    async ownerAddsMembers() {
      await signIn('owner');
      await deps.page.goto('/dashboard/organizacao');
      await expect(deps.page.getByRole('heading', { name: 'Organização' })).toBeVisible();
      await attach('04-listar-membros');

      await mark('Adicionar organizer', async () => {
        await deps.page.getByLabel('E-mail do usuário').fill(users.organizer.email);
        await deps.page.getByLabel('Papel').selectOption('organizer');
        await deps.page.getByRole('button', { name: 'Adicionar membro' }).click();
        await expect(deps.page.getByText('Organizador adicionado.')).toBeVisible();
        await expect(listedText(users.organizer.email)).toBeVisible();
        await attach('05-organizer');
      });

      await mark('Adicionar finance', async () => {
        await deps.page.getByLabel('E-mail do usuário').fill(users.finance.email);
        await deps.page.getByLabel('Papel').selectOption('finance');
        await deps.page.getByRole('button', { name: 'Adicionar membro' }).click();
        await expect(deps.page.getByText('Membro financeiro adicionado.')).toBeVisible();
        await expect(listedText(users.finance.email)).toBeVisible();
        await attach('06-finance');
      });
    },
    async ownerGuards() {
      await mark('Duplicidade', async () => {
        await deps.page.getByLabel('E-mail do usuário').fill(users.organizer.email);
        await deps.page.getByLabel('Papel').selectOption('organizer');
        await deps.page.getByRole('button', { name: 'Adicionar membro' }).click();
        await expect(deps.page.getByText('Este usuário já é membro desta organização.')).toBeVisible();
      });

      await mark('Proteger owner', async () => {
        await expect(deps.page.getByText('Protegido').first()).toBeVisible();
        const ownerClient = await asUser('owner');
        const { error } = await ownerClient.rpc('remove_organization_member', {
          target_organization_id: orgIds[0],
          member_user_id: users.owner.id,
        });
        if (!error) throw new Error('Owner conseguiu remover a si mesmo.');
        await attach('07-duplicidade-owner');
      });
    },
    async forbiddenRoles() {
      await mark('Organizer sem permissão', async () => {
        await signIn('organizer');
        await deps.page.goto('/dashboard/organizacao');
        await expect(deps.page.getByText('Acesso administrativo negado')).toBeVisible();
        const organizerClient = await asUser('organizer');
        const { error } = await organizerClient.rpc('add_organization_member', {
          target_organization_id: orgIds[0],
          member_email: `${runId}-ghost@example.invalid`,
          member_role: 'finance',
        });
        if (!error) throw new Error('Organizer adicionou membro.');
      });

      await mark('Finance sem permissão', async () => {
        await signIn('finance');
        await deps.page.goto('/dashboard/organizacao');
        await expect(deps.page.getByText('Acesso administrativo negado')).toBeVisible();
        const financeClient = await asUser('finance');
        const { error } = await financeClient.rpc('remove_organization_member', {
          target_organization_id: orgIds[0],
          member_user_id: users.organizer.id,
        });
        if (!error) throw new Error('Finance removeu membro.');
        await attach('08-sem-permissao');
      });
    },
    async crossTenant() {
      await mark('Cross-tenant', async () => {
        const adminClient = await asUser('admin');
        const { data: orgB, error } = await adminClient.rpc('create_organization_with_owner', {
          organization_name: orgBName,
          owner_email: users.ownerB.email,
        });
        if (error || !orgB) throw new Error(`Org B: ${error?.message || 'não criada'}`);
        orgIds.push(orgB);
        const ownerClient = await asUser('owner');
        const add = await ownerClient.rpc('add_organization_member', {
          target_organization_id: orgB,
          member_email: users.organizer.email,
          member_role: 'organizer',
        });
        if (!add.error) throw new Error('Owner A adicionou membro na org B.');
        const list = await ownerClient.rpc('list_organization_members', { target_organization_id: orgB });
        if (!list.error) throw new Error('Owner A listou a org B.');
      });
    },
    async removeOrganizer() {
      await mark('Remover membro', async () => {
        await signIn('owner');
        await deps.page.goto('/dashboard/organizacao');
        await deps.page.getByRole('button', { name: `Remover ${users.organizer.name}` }).first().click();
        await expect(deps.page.getByText(users.organizer.email)).toHaveCount(0);
        const leftover = await admin
          .from('organization_members')
          .select('user_id')
          .eq('organization_id', orgIds[0])
          .eq('user_id', users.organizer.id)
          .maybeSingle();
        if (leftover.data) throw new Error('Organizer permaneceu membro.');
        const authUser = await admin.auth.admin.getUserById(users.organizer.id);
        if (!authUser.data.user) throw new Error('Remoção apagou o Auth user.');
        await attach('09-remover-membro');
      });
    },
    async mobile() {
      await mark('Mobile', async () => {
        await deps.page.setViewportSize({ width: 390, height: 844 });
        await deps.page.goto('/dashboard/organizacao');
        await expect(deps.page.getByRole('heading', { name: 'Organização' })).toBeVisible();
        await expect(deps.page.getByLabel('E-mail do usuário')).toBeVisible();
        await expect(listedText(users.finance.email)).toBeVisible();
        await attach('10-mobile-organizacao');
        await deps.page.setViewportSize({ width: 1280, height: 720 });
      });
    },
    async cleanup() {
      await mark('Cleanup', async () => {
        await purgeOrganizationRun(admin, runId, orgIds, Object.values(users).map((user) => user.id));
        const leftoverOrgs = await admin.from('organizations').select('id, nome').like('nome', `${runId}%`);
        if ((leftoverOrgs.data || []).length) throw new Error('Organizações de homologação permaneceram.');
        const leftoverUsers = await admin.from('profiles').select('id').in('id', Object.values(users).map((user) => user.id));
        if ((leftoverUsers.data || []).length) throw new Error('Usuários descartáveis permaneceram.');
      });
    },
  };
}

export async function purgeOrganizationRun(
  admin: AdminClient,
  runId: string,
  orgIds: string[],
  userIds: string[],
) {
  if (!runId.startsWith('MC-ORG-E2E-')) throw new Error('Cleanup recusou RUN_ID fora do prefixo.');
  const { data: orgs } = await admin.from('organizations').select('id, nome').in('id', orgIds.length ? orgIds : ['00000000-0000-0000-0000-000000000000']);
  const discovered = await admin.from('organizations').select('id, nome').like('nome', `${runId}%`);
  const targets = [...(orgs || []), ...(discovered.data || [])];
  for (const org of targets) {
    if (PROTECTED_ORG_NAMES.includes(org.nome) || !org.nome.startsWith(runId)) {
      throw new Error(`Cleanup recusou organização protegida: ${org.nome}`);
    }
  }
  const safeIds = [...new Set(targets.map((org) => org.id))];
  if (safeIds.length) {
    await admin.from('organization_members').delete().in('organization_id', safeIds);
    await admin.from('organizations').delete().in('id', safeIds);
  }
  if (userIds.length) {
    await admin.from('platform_user_roles').delete().in('user_id', userIds);
    for (const userId of userIds) {
      await admin.auth.admin.deleteUser(userId);
    }
  }
}
