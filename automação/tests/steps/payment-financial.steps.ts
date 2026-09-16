import { expect } from '@playwright/test'
import { createBdd } from 'playwright-bdd'
import { test } from '../support/fixtures'

const { Given, When, Then } = createBdd(test)
const reason = 'Recebimento conferido manualmente pela organização no teste E2E'

Given('que o usuário é owner do evento da reserva', async ({ paymentData }) => {
  await paymentData.grantEventRole('owner')
})

When('abre o financeiro do evento', async ({ page, paymentData }) => {
  await page.goto(`/admin/eventos/${paymentData.events[0]}/financeiro`)
})

When('confirma a baixa manual com justificativa', async ({ page }) => {
  await expect(page.getByRole('heading', { name: /^Financeiro/ })).toBeVisible()
  await page.getByLabel('Justificativa da baixa manual').fill(reason)
  await page.getByRole('checkbox', { name: /Confirmo que conferi/ }).check()
  await page.getByRole('button', { name: 'Confirmar baixa manual' }).click()
  await expect(page.getByRole('status')).toContainText('Baixa manual registrada e auditada.')
})

Then('pagamento e inscrição ficam pagos com auditoria', async ({ paymentData }) => {
  const payments = await paymentData.payments()
  expect(payments).toHaveLength(1)
  expect(payments[0].status).toBe('pago')
  const { data: registrations, error } = await paymentData.admin.from('registrations').select('status').eq('id', paymentData.registrations[0]).single()
  expect(error).toBeNull()
  expect(registrations?.status).toBe('efetivada')
  expect(await paymentData.auditFor(payments[0].id)).toEqual([expect.objectContaining({ action: 'payment_manually_settled', reason })])
})

Then('retorna ao dashboard com negação financeira', async ({ page }) => {
  await expect(page).toHaveURL(/\/dashboard\?erro=sem_permissao$/)
  await expect(page.getByRole('heading', { name: /^Financeiro/ })).toHaveCount(0)
})
