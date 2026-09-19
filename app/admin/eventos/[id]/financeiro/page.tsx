import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { PageContainer } from '@/components/ui/PageContainer'
import { PageHeader } from '@/components/ui/PageHeader'
import { createClient } from '@/lib/supabase/server'
import { createPrivilegedClient } from '@/lib/supabase/admin'
import { loadEventClosing } from './data'
import FinancialClosingReport from './FinancialClosingReport'
import ManualSettlementForm from './ManualSettlementForm'

type FinancialPayment = {
  id: string
  external_reference: string | null
  valor_total: number
  metodo: 'pix' | 'boleto'
  status: string
  created_at: string
  payment_attempts: Array<{ gateway_payment_id: string; status: string }>
  payment_registrations: Array<{ amount: number; registrations: { id: string; status: string; athlete_snapshot: unknown } | null }>
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
  const { data: event } = await supabase.from('events').select('id, nome, organization_id').eq('id', params.id).maybeSingle()
  if (!event) notFound()
  const [{ data: membership }, { data: platformRole }] = await Promise.all([
    supabase.from('organization_members').select('role').eq('organization_id', event.organization_id).eq('user_id', user.id).in('role', ['owner', 'organizer', 'finance']).limit(1).maybeSingle(),
    supabase.from('platform_user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle(),
  ])
  if (!membership && !platformRole) redirect('/dashboard?erro=sem_permissao')
  const canSettle = Boolean(platformRole || membership?.role === 'owner' || membership?.role === 'organizer')
  const [{ data, error }, closing] = await Promise.all([
    supabase.from('payments').select(`id, external_reference, valor_total, metodo, status, created_at, payment_attempts(gateway_payment_id, status), payment_registrations(amount, registrations(id, status, athlete_snapshot))`).eq('event_id', event.id).order('created_at', { ascending: false }),
    loadEventClosing(supabase, event.id),
  ])
  const payments = (data || []) as unknown as FinancialPayment[]
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
          breadcrumb={
            <Link href={`/admin/eventos/${event.id}/gerenciar`} className="inline-flex min-h-10 items-center gap-mc-8 font-semibold text-mc-action">
              <ArrowLeft aria-hidden="true" size={18} />
              Voltar para gestão
            </Link>
          }
        />

        <div className="mt-mc-32 space-y-mc-32">
          <FinancialClosingReport report={closing} />

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
                  {payment.status === 'aguardando' && canSettle ? <ManualSettlementForm paymentId={payment.id} eventId={event.id} /> : null}
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
