import { notFound, redirect } from 'next/navigation'
import { Info } from 'lucide-react'
import { Alert } from '@/components/ui'
import EventActions from '../../../EventActions'
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

  if (result.kind === 'error') {
    return (
      <Alert className="mt-mc-24" role="alert" variant="error" title="Não foi possível carregar os resultados">
        {result.message}
      </Alert>
    )
  }

  const event = result.data.event

  return (
    <>
      {event.status === 'em_andamento' ? (
        <section
          className="mt-mc-24 rounded-mc-medium border border-mc-success/25 bg-mc-success/10 p-mc-16 shadow-mc-subtle sm:p-mc-24"
          aria-labelledby="conclude-event-title"
        >
          <h2 id="conclude-event-title" className="font-mc-display text-mc-h3 text-mc-text-primary">Concluir evento</h2>
          <p className="mt-mc-8 text-sm text-mc-text-secondary">
            Encerra a operação esportiva. Não gera relatório financeiro nem altera pagamentos.
          </p>
          <div className="mt-mc-12">
            <EventActions eventId={event.id} status={event.status} showCancel={false} />
          </div>
        </section>
      ) : null}

      {event.status === 'concluido' ? (
        <Alert className="mt-mc-24" variant="info" icon={<Info size={20} />} title="Evento concluído">
          A operação esportiva permanece somente leitura. O relatório financeiro não faz parte deste encerramento.
        </Alert>
      ) : !['chaves', 'em_andamento'].includes(event.status) ? (
        <Alert className="mt-mc-24" variant="warning" icon={<Info size={20} />} title="Operação indisponível nesta fase">
          Avance o evento para “chaves” antes de iniciar as lutas. O primeiro início muda o evento para “em andamento”.
        </Alert>
      ) : null}

      <ResultsWorkspace data={result.data} />
    </>
  )
}
