import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test } from '../support/fixtures';

const { Given, When, Then } = createBdd(test);

function createdEvent(page: import('@playwright/test').Page, name: string) {
  return page.locator('tr:visible, article:visible').filter({ hasText: name }).first();
}

When('abre as inscrições do evento criado', async ({ page, scenarioData }) => {
  const event = createdEvent(page, scenarioData.event);
  await event.getByRole('button', { name: 'Abrir inscrições' }).click();
  await expect(event.getByRole('button', { name: 'Abrir pagamento' })).toBeVisible();
});

When('abre o pagamento do evento criado', async ({ page, scenarioData }) => {
  const event = createdEvent(page, scenarioData.event);
  await event.getByRole('button', { name: 'Abrir pagamento' }).click();
  await expect(event.getByRole('button', { name: 'Abrir checagem' })).toBeVisible();
});

Then('o evento criado deve exibir o status {string}', async ({ page, scenarioData }, status: string) => {
  await expect(createdEvent(page, scenarioData.event).getByText(status, { exact: true })).toBeVisible();
});

Then('a ação {string} deve estar disponível no evento criado', async ({ page, scenarioData }, action: string) => {
  await expect(createdEvent(page, scenarioData.event).getByRole('button', { name: action, exact: true })).toBeVisible();
});

Then('a ação {string} não deve estar disponível no evento criado', async ({ page, scenarioData }, action: string) => {
  await expect(createdEvent(page, scenarioData.event).getByRole('button', { name: action, exact: true })).toHaveCount(0);
});

Then('a ação {string} deve estar visível', async ({ page }, action: string) => {
  await expect(page.getByRole('button', { name: action, exact: true })).toBeVisible();
});

Then('a ação {string} não deve estar visível', async ({ page }, action: string) => {
  await expect(page.getByRole('button', { name: action, exact: true })).toHaveCount(0);
});

When('trava a checagem oficial', async ({ page }) => {
  await page.getByLabel(/Confirmo que a lista oficial/).check();
  await page.getByRole('button', { name: 'Travar checagem' }).click();
  await expect(page.getByRole('button', { name: 'Abrir chaves' })).toBeVisible();
});

When('abre a fase de chaves', async ({ page }) => {
  await page.getByRole('button', { name: 'Abrir chaves' }).click();
  await expect(page.getByRole('link', { name: 'Ir para as chaves' })).toBeVisible();
});

Then('a checagem deve indicar a fase de chaves', async ({ page }) => {
  await expect(page.getByText('Fase de chaves aberta')).toBeVisible();
});

When('acessa as chaves pela checagem', async ({ page }) => {
  await page.getByRole('link', { name: 'Ir para as chaves' }).click();
});

Then('a tela administrativa de chaves deve abrir', async ({ page, checagemData }) => {
  await expect(page).toHaveURL(new RegExp(`/admin/eventos/${checagemData.eventId}/chaves$`));
  await expect(page.getByRole('heading', { name: `Chaves — ${checagemData.eventName}` })).toBeVisible();
});

When('acessa a checagem do evento isolado', async ({ page, checagemData }) => {
  await page.goto(`/admin/eventos/${checagemData.eventId}/checagem`);
});

Given('existe um evento operacional em andamento', async ({ liveEventData }) => {
  expect(liveEventData.eventId).toBeTruthy();
  expect(liveEventData.status).toBe('em_andamento');
});

When('abre os resultados do evento operacional', async ({ page, liveEventData }) => {
  await page.goto(`/admin/eventos/${liveEventData.eventId}/resultados`);
  await expect(page.getByRole('heading', { name: `Resultados — ${liveEventData.eventName}` })).toBeVisible();
});

When('conclui o evento operacional', async ({ page }) => {
  await page.getByRole('button', { name: 'Concluir evento' }).click();
  await expect(page.getByText('Evento concluído')).toBeVisible();
});

Then('os resultados devem indicar evento concluído', async ({ page }) => {
  await expect(page.getByText('Evento: concluido')).toBeVisible();
  await expect(page.getByText('Evento concluído', { exact: true })).toBeVisible();
});

When('recarrega os resultados do evento operacional', async ({ page, liveEventData }) => {
  await page.goto(`/admin/eventos/${liveEventData.eventId}/resultados`);
  await expect(page.getByRole('heading', { name: `Resultados — ${liveEventData.eventName}` })).toBeVisible();
});

When('abre a página pública do evento operacional', async ({ page, liveEventData }) => {
  await page.goto(`/eventos/${liveEventData.eventId}`);
  await expect(page.getByRole('heading', { name: liveEventData.eventName })).toBeVisible();
});

Then('o evento público deve permanecer concluído', async ({ page }) => {
  await expect(page.getByText('concluido', { exact: true })).toBeVisible();
});

Then('as inscrições públicas devem permanecer indisponíveis', async ({ page }) => {
  await expect(page.getByText('Inscrições indisponíveis nesta fase.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Inscrever atletas' })).toHaveCount(0);
});
