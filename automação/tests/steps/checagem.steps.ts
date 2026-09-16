import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test } from '../support/fixtures';

const { Given, When, Then } = createBdd(test);

Given('existe um evento isolado com inscrições mistas para checagem', async ({ checagemData }) => {
  expect(checagemData.eventId).toBeTruthy();
});

When('abre a checagem do evento isolado', async ({ page, checagemData }) => {
  await page.goto(`/admin/eventos/${checagemData.eventId}/checagem`);
  await expect(page.getByRole('heading', { name: `Checagem — ${checagemData.eventName}` })).toBeVisible();
});

Then('a checagem lista somente os três atletas efetivados', async ({ page, checagemData }) => {
  await expect(page.getByText('3 de 3 inscrições efetivadas')).toBeVisible();
  for (const name of checagemData.athleteNames.slice(0, 3)) {
    await expect(page.getByText(name)).toBeVisible();
  }
});

Then('as inscrições pendente, expirada, cancelada e estornada não aparecem', async ({ page, checagemData }) => {
  for (const name of checagemData.hiddenNames) {
    await expect(page.getByText(name)).toHaveCount(0);
  }
});

When('filtra a checagem pela categoria pesada', async ({ page, checagemData }) => {
  await page.getByLabel('Filtrar por categoria').selectOption(checagemData.categoryNames[1]);
});

Then('somente o atleta sozinho permanece visível', async ({ page, checagemData }) => {
  await expect(page.getByText(checagemData.aloneAthleteName)).toBeVisible();
  await expect(page.getByText(checagemData.athleteNames[0])).toHaveCount(0);
  await expect(page.getByText(checagemData.athleteNames[1])).toHaveCount(0);
});

Then('a checagem identifica o atleta sozinho', async ({ page }) => {
  await expect(page.getByText('Atleta sozinho').first()).toBeVisible();
});

When('filtra a checagem pela equipe beta', async ({ page, checagemData }) => {
  await page.getByLabel('Filtrar por categoria').selectOption('all');
  await page.getByLabel('Filtrar por equipe').selectOption(checagemData.teamNames[1]);
});

Then('somente o atleta da equipe beta permanece visível', async ({ page, checagemData }) => {
  await expect(page.getByText(checagemData.athleteNames[1])).toBeVisible();
  await expect(page.getByText(checagemData.athleteNames[0])).toHaveCount(0);
  await expect(page.getByText(checagemData.aloneAthleteName)).toHaveCount(0);
});
