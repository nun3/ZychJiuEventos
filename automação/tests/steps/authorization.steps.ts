import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test } from '../support/fixtures';

const { Given, When, Then } = createBdd(test);

function credentials(prefix: 'OWNER' | 'UNAUTHORIZED') {
  const account = {
    email: process.env[`E2E_${prefix}_EMAIL`],
    password: process.env[`E2E_${prefix}_PASSWORD`],
  };

  if (
    prefix === 'UNAUTHORIZED' &&
    account.email?.toLowerCase() === process.env.E2E_OWNER_EMAIL?.toLowerCase()
  ) {
    throw new Error(
      'Configuração E2E inválida: E2E_UNAUTHORIZED_EMAIL deve pertencer a uma conta diferente do E2E_OWNER_EMAIL e sem vínculo com organização.',
    );
  }

  return account;
}

async function authenticate(
  loginPage: { open: (redirectTo?: string) => Promise<void>; login: (email: string, password: string) => Promise<void> },
  page: import('@playwright/test').Page,
  prefix: 'OWNER' | 'UNAUTHORIZED',
) {
  const account = credentials(prefix);
  test.skip(!account.email || !account.password, `Defina E2E_${prefix}_EMAIL e E2E_${prefix}_PASSWORD em .env.e2e`);
  await loginPage.open('/dashboard');
  await loginPage.login(account.email!, account.password!);
  await expect(page).toHaveURL(/\/dashboard(?:\?|$)/);
}

Given('que o visitante não possui sessão', async ({ page }) => {
  await page.context().clearCookies();
});

When('acessa diretamente a rota de Meus Atletas', async ({ page }) => {
  await page.goto('/dashboard/meus-atletas');
});

Then('deve ser direcionado ao login preservando o destino', async ({ page }) => {
  await expect(page).toHaveURL(/\/login\?redirectTo=%2Fdashboard%2Fmeus-atletas$/);
});

When('acessa diretamente a área administrativa', async ({ page }) => {
  await page.goto('/admin/eventos');
});

Then('deve ser direcionado ao login administrativo preservando o destino', async ({ page }) => {
  await expect(page).toHaveURL(/\/admin\/autenticacao\?redirectTo=%2Fadmin%2Feventos$/);
});

Given('que o owner está autenticado', async ({ loginPage, page }) => {
  await authenticate(loginPage, page, 'OWNER');
});

Given('que o usuário sem vínculo está autenticado', async ({ loginPage, page }) => {
  await authenticate(loginPage, page, 'UNAUTHORIZED');
});

Then('a página Meus Eventos deve ser exibida', async ({ page }) => {
  await expect(page).toHaveURL(/\/admin\/eventos$/);
  await expect(page.getByRole('heading', { name: 'Meus Eventos' })).toBeVisible();
});

Then('a organização e o papel owner devem ser apresentados', async ({ page }) => {
  await expect(page.getByText(/Organização:.*Papel:.*owner/i)).toBeVisible();
});

Then('deve retornar ao dashboard com negação de permissão', async ({ page }) => {
  await expect(page).toHaveURL(/\/dashboard\?erro=sem_permissao$/);
});

When('encerra a sessão pelo menu da conta', async ({ page }) => {
  await page.getByRole('button', { name: 'Minha Conta' }).click();
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
});

Then('a tela de login deve ser exibida', async ({ loginPage }) => {
  await loginPage.expectVisible();
});

Then('a rota protegida deve voltar a exigir autenticação', async ({ page }) => {
  await page.goto('/dashboard/meus-atletas');
  await expect(page).toHaveURL(/\/login\?redirectTo=/);
});
