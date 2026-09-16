import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createPrivilegedClient } from '@/lib/supabase/admin'
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
  const { data, error } = await supabase.from('payments').select(`id, external_reference, valor_total, metodo, status, created_at, payment_attempts(gateway_payment_id, status), payment_registrations(amount, registrations(id, status, athlete_snapshot))`).eq('event_id', event.id).order('created_at', { ascending: false })
  const payments = (data || []) as unknown as FinancialPayment[]
  const paymentIds = payments.map(payment => payment.id)
  const admin = createPrivilegedClient()
  const { data: jobs } = paymentIds.length ? await admin.from('payment_issuance_jobs').select('payment_id, state').in('payment_id', paymentIds) : { data: [] }
  const jobState = new Map((jobs || []).map(job => [job.payment_id, job.state]))

  return <main className="min-h-screen bg-slate-50"><div className="container mx-auto max-w-6xl px-6 py-8">
    <Link href={`/admin/eventos/${event.id}/gerenciar`} className="font-semibold text-primary-blue">← Voltar para gestão</Link>
    <header className="my-6"><h1 className="text-3xl font-bold text-slate-900">Financeiro — {event.nome}</h1><p className="mt-2 text-slate-600">Conciliação e baixa manual auditada. Tentativas do gateway nunca são apagadas.</p></header>
    {error ? <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">Não foi possível carregar os pagamentos.</p> : null}
    {!error && payments.length === 0 ? <p className="rounded-xl bg-white p-8 text-slate-600 shadow">Nenhum pagamento neste evento.</p> : null}
    <section aria-label="Pagamentos do evento" className="space-y-5">
      {payments.map(payment => {
        const claim = jobState.get(payment.id)
        const needsReview = claim === 'reconcile' || payment.payment_attempts.some(attempt => attempt.status !== payment.status)
        return <article key={payment.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold text-slate-900">{payment.external_reference || payment.id}</h2><p className="mt-1 text-sm text-slate-600">{payment.metodo.toUpperCase()} · R$ {Number(payment.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} · {payment.payment_registrations.length} inscrição(ões)</p></div><div className="flex gap-2"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase">{paymentLabels[payment.status] || payment.status}</span>{needsReview ? <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase text-amber-800">Conciliação</span> : null}</div></div>
          <ul className="mt-4 space-y-1 text-sm text-slate-700">{payment.payment_registrations.map(link => <li key={link.registrations?.id || String(link.amount)}>{athleteName(link.registrations?.athlete_snapshot)} · {link.registrations?.status || 'indisponível'}</li>)}</ul>
          {payment.payment_attempts.length ? <p className="mt-3 text-xs text-slate-500">Tentativa: {payment.payment_attempts.map(attempt => `${attempt.gateway_payment_id} (${attempt.status})`).join(', ')}</p> : <p className="mt-3 text-xs text-slate-500">Sem tentativa emitida no gateway.</p>}
          {payment.status === 'aguardando' && canSettle ? <ManualSettlementForm paymentId={payment.id} eventId={event.id} /> : null}
          {payment.status === 'aguardando' && !canSettle ? <p className="mt-4 text-sm text-slate-500">Seu papel permite consulta, mas não baixa manual.</p> : null}
        </article>
      })}
    </section>
  </div></main>
}
