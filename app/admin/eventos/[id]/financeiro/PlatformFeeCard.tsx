'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { formatClosingAmount } from '@/lib/finance/event-closing'
import { centsToDecimal } from '@/lib/payments/domain'
import { setEventPlatformFee } from './actions'

type Props = {
  eventId: string
  feeCents: number
  canConfigure: boolean
}

export default function PlatformFeeCard({ eventId, feeCents, canConfigure }: Props) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const current = formatClosingAmount(feeCents)

  return (
    <section aria-labelledby="platform-fee-title" className="rounded-mc-medium border border-mc-border bg-mc-surface p-mc-24">
      <h2 id="platform-fee-title" className="font-mc-display text-mc-h3 text-mc-text-primary">Taxa MEU CAMP por inscrição</h2>
      <p className="mt-mc-8 font-mc-interface text-mc-body text-mc-text-secondary">
        Valor fixo cobrado por inscrição efetivada. A taxa vigente vale para as próximas efetivações; inscrições já efetivadas mantêm a taxa registrada na época.
      </p>

      <dl className="mt-mc-16">
        <dt className="font-mc-interface text-sm text-mc-text-secondary">Taxa vigente por inscrição efetivada</dt>
        <dd className="mt-mc-4 font-mc-display text-mc-h2 text-mc-text-primary">{current}</dd>
      </dl>

      {canConfigure ? (
        <form
          className="mt-mc-16 flex flex-wrap items-end gap-mc-12"
          action={(formData) => startTransition(async () => {
            setMessage(null)
            const result = await setEventPlatformFee(formData)
            setMessage({ ok: result.ok, text: result.message })
          })}
        >
          <input type="hidden" name="event_id" value={eventId} />
          <FormField
            id="platform-fee"
            label="Nova taxa por inscrição (R$)"
            description="Use ponto ou vírgula para os centavos. Zero desativa a cobrança."
            className="w-48"
          >
            <Input name="fee" inputMode="decimal" defaultValue={centsToDecimal(feeCents)} required />
          </FormField>
          <Button type="submit" disabled={pending}>{pending ? 'Salvando…' : 'Salvar taxa'}</Button>
        </form>
      ) : (
        <p className="mt-mc-16 font-mc-interface text-sm text-mc-text-secondary">
          Seu papel permite consultar a taxa contratada, mas não alterá-la. A taxa é configurada pela plataforma.
        </p>
      )}

      {message ? (
        <p role={message.ok ? 'status' : 'alert'} className={`mt-mc-12 font-mc-interface text-sm ${message.ok ? 'text-mc-success' : 'text-mc-error'}`}>
          {message.text}
        </p>
      ) : null}
    </section>
  )
}
