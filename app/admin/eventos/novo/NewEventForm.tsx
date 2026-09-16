'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { FiSave, FiSend } from 'react-icons/fi'
import { createEvent } from '../actions'

const phases = [['inscricao', 'Inscrição'], ['pagamento', 'Pagamento'], ['checagem', 'Checagem'], ['chaves', 'Chaves']] as const

export default function NewEventForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  function submit(formData: FormData, intent: 'rascunho' | 'publicar') {
    formData.set('intent', intent)
    setMessage(null)
    startTransition(async () => {
      const result = await createEvent(formData)
      setMessage({ ok: result.ok, text: result.message })
      if (result.ok) router.push('/admin/eventos')
    })
  }

  return (
    <form className="space-y-6 rounded-2xl bg-white p-6 shadow" action={(data) => submit(data, 'rascunho')}>
      {message && <p role="alert" className={`rounded-lg border p-3 ${message.ok ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-700'}`}>{message.text}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm font-semibold text-gray-700">Nome do evento<input name="nome" required minLength={3} className="w-full rounded-lg border px-3 py-2 font-normal" /></label>
        <label className="space-y-1 text-sm font-semibold text-gray-700">Data do evento<input name="data_evento" type="date" required className="w-full rounded-lg border px-3 py-2 font-normal" /></label>
        <label className="space-y-1 text-sm font-semibold text-gray-700">Local<input name="local" required minLength={3} className="w-full rounded-lg border px-3 py-2 font-normal" /></label>
        <label className="space-y-1 text-sm font-semibold text-gray-700">Valor da inscrição (R$)<input name="valor_inscricao" type="number" required min="0" step="0.01" defaultValue="0" className="w-full rounded-lg border px-3 py-2 font-normal" /></label>
        <label className="space-y-1 text-sm font-semibold text-gray-700">Fuso horário<select name="timezone" defaultValue="America/Sao_Paulo" className="w-full rounded-lg border px-3 py-2 font-normal"><option>America/Sao_Paulo</option><option>America/Manaus</option><option>America/Rio_Branco</option></select></label>
      </div>
      <label className="block space-y-1 text-sm font-semibold text-gray-700">Informações<textarea name="informacoes" rows={4} className="w-full rounded-lg border px-3 py-2 font-normal" /></label>
      <fieldset className="grid gap-4 rounded-lg border p-4 md:grid-cols-3">
        <legend className="px-2 text-lg font-bold">Arquivos públicos</legend>
        <label className="space-y-1 text-sm">Banner<input name="banner" type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-xs" /></label>
        <label className="space-y-1 text-sm">Regulamento<input name="regulamento" type="file" accept="application/pdf" className="block w-full text-xs" /></label>
        <label className="space-y-1 text-sm">Tabela de peso<input name="tabela_peso" type="file" accept="application/pdf" className="block w-full text-xs" /></label>
        <p className="text-xs text-gray-500 md:col-span-3">Até 10 MB por arquivo. Banner em JPEG, PNG ou WebP; documentos em PDF.</p>
      </fieldset>
      <fieldset className="space-y-4">
        <legend className="text-lg font-bold text-gray-900">Fases do evento</legend>
        {phases.map(([value, label]) => <div key={value} className="grid gap-3 rounded-lg border p-4 md:grid-cols-2"><p className="font-semibold md:col-span-2">{label}</p><label className="space-y-1 text-sm">Início<input name={`${value}_inicio`} type="datetime-local" required className="w-full rounded-lg border px-3 py-2" /></label><label className="space-y-1 text-sm">Término<input name={`${value}_fim`} type="datetime-local" required className="w-full rounded-lg border px-3 py-2" /></label></div>)}
      </fieldset>
      <div className="flex flex-wrap justify-end gap-3">
        <button disabled={pending} type="submit" className="inline-flex items-center gap-2 rounded-lg border border-primary-blue px-5 py-3 font-semibold text-primary-blue disabled:opacity-50"><FiSave /> Salvar rascunho</button>
        <button disabled={pending} type="button" onClick={(event) => { const form = event.currentTarget.form; if (form?.reportValidity()) submit(new FormData(form), 'publicar') }} className="inline-flex items-center gap-2 rounded-lg bg-primary-blue px-5 py-3 font-semibold text-white disabled:opacity-50"><FiSend /> {pending ? 'Salvando...' : 'Publicar'}</button>
      </div>
    </form>
  )
}
