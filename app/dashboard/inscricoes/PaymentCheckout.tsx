'use client'

import { useState } from 'react'
import { useFormState, useFormStatus } from 'react-dom'
import Link from 'next/link'
import { toCents } from '@/lib/payments/domain'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { FormField } from '@/components/ui/FormField'
import { Select } from '@/components/ui/Select'
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
  return (
    <Button type="submit" disabled={disabled || pending} aria-busy={pending}>
      {pending ? 'Reservando…' : 'Reservar pagamento'}
    </Button>
  )
}

export default function PaymentCheckout({ registrations, manualOnly = false }: { registrations: CheckoutRegistration[]; manualOnly?: boolean }) {
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

  return (
    <Card className="mt-mc-32 p-mc-16 sm:p-mc-24" aria-labelledby="checkout-title">
      <h2 id="checkout-title" className="font-mc-display text-mc-h2 text-mc-text-primary">Reservar pagamento</h2>
      <p className="mt-mc-8 font-mc-interface text-sm leading-6 text-mc-text-secondary">Selecione inscrições pendentes do mesmo evento.</p>
      <p className="mt-mc-8 font-mc-interface text-sm leading-6 text-mc-text-secondary">
        {manualOnly
          ? 'Esta etapa apenas reserva o valor para a baixa manual do organizador. Não emite cobrança no Asaas nem confirma pagamento.'
          : 'Esta etapa apenas reserva o valor. Não emite cobrança nem confirma pagamento. Até 100 inscrições por reserva.'}
      </p>
      {state.error ? <Alert variant="error" role="alert" className="mt-mc-16">{state.error}</Alert> : null}
      {state.summary ? (
        <Alert variant="success" role="status" className="mt-mc-16">
          <strong>Reserva persistida.</strong> {state.summary.registrationCount} inscrição(ões), {money(state.summary.total)}, método {state.summary.method.toUpperCase()}.
          <span className="mt-mc-4 block text-sm">Referência: {state.summary.externalReference}</span>
          <Link className="mt-mc-8 inline-flex min-h-11 items-center font-semibold text-mc-action hover:underline" href={`/dashboard/pagamentos/${state.summary.paymentId}`}>
            Ver resumo do pagamento
          </Link>
        </Alert>
      ) : null}
      {state.summary ? null : !payable.length ? (
        <p className="mt-mc-16 font-mc-interface text-sm text-mc-text-secondary">Nenhuma inscrição disponível para nova reserva.</p>
      ) : (
        <form action={formAction} className="mt-mc-24 space-y-mc-24">
          <FormField id="checkout-event" label="Evento" required>
            <Select id="checkout-event" value={eventId} onChange={event => chooseEvent(event.target.value)} name="eventId" required>
              <option value="">Selecione um evento</option>
              {events.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </Select>
          </FormField>
          {visible.length > 0 ? (
            <fieldset className="space-y-mc-8">
              <legend className="font-mc-interface text-sm font-semibold text-mc-text-primary">Inscrições</legend>
              {visible.map(registration => (
                <label key={registration.id} className="flex min-h-11 items-center gap-mc-12 rounded-mc-medium border border-mc-border bg-mc-surface px-mc-12 py-mc-12 font-mc-interface text-sm">
                  <input
                    type="checkbox"
                    name="registrationId"
                    value={registration.id}
                    checked={selected.includes(registration.id)}
                    onChange={event => setSelected(current => event.target.checked ? [...current, registration.id] : current.filter(id => id !== registration.id))}
                    className="h-4 w-4 rounded border-mc-border text-mc-action focus:ring-mc-focus"
                  />
                  <span>
                    <strong className="block text-mc-text-primary">{registration.athleteName}</strong>
                    <span className="text-mc-text-secondary">{registration.categoryName} · {money(registration.amount)}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          ) : null}
          <fieldset className="space-y-mc-8">
            <legend className="font-mc-interface text-sm font-semibold text-mc-text-primary">Forma de pagamento</legend>
            <p className="font-mc-interface text-sm text-mc-text-secondary">Indica como o valor será informado ao organizador. Não gera cobrança automática.</p>
            <div className="flex flex-wrap gap-mc-16">
              <label className="inline-flex min-h-11 items-center gap-mc-8 font-mc-interface text-sm text-mc-text-primary">
                <input type="radio" name="method" value="pix" checked={method === 'pix'} onChange={() => setMethod('pix')} className="text-mc-action focus:ring-mc-focus" />
                PIX
              </label>
              <label className="inline-flex min-h-11 items-center gap-mc-8 font-mc-interface text-sm text-mc-text-primary">
                <input type="radio" name="method" value="boleto" checked={method === 'boleto'} onChange={() => setMethod('boleto')} className="text-mc-action focus:ring-mc-focus" />
                Boleto
              </label>
            </div>
          </fieldset>
          <p className="font-mc-interface font-semibold text-mc-text-primary">Total: {money(total)}</p>
          <SubmitReservation disabled={!eventId || !selected.length || selected.length > 100} />
        </form>
      )}
    </Card>
  )
}
