import { expect, test, type Page } from '@playwright/test';

function ownerCredentials() {
  return {
    email: process.env.E2E_OWNER_EMAIL || '',
    password: process.env.E2E_OWNER_PASSWORD || '',
  };
}

async function submitLogin(page: Page, email: string, password: string) {
  await page.getByLabel('E-mail cadastrado').fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar na conta', exact: true }).click();
}

async function loginAsOwner(page: Page, redirectTo = '/dashboard') {
  const { email, password } = ownerCredentials();
  test.skip(!email || !password, 'Defina E2E_OWNER_EMAIL e E2E_OWNER_PASSWORD em .env.e2e');
  await page.goto(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  await submitLogin(page, email, password);
  await expect(page).toHaveURL(new RegExp(`${redirectTo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\?|$)`));
}

async function openAccountMenu(page: Page) {
  const width = page.viewportSize()?.width ?? 1440;
  if (width < 768) {
    await page.getByRole('button', { name: 'Abrir menu' }).click();
    await page.getByRole('button', { name: 'Minha conta', exact: true }).click();
    return;
  }
  await page.getByRole('button', { name: /Abrir menu de / }).click();
}

test.describe('experiência de autenticação', () => {
  test('rejeita credenciais inválidas e reabilita o envio', async ({ page }) => {
    await page.goto('/login');
    await submitLogin(page, 'qa-invalido@example.com', 'senha-incorreta');
    await expect(page.getByText('E-mail ou senha inválidos.', { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/\/login(?:\?|$)/);
    await expect(page.getByRole('button', { name: 'Entrar na conta', exact: true })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Entrando...' })).toHaveCount(0);
  });

  test('login válido redireciona para o destino interno seguro', async ({ page }) => {
    await loginAsOwner(page, '/dashboard');
  });

  test('bloqueia redirectTo externo após login válido', async ({ page }) => {
    const { email, password } = ownerCredentials();
    test.skip(!email || !password, 'Defina E2E_OWNER_EMAIL e E2E_OWNER_PASSWORD em .env.e2e');
    await page.goto('/login?redirectTo=https://evil.example/phish');
    await submitLogin(page, email, password);
    await expect(page).toHaveURL(/\/dashboard(?:\?|$)/);
    expect(page.url()).not.toContain('evil.example');
  });

  test('persiste a sessão depois de recarregar o painel', async ({ page }) => {
    await loginAsOwner(page, '/dashboard');
    await page.reload();
    await expect(page).toHaveURL(/\/dashboard(?:\?|$)/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('visitante é enviado ao login ao acessar rota protegida', async ({ page }) => {
    await page.context().clearCookies();
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fdashboard$/);
  });

  test('sessão autenticada em /admin/autenticacao é redirecionada pelo middleware', async ({ page }) => {
    await loginAsOwner(page, '/dashboard');
    await page.goto('/admin/autenticacao?redirectTo=%2Fadmin%2Feventos');
    await expect(page).toHaveURL(/\/admin\/eventos(?:\?|$)/);
  });

  test('usuário sem vínculo administrativo é recusado em /admin', async ({ page }) => {
    const email = process.env.E2E_UNAUTHORIZED_EMAIL || '';
    const password = process.env.E2E_UNAUTHORIZED_PASSWORD || '';
    test.skip(!email || !password, 'Defina E2E_UNAUTHORIZED_EMAIL e E2E_UNAUTHORIZED_PASSWORD em .env.e2e');
    await page.goto('/login?redirectTo=%2Fdashboard');
    await submitLogin(page, email, password);
    await expect(page).toHaveURL(/\/dashboard(?:\/|\?|$)/);
    await page.goto('/admin/eventos');
    await expect(page).not.toHaveURL(/\/admin(?:\/|\?|$)/);
    await expect(page).toHaveURL(/\/dashboard(?:\/|\?|$)/);
    await page.goto('/admin/autenticacao');
    await expect(page).not.toHaveURL(/\/admin\/autenticacao/);
    await expect(page).toHaveURL(/\/dashboard(?:\/|\?|$)/);
  });

  test('logout encerra a sessão e volta a proteger o painel', async ({ page }) => {
    await loginAsOwner(page, '/dashboard');
    await openAccountMenu(page);
    await page.getByRole('button', { name: 'Sair da conta' }).click();
    await expect(page).toHaveURL(/\/login(?:\?|$)/);
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login\?redirectTo=/);
  });

  test('link de recuperação expirado orienta a solicitar outro', async ({ page }) => {
    await page.goto('/auth/callback?error=access_denied&error_code=otp_expired&redirectTo=%2Fatualizar-senha');
    await expect(page).toHaveURL(/\/recuperar-senha\?erro=link_expirado$/);
    await expect(page.getByText(/Esse link expirou ou já foi utilizado/i)).toBeVisible();
  });

  test('formulário de login é percorrível por teclado', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/login');
    await page.locator('body').press('Tab');
    const email = page.getByLabel('E-mail cadastrado');
    await email.focus();
    await expect(email).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Senha', { exact: true })).toBeFocused();
  });
});

for (const width of [320, 390, 1440] as const) {
  test(`login permanece utilizável em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Entre na sua conta' })).toBeVisible();
    await expect(page.getByLabel('E-mail cadastrado')).toBeVisible();
    await expect(page.getByLabel('Senha', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar na conta', exact: true })).toBeVisible();
  });
}
