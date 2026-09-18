import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, Info } from 'lucide-react'
import InternalNavigation from '@/components/InternalNavigation'
import { Alert, PageContainer, PageHeader, StatusBadge } from '@/components/ui'
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
                description="Opere cada chave publicada, registre vitória normal ou WO e acompanhe o avanço até as colocações."
                breadcrumb={
                  <Link href={`/admin/eventos/${result.data.event.id}/gerenciar`} className="inline-flex min-h-10 items-center gap-mc-8 font-semibold text-mc-action hover:underline">
                    <ArrowLeft aria-hidden="true" size={18} />
                    Voltar para gestão
                  </Link>
                }
                actions={<StatusBadge variant={result.data.event.status === 'em_andamento' ? 'success' : 'info'}>Evento: {result.data.event.status.replaceAll('_', ' ')}</StatusBadge>}
              />

              {!['chaves', 'em_andamento'].includes(result.data.event.status) ? (
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
