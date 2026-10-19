'use client'

import { useState, useTransition } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { reviewCategoryChange } from './actions'

export default function ReviewCategoryChange({
  requestId,
  eventId,
  locked,
}: {
  requestId: string
  eventId: string
  locked: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  function decide(decision: 'approve' | 'reject') {
    const formData = new FormData()
    formData.set('request_id', requestId)
    formData.set('event_id', eventId)
    formData.set('decision', decision)
    startTransition(async () => {
      setMessage(null)
      const result = await reviewCategoryChange(formData)
      setMessage({ ok: result.ok, text: result.message })
    })
  }

  return (
    <div className="mt-mc-12 space-y-mc-8">
      {message ? <Alert variant={message.ok ? 'success' : 'error'} role={message.ok ? 'status' : 'alert'}>{message.text}</Alert> : null}
      <div className="flex flex-wrap gap-mc-8">
        <Button type="button" size="small" disabled={pending || locked} onClick={() => decide('approve')}>
          {pending ? 'Registrando…' : 'Aprovar'}
        </Button>
        <Button type="button" size="small" variant="outline" disabled={pending || locked} onClick={() => decide('reject')}>
          Recusar
        </Button>
      </div>
    </div>
  )
}
