import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test } from '../support/fixtures';
const { When, Then } = createBdd(test);

When('cria evento com prazo de inscrição vigente', async ({ page, scenarioData }) => {
  test.setTimeout(90000);
  await page.goto('/admin/eventos/novo');
  await page.getByLabel('Nome do evento').fill(scenarioData.event);
  const date = (offset: number) => new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);
  await page.getByLabel('Data do evento').fill(date(30));
  await page.getByLabel('Local', { exact: true }).fill('Ginásio E2E');
  await page.getByLabel('Valor da inscrição').fill('123.45');
  for (const [label, start, end] of [['Inscrição', -1, 5], ['Pagamento', 6, 10], ['Checagem', 11, 15], ['Chaves', 16, 20]] as const) {
    const group = page.getByText(label, { exact: true }).locator('..');
    await group.getByLabel('Início').fill(date(start) + 'T00:00');
    await group.getByLabel('Término').fill(date(end) + 'T23:00');
  }
  await page.getByRole('button', { name: 'Publicar', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/eventos$/);
});
When('configura categoria elegível para o atleta da inscrição', async ({ page }) => {
  await page.getByLabel('Nome do conjunto').fill('Regras inscrição E2E');
  await page.getByLabel('Nome da categoria').fill('Adulto Branca E2E');
  await page.getByLabel('Idade máxima').fill('99');
  await page.getByLabel('Peso máximo').fill('100');
  await page.getByRole('button', { name: 'Criar versão' }).click();
  await expect(page.getByText('Versão 1 criada com sucesso.', { exact: true })).toBeVisible();
});
When('abre inscrições do evento criado', async ({ page, scenarioData }) => {
  await page.goto('/admin/eventos');
  const card = page.getByRole('article').filter({ hasText: scenarioData.event });
  await card.getByRole('button', { name: 'Abrir inscrições' }).click();
  await expect(card.getByRole('button', { name: 'Abrir inscrições' })).toHaveCount(0);
});
When('acessa o formulário de inscrição do evento criado', async ({ page, scenarioData }) => {
  const card = page.getByRole('article').filter({ hasText: scenarioData.event });
  await card.getByRole('link', { name: 'Página pública' }).click();
  await page.getByRole('link', { name: 'Inscrever atletas' }).click();
});
Then('confirmar inscrições fica bloqueado sem seleção e aceite', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Confirmar inscrições' })).toBeDisabled();
});
When('seleciona o atleta e aceita os termos', async ({ page, scenarioData }) => {
  await page.getByLabel(scenarioData.athlete, { exact: true }).check();
  await expect(page.getByRole('button', { name: 'Confirmar inscrições' })).toBeDisabled();
  await page.getByLabel('Li e aceito os termos').check();
  await expect(page.getByText(/Total: R\$\s*123,45/)).toBeVisible();
});
When('confirma as inscrições', async ({ page }) => {
  await page.getByRole('button', { name: 'Confirmar inscrições' }).click();
});
Then('a inscrição pendente deve ser confirmada', async ({ page }) => {
  await expect(page.getByRole('status')).toContainText('1 inscrição(ões) criada(s). Pendente de pagamento.');
});
Then('o atleta inscrito não pode ser selecionado novamente', async ({ page, scenarioData }) => {
  await page.reload();
  await expect(page.getByLabel(scenarioData.athlete, { exact: true })).toBeDisabled();
});
Then('o histórico apresenta a inscrição com categoria e preço', async ({ page, scenarioData }) => {
  await page.getByLabel(scenarioData.athlete, { exact: true }).locator('../..').getByRole('link', { name: 'Ver histórico de inscrições' }).click();
  const card = page.getByRole('article').filter({ hasText: scenarioData.event });
  await expect(card).toContainText('Adulto Branca E2E');
  await expect(card).toContainText('123,45');
  await expect(card).toContainText('pendente pagamento');
});
Then('o atleta sem categoria não pode ser selecionado', async ({ page, scenarioData }) => {
  const input = page.getByLabel(scenarioData.athlete, { exact: true });
  await expect(input).toBeDisabled();
  await expect(input.locator('../..')).toContainText('Nenhuma categoria elegível');
});
Then('a inscrição aparece na consulta consolidada', async ({ page, scenarioData }) => {
  await page.goto('/dashboard/inscricoes');
  const card = page.getByRole('article').filter({ hasText: scenarioData.event });
  await expect(card).toContainText(scenarioData.athlete);
  await expect(card).toContainText('Adulto Branca E2E');
  await expect(card).toContainText('123,45');
});
Then('o prazo indisponível deve ser informado', async ({ page }) => {
  await expect(page.getByText('Este evento está fora do prazo de inscrição.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirmar inscrições' })).toHaveCount(0);
});
