'use client'

import { type FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { finishLock, idleLockForm, lockButtonLabel, startLock } from '@/lib/checking/lock-form-state'
import { lockEventChecagem } from './actions'

export default function LockChecagem({ eventId }: { eventId: string }) {
  const router = useRouter()
  const [state, setState] = useState(idleLockForm)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    setState((current) => startLock(current))
    let result = { ok: false, message: 'Não foi possível travar a checagem.' }
    try {
      result = await lockEventChecagem(formData)
    } finally {
      const next = finishLock(result)
      setState(next)
      if (next.locked) router.refresh()
    }
  }

  return (
    <form
      className="mt-mc-24 space-y-mc-12 rounded-mc-medium border border-mc-border bg-mc-surface p-mc-16"
      onSubmit={onSubmit}
    >
      <input type="hidden" name="event_id" value={eventId} />
      <h2 className="font-mc-display text-mc-h3 text-mc-text-primary">Travar lista oficial</h2>
      <p className="text-sm text-mc-text-secondary">
        Depois do travamento, solicitações e decisões de categoria ficam bloqueadas. Esta operação é auditada e não reabre a checagem neste incremento.
      </p>
      <label className="flex items-start gap-mc-8 text-sm text-mc-text-primary">
        <input type="checkbox" name="confirmed" value="yes" required disabled={state.pending || state.locked} className="mt-1 min-h-5 min-w-5" />
        Confirmo que a lista oficial está conferida e assumo o travamento auditado.
      </label>
      {state.message ? <Alert variant={state.message.ok ? 'success' : 'error'} role={state.message.ok ? 'status' : 'alert'}>{state.message.text}</Alert> : null}
      {state.locked ? null : (
        <Button type="submit" variant="danger" size="small" disabled={state.pending}>
          {lockButtonLabel(state)}
        </Button>
      )}
    </form>
  )
}
