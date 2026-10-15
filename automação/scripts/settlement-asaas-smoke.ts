/**
 * Smoke real do Financeiro Lote 4: fechamento de R$ 8 por inscrição paga, cobrança PIX no Asaas Sandbox
 * com split de 50% do líquido para a conta recebedora, e webhooks PAYMENT_RECEIVED / PAYMENT_SPLIT_DONE.
 *
 * Modo padrão (após deploy): emite pela UI local, confirma pelo endpoint oficial do Sandbox e aguarda os
 * webhooks reais entregues ao endpoint publicado. --simulate-webhooks: antes do deploy, envia ao servidor
 * local eventos montados a partir da cobrança real (sem confirmar pagamento no Asaas).
 *
 * Massa pequena (2 inscrições pagas = R$ 16,00) na organização MEU CAMP; limpeza por IDs exatos.
 */
import { chromium, expect, type BrowserContext, type Page } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { SANDBOX_HOST, createCleanupClients, loadCleanupEnv } from '../tests/support/e2e-cleanup'
import { RELEASE_ORG_NAME, assertHomologationEnvironment } from '../tests/support/homologation-guard'

const ASAAS = 'https://api-sandbox.asaas.com/v3'
const FEE = 80
const REGISTRATIONS = 2
const SANDBOX_TEST_CPF = '52998224725'
const simulate = process.argv.includes('--simulate-webhooks')

function runIdNow() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(new Date())
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || ''
  return `settlement-smoke-${value('year')}${value('month')}${value('day')}-${value('hour')}${value('minute')}${value('second')}`
}

const mask = (value: unknown) => {
  const text = typeof value === 'string' ? value : ''
  return text.length > 8 ? `${text.slice(0, 4)}…${text.slice(-4)}` : text ? '••••' : null
}

async function asaas(pathname: string, method: 'GET' | 'POST' | 'DELETE' = 'GET') {
  const key = (process.env.ASAAS_SANDBOX_API_KEY || '').replace(/\\\$/g, '$')
  const response = await fetch(ASAAS + pathname, {
    method, redirect: 'error', cache: 'no-store',
    headers: { access_token: key, 'Content-Type': 'application/json', 'User-Agent': 'MeuCamp-Sandbox/1.0' },
  })
  const body = await response.json().catch(() => null) as Record<string, unknown> | null
  return { status: response.status, body }
}

async function main() {
  loadCleanupEnv()
  process.env.E2E_ALLOW_WRITES = 'true'
  const env = assertHomologationEnvironment(process.env)
  if (process.env.ASAAS_ENVIRONMENT !== 'sandbox') throw new Error('Smoke restrito ao Asaas Sandbox.')
  const recipientWallet = process.env.ASAAS_SPLIT_RECIPIENT_WALLET_ID || ''
  if (!recipientWallet || process.env.ASAAS_SPLIT_RECIPIENT_PERCENT !== '50' || process.env.PLATFORM_SETTLEMENT_ASAAS_ENABLED !== 'true') {
    throw new Error('Configuração de split ausente no ambiente local.')
  }
  const baseURL = process.env.BASE_URL || 'http://localhost:3000'
  if (new URL(baseURL).hostname !== 'localhost') throw new Error('Emissão do smoke restrita ao servidor local.')

  const runId = runIdNow()
  const evidenceDir = path.resolve(__dirname, '../../docs/design-system/evidencias/financeiro-lote-4', runId)
  mkdirSync(evidenceDir, { recursive: true })
  const { admin, actor } = await createCleanupClients()
  const org = await admin.from('organizations').select('id, nome').eq('id', env.organizationId).maybeSingle()
  if (org.data?.nome !== RELEASE_ORG_NAME) throw new Error('Organização ativa não é MEU CAMP.')
  const ownerEmail = process.env.E2E_OWNER_EMAIL || ''
  if (!ownerEmail) throw new Error('E2E_OWNER_EMAIL ausente.')

  const ids = {
    team: randomUUID(), event: randomUUID(), rule: randomUUID(), category: randomUUID(),
    athletes: Array.from({ length: REGISTRATIONS }, () => randomUUID()),
    registrations: Array.from({ length: REGISTRATIONS }, () => randomUUID()),
    payments: Array.from({ length: REGISTRATIONS }, () => randomUUID()),
  }
  const eventName = `${runId} — Fechamento`
  const report: Record<string, unknown> = { runId, mode: simulate ? 'simulacao-local' : 'webhook-real', registrations: REGISTRATIONS }
  const simulatedEvents: string[] = []
  let ownerId = ''
  let previousCpf: string | null = null
  let settlementId = ''
  let chargeId = ''

  async function sessionCookie(context: BrowserContext, email: string) {
    const link = await admin.auth.admin.generateLink({ type: 'magiclink', email })
    if (link.error || !link.data.properties?.hashed_token) throw new Error(`Sessão: ${link.error?.message || 'link ausente'}`)
    const verified = await actor.auth.verifyOtp({ token_hash: link.data.properties.hashed_token, type: 'email' })
    if (verified.error || !verified.data.session) throw new Error(`Sessão: ${verified.error?.message || 'falhou'}`)
    await context.clearCookies()
    await context.addCookies([{
      name: `sb-${SANDBOX_HOST.split('.')[0]}-auth-token`, value: JSON.stringify(verified.data.session),
      url: baseURL, httpOnly: false, secure: false, sameSite: 'Lax',
    }])
    return verified.data.session.user.id
  }

  async function shot(page: Page, name: string) {
    await page.evaluate(() => {
      document.querySelectorAll('img[alt^="QR Code PIX"]').forEach((node) => { (node as HTMLElement).style.filter = 'blur(8px)' })
      document.querySelectorAll('p.font-mono').forEach((node) => { node.textContent = '•••• código PIX mascarado na evidência ••••' })
    })
    writeFileSync(path.join(evidenceDir, `${name}.png`), await page.screenshot({ fullPage: true }))
  }

  async function settlement() {
    const { data, error } = await admin.from('event_financial_settlements').select('*').eq('event_id', ids.event).order('sequence_number')
    if (error) throw new Error(`Fechamento: ${error.message}`)
    return data
  }

  async function postLocalWebhook(body: unknown) {
    const response = await fetch(`${baseURL}/api/payments/webhook`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'asaas-access-token': process.env.ASAAS_WEBHOOK_TOKEN || '' },
      body: JSON.stringify(body),
    })
    return { status: response.status, body: await response.json().catch(() => null) as Record<string, unknown> | null }
  }

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  const financeUrl = `/admin/eventos/${ids.event}/financeiro`

  try {
    ownerId = await sessionCookie(context, ownerEmail)
    const profile = await admin.from('profiles').select('cpf').eq('id', ownerId).single()
    previousCpf = profile.data?.cpf ?? null
    const customer = await admin.from('organization_billing_customers').select('state').eq('organization_id', env.organizationId).maybeSingle()
    if (customer.data?.state !== 'ready' && !previousCpf) {
      const { error } = await admin.from('profiles').update({ cpf: SANDBOX_TEST_CPF }).eq('id', ownerId)
      if (error) throw new Error(`CPF de teste: ${error.message}`)
      report.ownerCpf = 'CPF fictício de Sandbox aplicado temporariamente'
    }
    const platformAdmin = await admin.from('platform_user_roles').select('role').eq('user_id', ownerId).eq('role', 'admin').maybeSingle()
    report.ownerIsPlatformAdmin = Boolean(platformAdmin.data)

    const must = async (label: string, result: PromiseLike<{ error: { message: string } | null }>) => {
      const { error } = await result
      if (error) throw new Error(`${label}: ${error.message}`)
    }
    const now = Date.now()
    await must('team', admin.from('teams').insert({ id: ids.team, organization_id: env.organizationId, nome: `${runId} Equipe`, created_by: ownerId }))
    await must('event', admin.from('events').insert({ id: ids.event, organization_id: env.organizationId, nome: eventName, slug: `${runId}-${ids.event.slice(0, 8)}`, data_evento: new Date(now + 30 * 86400000).toISOString().slice(0, 10), local: 'Sandbox Lote 4', status: 'rascunho', created_by: ownerId, valor_inscricao: FEE }))
    await must('rule', admin.from('category_rule_sets').insert({ id: ids.rule, event_id: ids.event, nome: 'Lote 4', versao: 1, ativo: true }))
    await must('category', admin.from('event_categories').insert({ id: ids.category, rule_set_id: ids.rule, nome: 'Adulto Lote 4', idade_min: 18, idade_max: 99, faixa_min_ordem: 1, faixa_max_ordem: 1, peso_max_kg: 120, genero: 'M' }))
    for (let i = 0; i < REGISTRATIONS; i++) {
      const name = `${runId} Atleta ${i + 1}`
      await must('athlete', admin.from('athletes').insert({ id: ids.athletes[i], organization_id: env.organizationId, team_id: ids.team, nome_completo: name, data_nascimento: '1995-01-01', genero: 'M', faixa: 'Branca', peso_kg: 70 }))
      await must('registration', admin.from('registrations').insert({
        id: ids.registrations[i], event_id: ids.event, athlete_id: ids.athletes[i], category_id: ids.category, registered_by: ownerId,
        status: 'efetivada', valor: FEE, athlete_snapshot: { nome_completo: name }, category_snapshot: { nome: 'Adulto Lote 4' },
        rule_set_version: 1, terms_version: 'MVP-2026-09', terms_accepted_at: new Date().toISOString(),
      }))
      await must('payment', admin.from('payments').insert({ id: ids.payments[i], event_id: ids.event, created_by: ownerId, valor_total: FEE, metodo: 'pix', status: 'pago', gateway: 'manual', paid_at: new Date().toISOString() }))
      await must('link', admin.from('payment_registrations').insert({ payment_id: ids.payments[i], registration_id: ids.registrations[i], amount: FEE }))
    }

    // 1) Card do organizador antes da emissão.
    await page.goto(financeUrl)
    const card = page.locator('section[aria-labelledby="settlement-title"]')
    await expect(card.getByRole('heading', { name: 'Fechamento financeiro' })).toBeVisible()
    await expect(card.getByText(`${REGISTRATIONS} × R$ 8,00`)).toBeVisible()
    await expect(card.getByText('R$ 16,00').first()).toBeVisible()
    await shot(page, '01-fechamento-antes-emissao')

    // 2) Emissão congelada.
    await card.getByRole('checkbox').check()
    await card.getByRole('button', { name: 'Emitir fechamento' }).click()
    await expect(card.getByRole('heading', { name: 'Fechamento #1' })).toBeVisible({ timeout: 20000 })
    let [row] = await settlement()
    settlementId = row.id
    if (row.eligible_registration_count !== REGISTRATIONS || row.platform_fee_gross_cents !== 1600 || row.fee_per_registration_cents !== 800) {
      throw new Error('Fechamento com valores inesperados.')
    }
    report.settlement = { id: mask(row.id), total: 'R$ 16,00', policy: row.fee_type, feePerRegistrationCents: row.fee_per_registration_cents }

    // 3) Pagar via PIX: cobrança Asaas com split; resposta não marca pago.
    await card.getByRole('button', { name: 'Pagar via PIX' }).click()
    await expect(card.getByRole('img', { name: 'QR Code PIX do fechamento financeiro' })).toBeVisible({ timeout: 30000 })
    await expect(card.getByRole('button', { name: 'Copiar código PIX' })).toBeVisible()
    await shot(page, '02-pix-emitido')
    ;[row] = await settlement()
    chargeId = row.provider_payment_id || ''
    if (row.status !== 'aguardando_pagamento' || !chargeId || row.paid_at) throw new Error(`Emissão: estado ${row.status}`)
    if (row.split_recipient_wallet_id !== recipientWallet || Number(row.split_percent) !== 50) throw new Error('Split persistido divergente.')

    const charge = await asaas(`/payments/${encodeURIComponent(chargeId)}`)
    if (charge.status !== 200 || !charge.body) throw new Error(`Consulta da cobrança: HTTP ${charge.status}`)
    const split = Array.isArray(charge.body.split) ? charge.body.split as Array<Record<string, unknown>> : []
    if (charge.body.externalReference !== `meucamp:settlement:${settlementId}` || Number(charge.body.value) !== 16 || charge.body.billingType !== 'PIX') {
      throw new Error('Cobrança Asaas divergente do fechamento.')
    }
    if (split.length !== 1 || split[0].walletId !== recipientWallet || Number(split[0].percentualValue) !== 50) {
      throw new Error('Split da cobrança não contém somente a conta recebedora a 50%.')
    }
    report.charge = {
      id: mask(chargeId), value: charge.body.value, status: charge.body.status, billingType: charge.body.billingType,
      netValue: charge.body.netValue ?? null,
      split: split.map((item) => ({ walletId: mask(item.walletId), percentualValue: item.percentualValue, status: item.status ?? null, id: mask(item.id) })),
    }

    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(financeUrl)
    await page.locator('section[aria-labelledby="settlement-title"]').getByRole('button', { name: 'Exibir PIX novamente' }).click()
    await expect(page.getByRole('img', { name: 'QR Code PIX do fechamento financeiro' })).toBeVisible({ timeout: 30000 })
    if (await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)) throw new Error('Overflow horizontal em 390px.')
    await shot(page, '03-pix-emitido-390')
    await page.setViewportSize({ width: 1440, height: 900 })
    ;[row] = await settlement()
    if (row.provider_payment_id !== chargeId) throw new Error('Reexibição criou outra cobrança.')
    report.idempotentReissue = 'OK — mesma cobrança reexibida'

    const paymentPayload = (status: string, extra: Record<string, unknown> = {}) => ({
      id: chargeId, externalReference: `meucamp:settlement:${settlementId}`, value: 16, billingType: 'PIX', status, ...extra,
    })

    if (simulate) {
      // 4a) Simulação local com dados da cobrança real.
      const netValue = typeof charge.body.netValue === 'number' ? charge.body.netValue : 15.01
      const received = { id: `${runId}-received`, event: 'PAYMENT_RECEIVED', payment: paymentPayload('RECEIVED', { netValue }) }
      const splitDone = { id: `${runId}-split`, event: 'PAYMENT_SPLIT_DONE', additionalInfo: { splitId: String(split[0].id || `${runId}-spl`) }, payment: paymentPayload('RECEIVED', { netValue }) }
      const unrelated = { id: `${runId}-transfer`, event: 'TRANSFER_DONE', transfer: { id: 'tra_smoke' } }
      simulatedEvents.push(received.id, splitDone.id, unrelated.id)
      const results: Record<string, unknown> = {}
      for (const [label, body] of [['received', received], ['received-dup', received], ['split', splitDone], ['split-dup', splitDone], ['unrelated', unrelated]] as const) {
        const result = await postLocalWebhook(body)
        if (result.status !== 200) throw new Error(`Webhook local ${label}: HTTP ${result.status}`)
        results[label] = { http: result.status, duplicate: result.body?.duplicate ?? false, kind: (result.body?.result as Record<string, unknown> | undefined)?.kind ?? null }
      }
      report.localWebhooks = results
    } else {
      // 4b) Confirmação oficial do Sandbox; webhooks reais entregues ao endpoint publicado.
      const confirm = await asaas(`/sandbox/payment/${encodeURIComponent(chargeId)}/confirm`, 'POST')
      if (confirm.status !== 200) throw new Error(`Confirmação Sandbox: HTTP ${confirm.status}`)
      report.sandboxConfirm = `HTTP ${confirm.status}`
    }

    // 5) Estado final: pago com netValue real e split concluído.
    const deadline = Date.now() + (simulate ? 10000 : 5 * 60000)
    while (Date.now() < deadline) {
      ;[row] = await settlement()
      if (row.status === 'pago' && row.distribution_status === 'concluido') break
      await new Promise((resolve) => setTimeout(resolve, 3000))
    }
    report.final = {
      status: row.status, paidAt: row.paid_at, netValueCents: row.provider_net_value_cents,
      distributionStatus: row.distribution_status, splitId: mask(row.split_id), splitPercent: row.split_percent,
      splitProviderEvent: mask(row.distribution_provider_event_id), distributionDoneAt: row.distribution_done_at,
    }
    if (row.status !== 'pago') throw new Error('PAYMENT_RECEIVED não marcou o fechamento como pago.')
    if (!row.provider_net_value_cents) throw new Error('netValue real não persistido.')
    if (row.distribution_status !== 'concluido') throw new Error('PAYMENT_SPLIT_DONE não concluiu a distribuição.')

    const events = await admin.from('webhook_events').select('external_event_id, event_type, status, last_error')
      .eq('payload->payment->>id', chargeId).order('received_at')
    if (events.error) throw new Error(`Falha ao ler webhook_events: ${events.error.message}`)
    report.webhookEvents = (events.data || []).map((event) => ({ id: mask(event.external_event_id), type: event.event_type, status: event.status, error: event.last_error }))

    if (!simulate) {
      const realReceived = (events.data || []).find((event) => event.event_type === 'PAYMENT_RECEIVED' && event.status === 'processado')
      if (!realReceived) throw new Error('Evento real PAYMENT_RECEIVED não encontrado.')
      const stored = await admin.from('webhook_events').select('payload').eq('external_event_id', realReceived.external_event_id).single()
      const duplicate = await postLocalWebhook(stored.data?.payload)
      if (duplicate.status !== 200 || duplicate.body?.duplicate !== true) throw new Error('Webhook duplicado não foi deduplicado.')
      report.duplicateWebhook = 'OK — reentrega do evento real respondeu 200 duplicate'
      const remote = await asaas(`/payments/${encodeURIComponent(chargeId)}`)
      const remoteSplit = Array.isArray(remote.body?.split) ? remote.body?.split as Array<Record<string, unknown>> : []
      report.asaasAfter = { status: remote.body?.status, netValue: remote.body?.netValue, split: remoteSplit.map((item) => ({ walletId: mask(item.walletId), percentualValue: item.percentualValue, status: item.status, totalValue: item.totalValue ?? null })) }
    }

    await page.goto(financeUrl)
    const paidCard = page.locator('section[aria-labelledby="settlement-title"]')
    await expect(paidCard.getByText('Pago', { exact: true }).first()).toBeVisible()
    await expect(paidCard.getByText('Split concluído', { exact: true }).first()).toBeVisible()
    const audit = paidCard.locator('details')
    if (await audit.count()) {
      await audit.first().locator('summary').click()
      report.adminAudit = 'OK — auditoria visível ao admin da plataforma'
    } else {
      report.adminAudit = 'Conta E2E não é admin da plataforma; auditoria não exibida (esperado para organizador)'
    }
    await shot(page, '04-fechamento-pago-split')
    report.smoke = 'OK'
  } catch (error) {
    report.smoke = 'FALHA'
    report.error = error instanceof Error ? error.message : String(error)
    await shot(page, 'falha').catch(() => undefined)
  } finally {
    await browser.close()
    const failures: string[] = []
    const run = async (label: string, result: PromiseLike<{ error: { message: string } | null }>) => {
      const { error } = await result
      if (error) failures.push(`${label}: ${error.message}`)
    }
    if (simulate && chargeId) {
      const removed = await asaas(`/payments/${encodeURIComponent(chargeId)}`, 'DELETE')
      report.asaasChargeCleanup = `DELETE HTTP ${removed.status}`
    }
    if (simulatedEvents.length) await run('webhooks simulados', admin.from('webhook_events').delete().in('external_event_id', simulatedEvents))
    if (settlementId) await run('fechamento', admin.from('event_financial_settlements').delete().eq('event_id', ids.event))
    await run('audit', admin.from('event_audit_logs').delete().eq('event_id', ids.event))
    await run('payments', admin.from('payments').delete().in('id', ids.payments))
    await run('registrations', admin.from('registrations').delete().in('id', ids.registrations))
    await run('categories', admin.from('event_categories').delete().eq('id', ids.category))
    await run('rules', admin.from('category_rule_sets').delete().eq('id', ids.rule))
    await run('events', admin.from('events').delete().eq('id', ids.event))
    await run('athletes', admin.from('athletes').delete().in('id', ids.athletes))
    await run('teams', admin.from('teams').delete().eq('id', ids.team))
    if (ownerId && report.ownerCpf) await run('cpf', admin.from('profiles').update({ cpf: previousCpf }).eq('id', ownerId))
    report.cleanup = failures.length ? `FALHA: ${failures.join('; ')}` : 'OK (massa removida; cliente Asaas da organização preservado)'
    writeFileSync(path.join(evidenceDir, 'report.json'), JSON.stringify(report, null, 2))
    console.log(JSON.stringify(report, null, 2))
  }
  if (report.smoke !== 'OK' || String(report.cleanup).startsWith('FALHA')) process.exit(1)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
