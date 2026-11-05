'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger } from '@/components/ui/Dropdown'
import { deleteDraftEvent, transitionEvent } from './actions'

export function EventRowMenu({
  eventId,
  eventName,
  status,
}: {
  eventId: string
  eventName: string
  status: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const canCancel = !['cancelado', 'concluido'].includes(status)

  function run(operation: () => Promise<{ ok: boolean; message: string }>) {
    setError('')
    startTransition(async () => {
      const result = await operation()
      if (!result.ok) setError(result.message)
      else router.refresh()
    })
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <Dropdown>
        <DropdownTrigger
          aria-label={`Mais ações de ${eventName}`}
          className="min-h-10 w-10 px-0"
          disabled={pending}
        >
          <MoreHorizontal aria-hidden="true" size={18} />
        </DropdownTrigger>
        <DropdownMenu>
          {status === 'rascunho' ? (
            <DropdownItem disabled={pending} onClick={() => run(() => transitionEvent(eventId, 'publicado'))}>
              Publicar
            </DropdownItem>
          ) : (
            <DropdownItem disabled={pending} onClick={() => router.push(`/eventos/${eventId}`)}>
              Página pública
            </DropdownItem>
          )}
          {status === 'rascunho' ? (
            <DropdownItem disabled={pending} onClick={() => run(() => deleteDraftEvent(eventId))}>
              Excluir
            </DropdownItem>
          ) : null}
          {canCancel ? (
            <DropdownItem disabled={pending} onClick={() => run(() => transitionEvent(eventId, 'cancelado'))}>
              Cancelar evento
            </DropdownItem>
          ) : null}
        </DropdownMenu>
      </Dropdown>
      {error ? <Alert variant="error" role="alert" className="max-w-xs p-2 text-sm">{error}</Alert> : null}
    </div>
  )
}
