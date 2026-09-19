import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ClipboardList } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  MobileRecord,
  MobileRecordActions,
  MobileRecordHeader,
  MobileRecordMeta,
  MobileRecordStatus,
  MobileRecordTitle,
} from '@/components/ui/MobileRecord'
import { PageContainer } from '@/components/ui/PageContainer'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge, type StatusBadgeProps } from '@/components/ui/StatusBadge'
import { createClient } from '@/lib/supabase/server'
import { isPaymentsManualOnly } from '@/lib/payments/manual-only'
import type { Json } from '@/lib/supabase/database.types'
import PaymentCheckout, { type CheckoutRegistration } from './PaymentCheckout'
import CategoryChangeRequest from './CategoryChangeRequest'

function snapshotName(value: Json, key: string) {
  return value && typeof value === 'object' && !Array.isArray(value) && typeof value[key] === 'string' ? String(value[key]) : 'Não informado'
}

const statusLabels: Record<string, string> = {
  rascunho: 'Rascunho',
  pendente_pagamento: 'Pendente de pagamento',
  efetivada: 'Efetivada',
  expirada: 'Expirada',
  cancelada: 'Cancelada',
  estornada: 'Estornada',
}

const statusVariants: Record<string, StatusBadgeProps['variant']> = {
  rascunho: 'neutral',
  pendente_pagamento: 'warning',
  efetivada: 'success',
  expirada: 'error',
  cancelada: 'error',
  estornada: 'error',
}

function RegistrationStatus({ status }: { status: string }) {
  return <StatusBadge variant={statusVariants[status] || 'neutral'}>{statusLabels[status] || status.replaceAll('_', ' ')}</StatusBadge>
}

export default async function RegistrationsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?redirectTo=%2Fdashboard%2Finscricoes')
  const [own, managed] = await Promise.all([
    supabase.from('athletes').select('id').eq('user_id', user.id),
    supabase.from('athlete_managers').select('athlete_id').eq('manager_id', user.id),
  ])
  const ids = Array.from(new Set([...(own.data || []).map(a => a.id), ...(managed.data || []).map(a => a.athlete_id)]))
  const result = ids.length ? await supabase.from('registrations')
    .select('id, numero, athlete_id, event_id, status, valor, athlete_snapshot, category_snapshot, operational_professor_name, events(id, nome)')
    .in('athlete_id', ids).order('created_at', { ascending: false }) : { data: [], error: null }
  const payments = await supabase.from('payments').select('id, status, valor_total, metodo, events(nome), payment_registrations(registration_id)').eq('created_by', user.id).order('created_at', { ascending: false })
  const error = own.error || managed.error || result.error || payments.error
  const reserved = new Set((payments.data || []).filter(p => ['aguardando', 'pago'].includes(p.status)).flatMap(p => p.payment_registrations.map(r => r.registration_id)))
  const checkoutRows: CheckoutRegistration[] = (result.data || []).filter(r => !reserved.has(r.id)).map(r => ({
    id: r.id,
    eventId: r.event_id,
    eventName: r.events?.nome || 'Evento',
    athleteName: snapshotName(r.athlete_snapshot, 'nome_completo'),
    categoryName: snapshotName(r.category_snapshot, 'nome'),
    status: r.status,
    amount: r.valor,
  }))
  const rows = result.data || []
  const columns: Array<DataTableColumn<(typeof rows)[number]>> = [
    {
      key: 'event',
      header: 'Evento',
      render: (registration) => (
        <div className="min-w-52">
          <p className="font-semibold text-mc-text-primary">{registration.events?.nome || 'Evento'}</p>
          <p className="mt-mc-4 text-xs text-mc-text-secondary">Inscrição #{registration.numero}</p>
        </div>
      ),
    },
    {
      key: 'athlete',
      header: 'Atleta',
      render: (registration) => (
        <div className="min-w-48">
          <p className="font-semibold text-mc-text-primary">{snapshotName(registration.athlete_snapshot, 'nome_completo')}</p>
          <p className="mt-mc-4 text-xs text-mc-text-secondary">{snapshotName(registration.category_snapshot, 'nome')}{registration.operational_professor_name ? ` · ${registration.operational_professor_name}` : ''}</p>
        </div>
      ),
    },
    { key: 'status', header: 'Situação', render: (registration) => <RegistrationStatus status={registration.status} /> },
    { key: 'amount', header: 'Valor', render: (registration) => <span className="font-semibold">{registration.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span> },
    {
      key: 'actions',
      header: 'Ação',
      render: (registration) => (
        <div className="min-w-56 space-y-mc-8">
          <Link href={`/dashboard/meus-atletas/${registration.athlete_id}/inscricoes`} className="inline-flex min-h-10 items-center font-semibold text-mc-action hover:underline">Histórico do atleta</Link>
          {registration.status === 'efetivada' ? <CategoryChangeRequest registrationId={registration.id} /> : null}
        </div>
      ),
    },
  ]

  return (
    <main className="py-mc-32 sm:py-mc-48">
      <PageContainer>
        <PageHeader title="Inscrições e pagamentos" description="Consulte inscrições dos atletas que você gerencia e reserve o valor para a baixa manual do organizador. Esta tela não emite PIX nem boleto automaticamente." />

        <div className="mt-mc-32">
          {error ? <Alert variant="error" role="alert">Não foi possível carregar as inscrições.</Alert> : null}
          {!error && !rows.length ? (
            <EmptyState
              icon={<ClipboardList size={34} />}
              title="Nenhuma inscrição encontrada"
              description="Quando você inscrever um atleta em um evento publicado, a inscrição aparece aqui com o status de pagamento."
              action={<Link href="/eventos" className="inline-flex min-h-11 items-center font-mc-interface text-sm font-semibold text-mc-action hover:underline">Ver eventos publicados</Link>}
              className="rounded-mc-medium border border-mc-border bg-mc-surface"
            />
          ) : null}
          {!error && rows.length ? (
            <section aria-labelledby="registrations-list-title">
              <h2 id="registrations-list-title" className="sr-only">Lista de inscrições</h2>
              <DataTable rows={rows} columns={columns} getRowKey={(registration) => registration.id} caption="Inscrições realizadas" className="hidden md:block" tableClassName="min-w-[900px]" />
              <div className="space-y-mc-12 md:hidden">
                {rows.map((registration) => (
                  <MobileRecord key={registration.id}>
                    <MobileRecordHeader>
                      <div className="min-w-0">
                        <MobileRecordTitle className="text-lg leading-6">{registration.events?.nome || 'Evento'}</MobileRecordTitle>
                        <MobileRecordMeta>Inscrição #{registration.numero}</MobileRecordMeta>
                      </div>
                    </MobileRecordHeader>
                    <dl className="mt-mc-16 space-y-mc-12 border-y border-mc-border py-mc-12 font-mc-interface text-sm">
                      <div><dt className="text-mc-text-secondary">Atleta</dt><dd className="mt-mc-4 font-semibold text-mc-text-primary">{snapshotName(registration.athlete_snapshot, 'nome_completo')}</dd></div>
                      <div><dt className="text-mc-text-secondary">Categoria</dt><dd className="mt-mc-4 font-semibold text-mc-text-primary">{snapshotName(registration.category_snapshot, 'nome')}</dd></div>
                      <div><dt className="text-mc-text-secondary">Valor</dt><dd className="mt-mc-4 font-semibold text-mc-text-primary">{registration.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</dd></div>
                    </dl>
                    <MobileRecordStatus><RegistrationStatus status={registration.status} /></MobileRecordStatus>
                    <MobileRecordActions>
                      <Link href={`/dashboard/meus-atletas/${registration.athlete_id}/inscricoes`} className="inline-flex min-h-11 items-center rounded-mc-medium border border-mc-border px-mc-12 font-mc-interface text-sm font-semibold text-mc-text-primary hover:bg-mc-surface-secondary">Histórico do atleta</Link>
                      {registration.status === 'efetivada' ? <CategoryChangeRequest registrationId={registration.id} /> : null}
                    </MobileRecordActions>
                  </MobileRecord>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        {!error && <PaymentCheckout registrations={checkoutRows} manualOnly={isPaymentsManualOnly()} />}
        {!error && !!payments.data?.length && (
          <section className="mt-mc-32" aria-labelledby="reserved-payments-title">
            <h2 id="reserved-payments-title" className="font-mc-display text-mc-h2 text-mc-text-primary">Pagamentos reservados</h2>
            <p className="mt-mc-8 font-mc-interface text-sm text-mc-text-secondary">A reserva guarda o valor. O status muda quando o organizador registra a baixa.</p>
            <ul className="mt-mc-16 divide-y divide-mc-border overflow-hidden rounded-mc-medium border border-mc-border bg-mc-surface">
              {payments.data.map((payment) => (
                <li key={payment.id}>
                  <Link href={`/dashboard/pagamentos/${payment.id}`} className="flex min-h-14 flex-col gap-mc-8 px-mc-16 py-mc-16 transition-colors hover:bg-mc-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mc-focus sm:flex-row sm:items-center sm:justify-between">
                    <span>
                      <strong className="block font-mc-interface text-mc-text-primary">{payment.events?.nome || 'Evento'}</strong>
                      <span className="mt-mc-4 block font-mc-interface text-sm text-mc-text-secondary">{payment.metodo.toUpperCase()} · {payment.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </span>
                    <StatusBadge variant={payment.status === 'pago' ? 'success' : payment.status === 'aguardando' ? 'warning' : 'error'}>
                      {payment.status === 'aguardando' ? 'Aguardando baixa' : payment.status === 'pago' ? 'Pago' : payment.status.replaceAll('_', ' ')}
                    </StatusBadge>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </PageContainer>
    </main>
  )
}
