import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, Info } from 'lucide-react'
import InternalNavigation from '@/components/InternalNavigation'
import { Alert, PageContainer, PageHeader, StatusBadge } from '@/components/ui'
import EventActions from '../../EventActions'
import ResultsWorkspace from './ResultsWorkspace'
import { loadResultsPageData } from './data'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function ResultadosPage({ params }: { params: { id: string } }) {
  if (!uuidPattern.test(params.id)) notFound()

  const result = await loadResultsPageData(params.id)
  if (result.kind === 'unauthenticated') {
    redirect(`/admin/autenticacao?redirectTo=${encodeURIComponent(`/admin/eventos/${params.id}/resultados`)}`)
  }
  if (result.kind === 'forbidden') redirect('/dashboard?erro=sem_permissao')
  if (result.kind === 'not_found') notFound()

  return (
    <div className="-mt-24 min-h-screen bg-mc-background">
      <InternalNavigation />
      <main className="py-mc-32 sm:py-mc-48">
        <PageContainer>
          {result.kind === 'error' ? (
            <>
              <PageHeader
                title="Resultados"
                breadcrumb={
                  <Link href={`/admin/eventos/${params.id}/gerenciar`} className="inline-flex min-h-10 items-center gap-mc-8 font-semibold text-mc-action hover:underline">
                    <ArrowLeft aria-hidden="true" size={18} />
                    Voltar para gestão
                  </Link>
                }
              />
              <Alert className="mt-mc-24" role="alert" variant="error" title="Não foi possível carregar os resultados">
                {result.message}
              </Alert>
            </>
          ) : (
            <>
              <PageHeader
                title={`Resultados — ${result.data.event.name}`}
                description="Confirme pesagem e premiação por subchave. O resultado continua vindo das lutas já operadas."
                breadcrumb={
                  <Link href={`/admin/eventos/${result.data.event.id}/gerenciar`} className="inline-flex min-h-10 items-center gap-mc-8 font-semibold text-mc-action hover:underline">
                    <ArrowLeft aria-hidden="true" size={18} />
                    Voltar para gestão
                  </Link>
                }
                actions={<StatusBadge variant={result.data.event.status === 'em_andamento' ? 'success' : 'info'}>Evento: {result.data.event.status.replaceAll('_', ' ')}</StatusBadge>}
              />

              {result.data.event.status === 'em_andamento' ? (
                <section className="mt-mc-24 rounded-mc-medium border border-mc-border bg-mc-surface p-mc-16" aria-labelledby="conclude-event-title">
                  <h2 id="conclude-event-title" className="font-mc-display text-mc-h3 text-mc-text-primary">Concluir evento</h2>
                  <p className="mt-mc-8 text-sm text-mc-text-secondary">
                    Encerra a operação esportiva. Não gera relatório financeiro nem altera pagamentos.
                  </p>
                  <div className="mt-mc-12">
                    <EventActions eventId={result.data.event.id} status={result.data.event.status} />
                  </div>
                </section>
              ) : null}

              {result.data.event.status === 'concluido' ? (
                <Alert className="mt-mc-24" variant="info" icon={<Info size={20} />} title="Evento concluído">
                  A operação esportiva permanece somente leitura. O relatório financeiro não faz parte deste encerramento.
                </Alert>
              ) : !['chaves', 'em_andamento'].includes(result.data.event.status) ? (
                <Alert className="mt-mc-24" variant="warning" icon={<Info size={20} />} title="Operação indisponível nesta fase">
                  Avance o evento para “chaves” antes de iniciar as lutas. O primeiro início muda o evento para “em andamento”.
                </Alert>
              ) : null}

              <ResultsWorkspace data={result.data} />
            </>
          )}
        </PageContainer>
      </main>
    </div>
  )
}
