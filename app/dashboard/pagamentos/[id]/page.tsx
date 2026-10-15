import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { CheckCircle2, Clock3, FileText, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { allowsPublicOrganization } from '@/lib/events/public-organization'
import { isPaymentsManualOnly } from '@/lib/payments/manual-only'
import { PIX_KEY_TYPE_LABELS, formatPixKey } from '@/lib/finance/pix-key'
import {
  PAYER_PAYMENT_STAGE_LABELS,
  PAYMENT_RECEIPT_STATUS_LABELS,
  canSubmitReceipt,
  resolvePayerPaymentStage,
  type PayerPaymentStage,
  type PaymentReceiptStatus,
} from '@/lib/finance/payment-receipt'
import { Alert } from '@/components/ui/Alert'
import { Card } from '@/components/ui/Card'
import { PageContainer } from '@/components/ui/PageContainer'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge, type StatusBadgeProps } from '@/components/ui/StatusBadge'
import IssuePayment from '../IssuePayment'
import CopyPixKeyButton from '../CopyPixKeyButton'
import ReceiptUploadForm from '../ReceiptUploadForm'

const paymentLabels: Record<string, string> = {
  aguardando: 'Aguardando baixa',
  pago: 'Pago',
  expirado: 'Expirado',
  cancelado: 'Cancelado',
  estornado: 'Estornado',
}

const paymentVariants: Record<string, StatusBadgeProps['variant']> = {
  aguardando: 'warning',
  pago: 'success',
  expirado: 'error',
  cancelado: 'error',
  estornado: 'error',
}

const stageVariants: Record<PayerPaymentStage, StatusBadgeProps['variant']> = {
  aguardando_pagamento: 'warning',
  em_analise: 'info',
  rejeitado: 'error',
  aprovado: 'success',
  encerrado: 'neutral',
}

const receiptVariants: Record<PaymentReceiptStatus, StatusBadgeProps['variant']> = {
  em_analise: 'info',
  aprovado: 'success',
  rejeitado: 'error',
}

function money(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function dateTime(value: string) {
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' })
}

function StageIcon({ stage }: { stage: PayerPaymentStage }) {
  if (stage === 'aprovado') return <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
  if (stage === 'rejeitado') return <XCircle aria-hidden="true" className="h-3.5 w-3.5" />
  return <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
}

export default async function PaymentSummary({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirectTo=${encodeURIComponent(`/dashboard/pagamentos/${params.id}`)}`)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id)) notFound()
  const { data: payment, error } = await supabase.from('payments')
    .select('id, external_reference, valor_total, metodo, status, events(nome, organization_id), payment_registrations(registration_id, amount, registrations(status))')
    .eq('id', params.id).eq('created_by', user.id).maybeSingle()
  if (error) {
    return (
      <main className="py-mc-32 sm:py-mc-48">
        <PageContainer>
          <Alert variant="error" role="alert">Não foi possível carregar o pagamento. Tente novamente.</Alert>
        </PageContainer>
      </main>
    )
  }
  if (!payment || !allowsPublicOrganization(payment.events?.organization_id || '')) notFound()

  const manualOnly = isPaymentsManualOnly()
  const [{ data: instructions }, { data: receiptRows }] = await Promise.all([
    supabase.from('payment_pix_instructions')
      .select('pix_key_type, pix_key, recipient_name')
      .eq('payment_id', payment.id)
      .maybeSingle(),
    supabase.from('payment_receipts')
      .select('id, status, rejection_reason, created_at, reviewed_at')
      .eq('payment_id', payment.id)
      .order('created_at', { ascending: false }),
  ])
  const receipts = receiptRows || []
  const directPix = manualOnly && payment.metodo === 'pix' && Boolean(instructions)
  const latest = receipts[0] || null
  const stage = resolvePayerPaymentStage(payment.status, latest?.status ?? null)
  const confirmedRegistrations = payment.payment_registrations.filter((link) => link.registrations?.status === 'efetivada').length

  return (
    <main className="py-mc-32 sm:py-mc-48">
      <PageContainer>
        <PageHeader
          title={directPix ? 'Pagamento da inscrição' : 'Resumo do pagamento'}
          description={payment.events?.nome || 'Evento'}
          breadcrumb={<Link href="/dashboard/inscricoes" className="font-semibold text-mc-action hover:underline">Voltar para inscrições</Link>}
        />
        <Card className="mt-mc-32 p-mc-16 sm:p-mc-24">
          <dl className="grid gap-mc-16 font-mc-interface text-sm sm:grid-cols-2">
            <div>
              <dt className="text-mc-text-secondary">{directPix ? 'Valor a pagar' : 'Valor reservado'}</dt>
              <dd className="mt-mc-4 font-mc-display text-mc-h2 text-mc-text-primary">{money(payment.valor_total)}</dd>
            </div>
            <div>
              <dt className="text-mc-text-secondary">Situação</dt>
              <dd className="mt-mc-8">
                {directPix ? (
                  <StatusBadge variant={stageVariants[stage]} icon={<StageIcon stage={stage} />}>
                    {PAYER_PAYMENT_STAGE_LABELS[stage]}
                  </StatusBadge>
                ) : (
                  <StatusBadge variant={paymentVariants[payment.status] || 'neutral'}>
                    {paymentLabels[payment.status] || payment.status}
                  </StatusBadge>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-mc-text-secondary">Inscrições vinculadas</dt>
              <dd className="mt-mc-4 font-semibold text-mc-text-primary">{payment.payment_registrations.length}</dd>
            </div>
            <div>
              <dt className="text-mc-text-secondary">Forma de pagamento</dt>
              <dd className="mt-mc-4 font-semibold text-mc-text-primary">{directPix ? 'PIX direto à organização' : payment.metodo.toUpperCase()}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-mc-text-secondary">Referência</dt>
              <dd className="mt-mc-4 break-all font-semibold text-mc-text-primary">{payment.external_reference}</dd>
            </div>
          </dl>
          {directPix ? null : (
            <Alert variant="info" className="mt-mc-24">
              {manualOnly
                ? 'A reserva não confirma pagamento. Neste go-live o organizador registra o recebimento por baixa manual. A emissão de cobrança no Asaas está desligada.'
                : 'A reserva não confirma pagamento. A emissão abaixo cria a cobrança somente no Asaas Sandbox.'}
            </Alert>
          )}
          {manualOnly && payment.metodo === 'pix' && payment.status === 'aguardando' && !instructions ? (
            <Alert variant="warning" className="mt-mc-16" title="Instruções PIX indisponíveis">
              Esta reserva foi criada antes da organização configurar o PIX de recebimento. Fale com a organização do evento para concluir o pagamento.
            </Alert>
          ) : null}
          {payment.status === 'aguardando' && !manualOnly ? <div className="mt-mc-16"><IssuePayment paymentId={payment.id} /></div> : null}
        </Card>

        {directPix && instructions && stage === 'aprovado' ? (
          <Alert variant="success" role="status" className="mt-mc-24" title="Pagamento aprovado" icon={<CheckCircle2 aria-hidden="true" className="h-5 w-5 text-mc-success" />}>
            {confirmedRegistrations === payment.payment_registrations.length
              ? 'A organização validou o comprovante. Sua inscrição está confirmada.'
              : 'A organização validou o comprovante. Acompanhe a situação das inscrições na sua lista.'}
          </Alert>
        ) : null}

        {directPix && instructions && payment.status === 'aguardando' ? (
          <Card className="mt-mc-24 p-mc-16 sm:p-mc-24" aria-labelledby="pix-instructions-title">
            <h2 id="pix-instructions-title" className="font-mc-display text-mc-h3 text-mc-text-primary">Pague diretamente para a organização</h2>
            <p className="mt-mc-8 font-mc-interface text-sm text-mc-text-secondary">
              Faça um PIX de <strong className="text-mc-text-primary">{money(payment.valor_total)}</strong> no app do seu banco. Confira o favorecido antes de confirmar.
            </p>
            <dl className="mt-mc-16 grid gap-mc-16 rounded-mc-medium bg-mc-surface-secondary p-mc-16 font-mc-interface text-sm sm:grid-cols-2">
              <div className="min-w-0">
                <dt className="text-mc-text-secondary">Favorecido</dt>
                <dd className="mt-mc-4 break-words text-base font-semibold text-mc-text-primary">{instructions.recipient_name}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-mc-text-secondary">Chave PIX ({PIX_KEY_TYPE_LABELS[instructions.pix_key_type]})</dt>
                <dd className="mt-mc-4 select-all break-all text-base font-semibold text-mc-text-primary">{formatPixKey(instructions.pix_key_type, instructions.pix_key)}</dd>
              </div>
            </dl>
            <div className="mt-mc-16">
              <CopyPixKeyButton value={instructions.pix_key} />
            </div>
            <p className="mt-mc-16 font-mc-interface text-xs text-mc-text-secondary">
              O MEU CAMP não recebe este valor. A inscrição é confirmada somente depois que a organização validar o comprovante.
            </p>
          </Card>
        ) : null}

        {directPix && payment.status === 'aguardando' ? (
          <Card className="mt-mc-24 p-mc-16 sm:p-mc-24" aria-labelledby="receipt-title">
            <h2 id="receipt-title" className="font-mc-display text-mc-h3 text-mc-text-primary">
              {stage === 'em_analise' ? 'Comprovante enviado' : 'Enviar comprovante'}
            </h2>
            {stage === 'em_analise' ? (
              <Alert variant="info" role="status" className="mt-mc-16" icon={<Clock3 aria-hidden="true" className="h-5 w-5 text-mc-info" />}>
                A organização vai validar seu pagamento. Status: em análise. Um novo envio só fica disponível se este comprovante for rejeitado.
              </Alert>
            ) : null}
            {stage === 'rejeitado' && latest ? (
              <Alert variant="error" role="alert" className="mt-mc-16" title="Comprovante não aprovado" icon={<XCircle aria-hidden="true" className="h-5 w-5 text-mc-error" />}>
                <span className="block">Motivo: {latest.rejection_reason}</span>
                <span className="mt-mc-4 block">Envie um novo comprovante abaixo.</span>
              </Alert>
            ) : null}
            {stage === 'aguardando_pagamento' ? (
              <p className="mt-mc-8 font-mc-interface text-sm text-mc-text-secondary">Depois de pagar, envie o comprovante para a organização validar.</p>
            ) : null}
            {canSubmitReceipt(stage) ? (
              <div className="mt-mc-16">
                <ReceiptUploadForm paymentId={payment.id} resubmission={stage === 'rejeitado'} />
              </div>
            ) : null}
          </Card>
        ) : null}

        {directPix && receipts.length ? (
          <section className="mt-mc-24" aria-labelledby="receipt-history-title">
            <h2 id="receipt-history-title" className="font-mc-display text-mc-h3 text-mc-text-primary">Comprovantes enviados</h2>
            <ul className="mt-mc-12 divide-y divide-mc-border overflow-hidden rounded-mc-medium border border-mc-border bg-mc-surface">
              {receipts.map((receipt) => (
                <li key={receipt.id} className="flex flex-col gap-mc-8 px-mc-16 py-mc-12 font-mc-interface text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <StatusBadge variant={receiptVariants[receipt.status]}>{PAYMENT_RECEIPT_STATUS_LABELS[receipt.status]}</StatusBadge>
                    <p className="mt-mc-4 text-mc-text-secondary">Enviado em {dateTime(receipt.created_at)}</p>
                    {receipt.status === 'rejeitado' && receipt.rejection_reason ? (
                      <p className="mt-mc-4 break-words text-mc-text-primary">Motivo: {receipt.rejection_reason}</p>
                    ) : null}
                  </div>
                  <a
                    href={`/dashboard/pagamentos/comprovantes/${receipt.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-mc-8 font-semibold text-mc-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
                  >
                    <FileText aria-hidden="true" className="h-4 w-4" />
                    Ver arquivo
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </PageContainer>
    </main>
  )
}
