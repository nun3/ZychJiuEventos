'use client'

import { useState, useTransition } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { settlePaymentManually } from './actions'

export default function ManualSettlementForm({ paymentId, eventId }: { paymentId: string; eventId: string }) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  return (
    <form
      className="mt-mc-16 space-y-mc-12 rounded-mc-medium border border-mc-warning/30 bg-mc-warning/10 p-mc-16"
      action={(formData) => startTransition(async () => {
        setMessage(null)
        const result = await settlePaymentManually(formData)
        setMessage({ ok: result.ok, text: result.message })
      })}
    >
      <input type="hidden" name="payment_id" value={paymentId} />
      <input type="hidden" name="event_id" value={eventId} />

      <FormField
        id={`manual-settlement-reason-${paymentId}`}
        label="Justificativa da baixa manual"
        description="Mínimo de 10 caracteres. A operação é auditada."
        required
      >
        <textarea
          name="reason"
          required
          minLength={10}
          maxLength={500}
          rows={3}
          className="w-full rounded-mc-medium border border-mc-border bg-mc-surface px-3 py-2 font-mc-interface text-sm text-mc-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
        />
      </FormField>

      <label className="flex items-start gap-mc-8 font-mc-interface text-sm text-mc-text-primary">
        <input type="checkbox" name="confirmed" value="yes" required className="mt-1 min-h-5 min-w-5" />
        Confirmo que conferi o recebimento fora do webhook e assumo esta operação auditada.
      </label>

      {message ? (
        <Alert variant={message.ok ? 'success' : 'error'} role={message.ok ? 'status' : 'alert'}>
          {message.text}
        </Alert>
      ) : null}

      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? 'Registrando…' : 'Confirmar baixa manual'}
      </Button>
    </form>
  )
}
