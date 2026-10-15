'use client'

import { type FormEvent, useId, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FileText } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { REJECTION_REASON_MAX, REJECTION_REASON_MIN } from '@/lib/finance/payment-receipt'
import { approvePaymentReceipt, rejectPaymentReceipt } from './receipt-actions'

export function ReceiptFileLink({ receiptId }: { receiptId: string }) {
  return (
    <a
      href={`/dashboard/pagamentos/comprovantes/${receiptId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center gap-mc-8 font-mc-interface text-sm font-semibold text-mc-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
    >
      <FileText aria-hidden="true" className="h-4 w-4" />
      Visualizar comprovante
    </a>
  )
}

export default function PaymentReceiptReview({
  receiptId,
  eventId,
  amountLabel,
}: {
  receiptId: string
  eventId: string
  amountLabel: string
}) {
  const router = useRouter()
  const ids = useId()
  const rejectPanelId = `${ids}-reject`
  const [mode, setMode] = useState<'idle' | 'reject'>('idle')
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function run(event: FormEvent<HTMLFormElement>, action: typeof approvePaymentReceipt) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    setFeedback(null)
    startTransition(async () => {
      const result = await action(data)
      setFeedback(result)
      if (result.ok) router.refresh()
    })
  }

  return (
    <div className="space-y-mc-12">
      {feedback ? (
        <Alert variant={feedback.ok ? 'success' : 'error'} role={feedback.ok ? 'status' : 'alert'}>{feedback.message}</Alert>
      ) : null}
      <form onSubmit={(event) => run(event, approvePaymentReceipt)} className="space-y-mc-12">
        <input type="hidden" name="receipt_id" value={receiptId} />
        <input type="hidden" name="event_id" value={eventId} />
        <label className="flex items-start gap-mc-8 font-mc-interface text-sm text-mc-text-primary">
          <input type="checkbox" name="confirmed" value="yes" required className="mt-1 h-4 w-4 accent-mc-action" />
          Conferi na conta da organização o recebimento de {amountLabel}.
        </label>
        <div className="flex flex-col gap-mc-8 sm:flex-row">
          <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
            {isPending && mode === 'idle' ? 'Aprovando…' : 'Aprovar pagamento'}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            aria-expanded={mode === 'reject'}
            aria-controls={rejectPanelId}
            onClick={() => setMode((current) => (current === 'reject' ? 'idle' : 'reject'))}
            className="w-full sm:w-auto"
          >
            Rejeitar
          </Button>
        </div>
      </form>
      <div id={rejectPanelId} hidden={mode !== 'reject'}>
        <form onSubmit={(event) => run(event, rejectPaymentReceipt)} className="space-y-mc-12 rounded-mc-medium border border-mc-border bg-mc-surface-secondary p-mc-12">
          <input type="hidden" name="receipt_id" value={receiptId} />
          <input type="hidden" name="event_id" value={eventId} />
          <FormField
            id={`${ids}-reason`}
            label="Motivo da rejeição"
            required
            description="O atleta verá este texto. Ex.: valor diferente do total, comprovante ilegível."
          >
            <Input name="reason" required minLength={REJECTION_REASON_MIN} maxLength={REJECTION_REASON_MAX} autoComplete="off" />
          </FormField>
          <Button type="submit" variant="danger" disabled={isPending} className="w-full sm:w-auto">
            {isPending && mode === 'reject' ? 'Rejeitando…' : 'Confirmar rejeição'}
          </Button>
        </form>
      </div>
    </div>
  )
}
