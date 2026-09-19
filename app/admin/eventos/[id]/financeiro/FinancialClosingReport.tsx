import { Alert } from '@/components/ui/Alert'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  MobileRecord,
  MobileRecordHeader,
  MobileRecordMeta,
  MobileRecordStatus,
  MobileRecordTitle,
} from '@/components/ui/MobileRecord'
import { StatusBadge, type StatusBadgeProps } from '@/components/ui/StatusBadge'
import {
  formatClosingAmount,
  settlementOriginLabel,
  type ClosingLine,
  type EventClosingReport,
} from '@/lib/finance/event-closing'

const registrationLabels: Record<string, string> = {
  pendente_pagamento: 'Pendente de pagamento',
  efetivada: 'Efetivada',
  expirada: 'Expirada',
  cancelada: 'Cancelada',
  estornada: 'Estornada',
}

const paymentLabels: Record<string, string> = {
  aguardando: 'Aguardando',
  pago: 'Pago',
  expirado: 'Expirado',
  cancelado: 'Cancelado',
  estornado: 'Estornado',
}

const registrationVariants: Record<string, StatusBadgeProps['variant']> = {
  pendente_pagamento: 'warning',
  efetivada: 'success',
  expirada: 'error',
  cancelada: 'error',
  estornada: 'error',
}

const paymentVariants: Record<string, StatusBadgeProps['variant']> = {
  aguardando: 'warning',
  pago: 'success',
  expirado: 'error',
  cancelado: 'error',
  estornado: 'error',
}

function money(value: string) {
  const [whole, fraction] = value.split('.')
  return `R$ ${Number(whole).toLocaleString('pt-BR')},${fraction}`
}

const columns: Array<DataTableColumn<ClosingLine>> = [
  { key: 'athlete', header: 'Atleta', render: (row) => row.athleteName },
  { key: 'category', header: 'Categoria', render: (row) => row.categoryName },
  {
    key: 'registrationStatus',
    header: 'Inscrição',
    render: (row) => (
      <StatusBadge variant={registrationVariants[row.status] || 'neutral'}>
        {registrationLabels[row.status] || row.status}
      </StatusBadge>
    ),
  },
  {
    key: 'paymentStatus',
    header: 'Pagamento',
    render: (row) => row.paymentStatus
      ? <StatusBadge variant={paymentVariants[row.paymentStatus] || 'neutral'}>{paymentLabels[row.paymentStatus]}</StatusBadge>
      : <StatusBadge variant="neutral">Sem pagamento</StatusBadge>,
  },
  { key: 'amount', header: 'Valor considerado', align: 'right', render: (row) => money(row.consideredAmount) },
  { key: 'origin', header: 'Origem da efetivação', render: (row) => settlementOriginLabel(row.settlementOrigin) },
]

export default function FinancialClosingReport({ report }: { report: EventClosingReport }) {
  const { totals, lines } = report
  const metrics = [
    { label: 'Inscrições realizadas', value: String(totals.performedCount) },
    { label: 'Inscrições canceladas', value: String(totals.cancelledCount) },
    { label: 'Inscrições efetivadas', value: String(totals.settledCount) },
    { label: 'Receita bruta', value: formatClosingAmount(totals.grossRevenueCents) },
  ]

  return (
    <section aria-labelledby="event-closing-title" className="space-y-mc-16">
      <div>
        <h2 id="event-closing-title" className="font-mc-display text-mc-h2 text-mc-text-primary">Fechamento do evento</h2>
        <p className="mt-mc-8 font-mc-interface text-mc-body text-mc-text-secondary">
          Totais derivados das inscrições e dos pagamentos persistidos. Pendentes, expiradas, canceladas e estornadas não entram na receita bruta.
        </p>
      </div>

      <dl className="grid gap-mc-12 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-mc-medium border border-mc-border bg-mc-surface p-mc-16">
            <dt className="font-mc-interface text-sm text-mc-text-secondary">{metric.label}</dt>
            <dd className="mt-mc-8 font-mc-display text-mc-h3 text-mc-text-primary">{metric.value}</dd>
          </div>
        ))}
      </dl>

      <Alert variant="info" title="Taxa da plataforma">
        A taxa da plataforma e a receita líquida permanecem pendentes de decisão comercial. Nenhum percentual ou valor foi aplicado neste fechamento.
      </Alert>

      {lines.length ? (
        <>
          <DataTable
            rows={lines}
            columns={columns}
            getRowKey={(row) => row.id}
            caption="Inscrições que compõem o fechamento financeiro"
            className="hidden lg:block"
          />
          <div className="space-y-mc-12 lg:hidden">
            {lines.map((row) => (
              <MobileRecord key={row.id}>
                <MobileRecordHeader>
                  <div className="min-w-0">
                    <MobileRecordTitle className="truncate text-lg">{row.athleteName}</MobileRecordTitle>
                    <MobileRecordMeta>{row.categoryName}</MobileRecordMeta>
                  </div>
                  <StatusBadge variant={registrationVariants[row.status] || 'neutral'}>
                    {registrationLabels[row.status] || row.status}
                  </StatusBadge>
                </MobileRecordHeader>
                <dl className="mt-mc-16 grid gap-mc-12 font-mc-interface text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-mc-text-secondary">Pagamento</dt>
                    <dd className="mt-mc-4 text-mc-text-primary">{row.paymentStatus ? paymentLabels[row.paymentStatus] : 'Sem pagamento'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-mc-text-secondary">Valor considerado</dt>
                    <dd className="mt-mc-4 text-mc-text-primary">{money(row.consideredAmount)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-mc-text-secondary">Origem da efetivação</dt>
                    <dd className="mt-mc-4 text-mc-text-primary">{settlementOriginLabel(row.settlementOrigin)}</dd>
                  </div>
                </dl>
                <MobileRecordStatus>
                  <StatusBadge variant={row.paymentStatus ? paymentVariants[row.paymentStatus] || 'neutral' : 'neutral'}>
                    {row.paymentStatus ? paymentLabels[row.paymentStatus] : 'Sem pagamento'}
                  </StatusBadge>
                </MobileRecordStatus>
              </MobileRecord>
            ))}
          </div>
        </>
      ) : (
        <EmptyState title="Nenhuma inscrição realizada" description="Quando houver inscrições neste evento, elas aparecerão no fechamento." />
      )}
    </section>
  )
}
