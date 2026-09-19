import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isPaymentsManualOnly } from '@/lib/payments/manual-only'
import IssuePayment from '../IssuePayment'

export default async function PaymentSummary({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirectTo=${encodeURIComponent(`/dashboard/pagamentos/${params.id}`)}`)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id)) notFound()
  // Staff RLS is broader than this personal route. Require the actual payer explicitly.
  const { data: payment, error } = await supabase.from('payments')
    .select('id, external_reference, valor_total, metodo, status, events(nome), payment_registrations(registration_id, amount)')
    .eq('id', params.id).eq('created_by', user.id).maybeSingle()
  if (error) return <section className="container mx-auto p-6"><p role="alert">Não foi possível carregar o pagamento. Tente novamente.</p></section>
  if (!payment) notFound()
  return <section className="container mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow">
    <h1 className="text-3xl font-bold">Resumo do pagamento</h1>
    <h2 className="mt-4 text-xl">{payment.events?.nome || 'Evento'}</h2>
    <dl className="my-6 space-y-3">
      <div><dt>Valor reservado</dt><dd className="text-2xl font-bold">{payment.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</dd></div>
      <div><dt>Inscrições vinculadas</dt><dd>{payment.payment_registrations.length}</dd></div>
      <div><dt>Forma de pagamento</dt><dd>{payment.metodo.toUpperCase()}</dd></div>
      <div><dt>Status</dt><dd>{payment.status}</dd></div>
      <div><dt>Referência</dt><dd className="break-all">{payment.external_reference}</dd></div>
    </dl>
    <p className="mb-6 rounded-lg bg-blue-50 p-4">{isPaymentsManualOnly()
      ? 'A reserva não confirma pagamento. Neste go-live o organizador registra o recebimento por baixa manual. A emissão de cobrança no Asaas está desligada.'
      : 'A reserva não confirma pagamento. A emissão abaixo cria a cobrança somente no Asaas Sandbox.'}</p>
    {payment.status === 'aguardando' && !isPaymentsManualOnly() && <IssuePayment paymentId={payment.id} />}
    <Link className="text-primary-blue underline" href="/dashboard/inscricoes">Voltar às inscrições</Link>
  </section>
}
