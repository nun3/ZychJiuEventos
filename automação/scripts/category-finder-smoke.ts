/**
 * Smoke visual: Descobrir minha categoria (público).
 * Cria evento + categorias vinculadas ao catálogo GI v1 e valida classificação
 * e disponibilidade em desktop, 390 px e 320 px. Não altera financeiro.
 */
import { chromium, expect } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import {
  SANDBOX_HOST,
  createCleanupClients,
  deleteEventOperationalGraph,
  loadCleanupEnv,
} from '../tests/support/e2e-cleanup'
import {
  RELEASE_ORG_NAME,
  assertHomologationEnvironment,
} from '../tests/support/homologation-guard'

const FEE = 80

function runIdNow() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date())
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || ''
  return `cat-finder-smoke-${value('year')}${value('month')}${value('day')}-${value('hour')}${value('minute')}${value('second')}`
}

function dateOffset(offset: number) {
  return new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10)
}

async function fillPhase(page: import('@playwright/test').Page, label: string, startOffset: number, endOffset: number) {
  const group = page.getByText(label, { exact: true }).locator('..')
  await group.getByLabel('Início').fill(`${dateOffset(startOffset)}T00:00`)
  await group.getByLabel('Término').fill(`${dateOffset(endOffset)}T23:00`)
}

async function main() {
  loadCleanupEnv()
  process.env.E2E_ALLOW_WRITES = 'true'
  const env = assertHomologationEnvironment(process.env)

  const runId = runIdNow()
  const eventName = `${runId} — Category Finder`
  const baseURL = process.env.BASE_URL || 'http://localhost:3000'
  const evidenceDir = path.resolve(
    __dirname,
    '../../docs/design-system/evidencias/category-finder',
    runId,
  )
  mkdirSync(evidenceDir, { recursive: true })

  const { admin, actor } = await createCleanupClients()
  const org = await admin.from('organizations').select('id, nome').eq('id', env.organizationId).maybeSingle()
  if (org.data?.nome !== RELEASE_ORG_NAME) throw new Error('Organização ativa não é MEU CAMP.')

  const ownerEmail = process.env.E2E_OWNER_EMAIL || ''
  if (!ownerEmail) throw new Error('E2E_OWNER_EMAIL ausente.')

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  const publicContext = await browser.newContext({ baseURL, viewport: { width: 1440, height: 900 } })
  const publicPage = await publicContext.newPage()

  let eventId = ''
  const report: Record<string, unknown> = { runId, eventName, baseURL }

  try {
    const link = await admin.auth.admin.generateLink({ type: 'magiclink', email: ownerEmail })
    if (link.error || !link.data.properties?.hashed_token) {
      throw new Error(`Sessão owner: ${link.error?.message || 'link ausente'}`)
    }
    const verified = await actor.auth.verifyOtp({
      token_hash: link.data.properties.hashed_token,
      type: 'email',
    })
    if (verified.error || !verified.data.session) {
      throw new Error(`Sessão owner: ${verified.error?.message || 'falhou'}`)
    }
    await context.clearCookies()
    await context.addCookies([
      {
        name: `sb-${SANDBOX_HOST.split('.')[0]}-auth-token`,
        value: JSON.stringify(verified.data.session),
        url: baseURL,
        httpOnly: false,
        secure: baseURL.startsWith('https://'),
        sameSite: 'Lax',
      },
    ])

    await page.goto('/admin/eventos/novo')
    await page.getByRole('heading', { name: 'Criar evento' }).waitFor()
    await page.getByLabel('Nome do evento').fill(eventName)
    await page.getByLabel('Data do evento').fill(dateOffset(30))
    await page.keyboard.press('Escape')
    await page.getByLabel('Local', { exact: true }).fill('Ginásio Category Finder — Curitiba/PR')
    await page.getByLabel('Valor da inscrição (R$)').fill(String(FEE))
    await page.getByLabel('Informações').fill('Smoke público do Descobrir minha categoria.')
    await fillPhase(page, 'Inscrição', -1, 10)
    await fillPhase(page, 'Pagamento', 11, 15)
    await fillPhase(page, 'Checagem', 16, 20)
    await fillPhase(page, 'Chaves', 21, 25)
    await page.getByRole('button', { name: 'Publicar', exact: true }).click()
    await page.waitForURL(/\/admin\/eventos$/, { timeout: 20000 })

    const created = await admin
      .from('events')
      .select('id, organization_id, status, data_evento')
      .eq('nome', eventName)
      .single()
    if (!created.data || created.data.organization_id !== env.organizationId) {
      throw new Error('Evento category finder não persistiu na MEU CAMP.')
    }
    eventId = created.data.id
    report.eventId = eventId
    report.eventStatus = created.data.status
    report.eventDate = created.data.data_evento

    const catalogQuery = await admin
      .from('sport_category_catalogs')
      .select('id, sport_category_definitions(id, nome, divisao_etaria, genero)')
      .eq('sport', 'jiu-jitsu')
      .eq('modality', 'gi')
      .eq('versao', 1)
      .single()
    if (!catalogQuery.data) throw new Error(`Catálogo GI v1 ausente: ${catalogQuery.error?.message || 'sem dados'}`)
    const adultMaleDefinitions = catalogQuery.data.sport_category_definitions.filter(
      (item) => item.divisao_etaria === 'ADULTO/MASTER' && item.genero === 'M',
    )
    const catalogCategory = (name: string) => {
      const item = adultMaleDefinitions.find((definition) => definition.nome === name)
      if (!item) throw new Error(`Categoria ${name} ausente no catálogo GI v1.`)
      return item.id
    }

    await page.goto(`/admin/eventos/${eventId}/configuracao`)
    await page.getByLabel('Nome do conjunto').fill('Regras Category Finder')
    await page.getByLabel('Nome da categoria').fill('Adulto Masculino Leve')
    await page.getByLabel('Categoria teórica vinculada').selectOption(catalogCategory('Leve'))
    await page.getByLabel('Gênero').selectOption('M')
    await page.getByLabel('Idade mínima').fill('18')
    await page.getByLabel('Idade máxima').fill('29')
    await page.getByLabel('Faixa mínima').fill('1')
    await page.getByLabel('Faixa máxima').fill('9')
    await page.getByLabel('Peso mínimo').fill('0')
    await page.getByLabel('Peso máximo').fill('76')
    await page.getByRole('button', { name: 'Criar versão' }).click()
    await expect(page.getByText(/Versão 1 criada com sucesso|Adulto Masculino Leve/)).toBeVisible({
      timeout: 15000,
    })

    const rule = await admin
      .from('category_rule_sets')
      .select('id, nome, versao, ativo')
      .eq('event_id', eventId)
      .eq('ativo', true)
      .single()
    if (!rule.data) throw new Error('Rule set ativo ausente após UI.')
    report.ruleSet = rule.data

    // Segunda categoria no mesmo rule set (UI cria 1 por versão).
    const medio = await actor.from('event_categories').insert({
      rule_set_id: rule.data.id,
      nome: 'Adulto Masculino Médio',
      genero: 'M',
      idade_min: 18,
      idade_max: 29,
      faixa_min_ordem: 1,
      faixa_max_ordem: 9,
      peso_min_kg: 76.01,
      peso_max_kg: 88,
      ordem: 2,
      ativa: true,
      catalog_category_id: catalogCategory('Médio'),
    })
    if (medio.error) throw new Error(`Segunda categoria: ${medio.error.message}`)

    const custom = await actor.from('event_categories').insert({
      rule_set_id: rule.data.id,
      nome: 'Pesado customizado sem associação',
      genero: 'M',
      idade_min: 18,
      idade_max: 29,
      faixa_min_ordem: 1,
      faixa_max_ordem: 9,
      peso_min_kg: 88.4,
      peso_max_kg: 94.3,
      ordem: 3,
      ativa: true,
      catalog_category_id: null,
    })
    if (custom.error) throw new Error(`Categoria customizada: ${custom.error.message}`)
    report.customCategory = 'OK — aceita com catalog_category_id=null'

    // —— Público anônimo ——
    await publicPage.goto(`/eventos/${eventId}`)
    await publicPage.getByRole('heading', { name: eventName }).waitFor()
    await expect(publicPage.getByRole('heading', { name: /Categorias/ })).toBeVisible()
    const openFinder = publicPage.getByRole('button', { name: 'Descobrir minha categoria' })
    await expect(openFinder).toBeVisible()
    await openFinder.click()
    const dialog = publicPage.getByRole('dialog', { name: 'Descubra sua categoria' })
    await expect(dialog).toBeVisible()

    await dialog.getByLabel('Data de nascimento').fill('10052000')
    await expect(dialog.getByLabel('Data de nascimento')).toHaveValue('10/05/2000')
    await dialog.getByLabel('Sexo').selectOption('M')
    await dialog.getByLabel('Faixa').selectOption('Branca')
    await dialog.getByLabel('Peso atual').fill('75')
    await dialog.getByRole('button', { name: 'Ver minha categoria' }).click()
    await expect(dialog.getByRole('heading', { name: 'Leve', exact: true })).toBeVisible()
    await expect(dialog.getByText('76 kg', { exact: true })).toBeVisible()
    await expect(dialog.getByText('Disponível neste campeonato')).toBeVisible()
    report.matchCase = 'OK — 75kg → Leve disponível'

    if (created.data.status === 'inscricao') {
      await expect(dialog.getByRole('link', { name: 'Fazer inscrição' })).toBeVisible()
      report.cta = 'OK — visível (inscricao)'
    } else {
      await expect(dialog.getByRole('link', { name: 'Fazer inscrição' })).toHaveCount(0)
      report.cta = `OK — ausente (status=${created.data.status})`
    }

    writeFileSync(
      path.join(evidenceDir, 'local-desktop-1440-match.png'),
      await publicPage.screenshot({ fullPage: false }),
    )

    await dialog.getByLabel('Peso atual').fill('81')
    await dialog.getByRole('button', { name: 'Ver minha categoria' }).click()
    await expect(dialog.getByRole('heading', { name: 'Médio', exact: true })).toBeVisible()
    await expect(dialog.getByText('82,3 kg', { exact: true })).toBeVisible()
    await expect(dialog.getByText('Disponível neste campeonato')).toBeVisible()
    report.weightChange = 'OK — 81kg → Médio disponível'
    writeFileSync(
      path.join(evidenceDir, 'local-desktop-1440-weight-change.png'),
      await publicPage.screenshot({ fullPage: false }),
    )

    await dialog.getByLabel('Peso atual').fill('92')
    await dialog.getByRole('button', { name: 'Ver minha categoria' }).click()
    await expect(dialog.getByRole('heading', { name: 'Pesado', exact: true })).toBeVisible()
    await expect(dialog.getByText('Não disponível neste campeonato')).toBeVisible()
    await expect(dialog.getByRole('link', { name: 'Ver categorias disponíveis' })).toBeVisible()
    report.unavailable = 'OK — 92kg → Pesado teórico indisponível'
    writeFileSync(
      path.join(evidenceDir, 'local-desktop-1440-no-match.png'),
      await publicPage.screenshot({ fullPage: false }),
    )

    await dialog.getByRole('button', { name: 'Fechar' }).click()
    await expect(publicPage.getByRole('dialog', { name: 'Descubra sua categoria' })).toHaveCount(0)

    await publicPage.setViewportSize({ width: 390, height: 844 })
    await publicPage.goto(`/eventos/${eventId}`)
    await publicPage.getByRole('button', { name: 'Descobrir minha categoria' }).click()
    const mobileDialog = publicPage.getByRole('dialog', { name: 'Descubra sua categoria' })
    await mobileDialog.getByLabel('Data de nascimento').fill('10052000')
    await expect(mobileDialog.getByLabel('Data de nascimento')).toHaveValue('10/05/2000')
    await mobileDialog.getByLabel('Sexo').selectOption('M')
    await mobileDialog.getByLabel('Faixa').selectOption('Branca')
    await mobileDialog.getByLabel('Peso atual').fill('75')
    await mobileDialog.getByRole('button', { name: 'Ver minha categoria' }).click()
    const mobileResult = mobileDialog.getByRole('heading', { name: 'Leve', exact: true })
    await expect(mobileResult).toBeVisible()
    await mobileResult.scrollIntoViewIfNeeded()
    await expect(mobileDialog.getByText('Disponível neste campeonato')).toBeVisible()
    const overflow = await publicPage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
    if (overflow) throw new Error('Overflow horizontal em 390px')
    writeFileSync(
      path.join(evidenceDir, 'local-mobile-390.png'),
      await publicPage.screenshot({ fullPage: false }),
    )
    report.mobile = 'OK'

    await publicPage.setViewportSize({ width: 320, height: 720 })
    await mobileResult.scrollIntoViewIfNeeded()
    await expect(mobileDialog.getByText('Disponível neste campeonato')).toBeVisible()
    const overflow320 = await publicPage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
    if (overflow320) throw new Error('Overflow horizontal em 320px')
    writeFileSync(
      path.join(evidenceDir, 'local-mobile-320.png'),
      await publicPage.screenshot({ fullPage: false }),
    )

    const deactivateCatalogRule = await actor.from('category_rule_sets').update({ ativo: false }).eq('id', rule.data.id)
    if (deactivateCatalogRule.error) throw new Error(`Desativar rule set catalogado: ${deactivateCatalogRule.error.message}`)
    const legacyRule = await actor.from('category_rule_sets').insert({
      event_id: eventId,
      nome: 'Regra legada de compatibilidade',
      versao: 2,
      ativo: true,
      category_catalog_id: null,
    }).select('id').single()
    if (!legacyRule.data || legacyRule.error) throw new Error(`Rule set legado: ${legacyRule.error?.message || 'sem dados'}`)
    const legacyCategory = await actor.from('event_categories').insert({
      rule_set_id: legacyRule.data.id,
      nome: 'Legado Médio',
      genero: 'M',
      idade_min: 18,
      idade_max: 99,
      faixa_min_ordem: 1,
      faixa_max_ordem: 9,
      peso_min_kg: 0,
      peso_max_kg: 88,
      ordem: 1,
      ativa: true,
      catalog_category_id: null,
    })
    if (legacyCategory.error) throw new Error(`Categoria legada: ${legacyCategory.error.message}`)

    await publicPage.setViewportSize({ width: 1440, height: 900 })
    await publicPage.goto(`/eventos/${eventId}`)
    await publicPage.getByRole('button', { name: 'Descobrir minha categoria' }).click()
    const legacyDialog = publicPage.getByRole('dialog', { name: 'Descubra sua categoria' })
    await legacyDialog.getByLabel('Data de nascimento').fill('10052000')
    await legacyDialog.getByLabel('Sexo').selectOption('M')
    await legacyDialog.getByLabel('Faixa').selectOption('Branca')
    await legacyDialog.getByLabel('Peso atual').fill('81')
    await legacyDialog.getByRole('button', { name: 'Ver minha categoria' }).click()
    await expect(legacyDialog.getByRole('heading', { name: 'Legado Médio', exact: true })).toBeVisible()
    await expect(legacyDialog.getByText(/GI · catálogo/)).toHaveCount(0)
    report.legacyEvent = 'OK — fallback sem classificação oficial inventada'
    writeFileSync(
      path.join(evidenceDir, 'local-desktop-1440-legacy.png'),
      await publicPage.screenshot({ fullPage: false }),
    )

    report.desktop = 'OK'
    report.smoke = 'OK'
    report.evidenceDir = evidenceDir
    console.log(JSON.stringify(report, null, 2))
  } finally {
    await publicContext.close().catch(() => undefined)
    await context.close().catch(() => undefined)
    await browser.close().catch(() => undefined)

    try {
      if (!runId.startsWith('cat-finder-smoke-')) throw new Error('Cleanup abortado: RUN_ID inválido.')
      const events = await admin
        .from('events')
        .select('id, nome, organization_id')
        .eq('organization_id', env.organizationId)
        .like('nome', `${runId}%`)
      const ids = (events.data || [])
        .filter((row) => row.nome.startsWith(runId) && row.organization_id === env.organizationId)
        .map((row) => row.id)
      if (eventId && !ids.includes(eventId)) ids.push(eventId)
      if (ids.length) {
        await deleteEventOperationalGraph(admin, ids)
        const rules = await admin.from('category_rule_sets').select('id').in('event_id', ids)
        if (rules.error) throw new Error(`Cleanup rule sets lookup: ${rules.error.message}`)
        const ruleIds = (rules.data || []).map((row) => row.id)
        if (ruleIds.length) {
          const categoriesDelete = await admin.from('event_categories').delete().in('rule_set_id', ruleIds)
          if (categoriesDelete.error) throw new Error(`Cleanup categories: ${categoriesDelete.error.message}`)
        }
        const rulesDelete = await admin.from('category_rule_sets').delete().in('event_id', ids)
        if (rulesDelete.error) throw new Error(`Cleanup rule sets: ${rulesDelete.error.message}`)
        const phasesDelete = await admin.from('event_phases').delete().in('event_id', ids)
        if (phasesDelete.error) throw new Error(`Cleanup phases: ${phasesDelete.error.message}`)
        const auditDelete = await admin.from('event_audit_logs').delete().in('event_id', ids)
        if (auditDelete.error) throw new Error(`Cleanup audit: ${auditDelete.error.message}`)
        const eventsDelete = await admin.from('events').delete().in('id', ids)
        if (eventsDelete.error) throw new Error(`Cleanup events: ${eventsDelete.error.message}`)
      }
      report.cleanup = `OK (${ids.length})`
    } catch (error) {
      console.error('Cleanup falhou:', error)
      report.cleanup = 'FALHA'
    }
  }

  if (report.smoke !== 'OK') process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
