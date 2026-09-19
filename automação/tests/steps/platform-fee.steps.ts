import { expect, type Locator, type Page } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test } from '../support/fixtures';
import type { PlatformFeeFixture } from '../support/platform-fee-fixture';

const { Given, When, Then } = createBdd(test);

const FEE_COLUMN = 5;

function feeCard(page: Page) {
  return page.getByRole('region', { name: 'Taxa MEU CAMP por inscrição' });
}

function closing(page: Page) {
  return page.getByRole('region', { name: 'Fechamento do evento' });
}

function metric(page: Page, label: string) {
  return closing(page).locator('dl > div').filter({ has: page.getByText(label, { exact: true }) }).first();
}

function athleteFor(data: PlatformFeeFixture, key: string) {
  const names: Record<string, string> = {
    'pendente A': data.athleteNames.pendingFirst,
    'pendente B': data.athleteNames.pendingSecond,
    confirmada: data.athleteNames.confirmed,
    cancelada: data.athleteNames.cancelled,
    estornada: data.athleteNames.refunded,
  };
  const name = names[key];
  if (!name) throw new Error(`Atleta desconhecido na massa de taxa: ${key}`);
  return name;
}

function closingRow(page: Page, athleteName: string) {
  return closing(page).locator('tr').filter({ hasText: athleteName }).first();
}

function toCents(text: string) {
  const match = text.match(/-?R\$\s*([\d.]+),(\d{2})/);
  if (!match) throw new Error(`Valor monetário não reconhecido: ${text}`);
  const cents = Number(match[1].replace(/\./g, '')) * 100 + Number(match[2]);
  return text.trim().startsWith('-') ? -cents : cents;
}

async function metricCents(page: Page, label: string) {
  const text = await metric(page, label).innerText();
  return toCents(text.replace(label, ''));
}

async function openFinancialPage(page: Page, eventId: string) {
  await page.goto(`/admin/eventos/${eventId}/financeiro`);
  await expect(page.getByRole('heading', { name: /^Financeiro/ })).toBeVisible();
}

async function settleThroughUi(page: Page, reference: string) {
  const card: Locator = page.locator('article').filter({ hasText: reference }).first();
  await card.getByLabel('Justificativa da baixa manual').fill('Recebimento conferido fora do webhook no cenário de taxa.');
  await card.getByRole('checkbox').check();
  await card.getByRole('button', { name: 'Confirmar baixa manual' }).click();
  await expect(card.getByRole('status')).toHaveText('Baixa manual registrada e auditada.');
}

Given('que existe um evento isolado com taxa MEU CAMP contratada', async ({ platformFeeData }) => {
  expect(await platformFeeData.currentFeeCents()).toBe(500);
});

When('abre o financeiro do evento com taxa', async ({ page, platformFeeData }) => {
  await openFinancialPage(page, platformFeeData.eventId);
});

When('recarrega o financeiro do evento com taxa', async ({ page, platformFeeData }) => {
  await openFinancialPage(page, platformFeeData.eventId);
});

When('a plataforma passa a cobrar {string} por inscrição', async ({ platformFeeData }, amount: string) => {
  await platformFeeData.contractFee(toCents(amount));
});

When('registra a baixa manual da inscrição {string}', async ({ page, platformFeeData }, key: string) => {
  const reference = key === 'pendente A' ? platformFeeData.references.pendingFirst : platformFeeData.references.pendingSecond;
  await settleThroughUi(page, reference);
  await openFinancialPage(page, platformFeeData.eventId);
});

Then('a taxa por inscrição do evento deve ser {string}', async ({ page }, amount: string) => {
  await expect(feeCard(page).getByText(amount, { exact: true })).toBeVisible();
});

Then('a taxa MEU CAMP apurada deve ser {string}', async ({ page }, amount: string) => {
  await expect(metric(page, 'Taxa MEU CAMP').getByText(amount, { exact: true })).toBeVisible();
});

Then('a receita líquida deve ser {string}', async ({ page }, amount: string) => {
  await expect(metric(page, 'Receita líquida').getByText(amount, { exact: true })).toBeVisible();
});

Then('a receita bruta menos a taxa deve ser igual à receita líquida', async ({ page }) => {
  const gross = await metricCents(page, 'Receita bruta');
  const fee = await metricCents(page, 'Taxa MEU CAMP');
  const net = await metricCents(page, 'Receita líquida');
  expect(gross - fee).toBe(net);
});

Then('a soma das taxas da visão analítica bate com a taxa apurada', async ({ page }) => {
  const cells = await closing(page).locator('tbody tr').all();
  let sum = 0;
  for (const row of cells) {
    sum += toCents(await row.locator('td').nth(FEE_COLUMN).innerText());
  }
  expect(sum).toBe(await metricCents(page, 'Taxa MEU CAMP'));
});

Then('a inscrição do atleta {string} mostra taxa {string}', async ({ page, platformFeeData }, key: string, amount: string) => {
  const row = closingRow(page, athleteFor(platformFeeData, key));
  await expect(row.locator('td').nth(FEE_COLUMN)).toHaveText(amount);
});

Then('a inscrição do atleta {string} não gera taxa', async ({ page, platformFeeData }, key: string) => {
  const row = closingRow(page, athleteFor(platformFeeData, key));
  await expect(row.locator('td').nth(FEE_COLUMN)).toHaveText('R$ 0,00');
});

Then('a taxa registrada para o atleta {string} deve ser {string}', async ({ platformFeeData }, key: string, amount: string) => {
  expect(await platformFeeData.feeSnapshotFor(athleteFor(platformFeeData, key))).toBe(toCents(amount));
});

Then('a tela informa que a taxa é configurada pela plataforma', async ({ page }) => {
  await expect(feeCard(page).getByText(/configurada pela plataforma/)).toBeVisible();
});

Then('não deve existir formulário de alteração da taxa', async ({ page }) => {
  await expect(feeCard(page).getByRole('button', { name: 'Salvar taxa' })).toHaveCount(0);
  await expect(feeCard(page).getByLabel(/Nova taxa por inscrição/)).toHaveCount(0);
});

Given('que o organizador do evento com taxa está autenticado', async ({ loginPage, page, platformFeeData }) => {
  await platformFeeData.grantOrganizer();
  const email = process.env.E2E_UNAUTHORIZED_EMAIL;
  const password = process.env.E2E_UNAUTHORIZED_PASSWORD;
  test.skip(!email || !password, 'Defina E2E_UNAUTHORIZED_EMAIL e E2E_UNAUTHORIZED_PASSWORD em .env.e2e');
  await loginPage.open('/dashboard');
  await loginPage.login(email!, password!);
  await expect(page).toHaveURL(/\/dashboard(?:\?|$)/);
});

Then('a tentativa do organizador de alterar a taxa deve ser recusada', async ({ platformFeeData }) => {
  const { error } = await platformFeeData.organizerFeeChangeAttempt(1);
  expect(error?.message).toContain('Somente a plataforma configura a taxa');
});

Then('a taxa contratada permanece {string}', async ({ platformFeeData }, amount: string) => {
  expect(await platformFeeData.currentFeeCents()).toBe(toCents(amount));
});
