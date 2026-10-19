import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test } from '../support/fixtures';
import { applyOwnerSession } from '../support/e2e-cleanup';

const { Given, When, Then } = createBdd(test);

async function fillPhase(page: import('@playwright/test').Page, label: string, start: string, end: string) {
  const toggle = page.getByRole('button', { name: 'Configurar datas das fases' });
  if (await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click();
  const group = page.getByText(label, { exact: true }).locator('..');
  await group.getByLabel('Início').fill(start);
  await group.getByLabel('Término').fill(end);
}

async function publishExistingEvent(page: import('@playwright/test').Page, eventName: string) {
  await page.goto('/admin/eventos');
  const card = page.getByRole('article').filter({ hasText: eventName });
  await card.getByRole('button', { name: `Mais ações de ${eventName}` }).click();
  await page.getByRole('menuitem', { name: 'Publicar' }).click();
  await expect(card.getByText('Publicado', { exact: true })).toBeVisible();
}

Given('que o owner possui uma sessão E2E', async ({ context, page }) => {
  await applyOwnerSession(context, process.env.BASE_URL || 'http://localhost:3000');
  await page.goto('/admin/eventos');
  await expect(page).toHaveURL(/\/admin\/eventos$/);
});

When('cria um rascunho marcado para destaque na Home', async ({ page, scenarioData, homeCacheProof }) => {
  await page.goto('/admin/eventos/novo');
  await page.getByLabel('Nome do evento').fill(scenarioData.event);
  await page.getByLabel('Data do evento').fill('2027-12-20');
  await page.getByLabel('Local').fill('Ginásio E2E');
  await fillPhase(page, 'Inscrição', '2027-10-01T08:00', '2027-10-31T23:00');
  await fillPhase(page, 'Pagamento', '2027-11-01T08:00', '2027-11-10T23:00');
  await fillPhase(page, 'Checagem', '2027-11-11T08:00', '2027-11-20T23:00');
  await fillPhase(page, 'Chaves', '2027-11-21T08:00', '2027-12-01T23:00');
  await page.getByRole('button', { name: 'Criar evento e continuar' }).click();
  await expect(page).toHaveURL(/\/admin\/eventos\/[^/]+\/configuracao$/);
  const eventId = page.url().match(/\/admin\/eventos\/([^/]+)\/configuracao$/)?.[1];
  if (!eventId) throw new Error('Identificador do evento de prova não foi encontrado.');
  await homeCacheProof.markAsHighlight(eventId);
});

When('aquece o cache da Home antes de publicar', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Próximos campeonatos' })).toBeVisible();
});

When('publica o rascunho marcado para destaque', async ({ page, scenarioData }) => {
  await publishExistingEvent(page, scenarioData.event);
});

Then('o evento publicado deve aparecer imediatamente no carrossel da Home', async ({ page, scenarioData }) => {
  await page.context().clearCookies();
  await page.goto('/');
  const eventTab = page.getByRole('tab', { name: `Mostrar ${scenarioData.event}` });
  await expect(eventTab).toBeVisible();
  await eventTab.click();
  await expect(page.getByLabel('Campeonatos em destaque').getByRole('heading', { name: scenarioData.event, exact: true })).toBeVisible();
});
