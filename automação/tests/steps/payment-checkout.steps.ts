import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test } from '../support/fixtures';

const { When, Then } = createBdd(test);

Then('a seleção contém somente atletas gerenciados pelo pagador', async ({ page, paymentData }) => {
  const area = page.getByRole('region', { name: 'Reservar pagamento', exact: true });
  await expect(area.getByRole('checkbox')).toHaveCount(2);
  await expect(area.getByText(paymentData.athleteNames[2], { exact: false })).toHaveCount(0);
  await expect(area.getByRole('radio', { name: 'PIX', exact: true })).toBeChecked();
});

When('adultera o método de pagamento para cartão', async ({ page }) => {
  await page.getByRole('radio', { name: 'PIX', exact: true }).evaluate(node => {
    (node as HTMLInputElement).value = 'credit_card';
  });
});
