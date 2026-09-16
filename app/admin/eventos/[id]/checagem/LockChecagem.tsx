'use client'

import { useState, useTransition } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { lockEventChecagem } from './actions'

export default function LockChecagem({ eventId }: { eventId: string }) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  return (
    <form
      className="mt-mc-24 space-y-mc-12 rounded-mc-medium border border-mc-border bg-mc-surface p-mc-16"
      action={(formData) => startTransition(async () => {
        setMessage(null)
        const result = await lockEventChecagem(formData)
        setMessage({ ok: result.ok, text: result.message })
      })}
    >
      <input type="hidden" name="event_id" value={eventId} />
      <h2 className="font-mc-display text-mc-h3 text-mc-text-primary">Travar lista oficial</h2>
      <p className="text-sm text-mc-text-secondary">
        Depois do travamento, solicitações e decisões de categoria ficam bloqueadas. Esta operação é auditada e não reabre a checagem neste incremento.
      </p>
      <label className="flex items-start gap-mc-8 text-sm text-mc-text-primary">
        <input type="checkbox" name="confirmed" value="yes" required className="mt-1 min-h-5 min-w-5" />
        Confirmo que a lista oficial está conferida e assumo o travamento auditado.
      </label>
      {message ? <Alert variant={message.ok ? 'success' : 'error'} role={message.ok ? 'status' : 'alert'}>{message.text}</Alert> : null}
      <Button type="submit" variant="danger" size="small" disabled={pending}>
        {pending ? 'Travando…' : 'Travar checagem'}
      </Button>
    </form>
  )
}
