import { expect, type Page } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { test } from '../support/fixtures';
import { LoginPage } from '../pages/LoginPage';

const { Given, When, Then } = createBdd(test);
const checkout = (page: Page) => page.getByRole('region', { name: 'Reservar pagamento', exact: true });

Given('que a emissão real no Asaas Sandbox foi habilitada', async () => {
  test.skip(process.env.E2E_ALLOW_ASAAS !== 'true', 'Use test:payments:asaas para autorizar POST e limpeza no Sandbox.');
});
Given('o perfil fictício está pronto para emissão', async ({ paymentData }) => { await paymentData.preparePayer(); });

When('abre a consulta de inscrições para pagamento', async ({ page }) => { await page.goto('/dashboard/inscricoes'); });
Then('o login deve preservar o destino do checkout', async ({ page }) => { await expect(page).toHaveURL(/\/login\?redirectTo=%2Fdashboard%2Finscricoes$/); });
Given('existem inscrições isoladas para testar o checkout', async ({ page, paymentData }) => {
  test.setTimeout(90000);
  expect(paymentData.events).toHaveLength(2);
  await page.goto('/dashboard/inscricoes');
  await expect(checkout(page)).toBeVisible();
});
When('seleciona o primeiro evento no checkout', async ({ page, paymentData }) => {
  await checkout(page).getByLabel('Evento', { exact: true }).selectOption(paymentData.events[0]);
});
Then('reservar fica bloqueado sem inscrições selecionadas', async ({ page }) => {
  await expect(checkout(page).getByRole('button', { name: 'Reservar pagamento' })).toBeDisabled();
  await expect(checkout(page).getByRole('checkbox', { checked: true })).toHaveCount(0);
});
When('seleciona duas inscrições e a forma {string}', async ({ page }, method: string) => {
  const boxes = checkout(page).getByRole('checkbox');
  await expect(boxes).toHaveCount(2);
  await boxes.nth(0).check(); await boxes.nth(1).check();
  await checkout(page).getByRole('radio', { name: method, exact: true }).check();
});
Then('o total do checkout deve ser {string}', async ({ page }, total: string) => {
  await expect(checkout(page).getByText(/^Total:/)).toContainText(total);
});
When('confirma a reserva pelo formulário', async ({ page }) => {
  await checkout(page).getByRole('button', { name: 'Reservar pagamento', exact: true }).click();
});
Then('o resumo e o banco devem confirmar uma reserva {string} de duas inscrições', async ({ page, paymentData }, method: string) => {
  await expect(checkout(page).getByRole('status')).toContainText('Reserva persistida.');
  const payments = await paymentData.payments();
  expect(payments).toHaveLength(1);
  expect(payments[0]).toMatchObject({ valor_total: 246.9, metodo: method.toLowerCase(), status: 'aguardando', payment_attempts: [] });
  expect(payments[0].payment_registrations.map(r => r.registration_id).sort()).toEqual(paymentData.registrations.slice(0, 2).sort());
  expect(payments[0].payment_registrations.every(r => r.amount === 123.45)).toBe(true);
  await checkout(page).getByRole('link', { name: 'Ver resumo do pagamento' }).click();
  await expect(page).toHaveURL(new RegExp(`/dashboard/pagamentos/${payments[0].id}$`));
  await expect(page.getByRole('heading', { name: 'Resumo do pagamento' })).toBeVisible();
  await expect(page.getByText('246,90', { exact: false })).toBeVisible();
  await test.info().attach('resumo-persistido', {
    body: await page.getByRole('heading', { name: 'Resumo do pagamento' }).locator('..').screenshot(),
    contentType: 'image/png',
  });
});
Then('atualizar a página deve preservar o resumo sem emitir cobrança', async ({ page, paymentData }) => {
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Resumo do pagamento' })).toBeVisible();
  await page.getByRole('link', { name: 'Voltar às inscrições' }).click();
  const payments = await paymentData.payments();
  await expect(page.getByRole('region', { name: 'Pagamentos reservados' }).getByRole('link').filter({ hasText: paymentData.eventNames[0] })).toBeVisible();
  expect(payments).toHaveLength(1);
  expect(payments[0].payment_attempts).toEqual([]);
  const { data, error } = await paymentData.admin.from('registrations').select('status').in('id', paymentData.registrations);
  expect(error).toBeNull(); expect(data?.every(r => r.status === 'pendente_pagamento')).toBe(true);
});
When('troca para o segundo evento', async ({ page, paymentData }) => { await checkout(page).getByLabel('Evento', { exact: true }).selectOption(paymentData.events[1]); });
When('o prazo de pagamento expira no banco', async ({ paymentData }) => { await paymentData.expire(); });
Then('o checkout informa {string}', async ({ page }, message: string) => { await expect(checkout(page).getByRole('alert')).toHaveText(message); });
Then('nenhuma reserva deve existir no banco', async ({ paymentData }) => { expect(await paymentData.payments()).toHaveLength(0); });
When('seleciona somente a primeira inscrição', async ({ page }) => {
  await checkout(page).getByRole('checkbox').nth(0).check();
});
When('escolhe a forma {string}', async ({ page }, method: string) => {
  await checkout(page).getByRole('radio', { name: method, exact: true }).check();
});
Then('uma reserva individual deve estar persistida', async ({ page, paymentData }) => {
  await expect(checkout(page).getByRole('status')).toContainText('1 inscrição(ões)');
  const payments = await paymentData.payments();
  expect(payments).toHaveLength(1);
  expect(payments[0]).toMatchObject({ valor_total: 123.45, metodo: 'pix', status: 'aguardando', payment_attempts: [] });
  expect(payments[0].payment_registrations).toHaveLength(1);
  await checkout(page).getByRole('link', { name: 'Ver resumo do pagamento' }).click();
  await expect(page.getByRole('heading', { name: 'Resumo do pagamento' })).toBeVisible();
  await expect(page.getByText('123,45', { exact: false })).toBeVisible();
});
Then('uma reserva individual {string} deve estar persistida', async ({ page, paymentData }, method: string) => {
  await expect(checkout(page).getByRole('status')).toContainText('Reserva persistida.');
  const payments = await paymentData.payments();
  expect(payments).toHaveLength(1);
  expect(payments[0]).toMatchObject({
    valor_total: 123.45,
    metodo: method === 'Boleto' ? 'boleto' : 'pix',
    status: 'aguardando',
    payment_attempts: [],
  });
  expect(payments[0].payment_registrations).toHaveLength(1);
  await checkout(page).getByRole('link', { name: 'Ver resumo do pagamento' }).click();
  await expect(page.getByRole('heading', { name: 'Resumo do pagamento' })).toBeVisible();
});
When('uma inscrição selecionada expira no banco', async ({ paymentData }) => {
  const { error } = await paymentData.admin.from('registrations').update({ status: 'expirada' }).eq('id', paymentData.registrations[0]);
  expect(error).toBeNull();
});
When('envia reservas simultâneas por duas abas', async ({ page, context, paymentData }) => {
  const second = await context.newPage();
  try {
    await second.goto('/dashboard/inscricoes');
    await checkout(second).getByLabel('Evento', { exact: true }).selectOption(paymentData.events[0]);
    await checkout(second).getByRole('checkbox').nth(0).check();
    await checkout(second).getByRole('checkbox').nth(1).check();
    await Promise.all([page, second].map(tab => checkout(tab).getByRole('button', { name: 'Reservar pagamento', exact: true }).click()));
    await Promise.all([page, second].map(tab => expect(checkout(tab).locator('[role="status"], [role="alert"]')).toBeVisible()));
    const messages = await Promise.all([page, second].map(tab => checkout(tab).locator('[role="status"], [role="alert"]').innerText()));
    expect(messages.filter(message => message.includes('Reserva persistida.'))).toHaveLength(1);
    expect(messages.filter(message => message.includes('já possui pagamento ativo'))).toHaveLength(1);
  } finally { await second.close(); }
});
When('adultera uma inscrição para {string}', async ({ page, paymentData }, target: string) => {
  await checkout(page).getByRole('checkbox').nth(1).evaluate((node, id) => { (node as HTMLInputElement).value = id; }, paymentData.registrations[target === 'outro evento' ? 2 : 3]);
});
When('injeta um preço de um centavo no formulário', async ({ page }) => {
  await checkout(page).locator('form').evaluate(form => {
    for (const name of ['total', 'valor', 'amount']) {
      const input = document.createElement('input'); input.type = 'hidden'; input.name = name; input.value = '0.01'; form.appendChild(input);
    }
  });
});
When('tenta reservar as mesmas inscrições por duas abas', async ({ page, context, paymentData }) => {
  const second = await context.newPage();
  try {
    await second.goto('/dashboard/inscricoes');
    await checkout(second).getByLabel('Evento', { exact: true }).selectOption(paymentData.events[0]);
    await checkout(second).getByRole('checkbox').nth(0).check();
    await checkout(second).getByRole('checkbox').nth(1).check();
    await checkout(page).getByRole('button', { name: 'Reservar pagamento', exact: true }).click();
    await expect(checkout(page).getByRole('status')).toContainText('Reserva persistida.');
    await checkout(second).getByRole('button', { name: 'Reservar pagamento', exact: true }).click();
    await expect(checkout(second).getByRole('alert')).toContainText('já possui pagamento ativo');
    // Preserve visible evidence in the primary page before closing the second tab.
    await page.goto(second.url());
  } finally { await second.close(); }
});
Then('somente uma reserva deve existir e a segunda aba informa duplicidade', async ({ paymentData }) => { expect(await paymentData.payments()).toHaveLength(1); });
Then('somente uma reserva deve existir no banco', async ({ paymentData }) => { expect(await paymentData.payments()).toHaveLength(1); });
When('outro usuário tenta abrir esse resumo', async ({ page, context }) => {
  const target = page.url();
  const email = process.env.E2E_UNAUTHORIZED_EMAIL, password = process.env.E2E_UNAUTHORIZED_PASSWORD;
  if (!email || !password || email === process.env.E2E_OWNER_EMAIL) throw new Error('Configure usuário UNAUTHORIZED distinto do OWNER.');
  await context.clearCookies();
  const login = new LoginPage(page);
  await login.open('/dashboard'); await login.login(email, password);
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.goto(target);
});
Then('os dados do pagamento não devem ser expostos', async ({ page, paymentData }) => {
  await expect(page.getByText('404', { exact: true })).toBeVisible();
  await expect(page.getByText(paymentData.eventNames[0], { exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Resumo do pagamento' })).toHaveCount(0);
});
When('emite a cobrança no Asaas Sandbox', async ({ page }) => {
  await page.getByRole('button', { name: 'Emitir cobrança', exact: true }).click();
});
Then('as instruções de {string} e uma tentativa devem ser exibidas e persistidas', async ({ page, paymentData }, method: string) => {
  await expect(page.getByRole('status')).toContainText('Cobrança criada no Asaas Sandbox.');
  if (method === 'PIX') {
    const copyPaste = page.getByRole('textbox', { name: 'PIX copia e cola:' });
    if (await copyPaste.count()) await expect(copyPaste).not.toHaveValue('');
    else await expect(page.getByText('As instruções PIX ainda estão sendo consultadas.')).toBeVisible();
  } else await expect(page.getByRole('link', { name: 'Abrir boleto' })).toHaveAttribute('href', /^https:\/\/[^/]*asaas\.com\//);
  const payments = await paymentData.payments();
  expect(payments).toHaveLength(1);
  expect(payments[0].status).toBe('aguardando');
  expect(payments[0].payment_attempts).toHaveLength(1);
  expect(payments[0].payment_attempts[0].gateway_payment_id).toMatch(/^pay_[A-Za-z0-9]+$/);
  const { data: registrations, error } = await paymentData.admin.from('registrations').select('status').in('id', paymentData.registrations);
  expect(error).toBeNull();
  expect(registrations?.every(registration => registration.status === 'pendente_pagamento')).toBe(true);
});
When('recarrega e solicita novamente a mesma cobrança', async ({ page }) => {
  await page.reload();
  await page.getByRole('button', { name: 'Emitir cobrança', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Cobrança criada no Asaas Sandbox.');
});
Then('a mesma tentativa deve ser reutilizada sem duplicidade', async ({ paymentData }) => {
  const payments = await paymentData.payments();
  expect(payments).toHaveLength(1);
  expect(payments[0].payment_attempts).toHaveLength(1);
});
