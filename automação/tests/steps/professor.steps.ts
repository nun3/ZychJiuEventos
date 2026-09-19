import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test } from '../support/fixtures';

const { Given, When, Then } = createBdd(test);

Given('que existe um evento isolado disponível para o professor', async ({ professorData }) => {
  expect(professorData.eventId).toBeTruthy();
});

When('cadastra uma conta como Professor', async ({ page, professorData }) => {
  await page.goto('/login?mode=register');
  await page.getByRole('button', { name: /Professor/ }).click();
  await expect(page.getByRole('heading', { name: 'Cadastrar Novo Professor' })).toBeVisible();
  await page.getByPlaceholder('Digite o nome completo').fill(professorData.professorName);
  await page.getByPlaceholder('000.000.000-00').fill(professorData.professorCpf);
  await page.locator('input[type="date"]').fill('1988-03-15');
  await page.locator('select').first().selectOption('Masculino');
  await page.getByPlaceholder('nome@exemplo.com').fill(professorData.email);
  await page.getByPlaceholder('(00) 00000-0000').fill('27999999999');
  await page.getByPlaceholder('Crie uma senha forte').fill(professorData.password);
  await page.getByPlaceholder('Repita a senha').fill(professorData.password);
  await page.getByRole('button', { name: 'Próximo' }).click();
  await page.getByRole('button', { name: 'Cadastrar Professor' }).click();
  await expect(page.getByText('Cadastro recebido. Verifique seu e-mail para confirmar a conta.')).toBeVisible();
  await professorData.confirmSignup();
});

When('entra com a conta de Professor', async ({ page, professorData }) => {
  await page.goto('/login');
  await page.getByLabel('E-mail cadastrado').fill(professorData.email);
  await page.getByLabel('Senha').fill(professorData.password);
  await page.getByRole('button', { name: 'Entrar na conta' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
});

Then('vê o painel do professor', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Painel do professor' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Minha equipe e atletas' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Gerenciar eventos' })).toHaveCount(0);
});

When('cria sua equipe', async ({ page, professorData }) => {
  await page.goto('/dashboard/meus-atletas');
  const nameField = page.getByLabel('Nome da equipe');
  if (!(await nameField.isVisible())) {
    await page.getByRole('button', { name: 'Nova equipe' }).click();
  }
  await nameField.fill(professorData.teamName);
  await page.getByRole('button', { name: 'Cadastrar equipe' }).click();
  await expect(page.getByText('Equipe cadastrada com sucesso.')).toBeVisible();
});

When('cadastra um atleta na equipe', async ({ page, professorData }) => {
  await page.getByRole('button', { name: /Novo atleta/i }).click();
  await page.getByLabel('Nome completo').fill(professorData.athleteName);
  await page.getByLabel('Nascimento').fill('1996-04-12');
  await page.getByLabel('Gênero').selectOption('M');
  await page.getByLabel('Equipe').selectOption({ label: professorData.teamName });
  await page.getByLabel('Vínculo').selectOption('professor');
  await page.getByLabel('Faixa').fill('Branca');
  await page.getByLabel('Peso (kg)').fill('72');
  await page.getByRole('button', { name: 'Cadastrar atleta' }).click();
  await expect(page.getByText('Atleta cadastrado com sucesso.')).toBeVisible();
  await expect(page.getByText(professorData.athleteName, { exact: true }).first()).toBeVisible();
});

When('inscreve o atleta no evento disponível', async ({ page, professorData }) => {
  await page.goto(`/eventos/${professorData.eventId}/inscricao/cadastrar-atleta`);
  await page.getByLabel(`Selecionar ${professorData.athleteName}`).check();
  await page.getByLabel('Li e aceito os termos de inscrição.').check();
  await page.getByRole('button', { name: 'Confirmar inscrições' }).click();
  await expect(page.getByText('inscrição(ões) criada(s)')).toBeVisible();
});

Then('a inscrição do atleta aparece', async ({ page, professorData }) => {
  await page.goto('/dashboard/inscricoes');
  await expect(page.getByText(professorData.athleteName, { exact: true }).first()).toBeVisible();
  await expect(page.getByText(professorData.eventName).first()).toBeVisible();
});

When('acompanha a checagem pública do evento', async ({ page, professorData }) => {
  await professorData.openChecking();
  await page.goto(`/eventos/${professorData.eventId}/checagem`);
  await expect(page.getByRole('heading', { name: /^Checagem/ })).toBeVisible();
});

Then('o atleta inscrito aparece na checagem pública', async ({ page, professorData }) => {
  await expect(page.getByText(professorData.athleteName, { exact: true }).first()).toBeVisible();
});

When('tenta abrir a administração de eventos', async ({ page }) => {
  await page.goto('/admin/eventos');
});

When('tenta abrir o financeiro de um evento alheio', async ({ page }) => {
  await page.goto('/admin/eventos/24fa57c3-1dfc-4c17-a3f2-e6810f287786/financeiro');
});

Then('o acesso administrativo é negado', async ({ page }) => {
  await expect(page).toHaveURL(/\/dashboard\?erro=sem_permissao/);
  await expect(page.getByText('Acesso administrativo negado')).toBeVisible();
});
