import { notFound, redirect } from 'next/navigation'
import { OperatorShell } from '@/components/live/OperatorShell'
import { loadOperatorPageData } from './data'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function OperacaoPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams?: { areaId?: string; matchId?: string }
}) {
  if (!uuidPattern.test(params.id)) notFound()

  const result = await loadOperatorPageData(params.id)
  if (result.kind === 'unauthenticated') {
    redirect(`/admin/autenticacao?redirectTo=${encodeURIComponent(`/admin/eventos/${params.id}/operacao`)}`)
  }
  if (result.kind === 'forbidden') redirect('/dashboard?erro=sem_permissao')
  if (result.kind === 'not_found') notFound()
  if (result.kind === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#071B2E] px-4 text-white">
        <div className="max-w-md rounded-3xl bg-black/40 p-6 ring-1 ring-white/15" role="alert">
          <h1 className="font-mc-display text-2xl font-bold">Operação indisponível</h1>
          <p className="mt-2 text-sm text-slate-300">{result.message}</p>
        </div>
      </div>
    )
  }

  const areaId = searchParams?.areaId && uuidPattern.test(searchParams.areaId) ? searchParams.areaId : null
  const matchId = searchParams?.matchId && uuidPattern.test(searchParams.matchId) ? searchParams.matchId : null

  return <OperatorShell data={result.data} areaId={areaId} matchId={matchId} />
}
