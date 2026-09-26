import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { test } from '../support/fixtures';

const { Given, When, Then } = createBdd(test);

Given('o usuário acessa a página inicial', async ({ page }) => {
  await page.goto('/');
});

When('seleciona o link {string}', async ({ page }, label: string) => {
  const scope = label === 'Entrar'
    ? page.getByRole('navigation', { name: 'Navegação principal' }).locator('xpath=ancestor::header[1]')
    : page;
  await scope.getByRole('link', { name: label, exact: true }).click();
});

Then('a rota de login deve ser exibida', async ({ page }) => {
  await expect(page).toHaveURL(/\/login$/);
});

Then('o formulário deve apresentar os campos de e-mail e senha', async ({ page }) => {
  await expect(page.getByLabel('E-mail cadastrado')).toBeVisible();
  await expect(page.getByLabel('Senha')).toBeVisible();
});

Given('o usuário está na tela de login', async ({ page }) => {
  await page.goto('/login');
});

When('informa o e-mail {string} e a senha {string}', async ({ page }, email: string, password: string) => {
  await page.getByLabel('E-mail cadastrado').fill(email);
  await page.getByLabel('Senha').fill(password);
});

When('seleciona o botão {string}', async ({ page }, label: string) => {
  await page.getByRole('button', { name: label, exact: true }).click();
});

Then('a mensagem {string} deve ser exibida', async ({ page }, message: string) => {
  await expect(page.getByText(message, { exact: true })).toBeVisible();
});

Then('o usuário deve permanecer na rota de login', async ({ page }) => {
  await expect(page).toHaveURL(/\/login$/);
});

When('seleciona a aba {string}', async ({ page }, label: string) => {
  await page.getByRole('button', { name: label, exact: true }).click();
});

Then('a rota de recuperação de senha deve ser exibida', async ({ page }) => {
  await expect(page).toHaveURL(/\/recuperar-senha(?:\?erro=link_expirado)?$/);
});

Then('o botão {string} deve estar disponível', async ({ page }, label: string) => {
  await expect(page.getByRole('button', { name: label, exact: true })).toBeVisible();
});

When('seleciona a opção de cadastro {string}', async ({ page }, profile: string) => {
  await page.getByRole('button', { name: new RegExp(`^${profile}\\b`, 'i') }).click();
});

Then('o formulário de criar conta deve pedir nome, e-mail, senha e data de nascimento', async ({ page }) => {
  await expect(page.getByLabel('Nome completo')).toBeVisible();
  await expect(page.getByLabel('Data de nascimento')).toBeVisible();
  await expect(page.getByLabel('E-mail')).toBeVisible();
  await expect(page.getByLabel('Senha', { exact: true })).toBeVisible();
});

Then('a orientação de que menor é cadastrado por Professor ou Responsável deve ser exibida', async ({ page }) => {
  await expect(page.getByText(/Menor de idade é cadastrado por Professor ou Responsável/i)).toBeVisible();
});

Given('o usuário acessa um link de recuperação expirado', async ({ page }) => {
  await page.goto('/auth/callback?error=access_denied&error_code=otp_expired&redirectTo=%2Fatualizar-senha');
});

Then('a orientação para solicitar um novo link deve ser exibida', async ({ page }) => {
  await expect(page.getByText(/Esse link expirou ou já foi utilizado/i)).toBeVisible();
});
