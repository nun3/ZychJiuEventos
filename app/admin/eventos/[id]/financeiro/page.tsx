import { notFound, redirect } from 'next/navigation'
import AdminEventNav, { adminEventBackLink } from '@/components/AdminEventNav'
import { PageContainer } from '@/components/ui/PageContainer'
import { PageHeader } from '@/components/ui/PageHeader'
import { allowsPublicOrganization } from '@/lib/events/public-organization'
import { createClient } from '@/lib/supabase/server'
import { createPrivilegedClient } from '@/lib/supabase/admin'
import { loadEventClosing } from './data'
import FinancialClosingReport from './FinancialClosingReport'
import ManualSettlementForm from './ManualSettlementForm'
import PaymentReceiptReview, { ReceiptFileLink } from './PaymentReceiptReview'
import PlatformFeeCard from './PlatformFeeCard'
import { EventGuidancePanel } from '@/components/onboarding/EventGuidancePanel'
import { Alert } from '@/components/ui/Alert'
import { StatusBadge, type StatusBadgeProps } from '@/components/ui/StatusBadge'
import { PAYMENT_RECEIPT_STATUS_LABELS, requiresDirectPixInstructions, type PaymentReceiptStatus } from '@/lib/finance/payment-receipt'
import { isPaymentsManualOnly } from '@/lib/payments/manual-only'
import { isPlatformSettlementEnabled } from '@/lib/payments/settlement-config'
import EventSettlementCard, { type SettlementRow } from './EventSettlementCard'

const SETTLEMENT_COLUMNS = 'id, sequence_number, status, eligible_registration_count, fee_per_registration_cents, platform_fee_gross_cents, gross_confirmed_cents, provider_payment_id, provider_net_value_cents, split_recipient_wallet_id, split_percent, split_id, distribution_status, due_at, issued_at, paid_at, distribution_done_at, created_at'

type EventReceipt = {
  id: string
  payment_id: string
  status: PaymentReceiptStatus
  mime_type: string
  created_at: string
  reviewed_at: string | null
  rejection_reason: string | null
}

const receiptVariants: Record<PaymentReceiptStatus, StatusBadgeProps['variant']> = {
  em_analise: 'info',
  aprovado: 'success',
  rejeitado: 'error',
}

function categoryName(snapshot: unknown) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return 'Categoria não informada'
  const name = (snapshot as Record<string, unknown>).nome
  return typeof name === 'string' && name.trim() ? name : 'Categoria não informada'
}

function money(value: number) {
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function dateTime(value: string) {
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' })
}

type FinancialPayment = {
  id: string
  external_reference: string | null
  valor_total: number
  metodo: 'pix' | 'boleto'
  status: string
  created_at: string
  payment_attempts: Array<{ gateway_payment_id: string; status: string }>
  payment_registrations: Array<{ amount: number; registrations: { id: string; status: string; athlete_snapshot: unknown; category_snapshot: unknown } | null }>
}

const paymentLabels: Record<string, string> = { aguardando: 'Aguardando', pago: 'Pago', expirado: 'Expirado', cancelado: 'Cancelado', estornado: 'Estornado' }

function athleteName(snapshot: unknown) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return 'Atleta'
  const name = (snapshot as Record<string, unknown>).nome_completo
  return typeof name === 'string' && name.trim() ? name : 'Atleta'
}

export default async function FinancialPage({ params }: { params: { id: string } }) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id)) notFound()
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/admin/autenticacao?redirectTo=${encodeURIComponent(`/admin/eventos/${params.id}/financeiro`)}`)
  const { data: event } = await supabase.from('events').select('id, nome, organization_id, valor_inscricao').eq('id', params.id).maybeSingle()
  if (!event || !allowsPublicOrganization(event.organization_id)) notFound()
  const [{ data: membership }, { data: platformRole }] = await Promise.all([
    supabase.from('organization_members').select('role').eq('organization_id', event.organization_id).eq('user_id', user.id).in('role', ['owner', 'organizer', 'finance']).limit(1).maybeSingle(),
    supabase.from('platform_user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle(),
  ])
  if (!membership && !platformRole) redirect('/dashboard?erro=sem_permissao')
  const canSettle = Boolean(platformRole || membership?.role === 'owner' || membership?.role === 'organizer')
  const manualOnly = isPaymentsManualOnly()
  const [{ data, error }, closing, { data: receiptRows, error: receiptsError }, { data: pixReady }, { data: settlementRows }] = await Promise.all([
    supabase.from('payments').select(`id, external_reference, valor_total, metodo, status, created_at, payment_attempts(gateway_payment_id, status), payment_registrations(amount, registrations(id, status, athlete_snapshot, category_snapshot))`).eq('event_id', event.id).order('created_at', { ascending: false }),
    loadEventClosing(supabase, event.id),
    supabase.from('payment_receipts').select('id, payment_id, status, mime_type, created_at, reviewed_at, rejection_reason').eq('event_id', event.id).order('created_at', { ascending: false }),
    supabase.rpc('event_direct_pix_configured', { target_event_id: event.id }),
    supabase.from('event_financial_settlements').select(`${SETTLEMENT_COLUMNS}, event_financial_settlement_items(registration_id)`).eq('event_id', event.id).order('sequence_number', { ascending: false }),
  ])
  const payments = (data || []) as unknown as FinancialPayment[]
  const receipts = (receiptRows || []) as EventReceipt[]
  const settlements = (settlementRows || []) as unknown as Array<SettlementRow & { event_financial_settlement_items: Array<{ registration_id: string }> }>
  const settledRegistrations = new Set(settlements.flatMap(settlement => settlement.event_financial_settlement_items.map(item => item.registration_id)))
  const pendingSettlementRegistrations = new Set(payments
    .filter(payment => payment.status === 'pago')
    .flatMap(payment => payment.payment_registrations)
    .filter(link => link.registrations?.status === 'efetivada' && !settledRegistrations.has(link.registrations.id))
    .map(link => link.registrations!.id))
  const receiptsByPayment = new Map<string, EventReceipt[]>()
  for (const receipt of receipts) receiptsByPayment.set(receipt.payment_id, [...(receiptsByPayment.get(receipt.payment_id) || []), receipt])
  const pendingReceipts = receipts
    .filter(receipt => receipt.status === 'em_analise')
    .map(receipt => ({ receipt, payment: payments.find(payment => payment.id === receipt.payment_id) }))
    .filter((entry): entry is { receipt: EventReceipt; payment: FinancialPayment } => Boolean(entry.payment))
    .sort((left, right) => left.receipt.created_at.localeCompare(right.receipt.created_at))
  const missingPix = requiresDirectPixInstructions({ manualOnly, eventFee: event.valor_inscricao }) && pixReady !== true
  const paymentIds = payments.map(payment => payment.id)
  const admin = createPrivilegedClient()
  const { data: jobs } = paymentIds.length ? await admin.from('payment_issuance_jobs').select('payment_id, state').in('payment_id', paymentIds) : { data: [] }
  const jobState = new Map((jobs || []).map(job => [job.payment_id, job.state]))

  return (
    <main className="min-h-screen bg-mc-bg">
      <PageContainer className="py-mc-32">
        <PageHeader
          title={`Financeiro — ${event.nome}`}
          description="Conciliação operacional das reservas e fechamento do evento a partir das inscrições e pagamentos persistidos."
          breadcrumb={adminEventBackLink()}
        />
        <AdminEventNav eventId={event.id} current="financeiro" />
        <EventGuidancePanel eventId={event.id} coachmark="financeiro" />

        <div className="mt-mc-32 space-y-mc-32">
          <PlatformFeeCard
            eventId={event.id}
            feeCents={closing.configuredFeeCents}
            canConfigure={Boolean(platformRole)}
          />

          <FinancialClosingReport report={closing} />

          <EventSettlementCard
            eventId={event.id}
            settlements={settlements}
            pendingCount={pendingSettlementRegistrations.size}
            receiptsInReview={receipts.filter(receipt => receipt.status === 'em_analise').length}
            canIssue={canSettle}
            platformAdmin={Boolean(platformRole)}
            enabled={isPlatformSettlementEnabled()}
          />

          {missingPix ? (
            <Alert variant="warning" role="status" title="PIX de recebimento não configurado">
              Atletas não conseguem reservar pagamento neste evento pago até o proprietário da organização cadastrar a chave PIX em{' '}
              <a href="/dashboard/organizacao" className="font-semibold text-mc-action hover:underline">Organização</a>.
            </Alert>
          ) : null}

          <section aria-labelledby="pending-receipts-title" className="space-y-mc-16">
            <div className="flex flex-wrap items-center justify-between gap-mc-8">
              <div>
                <h2 id="pending-receipts-title" className="font-mc-display text-mc-h2 text-mc-text-primary">Comprovantes em análise</h2>
                <p className="mt-mc-8 font-mc-interface text-mc-body text-mc-text-secondary">PIX pago direto à organização. Confira o valor na conta antes de aprovar: a aprovação registra a baixa manual auditada e confirma as inscrições.</p>
              </div>
              <StatusBadge variant={pendingReceipts.length ? 'warning' : 'neutral'}>{pendingReceipts.length} pendente(s)</StatusBadge>
            </div>
            {receiptsError ? <Alert variant="error" role="alert">Não foi possível carregar os comprovantes.</Alert> : null}
            {!receiptsError && pendingReceipts.length === 0 ? (
              <p className="rounded-mc-medium border border-mc-border bg-mc-surface p-mc-24 font-mc-interface text-sm text-mc-text-secondary">Nenhum comprovante aguardando análise.</p>
            ) : null}
            <ul aria-label="Comprovantes aguardando análise" className="space-y-mc-16">
              {pendingReceipts.map(({ receipt, payment }) => (
                <li key={receipt.id} className="rounded-mc-medium border border-mc-border bg-mc-surface p-mc-16 sm:p-mc-24">
                  <div className="flex flex-wrap items-start justify-between gap-mc-12">
                    <div className="min-w-0">
                      <p className="font-mc-display text-mc-h3 text-mc-text-primary">{money(payment.valor_total)}</p>
                      <p className="mt-mc-4 font-mc-interface text-sm text-mc-text-secondary">Enviado em {dateTime(receipt.created_at)} · {receipt.mime_type === 'application/pdf' ? 'PDF' : 'Imagem'}</p>
                      <p className="mt-mc-4 break-all font-mc-interface text-xs text-mc-text-secondary">{payment.external_reference || payment.id}</p>
                    </div>
                    <StatusBadge variant="info">{PAYMENT_RECEIPT_STATUS_LABELS.em_analise}</StatusBadge>
                  </div>
                  <ul className="mt-mc-12 space-y-mc-4 font-mc-interface text-sm text-mc-text-primary">
                    {payment.payment_registrations.map(link => (
                      <li key={link.registrations?.id || String(link.amount)}>
                        <strong>{athleteName(link.registrations?.athlete_snapshot)}</strong>
                        <span className="text-mc-text-secondary"> · {categoryName(link.registrations?.category_snapshot)} · {money(link.amount)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-mc-12"><ReceiptFileLink receiptId={receipt.id} /></div>
                  <div className="mt-mc-12 border-t border-mc-border pt-mc-16">
                    {canSettle
                      ? <PaymentReceiptReview receiptId={receipt.id} eventId={event.id} amountLabel={money(payment.valor_total)} />
                      : <p className="font-mc-interface text-sm text-mc-text-secondary">Seu papel permite consulta, mas não aprovação.</p>}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="operational-reconciliation-title" className="space-y-mc-16">
            <div>
              <h2 id="operational-reconciliation-title" className="font-mc-display text-mc-h2 text-mc-text-primary">Conciliação operacional</h2>
              <p className="mt-mc-8 font-mc-interface text-mc-body text-mc-text-secondary">Reservas, tentativas do gateway e baixa manual auditada. Tentativas nunca são apagadas.</p>
            </div>
            {error ? <p role="alert" className="rounded-mc-medium bg-mc-error/10 p-mc-16 text-mc-error">Não foi possível carregar os pagamentos.</p> : null}
            {!error && payments.length === 0 ? <p className="rounded-mc-medium border border-mc-border bg-mc-surface p-mc-24 text-mc-text-secondary">Nenhum pagamento neste evento.</p> : null}
            <div aria-label="Pagamentos do evento" className="space-y-5">
              {payments.map(payment => {
                const claim = jobState.get(payment.id)
                const needsReview = claim === 'reconcile' || payment.payment_attempts.some(attempt => attempt.status !== payment.status)
                return <article key={payment.id} className="rounded-mc-medium border border-mc-border bg-mc-surface p-mc-16">
                  <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold text-mc-text-primary">{payment.external_reference || payment.id}</h3><p className="mt-1 text-sm text-mc-text-secondary">{payment.metodo.toUpperCase()} · R$ {Number(payment.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} · {payment.payment_registrations.length} inscrição(ões)</p></div><div className="flex gap-2"><span className="rounded-full bg-mc-surface-secondary px-3 py-1 text-xs font-bold uppercase">{paymentLabels[payment.status] || payment.status}</span>{needsReview ? <span className="rounded-full bg-mc-warning/10 px-3 py-1 text-xs font-bold uppercase text-mc-warning">Conciliação</span> : null}</div></div>
                  <ul className="mt-4 space-y-1 text-sm text-mc-text-primary">{payment.payment_registrations.map(link => <li key={link.registrations?.id || String(link.amount)}>{athleteName(link.registrations?.athlete_snapshot)} · {link.registrations?.status || 'indisponível'}</li>)}</ul>
                  {payment.payment_attempts.length ? <p className="mt-3 text-xs text-mc-text-secondary">Tentativa: {payment.payment_attempts.map(attempt => `${attempt.gateway_payment_id} (${attempt.status})`).join(', ')}</p> : <p className="mt-3 text-xs text-mc-text-secondary">Sem tentativa emitida no gateway.</p>}
                  {(receiptsByPayment.get(payment.id) || []).length ? (
                    <ul aria-label="Comprovantes do pagamento" className="mt-3 space-y-2 text-sm">
                      {(receiptsByPayment.get(payment.id) || []).map(receipt => (
                        <li key={receipt.id} className="flex flex-wrap items-center gap-2">
                          <StatusBadge variant={receiptVariants[receipt.status]}>{PAYMENT_RECEIPT_STATUS_LABELS[receipt.status]}</StatusBadge>
                          <span className="text-mc-text-secondary">{dateTime(receipt.created_at)}</span>
                          {receipt.rejection_reason ? <span className="break-words text-mc-text-primary">Motivo: {receipt.rejection_reason}</span> : null}
                          <ReceiptFileLink receiptId={receipt.id} />
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {payment.status === 'aguardando' && canSettle && (receiptsByPayment.get(payment.id) || []).some(receipt => receipt.status === 'em_analise')
                    ? <p className="mt-4 text-sm text-mc-text-secondary">Comprovante em análise: aprove ou rejeite na seção acima.</p>
                    : null}
                  {payment.status === 'aguardando' && canSettle && !(receiptsByPayment.get(payment.id) || []).some(receipt => receipt.status === 'em_analise') ? <ManualSettlementForm paymentId={payment.id} eventId={event.id} /> : null}
                  {payment.status === 'aguardando' && !canSettle ? <p className="mt-4 text-sm text-mc-text-secondary">Seu papel permite consulta, mas não baixa manual.</p> : null}
                </article>
              })}
            </div>
          </section>
        </div>
      </PageContainer>
    </main>
  )
}
