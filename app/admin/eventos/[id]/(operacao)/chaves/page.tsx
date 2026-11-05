import { notFound, redirect } from 'next/navigation'
import { Info } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
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

  if (result.kind === 'error') {
    return (
      <Alert className="mt-mc-24" role="alert" variant="error" title="Não foi possível carregar as chaves">
        {result.message}
      </Alert>
    )
  }

  const event = result.data.event

  return (
    <>
      <div className="mt-3">
        <StatusBadge variant={event.checkingLocked ? 'info' : 'warning'}>
          {event.checkingLocked ? 'Checagem travada' : 'Checagem aberta'}
        </StatusBadge>
      </div>
      {!event.checkingLocked || !['checagem', 'chaves'].includes(event.status) ? (
        <Alert className="mt-mc-24" variant="warning" icon={<Info size={20} />} title="Geração indisponível">
          {!event.checkingLocked
            ? 'Trave a checagem para congelar a lista oficial antes de gerar as chaves.'
            : `O evento está em “${event.status.replaceAll('_', ' ')}”. A operação de chaves exige a fase de checagem ou chaves.`}
        </Alert>
      ) : null}

      <BracketWorkspace data={result.data} />
    </>
  )
}
