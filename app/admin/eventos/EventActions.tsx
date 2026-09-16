'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { deleteDraftEvent, transitionEvent } from './actions'

export default function EventActions({ eventId, status }: { eventId: string; status: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function run(operation: () => Promise<{ ok: boolean; message: string }>) {
    setError('')
    startTransition(async () => {
      const result = await operation()
      if (!result.ok) setError(result.message)
      else router.refresh()
    })
  }

  return <div className="space-y-mc-8">
    <div className="flex flex-wrap gap-mc-8">
      {status === 'rascunho' ? <>
        <Button size="small" disabled={pending} onClick={() => run(() => transitionEvent(eventId, 'publicado'))}>Publicar</Button>
        <Button size="small" variant="danger" disabled={pending} onClick={() => run(() => deleteDraftEvent(eventId))}>Excluir</Button>
      </> : null}
      {status === 'publicado' ? <Button size="small" disabled={pending} onClick={() => run(() => transitionEvent(eventId, 'inscricao'))}>Abrir inscrições</Button> : null}
      {!['cancelado', 'concluido'].includes(status) ? <Button size="small" variant="outline" disabled={pending} onClick={() => run(() => transitionEvent(eventId, 'cancelado'))}>Cancelar</Button> : null}
    </div>
    {error ? <Alert variant="error" role="alert" className="p-mc-8">{error}</Alert> : null}
  </div>
}
