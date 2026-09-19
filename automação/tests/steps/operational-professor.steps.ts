import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test } from '../support/fixtures';

const { Given, When, Then } = createBdd(test);

function visibleRecord(page: import('@playwright/test').Page, text: string) {
  return page.locator('tr:visible, article:visible').filter({ hasText: text }).first();
}

Given('que existe um evento isolado com dois atletas da mesma equipe', async ({ operationalProfessorData }) => {
  expect(operationalProfessorData.eventId).toBeTruthy();
});

When('entra com a conta que gerencia os atletas', async ({ page, operationalProfessorData }) => {
  await page.goto('/login');
  await page.getByLabel('E-mail cadastrado').fill(operationalProfessorData.email);
  await page.getByLabel('Senha').fill(operationalProfessorData.password);
  await page.getByRole('button', { name: 'Entrar na conta' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
});

When('inscreve os dois atletas com professores operacionais distintos', async ({ page, operationalProfessorData }) => {
  await page.goto(`/eventos/${operationalProfessorData.eventId}/inscricao/cadastrar-atleta`);
  for (const [index, name] of operationalProfessorData.athleteNames.entries()) {
    await page.getByLabel(`Selecionar ${name}`).check();
    await page.getByRole('textbox', { name: 'Professor operacional' }).nth(index).fill(operationalProfessorData.professorNames[index]);
    const link = page.getByLabel('Sou o professor operacional desta inscrição').nth(index);
    if (await link.count()) await link.uncheck();
  }
  await page.getByLabel('Li e aceito os termos de inscrição.').check();
  await page.getByRole('button', { name: 'Confirmar inscrições' }).click();
  await expect(page.getByText('inscrição(ões) criada(s)')).toBeVisible();
});

Then('as inscrições mostram os professores informados', async ({ page, operationalProfessorData }) => {
  await page.goto('/dashboard/inscricoes');
  for (const name of operationalProfessorData.professorNames) {
    await expect(page.getByText(name).first()).toBeVisible();
  }
});

When('acompanha a checagem pública do evento operacional', async ({ page, operationalProfessorData }) => {
  await operationalProfessorData.openChecking();
  await page.goto(`/eventos/${operationalProfessorData.eventId}/checagem`);
  await expect(page.getByRole('heading', { name: /^Checagem/ })).toBeVisible();
});

Then('os dois professores operacionais aparecem', async ({ page, operationalProfessorData }) => {
  for (const name of operationalProfessorData.professorNames) {
    await expect(visibleRecord(page, name)).toBeVisible();
  }
});

When('filtra a checagem pública pelo primeiro professor operacional', async ({ page, operationalProfessorData }) => {
  await page.getByLabel('Filtrar por professor').selectOption(operationalProfessorData.professorNames[0]);
  await page.getByRole('button', { name: 'Filtrar' }).click();
  expect(new URL(page.url()).searchParams.get('professor')).toBe(operationalProfessorData.professorNames[0]);
});

Then('somente o atleta daquele professor permanece visível', async ({ page, operationalProfessorData }) => {
  await expect(visibleRecord(page, operationalProfessorData.athleteNames[0])).toBeVisible();
  await expect(page.getByRole('main').getByText(operationalProfessorData.athleteNames[1], { exact: true })).toHaveCount(0);
});

Then('a conta do professor operacional não aparece na checagem pública', async ({ page, operationalProfessorData }) => {
  const body = await page.getByRole('main').innerText();
  expect(body).not.toContain(operationalProfessorData.email);
  expect(body.toLowerCase()).not.toMatch(/@example\.invalid|telefone|e-mail/);
});
