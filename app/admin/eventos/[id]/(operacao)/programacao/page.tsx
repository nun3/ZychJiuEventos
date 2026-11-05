import { notFound, redirect } from 'next/navigation'
import { Info } from 'lucide-react'
import { Alert, StatusBadge } from '@/components/ui'
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

  if (result.kind === 'error') {
    return (
      <Alert className="mt-mc-24" role="alert" variant="error" title="Não foi possível carregar a programação">
        {result.message}
      </Alert>
    )
  }

  const event = result.data.event

  return (
    <>
      <div className="mt-3">
        <StatusBadge variant={result.data.schedule.status === 'publicada' ? 'success' : 'warning'}>
          {result.data.schedule.status === 'publicada' ? 'Programação publicada' : 'Programação em rascunho'}
        </StatusBadge>
      </div>
      {!['chaves', 'em_andamento', 'concluido'].includes(event.status) ? (
        <Alert className="mt-mc-24" variant="warning" icon={<Info size={20} />} title="Programação ainda indisponível">
          Publique as chaves e avance o evento para a fase de chaves antes de distribuir as lutas.
        </Alert>
      ) : null}

      <ScheduleWorkspace data={result.data} />
    </>
  )
}
