import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test } from '../support/fixtures';

const { Given, When, Then } = createBdd(test);

function checking(page: import('@playwright/test').Page) {
  return page.getByRole('main');
}

function visibleRecord(page: import('@playwright/test').Page, text: string) {
  return page.locator('tr:visible, article:visible').filter({ hasText: text }).first();
}

Given('que existe um evento isolado com checagem pública', async ({ publicCheckingData }) => {
  expect(publicCheckingData.eventId).toBeTruthy();
});

When('abre a checagem pública sem autenticação', async ({ page, publicCheckingData }) => {
  await page.goto(`/eventos/${publicCheckingData.eventId}/checagem`);
  await expect(page.getByRole('heading', { name: /^Checagem/ })).toBeVisible();
});

When('abre a checagem pública em 390px sem autenticação', async ({ page, publicCheckingData }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/eventos/${publicCheckingData.eventId}/checagem`);
  await expect(page.getByRole('heading', { name: /^Checagem/ })).toBeVisible();
});

When('filtra a checagem pública pela categoria média', async ({ page, publicCheckingData }) => {
  await page.getByLabel('Filtrar por categoria').selectOption(publicCheckingData.categoryNames[1]);
  await page.getByRole('button', { name: 'Filtrar' }).click();
  expect(new URL(page.url()).searchParams.get('categoria')).toBe(publicCheckingData.categoryNames[1]);
});

When('filtra a checagem pública pela equipe beta', async ({ page, publicCheckingData }) => {
  await page.goto(`/eventos/${publicCheckingData.eventId}/checagem`);
  await page.getByLabel('Filtrar por equipe').selectOption(publicCheckingData.teamNames[1]);
  await page.getByRole('button', { name: 'Filtrar' }).click();
  expect(new URL(page.url()).searchParams.get('equipe')).toBe(publicCheckingData.teamNames[1]);
});

Then('a checagem pública lista os atletas efetivados', async ({ page, publicCheckingData }) => {
  for (const name of publicCheckingData.visibleNames) {
    await expect(visibleRecord(page, name)).toBeVisible();
  }
});

Then('a inscrição pendente não aparece na checagem pública', async ({ page, publicCheckingData }) => {
  await expect(checking(page).getByText(publicCheckingData.hiddenNames[0], { exact: true })).toHaveCount(0);
});

Then('a inscrição cancelada não aparece na checagem pública', async ({ page, publicCheckingData }) => {
  await expect(checking(page).getByText(publicCheckingData.hiddenNames[1], { exact: true })).toHaveCount(0);
});

Then('o atleta realocado aparece na categoria vigente', async ({ page, publicCheckingData }) => {
  const row = visibleRecord(page, publicCheckingData.reallocatedAthleteName);
  await expect(row).toBeVisible();
  await expect(checking(page).getByRole('heading', { name: publicCheckingData.categoryNames[2] })).toBeVisible();
  await expect(row.getByText(publicCheckingData.categoryNames[0])).toHaveCount(0);
});

Then('nome, equipe e categoria vigentes estão visíveis', async ({ page, publicCheckingData }) => {
  await expect(visibleRecord(page, publicCheckingData.athleteNames[0])).toBeVisible();
  await expect(visibleRecord(page, publicCheckingData.teamNames[0])).toBeVisible();
  await expect(checking(page).getByRole('heading', { name: publicCheckingData.categoryNames[0] })).toBeVisible();
  await expect(checking(page).getByRole('heading', { name: publicCheckingData.categoryNames[2] })).toBeVisible();
});

Then('dados privados não aparecem na checagem pública', async ({ page, publicCheckingData }) => {
  const body = await checking(page).innerText();
  for (const token of publicCheckingData.privateTokens) {
    expect(body).not.toContain(token);
  }
  const records = await page.locator('tr:visible, article:visible').allInnerTexts();
  expect(records.join('\n')).not.toMatch(/cpf|e-mail|telefone|gateway|auditoria|5299822472|1995-01-01|77\.77/i);
});

Then('a checagem pública identifica o atleta sozinho', async ({ page, publicCheckingData }) => {
  await expect(visibleRecord(page, publicCheckingData.aloneAthleteName).getByText('Atleta sozinho').first()).toBeVisible();
});

Then('somente o atleta sozinho permanece visível na checagem pública', async ({ page, publicCheckingData }) => {
  await expect(visibleRecord(page, publicCheckingData.aloneAthleteName)).toBeVisible();
  for (const name of publicCheckingData.visibleNames.filter((item) => item !== publicCheckingData.aloneAthleteName)) {
    await expect(checking(page).getByText(name, { exact: true })).toHaveCount(0);
  }
});

Then('somente o atleta da equipe beta permanece visível na checagem pública', async ({ page, publicCheckingData }) => {
  await expect(visibleRecord(page, publicCheckingData.athleteNames[1])).toBeVisible();
  for (const name of publicCheckingData.visibleNames.filter((item) => item !== publicCheckingData.athleteNames[1])) {
    await expect(checking(page).getByText(name, { exact: true })).toHaveCount(0);
  }
});
