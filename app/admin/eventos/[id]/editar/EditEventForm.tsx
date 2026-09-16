'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateEvent } from '../../actions'

type EventData = { id: string; nome: string; data_evento: string; local: string; timezone: string; valor_inscricao: number; informacoes: string | null }

export default function EditEventForm({ event }: { event: EventData }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  return <form action={(data) => startTransition(async () => { const result = await updateEvent(data); setMessage(result.message); if (result.ok) router.push('/admin/eventos') })} className="space-y-5 rounded-2xl bg-white p-6 shadow">
    <input type="hidden" name="event_id" value={event.id} />
    {message ? <p role="alert">{message}</p> : null}
    <label className="block text-sm font-semibold">Nome do evento<input name="nome" required defaultValue={event.nome} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal" /></label>
    <div className="grid gap-4 md:grid-cols-2">
      <label className="text-sm font-semibold">Data do evento<input name="data_evento" type="date" required defaultValue={event.data_evento} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal" /></label>
      <label className="text-sm font-semibold">Local<input name="local" required defaultValue={event.local} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal" /></label>
      <label className="text-sm font-semibold">Valor da inscrição (R$)<input name="valor_inscricao" type="number" min="0" step="0.01" required defaultValue={event.valor_inscricao} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal" /></label>
      <label className="text-sm font-semibold">Fuso horário<select name="timezone" defaultValue={event.timezone} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal"><option>America/Sao_Paulo</option><option>America/Manaus</option><option>America/Rio_Branco</option></select></label>
    </div>
    <label className="block text-sm font-semibold">Informações<textarea name="informacoes" rows={5} defaultValue={event.informacoes || ''} className="mt-1 w-full rounded-lg border px-3 py-2 font-normal" /></label>
    <button disabled={pending} className="rounded-lg bg-primary-blue px-5 py-3 font-semibold text-white disabled:opacity-50">{pending ? 'Salvando...' : 'Salvar alterações'}</button>
  </form>
}
