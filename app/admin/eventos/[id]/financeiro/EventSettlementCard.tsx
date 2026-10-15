import type { ReactNode } from 'react'
import { Alert } from '@/components/ui/Alert'
import { StatusBadge, type StatusBadgeProps } from '@/components/ui/StatusBadge'
import {
  computeSettlementTotals,
  distributionStatusLabel,
  maskIdentifier,
  SETTLEMENT_POLICY_V1,
  settlementStatusLabel,
  type SettlementDistributionStatus,
  type SettlementStatus,
} from '@/lib/finance/settlement'
import { CreateSettlementForm, SettlementPixPanel } from './SettlementControls'

export type SettlementRow = {
  id: string
  sequence_number: number
  status: SettlementStatus
  eligible_registration_count: number
  fee_per_registration_cents: number
  platform_fee_gross_cents: number
  gross_confirmed_cents: number
  provider_payment_id: string | null
  provider_net_value_cents: number | null
  split_recipient_wallet_id: string | null
  split_percent: number | null
  split_id: string | null
  distribution_status: SettlementDistributionStatus
  due_at: string | null
  issued_at: string | null
  paid_at: string | null
  distribution_done_at: string | null
  created_at: string
}

const statusVariants: Record<SettlementStatus, StatusBadgeProps['variant']> = {
  pendente_emissao: 'neutral',
  emitindo: 'info',
  aguardando_pagamento: 'warning',
  reconciliacao: 'error',
  pago: 'success',
  cancelado: 'neutral',
}

const distributionVariants: Record<SettlementDistributionStatus, StatusBadgeProps['variant']> = {
  pendente: 'neutral',
  concluido: 'success',
  falhou: 'error',
}

function money(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function when(value: string | null) {
  if (!value) return '—'
  const date = new Date(value.length === 10 ? `${value}T12:00:00-03:00` : value)
  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: value.length === 10 ? undefined : 'short', timeZone: 'America/Sao_Paulo' })
}

function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="font-mc-interface text-xs text-mc-text-secondary">{label}</dt>
      <dd className="mt-mc-4 break-words font-mc-interface text-sm font-semibold text-mc-text-primary">{value}</dd>
    </div>
  )
}

export default function EventSettlementCard({
  eventId,
  settlements,
  pendingCount,
  receiptsInReview,
  canIssue,
  platformAdmin,
  enabled,
}: {
  eventId: string
  settlements: SettlementRow[]
  pendingCount: number
  receiptsInReview: number
  canIssue: boolean
  platformAdmin: boolean
  enabled: boolean
}) {
  const preview = computeSettlementTotals(pendingCount)
  const fee = money(SETTLEMENT_POLICY_V1.valueCents)
  const countLabel = `${pendingCount} inscrição(ões)`

  return (
    <section aria-labelledby="settlement-title" className="space-y-mc-16 rounded-mc-medium border border-mc-border bg-mc-surface p-mc-16 sm:p-mc-24">
      <div>
        <h2 id="settlement-title" className="font-mc-display text-mc-h2 text-mc-text-primary">Fechamento financeiro</h2>
        <p className="mt-mc-8 font-mc-interface text-mc-body text-mc-text-secondary">
          Comissão MEU CAMP de {fee} por inscrição confirmada e paga. Cada inscrição entra em um único fechamento; novas inscrições pagas geram o fechamento seguinte.
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-mc-16 border-y border-mc-border py-mc-16 md:grid-cols-4">
        <Fact label="Confirmadas fora de fechamento" value={pendingCount} />
        <Fact label="Cálculo" value={`${pendingCount} × ${fee}`} />
        <Fact label="Total a fechar" value={money(preview.totalCents)} />
        <Fact label="Fechamentos emitidos" value={settlements.length} />
      </dl>

      {receiptsInReview > 0 ? (
        <Alert variant="warning" role="status" title="Comprovantes em análise">
          {receiptsInReview} comprovante(s) aguardam análise. Aprove ou rejeite antes de emitir o fechamento.
        </Alert>
      ) : null}

      {canIssue && pendingCount > 0 && receiptsInReview === 0 ? (
        <CreateSettlementForm eventId={eventId} countLabel={countLabel} totalLabel={money(preview.totalCents)} />
      ) : null}
      {!canIssue ? <p className="font-mc-interface text-sm text-mc-text-secondary">Seu papel permite consulta, mas não emissão do fechamento.</p> : null}

      {settlements.length ? (
        <ul aria-label="Fechamentos do evento" className="space-y-mc-16">
          {settlements.map(settlement => {
            const payable = canIssue && enabled && ['pendente_emissao', 'aguardando_pagamento'].includes(settlement.status)
            return (
              <li key={settlement.id} className="space-y-mc-12 border-t border-mc-border pt-mc-16 first:border-t-0 first:pt-0">
                <div className="flex flex-wrap items-center justify-between gap-mc-8">
                  <h3 className="font-mc-display text-mc-h3 text-mc-text-primary">Fechamento #{settlement.sequence_number}</h3>
                  <div className="flex flex-wrap gap-mc-8">
                    <StatusBadge variant={statusVariants[settlement.status]}>{settlementStatusLabel[settlement.status]}</StatusBadge>
                    {settlement.status === 'pago' || settlement.distribution_status !== 'pendente'
                      ? <StatusBadge variant={distributionVariants[settlement.distribution_status]}>{distributionStatusLabel[settlement.distribution_status]}</StatusBadge>
                      : null}
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-mc-16 md:grid-cols-4">
                  <Fact label="Inscrições" value={`${settlement.eligible_registration_count} × ${money(settlement.fee_per_registration_cents)}`} />
                  <Fact label="Total" value={money(settlement.platform_fee_gross_cents)} />
                  <Fact label="Vencimento" value={when(settlement.due_at)} />
                  <Fact label="Pago em" value={when(settlement.paid_at)} />
                </dl>
                {settlement.status === 'reconciliacao' ? (
                  <Alert variant="error" role="status">A emissão ficou incerta no Asaas e aguarda conciliação. Não emita outra cobrança.</Alert>
                ) : null}
                {payable ? <SettlementPixPanel settlementId={settlement.id} issued={Boolean(settlement.provider_payment_id)} /> : null}
                {canIssue && !enabled && settlement.status !== 'pago' ? (
                  <p className="font-mc-interface text-sm text-mc-text-secondary">Pagamento via PIX do fechamento desligado neste ambiente.</p>
                ) : null}

                {platformAdmin ? (
                  <details className="rounded-mc-medium border border-mc-border bg-mc-surface-secondary p-mc-12">
                    <summary className="min-h-11 cursor-pointer content-center font-mc-interface text-sm font-semibold text-mc-text-primary">Auditoria da plataforma</summary>
                    <dl className="mt-mc-12 grid grid-cols-1 gap-mc-12 sm:grid-cols-2 lg:grid-cols-3">
                      <Fact label="Fechamento" value={maskIdentifier(settlement.id)} />
                      <Fact label="Cobrança Asaas" value={maskIdentifier(settlement.provider_payment_id)} />
                      <Fact label="Valor bruto" value={money(settlement.platform_fee_gross_cents)} />
                      <Fact label="Valor líquido (Asaas)" value={settlement.provider_net_value_cents == null ? 'Aguardando recebimento' : money(settlement.provider_net_value_cents)} />
                      <Fact label="Split" value={settlement.split_percent == null ? '—' : `${Number(settlement.split_percent)}% do líquido`} />
                      <Fact label="Status do split" value={distributionStatusLabel[settlement.distribution_status]} />
                      <Fact label="Wallet recebedora" value={maskIdentifier(settlement.split_recipient_wallet_id)} />
                      <Fact label="Split ID" value={maskIdentifier(settlement.split_id)} />
                      <Fact label="Inscrições pagas (bruto)" value={money(settlement.gross_confirmed_cents)} />
                      <Fact label="Criado" value={when(settlement.created_at)} />
                      <Fact label="Emitido" value={when(settlement.issued_at)} />
                      <Fact label="Split concluído" value={when(settlement.distribution_done_at)} />
                    </dl>
                  </details>
                ) : null}
              </li>
            )
          })}
        </ul>
      ) : null}
    </section>
  )
}
