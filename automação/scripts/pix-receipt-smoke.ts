/**
 * Smoke E2E + visual: PIX direto ao organizador com comprovante (Financeiro Lote 3).
 * Reserva pela UI, envia comprovante, organizador rejeita, atleta reenvia, organizador aprova.
 * Inclui sondas de segurança (arquivo disfarçado, PDF ativo, acesso anônimo/terceiro, URL pública).
 * Usa a organização MEU CAMP do Sandbox; chave PIX fictícia de E2E é removida ao final.
 */
import { chromium, expect, type BrowserContext, type Page } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { SANDBOX_HOST, createCleanupClients, loadCleanupEnv } from '../tests/support/e2e-cleanup'
import { RELEASE_ORG_NAME, assertHomologationEnvironment } from '../tests/support/homologation-guard'
import { E2E_PIX_RECIPIENT, ensureDirectPixForE2E } from '../tests/support/direct-pix-fixture'

const FEE = 80
const REJECTION = 'Valor diferente do total da inscrição'

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
  return `pix-receipt-smoke-${value('year')}${value('month')}${value('day')}-${value('hour')}${value('minute')}${value('second')}`
}

const minimalPdf = (extra = '') => Buffer.from(
  `%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R ${extra}>>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [] /Count 0 >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n`,
  'latin1',
)

async function main() {
  loadCleanupEnv()
  process.env.E2E_ALLOW_WRITES = 'true'
  const env = assertHomologationEnvironment(process.env)
  const baseURL = process.env.BASE_URL || 'http://localhost:3000'
  if (new URL(baseURL).hostname !== 'localhost') throw new Error('Smoke PIX direto restrito ao servidor local.')

  const runId = runIdNow()
  const evidenceDir = path.resolve(__dirname, '../../docs/design-system/evidencias/pix-direto', runId)
  mkdirSync(evidenceDir, { recursive: true })

  const { admin, actor } = await createCleanupClients()
  const org = await admin.from('organizations').select('id, nome').eq('id', env.organizationId).maybeSingle()
  if (org.data?.nome !== RELEASE_ORG_NAME) throw new Error('Organização ativa não é MEU CAMP.')
  const ownerEmail = process.env.E2E_OWNER_EMAIL || ''
  // Conta E2E com papel organizer na MEU CAMP: deve conseguir revisar comprovantes.
  const organizerEmail = process.env.E2E_UNAUTHORIZED_EMAIL || ''
  if (!ownerEmail || !organizerEmail) throw new Error('E2E_OWNER_EMAIL/E2E_UNAUTHORIZED_EMAIL ausentes.')
  const strangerEmail = `${runId}-terceiro@example.invalid`

  const ids = {
    team: randomUUID(),
    athlete: randomUUID(),
    event: randomUUID(),
    rule: randomUUID(),
    category: randomUUID(),
    registration: randomUUID(),
  }
  const eventName = `${runId} — PIX direto`
  const athleteName = `${runId} Atleta`
  const report: Record<string, unknown> = { runId, baseURL, eventName }
  const storagePaths = new Set<string>()
  let restorePix: (() => Promise<void>) | null = null
  let ownerId = ''
  let strangerUserId = ''

  async function sessionCookie(context: BrowserContext, email: string) {
    const link = await admin.auth.admin.generateLink({ type: 'magiclink', email })
    if (link.error || !link.data.properties?.hashed_token) throw new Error(`Sessão: ${link.error?.message || 'link ausente'}`)
    const verified = await actor.auth.verifyOtp({ token_hash: link.data.properties.hashed_token, type: 'email' })
    if (verified.error || !verified.data.session) throw new Error(`Sessão: ${verified.error?.message || 'falhou'}`)
    await context.clearCookies()
    await context.addCookies([{
      name: `sb-${SANDBOX_HOST.split('.')[0]}-auth-token`,
      value: JSON.stringify(verified.data.session),
      url: baseURL,
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    }])
    return verified.data.session.user.id
  }

  async function shot(page: Page, name: string) {
    writeFileSync(path.join(evidenceDir, `${name}.png`), await page.screenshot({ fullPage: true }))
  }

  async function mobileShot(page: Page, url: string, name: string, ready: (page: Page) => Promise<void>) {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(url)
    await ready(page)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
    if (overflow) throw new Error(`Overflow horizontal em 390px: ${name}`)
    await shot(page, `${name}-390`)
    await page.setViewportSize({ width: 1440, height: 900 })
  }

  async function receipts(paymentId: string) {
    const { data, error } = await admin.from('payment_receipts')
      .select('id, status, storage_path, mime_type, rejection_reason, reviewed_by')
      .eq('payment_id', paymentId).order('created_at')
    if (error) throw new Error(`Comprovantes: ${error.message}`)
    for (const row of data) storagePaths.add(row.storage_path)
    return data
  }

  const browser = await chromium.launch({ headless: true })
  const ownerContext = await browser.newContext({ baseURL, viewport: { width: 1440, height: 900 } })
  const strangerContext = await browser.newContext({ baseURL, viewport: { width: 1440, height: 900 } })
  const organizerContext = await browser.newContext({ baseURL })
  const anonContext = await browser.newContext({ baseURL })
  const page = await ownerContext.newPage()

  try {
    ownerId = await sessionCookie(ownerContext, ownerEmail)
    await sessionCookie(organizerContext, organizerEmail)
    const created = await admin.auth.admin.createUser({
      email: strangerEmail,
      email_confirm: true,
      user_metadata: { nome_completo: 'Terceiro PIX Smoke', tipo_cadastro: 'atleta', data_nascimento: '1990-01-01' },
    })
    if (created.error || !created.data.user) throw new Error(`Terceiro temporário: ${created.error?.message || 'falhou'}`)
    strangerUserId = created.data.user.id
    await sessionCookie(strangerContext, strangerEmail)
    restorePix = await ensureDirectPixForE2E(admin, env.organizationId)

    const today = Date.now()
    const must = async (label: string, result: PromiseLike<{ error: { message: string } | null }>) => {
      const { error } = await result
      if (error) throw new Error(`${label}: ${error.message}`)
    }
    await must('team', admin.from('teams').insert({ id: ids.team, organization_id: env.organizationId, nome: `${runId} Equipe`, created_by: ownerId }))
    await must('athlete', admin.from('athletes').insert({ id: ids.athlete, organization_id: env.organizationId, team_id: ids.team, nome_completo: athleteName, data_nascimento: '1995-01-01', genero: 'M', faixa: 'Branca', peso_kg: 70 }))
    await must('manager', admin.from('athlete_managers').insert({ manager_id: ownerId, athlete_id: ids.athlete, relationship_type: 'professor' }))
    await must('event', admin.from('events').insert({ id: ids.event, organization_id: env.organizationId, nome: eventName, slug: `${runId}-${ids.event.slice(0, 8)}`, data_evento: new Date(today + 30 * 86400000).toISOString().slice(0, 10), local: 'Sandbox PIX direto', status: 'pagamento', created_by: ownerId, valor_inscricao: FEE }))
    await must('phase', admin.from('event_phases').insert({ event_id: ids.event, tipo: 'pagamento', inicio: new Date(today - 86400000).toISOString(), fim: new Date(today + 86400000).toISOString() }))
    await must('rule', admin.from('category_rule_sets').insert({ id: ids.rule, event_id: ids.event, nome: 'PIX direto', versao: 1, ativo: true }))
    await must('category', admin.from('event_categories').insert({ id: ids.category, rule_set_id: ids.rule, nome: 'Adulto PIX direto', idade_min: 18, idade_max: 99, faixa_min_ordem: 1, faixa_max_ordem: 1, peso_max_kg: 120, genero: 'M' }))
    await must('registration', admin.from('registrations').insert({
      id: ids.registration, event_id: ids.event, athlete_id: ids.athlete, category_id: ids.category, registered_by: ownerId,
      status: 'pendente_pagamento', valor: FEE, athlete_snapshot: { nome_completo: athleteName }, category_snapshot: { nome: 'Adulto PIX direto' },
      rule_set_version: 1, terms_version: 'MVP-2026-09', terms_accepted_at: new Date().toISOString(),
    }))

    // 1) Checkout somente PIX direto.
    await page.goto('/dashboard/inscricoes')
    const checkout = page.getByRole('region', { name: 'Reservar pagamento' }).or(page.locator('[aria-labelledby="checkout-title"]'))
    await checkout.getByLabel('Evento').selectOption(ids.event)
    await checkout.getByRole('checkbox', { name: new RegExp(athleteName) }).check()
    await expect(checkout.getByRole('radio', { name: 'Boleto' })).toHaveCount(0)
    await expect(checkout.getByRole('radio', { name: 'PIX' })).toBeChecked()
    await shot(page, '01-checkout-pix-direto')
    await checkout.getByRole('button', { name: 'Reservar pagamento' }).click()
    await expect(checkout.getByText('Reserva persistida.')).toBeVisible({ timeout: 20000 })
    await checkout.getByRole('link', { name: 'Ver chave PIX e enviar comprovante' }).click()
    await page.waitForURL(/\/dashboard\/pagamentos\/[0-9a-f-]{36}$/)
    const paymentId = page.url().split('/').pop() || ''
    const paymentUrl = `/dashboard/pagamentos/${paymentId}`
    report.paymentId = paymentId
    report.checkout = 'OK — somente PIX; Boleto oculto'

    // 2) Instruções PIX (snapshot) para o pagador.
    await expect(page.getByRole('heading', { name: 'Pagamento da inscrição' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Pague diretamente para a organização' })).toBeVisible()
    await expect(page.getByText(E2E_PIX_RECIPIENT, { exact: true })).toBeVisible()
    await expect(page.getByText('Aguardando pagamento', { exact: true })).toBeVisible()
    await shot(page, '02-pagador-instrucoes')
    await mobileShot(page, paymentUrl, '02-pagador-instrucoes', async (p) => {
      await expect(p.getByRole('heading', { name: 'Pague diretamente para a organização' })).toBeVisible()
    })
    report.instructions = 'OK — chave e favorecido do snapshot'

    // 3) Sondas de upload malicioso: nada deve ser persistido.
    const fileInput = page.getByLabel('Arquivo do comprovante')
    const feedback = page.locator('#receipt-feedback')
    const attempts: Array<{ name: string; mimeType: string; buffer: Buffer; label: string }> = [
      { name: 'comprovante.png', mimeType: 'image/png', buffer: Buffer.from('<html><script>alert(1)</script></html>'), label: 'HTML disfarçado de PNG' },
      { name: 'comprovante.pdf', mimeType: 'application/pdf', buffer: minimalPdf('/OpenAction << /S /JavaScript /JS (app.alert(1)) >> '), label: 'PDF com JavaScript' },
      { name: 'comprovante.pdf', mimeType: 'application/pdf', buffer: minimalPdf('/OpenAction << /S /J#61vaScript /JS (app.alert(1)) >> '), label: 'PDF com JavaScript ofuscado (#hex)' },
      { name: 'comprovante.jpg', mimeType: 'image/jpeg', buffer: minimalPdf(), label: 'PDF com extensão JPG' },
    ]
    for (const attempt of attempts) {
      await fileInput.setInputFiles({ name: attempt.name, mimeType: attempt.mimeType, buffer: attempt.buffer })
      await page.getByRole('button', { name: 'Enviar comprovante' }).click()
      await expect(feedback).toBeVisible({ timeout: 15000 })
      await expect(feedback).toHaveAttribute('role', 'alert')
      if ((await receipts(paymentId)).length) throw new Error(`Upload malicioso aceito: ${attempt.label}`)
      await page.goto(paymentUrl)
    }
    const orphan = await admin.storage.from('payment-receipts').list(`${env.organizationId}/${ids.event}/${paymentId}`)
    if (orphan.error) throw new Error(`Storage list: ${orphan.error.message}`)
    if (orphan.data.length) throw new Error('Upload malicioso deixou objeto no bucket.')
    report.maliciousUploads = `OK — ${attempts.length} recusados, nada gravado`

    // 4) Comprovante válido (PNG real).
    const pngBuffer = await page.screenshot({ clip: { x: 0, y: 0, width: 600, height: 400 } })
    await fileInput.setInputFiles({ name: 'comprovante.png', mimeType: 'image/png', buffer: pngBuffer })
    await page.getByRole('button', { name: 'Enviar comprovante' }).click()
    await expect(page.getByRole('heading', { name: 'Comprovante enviado' })).toBeVisible({ timeout: 20000 })
    await expect(page.getByText('Comprovante em análise', { exact: true }).first()).toBeVisible()
    await expect(page.getByLabel('Arquivo do comprovante')).toHaveCount(0)
    let rows = await receipts(paymentId)
    if (rows.length !== 1 || rows[0].status !== 'em_analise' || rows[0].mime_type !== 'image/png') throw new Error('Comprovante 1 não registrado corretamente.')
    const firstReceipt = rows[0]
    await shot(page, '03-pagador-em-analise')
    await mobileShot(page, paymentUrl, '03-pagador-em-analise', async (p) => {
      await expect(p.getByRole('heading', { name: 'Comprovante enviado' })).toBeVisible()
    })
    report.upload = 'OK — em análise'

    // 5) Sondas de acesso ao arquivo.
    const receiptRoute = `/dashboard/pagamentos/comprovantes/${firstReceipt.id}`
    const anon = await anonContext.request.get(receiptRoute, { maxRedirects: 0 })
    const anonLocation = anon.headers().location || ''
    const anonToLogin = anon.status() === 307 && new URL(anonLocation, baseURL).pathname === '/login'
    if (!(anon.status() === 401 || anonToLogin) || anonLocation.includes('/storage/')) {
      throw new Error(`Anônimo acessou comprovante: ${anon.status()} ${anonLocation}`)
    }
    const stranger = await strangerContext.request.get(receiptRoute, { maxRedirects: 0 })
    if (stranger.status() !== 404 || stranger.headers().location) throw new Error(`Terceiro acessou comprovante: ${stranger.status()}`)
    const strangerPage = await strangerContext.newPage()
    const strangerPayment = await strangerPage.goto(paymentUrl)
    if (strangerPayment?.status() !== 404) throw new Error(`Terceiro abriu página do pagamento: ${strangerPayment?.status()}`)
    await strangerPage.close()
    const organizer = await organizerContext.request.get(receiptRoute, { maxRedirects: 0 })
    if (organizer.status() !== 303 || !(organizer.headers().location || '').includes('/storage/v1/object/sign/payment-receipts/')) {
      throw new Error(`Organizer da organização sem acesso ao comprovante: ${organizer.status()}`)
    }
    const supabaseUrl = env.supabaseUrl.replace(/\/$/, '')
    const publicUrl = await anonContext.request.get(`${supabaseUrl}/storage/v1/object/public/payment-receipts/${firstReceipt.storage_path}`)
    if (publicUrl.ok()) throw new Error('Bucket respondeu por URL pública.')
    const owner = await ownerContext.request.get(receiptRoute, { maxRedirects: 0 })
    const location = owner.headers().location || ''
    if (owner.status() !== 303 || !location.includes('/storage/v1/object/sign/payment-receipts/')) throw new Error(`Owner sem URL assinada: ${owner.status()}`)
    if (!/no-store/.test(owner.headers()['cache-control'] || '') || owner.headers()['referrer-policy'] !== 'no-referrer') throw new Error('Cabeçalhos privados ausentes.')
    const signed = await anonContext.request.get(location)
    if (!signed.ok() || !(signed.headers()['content-type'] || '').startsWith('image/png')) throw new Error('URL assinada não entregou o comprovante.')
    report.fileAccess = 'OK — anônimo vai ao login, terceiro sem vínculo 404, organizer da org 303, URL pública negada, owner 303 assinada (no-store, no-referrer)'

    // 6) Organizador rejeita.
    const financeUrl = `/admin/eventos/${ids.event}/financeiro`
    await page.goto(financeUrl)
    const pending = page.locator('section[aria-labelledby="pending-receipts-title"]')
    await expect(page.getByRole('heading', { name: 'Comprovantes em análise' })).toBeVisible()
    await expect(pending.getByText(athleteName)).toBeVisible()
    await expect(pending.getByRole('link', { name: 'Visualizar comprovante' })).toBeVisible()
    await shot(page, '04-organizador-revisao')
    await mobileShot(page, financeUrl, '04-organizador-revisao', async (p) => {
      await expect(p.getByRole('heading', { name: 'Comprovantes em análise' })).toBeVisible()
    })
    const rejectToggle = pending.getByRole('button', { name: 'Rejeitar' })
    await rejectToggle.click()
    await expect(rejectToggle).toHaveAttribute('aria-expanded', 'true')
    await pending.getByLabel('Motivo da rejeição').fill(REJECTION)
    await shot(page, '05-organizador-rejeitando')
    await pending.getByRole('button', { name: 'Confirmar rejeição' }).click()
    await expect(page.getByText('Comprovante rejeitado. O atleta verá o motivo e poderá reenviar.')).toBeVisible({ timeout: 20000 })
    rows = await receipts(paymentId)
    if (rows[0].status !== 'rejeitado' || rows[0].rejection_reason !== REJECTION || rows[0].reviewed_by !== ownerId) throw new Error('Rejeição não persistida.')
    const afterReject = await admin.from('payments').select('status').eq('id', paymentId).single()
    if (afterReject.data?.status !== 'aguardando') throw new Error('Pagamento mudou após rejeição.')
    report.reject = 'OK — pagamento segue aguardando'

    // 7) Atleta vê o motivo e reenvia (PDF limpo).
    await page.goto(paymentUrl)
    await expect(page.getByText('Comprovante não aprovado')).toBeVisible()
    await expect(page.getByText(`Motivo: ${REJECTION}`).first()).toBeVisible()
    await shot(page, '06-pagador-rejeitado')
    await mobileShot(page, paymentUrl, '06-pagador-rejeitado', async (p) => {
      await expect(p.getByText('Comprovante não aprovado')).toBeVisible()
    })
    await page.getByLabel('Novo comprovante').setInputFiles({ name: 'comprovante.pdf', mimeType: 'application/pdf', buffer: minimalPdf() })
    await page.getByRole('button', { name: 'Enviar novo comprovante' }).click()
    await expect(page.getByRole('heading', { name: 'Comprovante enviado' })).toBeVisible({ timeout: 20000 })
    rows = await receipts(paymentId)
    if (rows.length !== 2 || rows[1].status !== 'em_analise' || rows[1].mime_type !== 'application/pdf') throw new Error('Reenvio não registrado.')
    report.resubmit = 'OK — histórico preservado (2 comprovantes)'

    // 8) Organizador aprova.
    await page.goto(financeUrl)
    await pending.getByRole('checkbox', { name: /Conferi na conta da organização/ }).check()
    await pending.getByRole('button', { name: 'Aprovar pagamento' }).click()
    await expect(page.getByText('Pagamento aprovado. Baixa manual registrada e inscrições confirmadas.')).toBeVisible({ timeout: 20000 })
    await shot(page, '07-organizador-aprovado')
    const settled = await admin.from('payments').select('status, paid_at').eq('id', paymentId).single()
    const registration = await admin.from('registrations').select('status').eq('id', ids.registration).single()
    if (settled.data?.status !== 'pago' || !settled.data.paid_at) throw new Error('Pagamento não ficou pago.')
    if (registration.data?.status !== 'efetivada') throw new Error('Inscrição não efetivada.')
    const audit = await admin.from('event_audit_logs').select('action, actor_id').eq('event_id', ids.event)
    const actions = (audit.data || []).filter((row) => row.actor_id === ownerId).map((row) => row.action)
    for (const action of ['payment_receipt_submitted', 'payment_receipt_rejected', 'payment_receipt_approved', 'payment_manually_settled']) {
      if (!actions.includes(action)) throw new Error(`Auditoria ausente: ${action}`)
    }
    const attemptsCount = await admin.from('payment_attempts').select('id', { count: 'exact', head: true }).eq('payment_id', paymentId)
    const jobsCount = await admin.from('payment_issuance_jobs').select('payment_id', { count: 'exact', head: true }).eq('payment_id', paymentId)
    if (attemptsCount.count || jobsCount.count) throw new Error('Fluxo PIX direto acionou o gateway.')
    report.approve = 'OK — pago, inscrição efetivada, auditoria completa, sem Asaas'

    // 9) Atleta vê confirmação.
    await page.goto(paymentUrl)
    await expect(page.getByText('Sua inscrição está confirmada.', { exact: false })).toBeVisible()
    await expect(page.getByText('Pagamento aprovado', { exact: true }).first()).toBeVisible()
    await shot(page, '08-pagador-aprovado')
    await mobileShot(page, paymentUrl, '08-pagador-aprovado', async (p) => {
      await expect(p.getByText('Sua inscrição está confirmada.', { exact: false })).toBeVisible()
    })

    report.smoke = 'OK'
    report.evidenceDir = evidenceDir
  } finally {
    await ownerContext.close().catch(() => undefined)
    await strangerContext.close().catch(() => undefined)
    await organizerContext.close().catch(() => undefined)
    await anonContext.close().catch(() => undefined)
    await browser.close().catch(() => undefined)

    try {
      const payments = await admin.from('payments').select('id').eq('event_id', ids.event)
      const paymentIds = (payments.data || []).map((row) => row.id)
      if (paymentIds.length) {
        const stored = await admin.from('payment_receipts').select('storage_path').in('payment_id', paymentIds)
        for (const row of stored.data || []) storagePaths.add(row.storage_path)
      }
      const scopedPaths = [...storagePaths].filter((item) => item.startsWith(`${env.organizationId}/${ids.event}/`))
      if (scopedPaths.length) {
        const removed = await admin.storage.from('payment-receipts').remove(scopedPaths)
        if (removed.error) throw new Error(`storage: ${removed.error.message}`)
      }
      const run = async (label: string, result: PromiseLike<{ error: { message: string } | null }>) => {
        const { error } = await result
        if (error) throw new Error(`${label}: ${error.message}`)
      }
      await run('audit', admin.from('event_audit_logs').delete().eq('event_id', ids.event))
      if (paymentIds.length) await run('payments', admin.from('payments').delete().in('id', paymentIds))
      await run('registrations', admin.from('registrations').delete().eq('id', ids.registration))
      await run('categories', admin.from('event_categories').delete().eq('id', ids.category))
      await run('rules', admin.from('category_rule_sets').delete().eq('id', ids.rule))
      await run('phases', admin.from('event_phases').delete().eq('event_id', ids.event))
      await run('events', admin.from('events').delete().eq('id', ids.event))
      await run('managers', admin.from('athlete_managers').delete().eq('athlete_id', ids.athlete))
      await run('athletes', admin.from('athletes').delete().eq('id', ids.athlete))
      await run('teams', admin.from('teams').delete().eq('id', ids.team))
      if (restorePix) await restorePix()
      if (strangerUserId) {
        const removedUser = await admin.auth.admin.deleteUser(strangerUserId)
        if (removedUser.error) throw new Error(`terceiro: ${removedUser.error.message}`)
      }
      report.cleanup = `OK (${scopedPaths.length} arquivo(s), ${paymentIds.length} pagamento(s))`
    } catch (error) {
      console.error('Cleanup falhou:', error)
      report.cleanup = 'FALHA'
    }
    console.log(JSON.stringify(report, null, 2))
  }

  if (report.smoke !== 'OK' || report.cleanup === 'FALHA') process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
