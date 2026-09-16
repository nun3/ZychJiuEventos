'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import { toCents } from '@/lib/payments/domain'
import { reservePayment, type ReservePaymentState } from './actions'

export type CheckoutRegistration = {
  id: string
  eventId: string
  eventName: string
  athleteName: string
  categoryName: string
  status: string
  amount: number
}

const initialState: ReservePaymentState = { error: null, summary: null }

function money(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function SubmitReservation({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  return <button type="submit" disabled={disabled || pending} aria-busy={pending} className="rounded-lg bg-primary-blue px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
    {pending ? 'Reservando…' : 'Reservar pagamento'}
  </button>
}

export default function PaymentCheckout({ registrations }: { registrations: CheckoutRegistration[] }) {
  const [selected, setSelected] = useState<string[]>([])
  const [eventId, setEventId] = useState('')
  const [method, setMethod] = useState<'pix' | 'boleto'>('pix')
  const [state, formAction] = useFormState(reservePayment, initialState)
  const payable = registrations.filter(registration => registration.status === 'pendente_pagamento')
  const events = Array.from(new Map(payable.map(registration => [registration.eventId, registration.eventName])))
  const visible = eventId ? payable.filter(registration => registration.eventId === eventId) : []
  const total = visible.filter(registration => selected.includes(registration.id)).reduce((sum, registration) => sum + toCents(registration.amount), 0) / 100

  function chooseEvent(value: string) {
    setEventId(value)
    setSelected([])
  }

  return <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6" aria-labelledby="checkout-title">
    <h2 id="checkout-title" className="text-2xl font-bold text-slate-900">Reservar pagamento</h2>
    <p className="mt-1 text-slate-600">Selecione inscrições pendentes do mesmo evento.</p>
    <p className="mt-1 text-sm text-slate-600">Esta etapa apenas reserva o valor. Não emite cobrança nem confirma pagamento. Até 100 inscrições por reserva.</p>
    {state.error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-red-700">{state.error}</p>}
    {state.summary && <div role="status" className="mt-4 rounded-lg bg-emerald-50 p-4 text-emerald-900">
      <strong>Reserva persistida.</strong> {state.summary.registrationCount} inscrição(ões), {money(state.summary.total)}, método {state.summary.method.toUpperCase()}.
      <span className="mt-1 block text-sm">Referência: {state.summary.externalReference}</span>
      <Link className="mt-2 block underline" href={`/dashboard/pagamentos/${state.summary.paymentId}`}>Ver resumo do pagamento</Link>
    </div>}
    {state.summary ? null : !payable.length ? <p className="mt-4 text-slate-600">Nenhuma inscrição disponível para nova reserva.</p> : <form action={formAction} className="mt-5 space-y-5">
      <div>
        <label htmlFor="checkout-event" className="block text-sm font-semibold text-slate-800">Evento</label>
        <select id="checkout-event" value={eventId} onChange={event => chooseEvent(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-3" name="eventId" required>
          <option value="">Selecione um evento</option>
          {events.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
      </div>
      {visible.length > 0 && <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-slate-800">Inscrições
        </legend>
        {visible.map(registration => <label key={registration.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
          <input type="checkbox" name="registrationId" value={registration.id} checked={selected.includes(registration.id)} onChange={event => setSelected(current => event.target.checked ? [...current, registration.id] : current.filter(id => id !== registration.id))} />
          <span>{registration.athleteName} — {registration.categoryName}<br /><small>{money(registration.amount)}</small></span>
        </label>)}
      </fieldset>}
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-slate-800">Forma de pagamento</legend>
        <label className="mr-5"><input type="radio" name="method" value="pix" checked={method === 'pix'} onChange={() => setMethod('pix')} /> <span className="ml-1">PIX</span></label>
        <label><input type="radio" name="method" value="boleto" checked={method === 'boleto'} onChange={() => setMethod('boleto')} /> <span className="ml-1">Boleto</span></label>
      </fieldset>
      <p className="font-semibold text-slate-900">Total: {money(total)}</p>
      <SubmitReservation disabled={!eventId || !selected.length || selected.length > 100} />
    </form>}
  </section>
}
