import { expect, test } from '@playwright/test'

async function assertNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement
    return doc.scrollWidth <= doc.clientWidth + 1
  })
  expect(overflow).toBe(true)
}

test('a configuração separa a definição compartilhada e não envia o formulário', async ({ page }) => {
  const email = process.env.E2E_OWNER_EMAIL || ''
  const password = process.env.E2E_OWNER_PASSWORD || ''
  test.skip(!email || !password, 'sem credencial de leitura')

  await page.goto('/login?redirectTo=%2Fadmin%2Feventos')
  await page.getByLabel('E-mail cadastrado').fill(email)
  await page.getByLabel('Senha', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Entrar na conta', exact: true }).click()
  await page.waitForURL(/\/admin\/eventos|\/dashboard/)

  if (!page.url().includes('/admin/eventos')) {
    await page.goto('/admin/eventos')
  }
  const configLink = page.locator('a[href*="/configuracao"]').first()
  if (await configLink.count()) {
    await configLink.click()
  } else {
    const eventLink = page.locator('a[href*="/admin/eventos/"]').first()
    test.skip(await eventLink.count() === 0, 'nenhum evento visível para leitura')
    await eventLink.click()
    await page.goto(page.url().replace(/\/?$/, '/configuracao'))
  }
  await expect(page.getByRole('heading', { name: 'Nova versão de categorias' })).toBeVisible()
  await expect(page.getByRole('option', { name: 'Unissex (M/F)' })).toHaveCount(0)

  const shared = page.locator('option').filter({ hasText: 'Parâmetros compartilhados' }).first()
  test.skip(await shared.count() === 0, 'o catálogo visível não tem definição compartilhada')
  const value = await shared.getAttribute('value')
  await page.locator('#catalog-category').selectOption(value || '')
  await expect(page.getByText('duas categorias efetivas, Masculino e Feminino')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Criar versão' })).toBeVisible()

  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width >= 768 ? 900 : 844 })
    await assertNoHorizontalOverflow(page)
  }
})
