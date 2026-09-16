'use client'

import { useState, useTransition } from 'react'
import { settlePaymentManually } from './actions'

export default function ManualSettlementForm({ paymentId, eventId }: { paymentId: string; eventId: string }) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  return <form className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4" action={formData => startTransition(async () => {
    setMessage(null)
    const result = await settlePaymentManually(formData)
    setMessage({ ok: result.ok, text: result.message })
  })}>
    <input type="hidden" name="payment_id" value={paymentId} /><input type="hidden" name="event_id" value={eventId} />
    <label className="block text-sm font-semibold text-slate-800">Justificativa da baixa manual<textarea name="reason" required minLength={10} maxLength={500} rows={3} className="mt-1 w-full rounded border border-slate-300 bg-white p-2" /></label>
    <label className="mt-3 flex items-start gap-2 text-sm text-slate-700"><input type="checkbox" name="confirmed" value="yes" required className="mt-1" />Confirmo que conferi o recebimento fora do webhook e assumo esta operação auditada.</label>
    {message ? <p role={message.ok ? 'status' : 'alert'} className={`mt-3 text-sm ${message.ok ? 'text-emerald-700' : 'text-red-700'}`}>{message.text}</p> : null}
    <button disabled={pending} className="mt-3 rounded bg-amber-700 px-4 py-2 font-semibold text-white disabled:opacity-50">{pending ? 'Registrando…' : 'Confirmar baixa manual'}</button>
  </form>
}
