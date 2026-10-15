'use client'

import { type FormEvent, useState, useTransition } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import CopyPixKeyButton from '@/app/dashboard/pagamentos/CopyPixKeyButton'
import { createEventSettlement, paySettlementPix, type PaySettlementState } from './settlement-actions'

export function CreateSettlementForm({ eventId, totalLabel, countLabel }: { eventId: string; totalLabel: string; countLabel: string }) {
  const router = useRouter()
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setFeedback(null)
    startTransition(async () => {
      const result = await createEventSettlement(data)
      setFeedback(result)
      if (result.ok) router.refresh()
    })
  }

  return (
    <form onSubmit={submit} className="space-y-mc-12">
      {feedback ? <Alert variant={feedback.ok ? 'success' : 'error'} role={feedback.ok ? 'status' : 'alert'}>{feedback.message}</Alert> : null}
      <input type="hidden" name="event_id" value={eventId} />
      <label className="flex items-start gap-mc-8 font-mc-interface text-sm text-mc-text-primary">
        <input type="checkbox" name="confirmed" value="yes" required className="mt-1 h-4 w-4 accent-mc-action" />
        Emitir fechamento de {countLabel} por {totalLabel}. Os valores ficam congelados após a emissão.
      </label>
      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        {isPending ? 'Emitindo…' : 'Emitir fechamento'}
      </Button>
    </form>
  )
}

function PayButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="large" disabled={pending} className="w-full sm:w-auto">
      {pending ? 'Gerando PIX…' : label}
    </Button>
  )
}

const initialPayState: PaySettlementState = { error: null, pix: null, pending: false }

function dueLabel(value: string) {
  const date = new Date(value.length === 10 ? `${value}T12:00:00-03:00` : value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: value.length === 10 ? undefined : 'short', timeZone: 'America/Sao_Paulo' })
}

export function SettlementPixPanel({ settlementId, issued }: { settlementId: string; issued: boolean }) {
  const [state, action] = useFormState(paySettlementPix, initialPayState)
  return (
    <div className="space-y-mc-12">
      {state.error ? <Alert variant="error" role="alert">{state.error}</Alert> : null}
      {state.pending ? <Alert variant="warning" role="status">Cobrança emitida. O QR Code ainda não está disponível; tente exibir novamente em instantes.</Alert> : null}
      {state.pix ? (
        <div className="grid gap-mc-16 md:grid-cols-[200px_1fr] md:items-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/png;base64,${state.pix.imageBase64}`}
            alt="QR Code PIX do fechamento financeiro"
            width={200}
            height={200}
            className="mx-auto h-[200px] w-[200px] rounded-mc-medium border border-mc-border bg-mc-surface md:mx-0"
          />
          <div className="min-w-0 space-y-mc-12">
            <p className="font-mc-interface text-sm text-mc-text-secondary">PIX copia e cola</p>
            <p className="break-all rounded-mc-medium border border-mc-border bg-mc-surface-secondary p-mc-12 font-mono text-xs text-mc-text-primary">{state.pix.copyPaste}</p>
            <CopyPixKeyButton value={state.pix.copyPaste} label="Copiar código PIX" copiedLabel="Código copiado" hint="Cole o código no app do banco da organização." />
            <p className="font-mc-interface text-sm text-mc-text-secondary">QR válido até {dueLabel(state.pix.expiresAt)}. A confirmação chega automaticamente pelo Asaas.</p>
          </div>
        </div>
      ) : (
        <form action={action}>
          <input type="hidden" name="settlement_id" value={settlementId} />
          <PayButton label={issued ? 'Exibir PIX novamente' : 'Pagar via PIX'} />
        </form>
      )}
    </div>
  )
}
