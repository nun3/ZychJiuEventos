import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test } from '../support/fixtures';

const { Given, When, Then } = createBdd(test);

When('acessa a gestão de atletas', async ({ page }) => {
  await page.goto('/dashboard/meus-atletas');
  await expect(page).toHaveURL(/\/dashboard\/meus-atletas$/);
});

Then('a lista real de atletas deve ser exibida', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Meus Atletas', exact: true }).first()).toBeVisible();
  await expect(page.getByPlaceholder('Buscar pelo nome')).toBeVisible();
});

Then('as ações Nova equipe e Novo atleta devem estar disponíveis', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Nova equipe' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Novo atleta/i })).toBeVisible();
});

Given('que a escrita E2E foi habilitada', async () => {
  test.skip(process.env.E2E_ALLOW_WRITES !== 'true', 'Defina E2E_ALLOW_WRITES=true para criar massa no Sandbox');
});

async function createTeam(page: import('@playwright/test').Page, name: string) {
  await page.getByRole('button', { name: 'Nova equipe' }).click();
  await page.getByLabel('Nome da equipe').fill(name);
  await page.getByRole('button', { name: 'Cadastrar equipe' }).click();
  await expect(page.getByText('Equipe cadastrada com sucesso.')).toBeVisible();
}

When('cadastra duas equipes únicas', async ({ page, scenarioData }) => {
  await page.goto('/dashboard/meus-atletas');
  await createTeam(page, scenarioData.teamOne);
  await createTeam(page, scenarioData.teamTwo);
});

When('cadastra um atleta fictício na primeira equipe', async ({ page, scenarioData }) => {
  await page.getByRole('button', { name: /Novo atleta/i }).click();
  await page.getByLabel('Nome completo').fill(scenarioData.athlete);
  await page.getByLabel('Nascimento').fill('1995-05-20');
  await page.getByLabel('Gênero').selectOption('M');
  await page.getByLabel('Equipe').selectOption({ label: scenarioData.teamOne });
  await page.getByLabel('Vínculo').selectOption('professor');
  await page.getByLabel('Faixa').fill('Branca');
  await page.getByLabel('Peso (kg)').fill('82.5');
  await page.getByRole('button', { name: 'Cadastrar atleta' }).click();
  await expect(page.getByText('Atleta cadastrado com sucesso.')).toBeVisible();
});

Then('o atleta deve aparecer na lista', async ({ page, scenarioData }) => {
  await expect(page.getByRole('article').filter({ hasText: scenarioData.athlete })).toBeVisible();
});

When('edita o atleta e troca para a segunda equipe com motivo', async ({ page, scenarioData }) => {
  const card = page.getByRole('article').filter({ hasText: scenarioData.athlete });
  await card.getByRole('link', { name: 'Editar' }).click();
  await page.getByLabel('Equipe').selectOption({ label: scenarioData.teamTwo });
  await page.getByLabel('Motivo da troca de equipe').fill('Troca automatizada E2E');
  await page.getByRole('button', { name: 'Salvar alterações' }).click();
});

Then('a atualização deve ser confirmada', async ({ page }) => {
  await expect(page.getByText('Atleta atualizado com sucesso.')).toBeVisible();
});

Then('o motivo deve aparecer no histórico de troca de equipe', async ({ page }) => {
  await expect(page.getByText('Troca automatizada E2E')).toBeVisible();
});

When('abre as inscrições de um atleta disponível', async ({ page }) => {
  const registrations = page.getByRole('link', { name: 'Inscrições' });
  test.skip((await registrations.count()) === 0, 'Não há atleta de teste disponível para consultar inscrições');
  await registrations.first().click();
});

Then('a página deve exibir o histórico ou o estado vazio de inscrições', async ({ page }) => {
  await expect(page.getByRole('heading', { name: /Inscrições —/i })).toBeVisible();
  await expect(page.getByText(/Nenhuma inscrição encontrada|Número/i).first()).toBeVisible();
});
