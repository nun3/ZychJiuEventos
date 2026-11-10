import { expect, test, type Page } from '@playwright/test';

// Fluxos do gerador de evento no formulário "Novo evento". Exige o dono de teste (E2E_OWNER_*); sem credenciais, os testes
// ficam NOT_RUN. O comportamento do componente também é exercitado por rota de QA local (ver CURRENT-HANDOFF).

async function openNewEvent(page: Page) {
  const email = process.env.E2E_OWNER_EMAIL || '';
  const password = process.env.E2E_OWNER_PASSWORD || '';
  test.skip(!email || !password, 'Defina E2E_OWNER_EMAIL e E2E_OWNER_PASSWORD em .env.e2e');
  await page.goto('/login?redirectTo=%2Fadmin%2Feventos%2Fnovo');
  await page.getByLabel('E-mail cadastrado').fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar na conta', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/eventos\/novo/);
}

const value = (page: Page, name: string) => page.locator(`input[name="${name}"]`).inputValue();

test.describe('gerador de evento', () => {
  test('gera data (sábado) e as quatro fases sem gravar nada', async ({ page }) => {
    await openNewEvent(page);
    const writes: string[] = [];
    page.on('request', (request) => { if (request.method() === 'POST') writes.push(request.url()); });

    await page.getByLabel('Mês').selectOption({ index: 11 });
    await page.getByRole('button', { name: /Equilibrado/ }).click();
    await page.getByRole('button', { name: /Tarde/ }).click();
    await page.getByRole('button', { name: 'Gerar sugestão' }).click();

    const date = await value(page, 'data_evento');
    expect(new Date(`${date}T12:00:00Z`).getUTCDay()).toBe(6);
    for (const key of ['inscricao', 'pagamento', 'checagem', 'chaves']) {
      expect(await value(page, `${key}_inicio`)).toBeTruthy();
      expect(await value(page, `${key}_fim`)).toBeTruthy();
    }
    await expect(page.getByLabel('Resumo do cronograma')).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/eventos\/novo/);
    expect(writes).toEqual([]);
  });

  test('"gerar outra sugestão" muda o cronograma e edição manual pede consentimento', async ({ page }) => {
    await openNewEvent(page);
    await page.getByLabel('Mês').selectOption({ index: 11 });
    await page.getByRole('button', { name: 'Gerar sugestão' }).click();
    const first = await value(page, 'data_evento');
    await page.getByRole('button', { name: 'Gerar outra sugestão' }).click();
    expect(await value(page, 'data_evento')).not.toBe(first);

    await page.locator('input[name="pagamento_fim"]').fill('2099-01-01T10:00');
    await page.getByRole('button', { name: 'Gerar outra sugestão' }).click();
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await page.getByRole('button', { name: 'Manter minhas datas' }).click();
    expect(await value(page, 'pagamento_fim')).toBe('2099-01-01T10:00');
    await page.getByRole('button', { name: 'Gerar outra sugestão' }).click();
    await page.getByRole('button', { name: 'Substituir minhas datas' }).click();
    expect(await value(page, 'pagamento_fim')).not.toBe('2099-01-01T10:00');
  });
});
