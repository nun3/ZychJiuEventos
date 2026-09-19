import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test } from '../support/fixtures';

const { Given, When, Then } = createBdd(test);

function closing(page: import('@playwright/test').Page) {
  return page.getByRole('region', { name: 'Fechamento do evento' });
}

function lineFor(page: import('@playwright/test').Page, athleteName: string) {
  return page.locator('tr:visible, article:visible').filter({ hasText: athleteName }).first();
}

Given('que existe um evento isolado com massa de fechamento financeiro', async ({ closingData }) => {
  expect(closingData.eventId).toBeTruthy();
});

When('abre o financeiro do evento de fechamento', async ({ page, closingData }) => {
  await page.goto(`/admin/eventos/${closingData.eventId}/financeiro`);
});

Then('o fechamento deve mostrar 4 inscrições realizadas', async ({ page }) => {
  await expect(page.getByRole('heading', { name: /^Financeiro/ })).toBeVisible();
  await expect(closing(page).locator('div').filter({ hasText: 'Inscrições realizadas' }).getByText('4', { exact: true })).toBeVisible();
});

Then('1 inscrição cancelada', async ({ page }) => {
  await expect(closing(page).locator('div').filter({ hasText: 'Inscrições canceladas' }).getByText('1', { exact: true })).toBeVisible();
});

Then('1 inscrição efetivada', async ({ page }) => {
  await expect(closing(page).locator('div').filter({ hasText: 'Inscrições efetivadas' }).getByText('1', { exact: true })).toBeVisible();
});

Then('a receita bruta deve ser {string}', async ({ page }, amount: string) => {
  await expect(closing(page).locator('div').filter({ hasText: 'Receita bruta' }).getByText(amount, { exact: true })).toBeVisible();
});

Then('a visão analítica lista as 4 inscrições do fechamento', async ({ page, closingData }) => {
  for (const name of closingData.athleteNames) {
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
  }
});

Then('a soma dos valores considerados deve ser {string}', async ({ page, closingData }, amount: string) => {
  await expect(closing(page).locator('div').filter({ hasText: 'Receita bruta' }).getByText(amount, { exact: true })).toBeVisible();
  await expect(lineFor(page, closingData.athleteNames[1]).getByText(amount).first()).toBeVisible();
  for (const name of [closingData.athleteNames[0], closingData.athleteNames[2], closingData.athleteNames[3]]) {
    await expect(lineFor(page, name).getByText('R$ 0,00').first()).toBeVisible();
  }
});

Then('a inscrição pendente não entra na receita', async ({ page, closingData }) => {
  const row = lineFor(page, closingData.athleteNames[0]);
  await expect(row.getByText('Pendente de pagamento').first()).toBeVisible();
  await expect(row.getByText('R$ 0,00').first()).toBeVisible();
});

Then('a inscrição efetivada por baixa manual entra na receita', async ({ page, closingData }) => {
  const row = lineFor(page, closingData.athleteNames[1]);
  await expect(row.getByText('Efetivada').first()).toBeVisible();
  await expect(row.getByText('Baixa manual').first()).toBeVisible();
  await expect(row.getByText('R$ 80,00').first()).toBeVisible();
});

Then('a inscrição cancelada é contabilizada como cancelada', async ({ page, closingData }) => {
  const row = lineFor(page, closingData.athleteNames[2]);
  await expect(row.getByText('Cancelada').first()).toBeVisible();
  await expect(row.getByText('R$ 0,00').first()).toBeVisible();
});

Then('a inscrição estornada não entra na receita', async ({ page, closingData }) => {
  const row = lineFor(page, closingData.athleteNames[3]);
  await expect(row.getByText('Estornada').first()).toBeVisible();
  await expect(row.getByText('R$ 0,00').first()).toBeVisible();
});

Then('a taxa da plataforma permanece pendente', async ({ page }) => {
  await expect(closing(page).getByText(/permanecem pendentes de decisão comercial/)).toBeVisible();
  await expect(closing(page).getByText(/receita líquida/i)).toBeVisible();
  await expect(closing(page).getByText(/%/)).toHaveCount(0);
});
