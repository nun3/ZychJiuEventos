import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test } from '../support/fixtures';

const { When, Then } = createBdd(test);

When('acessa a gestão de eventos', async ({ page }) => {
  await page.goto('/admin/eventos');
  await expect(page).toHaveURL(/\/admin\/eventos$/);
});

Then('a lista real de eventos deve ser exibida', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Meus eventos' })).toBeVisible();
});

Then('a ação Novo evento deve estar disponível', async ({ page }) => {
  await expect(page.getByRole('link', { name: 'Novo evento' })).toBeVisible();
});

When('inicia o cadastro de um evento', async ({ page }) => {
  await page.goto('/admin/eventos/novo');
  await expect(page.getByRole('heading', { name: 'Criar evento' })).toBeVisible();
});

async function fillBase(page: import('@playwright/test').Page, eventName: string) {
  await page.getByLabel('Nome do evento').fill(eventName);
  await page.getByLabel('Data do evento').fill('2027-12-20');
  await page.getByLabel('Local').fill('Ginásio E2E');
}

async function fillPhase(page: import('@playwright/test').Page, label: string, start: string, end: string) {
  const group = page.getByText(label, { exact: true }).locator('..');
  await group.getByLabel('Início').fill(start);
  await group.getByLabel('Término').fill(end);
}

When('preenche os dados e as fases válidas do evento', async ({ page, scenarioData }) => {
  await fillBase(page, scenarioData.event);
  await fillPhase(page, 'Inscrição', '2027-10-01T08:00', '2027-10-31T23:00');
  await fillPhase(page, 'Pagamento', '2027-11-01T08:00', '2027-11-10T23:00');
  await fillPhase(page, 'Checagem', '2027-11-11T08:00', '2027-11-20T23:00');
  await fillPhase(page, 'Chaves', '2027-11-21T08:00', '2027-12-01T23:00');
});

When('publica o evento', async ({ page }) => {
  await page.getByRole('button', { name: 'Publicar', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/eventos$/);
});

Then('o evento publicado deve aparecer na lista administrativa', async ({ page, scenarioData }) => {
  await expect(page).toHaveURL(/\/admin\/eventos$/);
  const card = page.getByRole('article').filter({ hasText: scenarioData.event });
  await expect(card).toContainText('Publicado');
});

When('preenche fases sobrepostas', async ({ page, scenarioData }) => {
  await fillBase(page, `${scenarioData.event} inválido`);
  await fillPhase(page, 'Inscrição', '2027-10-01T08:00', '2027-10-31T23:00');
  await fillPhase(page, 'Pagamento', '2027-10-20T08:00', '2027-11-10T23:00');
  await fillPhase(page, 'Checagem', '2027-11-11T08:00', '2027-11-20T23:00');
  await fillPhase(page, 'Chaves', '2027-11-21T08:00', '2027-12-01T23:00');
});

When('tenta salvar o rascunho', async ({ page }) => {
  await page.getByRole('button', { name: 'Salvar rascunho' }).click();
});

Then('a mensagem de fases fora de ordem deve ser exibida', async ({ page }) => {
  await expect(page.getByText('As fases devem estar em ordem e não podem se sobrepor.', { exact: true })).toBeVisible();
});

When('salva o evento como rascunho', async ({ page }) => {
  await page.getByRole('button', { name: 'Salvar rascunho' }).click();
  await expect(page).toHaveURL(/\/admin\/eventos$/);
});

When('encerra a sessão e acessa a página pública', async ({ page }) => {
  await page.context().clearCookies();
  await page.goto('/');
});

Then('o evento deve aparecer na lista pública', async ({ page, scenarioData }) => {
  await expect(page.getByRole('heading', { name: scenarioData.event })).toBeVisible();
});

Then('os detalhes públicos do evento devem abrir', async ({ page, scenarioData }) => {
  await page.getByRole('heading', { name: scenarioData.event }).click();
  await page.getByRole('link', { name: /Ver Detalhes Completos/i }).click();
  await expect(page.getByRole('heading', { name: scenarioData.event })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Cronograma' })).toBeVisible();
});

Then('o cronograma deve preservar o horário do fuso do evento', async ({ page }) => {
  await expect(page.getByText(/01\/10\/2027, 08:00 até 31\/10\/2027, 23:00/)).toBeVisible();
});

Then('o rascunho não deve aparecer na lista pública', async ({ page, scenarioData }) => {
  await expect(page.getByRole('heading', { name: scenarioData.event })).toHaveCount(0);
});

When('cria um evento publicado para configuração', async ({ page, scenarioData }) => {
  await page.goto('/admin/eventos/novo');
  await fillBase(page, scenarioData.event);
  await fillPhase(page, 'Inscrição', '2027-10-01T08:00', '2027-10-31T23:00');
  await fillPhase(page, 'Pagamento', '2027-11-01T08:00', '2027-11-10T23:00');
  await fillPhase(page, 'Checagem', '2027-11-11T08:00', '2027-11-20T23:00');
  await fillPhase(page, 'Chaves', '2027-11-21T08:00', '2027-12-01T23:00');
  await page.getByRole('button', { name: 'Publicar', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/eventos$/);
});

When('acessa as categorias do evento criado', async ({ page, scenarioData }) => {
  await page.getByRole('article').filter({ hasText: scenarioData.event }).getByRole('link', { name: 'Categorias' }).click();
});

When('cadastra uma versão com categoria válida', async ({ page }) => {
  await page.getByLabel('Nome do conjunto').fill('Regras E2E');
  await page.getByLabel('Nome da categoria').fill('Adulto Leve E2E');
  await page.getByRole('button', { name: 'Criar versão' }).click();
});

Then('a versão e a categoria devem aparecer na configuração', async ({ page }) => {
  await expect(page.getByRole('heading', { name: /Versão 1 — Regras E2E/ })).toBeVisible();
  await expect(page.getByText(/Adulto Leve E2E/)).toBeVisible();
});

When('anexa banner, regulamento e tabela de peso válidos', async ({ page }) => {
  await page.getByLabel('Banner').setInputFiles({ name: 'banner.png', mimeType: 'image/png', buffer: Buffer.from('89504e470d0a1a0a', 'hex') });
  const pdf = Buffer.from('%PDF-1.4\n%%EOF');
  await page.getByLabel('Regulamento').setInputFiles({ name: 'regulamento.pdf', mimeType: 'application/pdf', buffer: pdf });
  await page.getByLabel('Tabela de peso').setInputFiles({ name: 'tabela-peso.pdf', mimeType: 'application/pdf', buffer: pdf });
});

When('abre os detalhes públicos do evento criado', async ({ page, scenarioData }) => {
  await page.context().clearCookies();
  await page.goto('/');
  await page.getByRole('heading', { name: scenarioData.event }).click();
  await page.getByRole('link', { name: /Ver Detalhes Completos/i }).click();
});

Then('o banner e os documentos públicos devem estar disponíveis', async ({ page, scenarioData }) => {
  await expect(page.getByRole('img', { name: `Banner de ${scenarioData.event}` })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Regulamento' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tabela de peso' })).toBeVisible();
});
