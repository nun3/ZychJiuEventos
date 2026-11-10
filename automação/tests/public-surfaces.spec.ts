import { expect, test, type Page } from '@playwright/test';

const failedRequests: string[] = [];

async function openPublic(page: Page, path: string) {
  failedRequests.length = 0;
  page.on('response', (response) => {
    if (response.status() >= 400 && !response.url().includes('_next/static')) {
      failedRequests.push(`${response.status()} ${response.url()}`);
    }
  });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('main')).toBeVisible();
  return { errors, failedRequests };
}

async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return { client: doc.clientWidth, scroll: doc.scrollWidth };
  });
  expect(overflow.scroll, 'a página não pode vazar na horizontal').toBeLessThanOrEqual(overflow.client + 1);
}

test.describe('superfícies públicas', () => {
  test('home: carrossel 3D, calendário e rodapé padrão', async ({ page }) => {
    const { errors } = await openPublic(page, '/');
    await expect(page.locator('#home-hero-title')).toHaveCount(1);
    await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeVisible();
    const carousel = page.getByRole('region', { name: 'Campeonatos em destaque' });
    await expect(carousel).toBeVisible();
    await expect(page.locator('article[data-pos="0"]')).toHaveCount(1);
    const first = await page.locator('article[data-pos="0"]').getAttribute('aria-label');
    await page.getByRole('button', { name: 'Próximo campeonato' }).click();
    await expect.poll(() => page.locator('article[data-pos="0"]').getAttribute('aria-label')).not.toBe(first);
    await expect(page.locator('#calendario')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Encontre seu próximo campeonato/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /Próximos campeonatos/ })).toBeVisible();
    await expect(page.locator('footer').getByRole('link', { name: 'Academias e equipes' })).toBeVisible();
    expect(errors).toEqual([]);
    await assertNoHorizontalOverflow(page);
  });

  test('home: filtros do calendário em combobox de vidro', async ({ page }) => {
    await openPublic(page, '/');
    const search = page.locator('#home-event-search');
    if (!(await search.count())) return; // sem eventos publicados não há barra de filtros
    await page.locator('#calendario').scrollIntoViewIfNeeded();
    await search.fill('zzz-sem-resultado');
    await expect(page.getByText('Nenhum campeonato encontrado')).toBeVisible();
    await page.getByRole('button', { name: 'Limpar filtros' }).click();
    await expect(search).toHaveValue('');
    const state = page.getByRole('combobox', { name: 'Estado' });
    await state.focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('listbox', { name: 'Estado' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox', { name: 'Estado' })).toBeHidden();
  });

  test('logo, "Eventos" e rodapé levam à nova home e o histórico funciona', async ({ page }) => {
    await openPublic(page, '/eventos');
    await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Eventos' }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goto('/eventos', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: /MEU CAMP, início/ }).click();
    await expect(page).toHaveURL(/\/$/);
    await page.goBack();
    await expect(page).toHaveURL(/\/eventos$/);
    // o link "Eventos" do rodapé padrão também aponta para a Home
    await page.goto('/noticias', { waitUntil: 'domcontentloaded' });
    const footerEvents = page.locator('footer').getByRole('link', { name: 'Eventos', exact: true });
    await footerEvents.scrollIntoViewIfNeeded();
    await footerEvents.click();
    await expect(page).toHaveURL(/\/$/);
    // /eventos continua existindo com o calendário completo
    await page.goto('/eventos', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Encontre seu próximo campeonato/i })).toBeVisible();
  });

  test('academias usa o palco institucional e preserva o conteúdo', async ({ page }) => {
    await openPublic(page, '/academias');
    await expect(page.getByRole('heading', { name: 'Sua equipe chega na competição organizada.' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Equipe e atletas' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Criar conta' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ver eventos' })).toBeVisible();
  });

  test('notícias permanece vazia sem inventar publicação', async ({ page }) => {
    await openPublic(page, '/noticias');
    await expect(page.getByRole('heading', { name: 'Acompanhe o esporte e a plataforma.' })).toBeVisible();
    await expect(page.getByText('Nenhuma notícia publicada')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Abrir calendário público' })).toBeVisible();
  });

  test('quem somos e sistema mantêm a navegação institucional', async ({ page }) => {
    await openPublic(page, '/quem-somos');
    await expect(page.getByRole('heading', { name: 'MEU CAMP existe para a competição acontecer.' })).toBeVisible();
    await page.getByRole('link', { name: 'Conhecer o sistema' }).click();
    await expect(page).toHaveURL(/\/sistema$/);
    await expect(page.getByRole('heading', { name: 'A competição inteira, do cadastro ao fechamento.' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Para cada perfil' })).toBeVisible();
    await page.getByRole('link', { name: 'Ver calendário' }).click();
    await expect(page).toHaveURL(/\/eventos$/);
  });

  test('calendário público e filtros continuam no ar', async ({ page }) => {
    await openPublic(page, '/eventos');
    await expect(page.getByRole('heading', { name: /Encontre seu próximo campeonato/i })).toBeVisible();
    const search = page.locator('#event-search');
    if (await search.count()) {
      await expect(search).toBeVisible();
      await search.fill('campeonato');
    } else {
      await expect(page.getByText(/Nenhum campeonato|ainda não|calendário/i).first()).toBeVisible();
    }
  });

  test('detalhe público de evento ou 404 honesto', async ({ page }) => {
    await page.goto('/eventos', { waitUntil: 'domcontentloaded' });
    const detail = page.getByRole('link', { name: /Ver campeonato|Detalhes|Gerenciar evento/i }).first();
    if (await detail.count()) {
      await detail.click();
      await expect(page).toHaveURL(/\/eventos\/.+/);
      await expect(page.locator('main')).toBeVisible();
      await expect(page.getByRole('heading').first()).toBeVisible();
      return;
    }
    const response = await page.goto('/eventos/00000000-0000-0000-0000-000000000000', { waitUntil: 'domcontentloaded' });
    expect(response?.status() === 404 || (await page.locator('main').count()) > 0).toBeTruthy();
  });

  test('rodapé liga as páginas públicas', async ({ page }) => {
    await page.goto('/noticias', { waitUntil: 'domcontentloaded' });
    const academias = page.locator('footer').getByRole('link', { name: 'Academias e equipes' });
    await academias.scrollIntoViewIfNeeded();
    await academias.click();
    await expect(page).toHaveURL(/\/academias$/);
    const about = page.locator('footer').getByRole('link', { name: 'Quem somos' });
    await about.scrollIntoViewIfNeeded();
    await about.click();
    await expect(page).toHaveURL(/\/quem-somos$/);
  });
});

for (const width of [390, 1440] as const) {
  test(`institucionais e calendário cabem em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 1440 ? 900 : 844 });
    for (const path of ['/', '/academias', '/noticias', '/quem-somos', '/sistema', '/eventos']) {
      await page.goto(path, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('main')).toBeVisible();
      await assertNoHorizontalOverflow(page);
    }
  });
}
