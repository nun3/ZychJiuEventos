import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, Info } from 'lucide-react'
import InternalNavigation from '@/components/InternalNavigation'
import { Alert } from '@/components/ui/Alert'
import { PageContainer } from '@/components/ui/PageContainer'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import BracketWorkspace from './BracketWorkspace'
import { loadBracketPageData } from './data'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function ChavesPage({ params }: { params: { id: string } }) {
  if (!uuidPattern.test(params.id)) notFound()

  const result = await loadBracketPageData(params.id)
  if (result.kind === 'unauthenticated') {
    redirect(`/admin/autenticacao?redirectTo=${encodeURIComponent(`/admin/eventos/${params.id}/chaves`)}`)
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
                title="Chaves"
                breadcrumb={
                  <Link href={`/admin/eventos/${params.id}/gerenciar`} className="inline-flex min-h-10 items-center gap-mc-8 font-semibold text-mc-action hover:underline">
                    <ArrowLeft aria-hidden="true" size={18} />
                    Voltar para gestão
                  </Link>
                }
              />
              <Alert className="mt-mc-24" role="alert" variant="error" title="Não foi possível carregar as chaves">
                {result.message}
              </Alert>
            </>
          ) : (
            <>
              <PageHeader
                title={`Chaves — ${result.data.event.name}`}
                description="Gere a sugestão automática, ajuste o casamento em rascunho e publique a versão oficial."
                breadcrumb={
                  <Link href={`/admin/eventos/${result.data.event.id}/gerenciar`} className="inline-flex min-h-10 items-center gap-mc-8 font-semibold text-mc-action hover:underline">
                    <ArrowLeft aria-hidden="true" size={18} />
                    Voltar para gestão
                  </Link>
                }
                actions={
                  <StatusBadge variant={result.data.event.checkingLocked ? 'info' : 'warning'}>
                    {result.data.event.checkingLocked ? 'Checagem travada' : 'Checagem aberta'}
                  </StatusBadge>
                }
              />

              {!result.data.event.checkingLocked || !['checagem', 'chaves'].includes(result.data.event.status) ? (
                <Alert className="mt-mc-24" variant="warning" icon={<Info size={20} />} title="Geração indisponível">
                  {!result.data.event.checkingLocked
                    ? 'Trave a checagem para congelar a lista oficial antes de gerar as chaves.'
                    : `O evento está em “${result.data.event.status.replaceAll('_', ' ')}”. A operação de chaves exige a fase de checagem ou chaves.`}
                </Alert>
              ) : null}

              <BracketWorkspace data={result.data} />
            </>
          )}
        </PageContainer>
      </main>
    </div>
  )
}
