import { expect, test } from '@playwright/test'

async function assertNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement
    return doc.scrollWidth <= doc.clientWidth + 1
  })
  expect(overflow).toBe(true)
}

async function loginAndOpenConfiguracao(page: import('@playwright/test').Page) {
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
}

test('a configuração separa a definição compartilhada e não envia o formulário (modo customizado)', async ({ page }) => {
  await loginAndOpenConfiguracao(page)

  const customTab = page.getByRole('tab', { name: 'Categoria customizada' })
  test.skip(await customTab.count() === 0, 'catálogo ausente; formulário já está no modo legado')
  await customTab.click()

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

test('seleção múltipla do catálogo: parcial, "selecionar todas" e teto de divisão sem limite, sem enviar o formulário', async ({ page }) => {
  await loginAndOpenConfiguracao(page)

  const catalogTab = page.getByRole('tab', { name: 'Selecionar do catálogo' })
  test.skip(await catalogTab.count() === 0, 'catálogo ausente; não há modo de seleção múltipla')
  await catalogTab.click()

  await expect(page.getByText('Nenhuma categoria selecionada ainda.')).toBeVisible()

  const checkboxes = page.locator('input[name="catalog_category_ids"]')
  const total = await checkboxes.count()
  test.skip(total === 0, 'catálogo publicado sem definições visíveis')

  // Seleção parcial: a primeira categoria da lista.
  await checkboxes.nth(0).check()
  await expect(page.getByText(/definição selecionada\.|categoria efetiva/)).toBeVisible()

  // "Selecionar todas" marca o total. Como o catálogo tem classes sem teto (a mais pesada de
  // cada divisão e, no caso do ADULTO/MASTER, também sem idade máxima), o aviso aponta a
  // primeira categoria que ainda precisa de um teto — nada é inventado automaticamente.
  const selectAll = page.getByLabel(/Selecionar todas as categorias do catálogo/)
  await selectAll.check()
  for (let index = 0; index < total; index += 1) {
    await expect(checkboxes.nth(index)).toBeChecked()
  }
  await expect(page.getByText(/idade máxima|peso máximo|categorias efetivas/)).toBeVisible()

  await selectAll.uncheck()
  for (let index = 0; index < total; index += 1) {
    await expect(checkboxes.nth(index)).not.toBeChecked()
  }
  await expect(page.getByText('Nenhuma categoria selecionada ainda.')).toBeVisible()

  // A classe mais pesada de cada divisão não tem teto de peso no catálogo: selecioná-la exige
  // um peso máximo operacional antes de criar a versão — nada é inventado automaticamente.
  const openEndedWeight = page.locator('label', { hasText: 'a partir de' }).first()
  test.skip(await openEndedWeight.count() === 0, 'catálogo publicado sem classe aberta de peso visível')
  await openEndedWeight.locator('input[type="checkbox"]').check()
  await expect(page.getByLabel(/Peso máximo, kg \(sem teto no catálogo\)/).first()).toBeVisible()

  await expect(page.getByRole('button', { name: 'Criar versão' })).toBeVisible()

  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width >= 768 ? 900 : 844 })
    await assertNoHorizontalOverflow(page)
  }
})
