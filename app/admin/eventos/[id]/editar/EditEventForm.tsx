'use client'

import { useState, useTransition, type FormEvent } from 'react'
import Link from 'next/link'
import { PanelColumns, panelClass } from '@/components/dashboard/PanelColumns'
import { VenueFields } from '@/components/events/VenueFields'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { DateTimeField } from '@/components/ui/DateTimeField'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { formatCepMask } from '@/lib/location/cep'
import { updateEvent } from '../../actions'

type EventData = {
  id: string
  nome: string
  data_evento: string
  local: string
  timezone: string
  valor_inscricao: number
  informacoes: string | null
  local_nome: string | null
  local_cep: string | null
  local_logradouro: string | null
  local_numero: string | null
  local_complemento: string | null
  local_bairro: string | null
  local_cidade: string | null
  local_uf: string | null
  local_latitude: number | null
  local_longitude: number | null
}

const fieldClass = 'min-h-28 w-full rounded-mc-small border border-mc-border bg-mc-surface px-3 py-2 font-mc-interface text-base text-mc-text-primary transition-colors duration-mc-normal hover:border-mc-text-secondary focus:border-mc-focus focus:outline-none focus:ring-2 focus:ring-mc-focus/20'

function textOf(formData: FormData, field: string) {
  return String(formData.get(field) || '').trim()
}

export default function EditEventForm({ event }: { event: EventData }) {
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [dataEvento, setDataEvento] = useState(event.data_evento || '')
  const hasStructured = Boolean(event.local_nome || event.local_cep || event.local_logradouro)

  function submit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault()
    if (pending) return
    const form = formEvent.currentTarget
    const data = new FormData(form)
    const next: Record<string, string> = {}

    if (textOf(data, 'nome').length < 3) next.nome = 'Informe o nome do evento.'
    if (!textOf(data, 'data_evento') && !dataEvento) next.data_evento = 'Informe a data do evento.'

    if (hasStructured || textOf(data, 'local_nome') || textOf(data, 'local_cep')) {
      const localNome = textOf(data, 'local_nome')
      const localNumero = textOf(data, 'local_numero')
      if (localNome.length < 3 || localNumero.length < 1) {
        next.local = 'Informe o nome do local e o número.'
      }
    } else if (textOf(data, 'local').length < 3) {
      next.local = 'Informe o local do evento.'
    }

    const valor = Number(textOf(data, 'valor_inscricao').replace(',', '.'))
    if (!Number.isFinite(valor) || valor < 0) next.valor_inscricao = 'Informe um valor válido, em reais.'

    setErrors(next)
    if (Object.keys(next).length > 0) return

    if (dataEvento) data.set('data_evento', dataEvento)
    setMessage(null)
    startTransition(async () => {
      try {
        const result = await updateEvent(data)
        if (!result) {
          setMessage({ ok: false, text: 'Não foi possível concluir o envio. Recarregue a página e tente de novo.' })
          return
        }
        setMessage({ ok: result.ok, text: result.message })
        if (result.ok) {
          window.location.assign('/admin/eventos')
        }
      } catch (error) {
        setMessage({
          ok: false,
          text: error instanceof Error ? error.message : 'Não foi possível salvar. Tente novamente.',
        })
      }
    })
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <input type="hidden" name="event_id" value={event.id} />
      {message ? (
        <Alert variant={message.ok ? 'success' : 'error'} role={message.ok ? 'status' : 'alert'}>
          {message.text}
        </Alert>
      ) : null}

      <PanelColumns
        main={(
          <>
            <section className={panelClass} aria-labelledby="edit-essentials-title">
              <h2 id="edit-essentials-title" className="font-mc-display text-xl font-semibold text-mc-text-primary">
                Informações essenciais
              </h2>
              <p className="mt-1 font-mc-interface text-sm text-mc-text-secondary">
                Atualize o essencial do campeonato. Depois você continua na configuração do evento.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <FormField id="nome" label="Nome do evento" required error={errors.nome} className="sm:col-span-2">
                  <Input
                    name="nome"
                    defaultValue={event.nome}
                    autoComplete="off"
                    aria-invalid={Boolean(errors.nome)}
                  />
                </FormField>
                <FormField id="data_evento" label="Data do evento" required error={errors.data_evento}>
                  <DateTimeField
                    name="data_evento"
                    type="date"
                    clearLabel="Limpar data do evento"
                    value={dataEvento}
                    aria-invalid={Boolean(errors.data_evento)}
                    onValueChange={(value) => {
                      setDataEvento(value)
                      setErrors((current) => {
                        const nextErrors = { ...current }
                        delete nextErrors.data_evento
                        return nextErrors
                      })
                    }}
                  />
                </FormField>
                <FormField id="timezone" label="Fuso horário" description="Os horários das fases usam este fuso.">
                  <Select name="timezone" defaultValue={event.timezone || 'America/Sao_Paulo'}>
                    <option>America/Sao_Paulo</option>
                    <option>America/Manaus</option>
                    <option>America/Rio_Branco</option>
                  </Select>
                </FormField>
              </div>
              <div className="mt-6">
                {hasStructured || event.local_nome || event.local_cep ? (
                  <VenueFields
                    error={errors.local}
                    initial={{
                      nome: event.local_nome || '',
                      cep: event.local_cep ? formatCepMask(event.local_cep) : '',
                      logradouro: event.local_logradouro || '',
                      numero: event.local_numero || '',
                      complemento: event.local_complemento || '',
                      bairro: event.local_bairro || '',
                      cidade: event.local_cidade || '',
                      uf: event.local_uf || '',
                      latitude: event.local_latitude,
                      longitude: event.local_longitude,
                    }}
                  />
                ) : (
                  <div className="space-y-4">
                    <VenueFields
                      error={errors.local}
                      initial={{
                        nome: event.local || '',
                        cep: '',
                        logradouro: '',
                        numero: '',
                        complemento: '',
                        bairro: '',
                        cidade: '',
                        uf: '',
                        latitude: null,
                        longitude: null,
                      }}
                    />
                    <p className="font-mc-interface text-sm text-mc-text-secondary">
                      Evento legado: complete CEP e endereço estruturado para manter o mapa e a formatação padrão.
                    </p>
                    <input type="hidden" name="local" value={event.local} />
                  </div>
                )}
              </div>
            </section>

            <section className={panelClass} aria-labelledby="edit-price-title">
              <h2 id="edit-price-title" className="font-mc-display text-xl font-semibold text-mc-text-primary">
                Inscrição
              </h2>
              <div className="mt-4 max-w-sm space-y-1.5">
                <div className="flex items-baseline gap-1">
                  <label htmlFor="valor_inscricao" className="font-mc-interface text-sm font-semibold text-mc-text-primary">
                    Valor da inscrição (R$)
                  </label>
                  <span aria-hidden="true" className="text-mc-error">*</span>
                </div>
                <div className="relative">
                  <span aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mc-interface text-sm text-mc-text-secondary">
                    R$
                  </span>
                  <Input
                    id="valor_inscricao"
                    name="valor_inscricao"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={String(event.valor_inscricao ?? 0)}
                    inputMode="decimal"
                    className="pl-10"
                    aria-invalid={Boolean(errors.valor_inscricao)}
                    aria-describedby={errors.valor_inscricao ? 'valor_inscricao-error' : 'valor_inscricao-hint'}
                  />
                </div>
                <p id="valor_inscricao-hint" className="font-mc-interface text-sm text-mc-text-secondary">
                  Valor base. R$ 0,00 é aceito neste rascunho.
                </p>
                {errors.valor_inscricao ? (
                  <p id="valor_inscricao-error" className="font-mc-interface text-sm text-mc-error">
                    {errors.valor_inscricao}
                  </p>
                ) : null}
              </div>
            </section>

            <section className={panelClass} aria-labelledby="edit-summary-title">
              <h2 id="edit-summary-title" className="font-mc-display text-xl font-semibold text-mc-text-primary">
                Página pública
              </h2>
              <div className="mt-4">
                <FormField
                  id="informacoes"
                  label="Resumo do evento"
                  description="Uma apresentação curta para a página pública."
                >
                  <textarea
                    id="informacoes"
                    name="informacoes"
                    rows={4}
                    defaultValue={event.informacoes || ''}
                    className={fieldClass}
                  />
                </FormField>
              </div>
            </section>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link
                href="/admin/eventos"
                className="inline-flex min-h-11 items-center justify-center rounded-mc-medium px-4 font-mc-interface text-sm font-semibold text-mc-text-secondary hover:text-mc-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2"
              >
                Cancelar
              </Link>
              <Button type="submit" size="large" disabled={pending} aria-busy={pending} className="w-full sm:w-auto">
                {pending ? 'Salvando...' : 'Salvar alterações'}
              </Button>
            </div>
          </>
        )}
        aside={(
          <aside className={panelClass} aria-labelledby="edit-aside-title">
            <h2 id="edit-aside-title" className="font-mc-display text-xl font-semibold text-mc-text-primary">
              Ao salvar
            </h2>
            <ol className="mt-4 space-y-3 font-mc-interface text-sm text-mc-text-secondary">
              <li className="flex gap-3">
                <span className="font-mc-display font-semibold text-mc-structure">1</span>
                <span>Os dados essenciais do rascunho são atualizados</span>
              </li>
              <li className="flex gap-3">
                <span className="font-mc-display font-semibold text-mc-structure">2</span>
                <span>Você volta para a lista, com a opção de editar ou gerenciar</span>
              </li>
              <li className="flex gap-3">
                <span className="font-mc-display font-semibold text-mc-structure">3</span>
                <span>Categorias e publicação continuam na operação</span>
              </li>
            </ol>
          </aside>
        )}
      />
    </form>
  )
}
