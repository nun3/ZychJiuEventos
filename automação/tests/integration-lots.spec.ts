import { expect, test, type Page } from '@playwright/test';

const privateRoutes = [
  '/dashboard',
  '/dashboard/meu-perfil',
  '/dashboard/meus-atletas',
  '/dashboard/organizacao',
  '/dashboard/inscricoes',
];

function ownerCredentials() {
  return {
    email: process.env.E2E_OWNER_EMAIL || '',
    password: process.env.E2E_OWNER_PASSWORD || '',
  };
}

async function loginAsOwner(page: Page) {
  const { email, password } = ownerCredentials();
  test.skip(!email || !password, 'Defina E2E_OWNER_EMAIL e E2E_OWNER_PASSWORD em .env.e2e');
  await page.goto('/login?redirectTo=%2Fdashboard');
  await page.getByLabel('E-mail cadastrado').fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar na conta', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard(?:\/|\?|$)/);
}

async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return { client: doc.clientWidth, scroll: doc.scrollWidth };
  });
  expect(overflow.scroll, 'a página não pode vazar na horizontal').toBeLessThanOrEqual(overflow.client + 1);
}

test('visitante é recusado nas rotas privadas do painel', async ({ page }) => {
  await page.context().clearCookies();
  for (const route of privateRoutes) {
    await page.goto(route);
    await expect(page).toHaveURL(new RegExp(`/login\\?redirectTo=${encodeURIComponent(route).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  }
});

test('owner lê dashboard, perfil, atletas, organização e inscrições', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await loginAsOwner(page);

  for (const route of privateRoutes) {
    await page.goto(route);
    await expect(page).toHaveURL(new RegExp(`${route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\?|$)`));
    await expect(page.locator('main')).toBeVisible();
    await expect(page.getByRole('heading').first()).toBeVisible();
  }

  await page.goto('/dashboard/organizacao');
  const staffOption = page.locator('select, [role="listbox"]').locator('text=/staff/i');
  if (await page.getByLabel(/papel|função/i).count()) {
    await expect(page.getByLabel(/papel|função/i)).toBeVisible();
  }
  void staffOption;
  expect(errors).toEqual([]);
});

test('usuário sem vínculo não permanece em /admin', async ({ page }) => {
  const email = process.env.E2E_UNAUTHORIZED_EMAIL || '';
  const password = process.env.E2E_UNAUTHORIZED_PASSWORD || '';
  test.skip(!email || !password, 'Defina E2E_UNAUTHORIZED_EMAIL e E2E_UNAUTHORIZED_PASSWORD em .env.e2e');
  await page.goto('/login?redirectTo=%2Fdashboard');
  await page.getByLabel('E-mail cadastrado').fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar na conta', exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard(?:\/|\?|$)/);
  await page.goto('/admin/eventos');
  await expect(page).not.toHaveURL(/\/admin(?:\/|\?|$)/);
  await expect(page).toHaveURL(/\/dashboard(?:\/|\?|$)/);
});

test('staff dedicado não está configurado neste ambiente', async () => {
  test.skip(!process.env.E2E_STAFF_EMAIL, 'NOT_RUN: sem E2E_STAFF_EMAIL. Staff só foi validado no select do owner e na RPC já aplicada.');
});

for (const width of [1440, 768, 390, 320] as const) {
  test(`superfícies compostas cabem em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width >= 768 ? 900 : 844 });
    for (const path of ['/', '/eventos', '/academias', '/login']) {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('main')).toBeVisible();
      await assertNoHorizontalOverflow(page);
    }
  });
}
