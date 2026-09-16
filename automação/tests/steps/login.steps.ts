import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { test } from '../support/fixtures';

const { Given, When, Then } = createBdd(test);

Given('o usuário acessa a página inicial', async ({ page }) => {
  await page.goto('/');
});

When('seleciona o link {string}', async ({ page }, label: string) => {
  const link = page.getByRole('link', { name: new RegExp(label, 'i') });
  await link.click();
});

Then('a rota de login deve ser exibida', async ({ page }) => {
  await expect(page).toHaveURL(/\/login$/);
});

Then('o formulário deve apresentar os campos de e-mail e senha', async ({ page }) => {
  await expect(page.getByRole('textbox', { name: 'nome@exemplo.com' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Digite sua senha' })).toBeVisible();
});

Given('o usuário está na tela de login', async ({ page }) => {
  await page.goto('/login');
});

When('informa o e-mail {string} e a senha {string}', async ({ page }, email: string, password: string) => {
  await page.getByRole('textbox', { name: 'nome@exemplo.com' }).fill(email);
  await page.getByRole('textbox', { name: 'Digite sua senha' }).fill(password);
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
  await page.getByRole('button', { name: new RegExp(`${profile}.*Cadastro`, 'i') }).click();
});

Then('o modal {string} deve ser exibido', async ({ page }, title: string) => {
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
});

Then('as etapas {string}, {string}, {string} e {string} devem estar disponíveis', async ({ page }, ...steps: string[]) => {
  for (const step of steps) {
    await expect(page.getByRole('button', { name: step, exact: true })).toBeVisible();
  }
});

Given('o usuário acessa um link de recuperação expirado', async ({ page }) => {
  await page.goto('/auth/callback?error=access_denied&error_code=otp_expired&redirectTo=%2Fatualizar-senha');
});

Then('a orientação para solicitar um novo link deve ser exibida', async ({ page }) => {
  await expect(page.getByText(/Esse link expirou ou já foi utilizado/i)).toBeVisible();
});
