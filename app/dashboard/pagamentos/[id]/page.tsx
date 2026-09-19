import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isPaymentsManualOnly } from '@/lib/payments/manual-only'
import { Alert } from '@/components/ui/Alert'
import { Card } from '@/components/ui/Card'
import { PageContainer } from '@/components/ui/PageContainer'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge, type StatusBadgeProps } from '@/components/ui/StatusBadge'
import IssuePayment from '../IssuePayment'

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

export default async function PaymentSummary({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirectTo=${encodeURIComponent(`/dashboard/pagamentos/${params.id}`)}`)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.id)) notFound()
  const { data: payment, error } = await supabase.from('payments')
    .select('id, external_reference, valor_total, metodo, status, events(nome), payment_registrations(registration_id, amount)')
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
  if (!payment) notFound()

  return (
    <main className="py-mc-32 sm:py-mc-48">
      <PageContainer>
        <PageHeader
          title="Resumo do pagamento"
          description={payment.events?.nome || 'Evento'}
          breadcrumb={<Link href="/dashboard/inscricoes" className="font-semibold text-mc-action hover:underline">Voltar para inscrições</Link>}
        />
        <Card className="mt-mc-32 p-mc-16 sm:p-mc-24">
          <dl className="grid gap-mc-16 font-mc-interface text-sm sm:grid-cols-2">
            <div>
              <dt className="text-mc-text-secondary">Valor reservado</dt>
              <dd className="mt-mc-4 font-mc-display text-mc-h2 text-mc-text-primary">{payment.valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</dd>
            </div>
            <div>
              <dt className="text-mc-text-secondary">Situação</dt>
              <dd className="mt-mc-8">
                <StatusBadge variant={paymentVariants[payment.status] || 'neutral'}>
                  {paymentLabels[payment.status] || payment.status}
                </StatusBadge>
              </dd>
            </div>
            <div>
              <dt className="text-mc-text-secondary">Inscrições vinculadas</dt>
              <dd className="mt-mc-4 font-semibold text-mc-text-primary">{payment.payment_registrations.length}</dd>
            </div>
            <div>
              <dt className="text-mc-text-secondary">Forma informada</dt>
              <dd className="mt-mc-4 font-semibold text-mc-text-primary">{payment.metodo.toUpperCase()}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-mc-text-secondary">Referência</dt>
              <dd className="mt-mc-4 break-all font-semibold text-mc-text-primary">{payment.external_reference}</dd>
            </div>
          </dl>
          <Alert variant="info" className="mt-mc-24">
            {isPaymentsManualOnly()
              ? 'A reserva não confirma pagamento. Neste go-live o organizador registra o recebimento por baixa manual. A emissão de cobrança no Asaas está desligada.'
              : 'A reserva não confirma pagamento. A emissão abaixo cria a cobrança somente no Asaas Sandbox.'}
          </Alert>
          {payment.status === 'aguardando' && !isPaymentsManualOnly() ? <div className="mt-mc-16"><IssuePayment paymentId={payment.id} /></div> : null}
        </Card>
      </PageContainer>
    </main>
  )
}
