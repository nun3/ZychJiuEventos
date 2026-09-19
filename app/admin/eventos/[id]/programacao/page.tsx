import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, Info } from 'lucide-react'
import InternalNavigation from '@/components/InternalNavigation'
import { Alert, PageContainer, PageHeader, StatusBadge } from '@/components/ui'
import ScheduleWorkspace from './ScheduleWorkspace'
import { loadSchedulePageData } from './data'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function ProgramacaoPage({ params }: { params: { id: string } }) {
  if (!uuidPattern.test(params.id)) notFound()

  const result = await loadSchedulePageData(params.id)
  if (result.kind === 'unauthenticated') {
    redirect(`/admin/autenticacao?redirectTo=${encodeURIComponent(`/admin/eventos/${params.id}/programacao`)}`)
  }
  if (result.kind === 'forbidden') redirect('/dashboard?erro=sem_permissao')
  if (result.kind === 'not_found') notFound()

  return (
    <div className="-mt-24 min-h-screen bg-mc-background">
      <InternalNavigation canManageEvents />
      <main className="py-mc-32 sm:py-mc-48">
        <PageContainer>
          {result.kind === 'error' ? (
            <>
              <PageHeader
                title="Programação"
                breadcrumb={
                  <Link href={`/admin/eventos/${params.id}/gerenciar`} className="inline-flex min-h-10 items-center gap-mc-8 font-semibold text-mc-action hover:underline">
                    <ArrowLeft aria-hidden="true" size={18} />
                    Voltar para gestão
                  </Link>
                }
              />
              <Alert className="mt-mc-24" role="alert" variant="error" title="Não foi possível carregar a programação">
                {result.message}
              </Alert>
            </>
          ) : (
            <>
              <PageHeader
                title={`Programação — ${result.data.event.name}`}
                description="Distribua subchaves por área e organize a numeração global das lutas."
                breadcrumb={
                  <Link href={`/admin/eventos/${result.data.event.id}/gerenciar`} className="inline-flex min-h-10 items-center gap-mc-8 font-semibold text-mc-action hover:underline">
                    <ArrowLeft aria-hidden="true" size={18} />
                    Voltar para gestão
                  </Link>
                }
                actions={
                  <StatusBadge variant={result.data.schedule.status === 'publicada' ? 'success' : 'warning'}>
                    {result.data.schedule.status === 'publicada' ? 'Publicada' : 'Rascunho'}
                  </StatusBadge>
                }
              />

              {!['chaves', 'em_andamento', 'concluido'].includes(result.data.event.status) ? (
                <Alert className="mt-mc-24" variant="warning" icon={<Info size={20} />} title="Programação ainda indisponível">
                  Publique as chaves e avance o evento para a fase de chaves antes de distribuir as lutas.
                </Alert>
              ) : null}

              <ScheduleWorkspace data={result.data} />
            </>
          )}
        </PageContainer>
      </main>
    </div>
  )
}
