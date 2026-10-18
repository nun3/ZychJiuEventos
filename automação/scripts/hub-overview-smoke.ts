/**
 * Smoke direcionado: Visão geral pública preserva texto com "Sandbox".
 * Não executa Full Event.
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
import { resolvePublicOverviewText } from '../../lib/events/public-event-presentation'

const FEE = 80
const OVERVIEW =
  'Evento de validação pública do Sandbox MEU CAMP. Este campeonato testa a exibição correta da Visão geral no hub público.'

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
  return `hub-overview-smoke-${value('year')}${value('month')}${value('day')}-${value('hour')}${value('minute')}${value('second')}`
}

function dateOffset(offset: number) {
  return new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10)
}

async function fillPhase(page: import('@playwright/test').Page, label: string, startOffset: number, endOffset: number) {
  const toggle = page.getByRole('button', { name: 'Configurar datas das fases' })
  if (await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click()
  const group = page.getByText(label, { exact: true }).locator('..')
  await group.getByLabel('Início').fill(`${dateOffset(startOffset)}T00:00`)
  await group.getByLabel('Término').fill(`${dateOffset(endOffset)}T23:00`)
}

async function main() {
  loadCleanupEnv()
  process.env.E2E_ALLOW_WRITES = 'true'
  const env = assertHomologationEnvironment(process.env)
  if (resolvePublicOverviewText(OVERVIEW) !== OVERVIEW) {
    throw new Error('Helper rejeitou overview válida com Sandbox antes do smoke.')
  }

  const runId = runIdNow()
  const eventName = `${runId} — Overview Hub`
  const baseURL = process.env.BASE_URL || 'http://localhost:3003'
  const evidenceDir = path.resolve(__dirname, '../../docs/design-system/evidencias/hub-overview-smoke', runId)
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
  const report: Record<string, unknown> = { runId, eventName, overview: OVERVIEW, baseURL }

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
    await page.getByRole('heading', { name: 'Criar novo evento' }).waitFor()
    await page.getByLabel('Nome do evento').fill(eventName)
    await page.getByLabel('Data do evento').fill(dateOffset(21))
    await page.keyboard.press('Escape')
    await page.getByLabel('Local', { exact: true }).fill('Ginásio Overview Smoke — Curitiba/PR')
    await page.getByLabel('Valor da inscrição (R$)').fill(String(FEE))
    await page.getByLabel('Resumo do evento').fill(OVERVIEW)
    await fillPhase(page, 'Inscrição', -1, 5)
    await fillPhase(page, 'Pagamento', 6, 10)
    await fillPhase(page, 'Checagem', 11, 15)
    await fillPhase(page, 'Chaves', 16, 20)
    await page.getByRole('button', { name: 'Criar evento e continuar' }).click()
    await page.waitForURL(/\/admin\/eventos\/[^/]+\/configuracao$/, { timeout: 20000 })
    await page.goto('/admin/eventos')
    const createdCard = page.getByRole('article').filter({ hasText: eventName })
    await createdCard.getByRole('button', { name: `Mais ações de ${eventName}` }).click()
    await page.getByRole('menuitem', { name: 'Publicar' }).click()
    await createdCard.getByText('Publicado', { exact: true }).waitFor()

    const created = await admin
      .from('events')
      .select('id, organization_id, status, informacoes, nome, local')
      .eq('nome', eventName)
      .single()
    if (!created.data || created.data.organization_id !== env.organizationId || created.data.status !== 'publicado') {
      throw new Error('Evento overview smoke não persistiu como publicado na MEU CAMP.')
    }
    if (created.data.informacoes !== OVERVIEW) {
      throw new Error('informacoes persistida diverge do texto publicado pelo organizador.')
    }
    eventId = created.data.id
    report.eventId = eventId
    report.fonte = 'events.informacoes'

    await publicPage.goto(`/eventos/${eventId}`)
    await publicPage.getByRole('heading', { name: eventName }).waitFor()
    await expect(publicPage.getByRole('heading', { name: 'Visão geral' })).toBeVisible()
    await expect(publicPage.getByText(OVERVIEW)).toBeVisible()
    await expect(publicPage.getByText('Sandbox', { exact: false }).first()).toBeVisible()
    await expect(publicPage.getByText(/carrossel editorial|banner oficial para o carrossel/i)).toHaveCount(0)
    await expect(publicPage.getByText(created.data.local, { exact: true }).first()).toBeVisible()
    await expect(publicPage.getByRole('link', { name: 'Informações' }).first()).toBeVisible()

    const desktop = await publicPage.screenshot({ fullPage: true })
    writeFileSync(path.join(evidenceDir, 'overview-desktop-1440.png'), desktop)

    await publicPage.setViewportSize({ width: 390, height: 844 })
    await publicPage.goto(`/eventos/${eventId}`)
    await publicPage.getByRole('heading', { name: eventName }).waitFor()
    await expect(publicPage.getByRole('heading', { name: 'Visão geral' })).toBeVisible()
    await expect(publicPage.getByText(OVERVIEW)).toBeVisible()
    const mobile = await publicPage.screenshot({ fullPage: true })
    writeFileSync(path.join(evidenceDir, 'overview-mobile-390.png'), mobile)

    report.desktop = 'OK'
    report.mobile = 'OK'
    report.sandboxPreserved = 'OK'
    report.internalAbsent = 'OK'
    report.smoke = 'OK'
    report.screenshots = {
      desktop: path.join(evidenceDir, 'overview-desktop-1440.png'),
      mobile: path.join(evidenceDir, 'overview-mobile-390.png'),
    }
  } finally {
    await publicContext.close().catch(() => undefined)
    await context.close().catch(() => undefined)
    await browser.close().catch(() => undefined)

    try {
      if (!runId.startsWith('hub-overview-smoke-')) throw new Error('Cleanup abortado: RUN_ID inválido.')
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
        await admin.from('event_audit_logs').delete().in('event_id', ids)
        await admin.from('event_phases').delete().in('event_id', ids)
        const rules = await admin.from('category_rule_sets').select('id').in('event_id', ids)
        const ruleIds = (rules.data || []).map((row) => row.id)
        if (ruleIds.length) {
          await admin.from('event_categories').delete().in('rule_set_id', ruleIds)
          await admin.from('category_rule_sets').delete().in('id', ruleIds)
        }
        await admin.from('events').delete().in('id', ids)
      }
      const residual = await admin
        .from('events')
        .select('id')
        .eq('organization_id', env.organizationId)
        .like('nome', `${runId}%`)
      if ((residual.data || []).length) throw new Error(`Cleanup residual: ${(residual.data || []).length}`)
      report.cleanup = 'OK'
    } catch (error) {
      report.cleanup = error instanceof Error ? error.message : String(error)
      console.error(JSON.stringify(report, null, 2))
      throw error
    }
  }

  console.log(JSON.stringify(report, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
