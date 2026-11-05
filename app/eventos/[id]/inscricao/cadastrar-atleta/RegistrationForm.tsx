'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { categorize, type Category, type Competitor } from '@/lib/categorization'
import { registerAthletes } from './actions'

type Athlete = Competitor & { id: string; nome_completo: string }
type Event = { id: string; data_evento: string; valor_inscricao: number; regulamento_url: string | null }
type Actor = { name: string; canLinkSelf: boolean }
const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
export default function RegistrationForm({ event, athletes, categories, registeredIds, actor }: { event: Event; athletes: Athlete[]; categories: Category[]; registeredIds: string[]; actor: Actor }) {
  const [selected, setSelected] = useState<string[]>([])
  const [accepted, setAccepted] = useState(false)
  const [completed, setCompleted] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [pending, startTransition] = useTransition()
  const [professorNames, setProfessorNames] = useState<Record<string, string>>({})
  const [linkSelf, setLinkSelf] = useState<Record<string, boolean>>({})

  const toggleAthlete = (athleteId: string, checked: boolean) => {
    setSelected((ids) => checked ? [...ids, athleteId] : ids.filter((id) => id !== athleteId))
    if (checked && actor.canLinkSelf) {
      setProfessorNames((current) => current[athleteId] ? current : { ...current, [athleteId]: actor.name })
      setLinkSelf((current) => ({ ...current, [athleteId]: current[athleteId] ?? true }))
    }
  }

  return (
    <form
      className="grid items-start gap-mc-24 lg:grid-cols-[minmax(0,1fr)_20rem]"
      action={form => startTransition(async () => {
        setMessage('')
        try {
          const result = await registerAthletes(event.id, form)
          setMessage(result.message)
          if (result.ok) { setCompleted(ids => [...ids, ...(result.ids || [])]); setSelected([]); setAccepted(false) }
        } catch { setMessage('Falha de conexão. Consulte o histórico antes de tentar novamente.') }
      })}
    >
      <div className="space-y-mc-16">
        <div className="flex flex-col gap-2 border-b border-mc-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-mc-display text-3xl font-bold uppercase leading-[0.95] tracking-[-0.03em] text-mc-text-primary">Atletas disponíveis</h2>
            <p className="mt-3 font-mc-interface text-sm text-mc-text-secondary">A categoria é calculada com os dados esportivos atuais e a data do evento.</p>
          </div>
          <p className="font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] text-mc-text-primary">
            {selected.length} {selected.length === 1 ? 'selecionado' : 'selecionados'}
          </p>
        </div>

        {!athletes.length ? (
          <section className="border-y border-mc-border py-14">
            <h3 className="font-mc-display text-3xl font-bold uppercase leading-[0.95] tracking-[-0.03em] text-mc-text-primary">Nenhum atleta gerenciado</h3>
            <p className="mt-4 max-w-xl font-mc-interface text-base leading-7 text-mc-text-secondary">
              Cadastre um atleta gerenciado ou, se você for o atleta, complete o cadastro esportivo antes de se inscrever.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard/completar-cadastro-esportivo" className="inline-flex min-h-12 items-center font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] text-mc-text-primary hover:text-mc-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus">Completar cadastro esportivo</Link>
              <Link href="/dashboard/meus-atletas" className="inline-flex min-h-12 items-center font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] text-mc-text-primary hover:text-mc-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus">Cadastrar atleta gerenciado</Link>
            </div>
          </section>
        ) : (
          <fieldset disabled={pending} className="space-y-mc-12">
            <legend className="sr-only">Selecione os atletas para inscrição</legend>
            {athletes.map(athlete => {
              const result = categorize(athlete, event.data_evento, categories)
              const registered = registeredIds.includes(athlete.id) || completed.includes(athlete.id)
              const unavailable = registered || !result.category
              return (
                <article key={athlete.id} className={`border-b border-mc-border py-5 ${selected.includes(athlete.id) ? 'border-l-4 border-l-mc-action pl-3' : ''}`}>
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      name="athlete_id"
                      value={athlete.id}
                      aria-label={`Selecionar ${athlete.nome_completo}`}
                      disabled={unavailable}
                      checked={selected.includes(athlete.id)}
                      onChange={e => toggleAthlete(athlete.id, e.target.checked)}
                      className="mt-1 h-5 w-5 shrink-0 rounded border-mc-border text-mc-action focus:ring-mc-focus"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-mc-8 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-mc-interface font-semibold text-mc-text-primary">{athlete.nome_completo}</p>
                          <p className="mt-mc-4 font-mc-interface text-sm text-mc-text-secondary">{athlete.faixa} · {athlete.peso_kg} kg</p>
                        </div>
                        <p className="font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] text-mc-text-primary">
                          <span
                            aria-hidden="true"
                            className={`mr-2 inline-block h-2 w-2 ${registered ? 'bg-mc-warning' : result.category ? 'bg-mc-success' : 'bg-mc-error'}`}
                          />
                          {registered ? 'Inscrição ativa' : result.category ? 'Elegível' : 'Sem categoria'}
                        </p>
                      </div>
                      <p className="mt-mc-12 border-t border-mc-border pt-mc-12 font-mc-interface text-sm text-mc-text-secondary">
                        {registered ? 'Já possui inscrição ativa neste evento.' : result.category?.nome || result.reason}
                      </p>
                      {selected.includes(athlete.id) && !registered ? (
                        <div className="mt-mc-12 space-y-mc-12 border-t border-mc-border pt-mc-12">
                          <FormField id={`professor-name-${athlete.id}`} label="Professor operacional" required>
                            <Input
                              name={`professor_name_${athlete.id}`}
                              value={professorNames[athlete.id] || ''}
                              onChange={(event) => setProfessorNames((current) => ({ ...current, [athlete.id]: event.target.value }))}
                              required
                              minLength={2}
                              autoComplete="off"
                              placeholder="Nome do treinador neste evento"
                            />
                          </FormField>
                          <p className="font-mc-interface text-xs text-mc-text-secondary">Informe o treinador desta inscrição. Não precisa ter conta no MEU CAMP.</p>
                          {actor.canLinkSelf ? (
                            <label className="flex min-h-11 items-start gap-mc-8 font-mc-interface text-sm text-mc-text-primary">
                              <input
                                type="checkbox"
                                name={`professor_link_${athlete.id}`}
                                checked={linkSelf[athlete.id] !== false}
                                onChange={(event) => setLinkSelf((current) => ({ ...current, [athlete.id]: event.target.checked }))}
                                className="mt-0.5 h-5 w-5 shrink-0 rounded border-mc-border text-mc-action focus:ring-mc-focus"
                              />
                              Sou o professor operacional desta inscrição
                            </label>
                          ) : null}
                        </div>
                      ) : null}
                      {registered ? <Link href={`/dashboard/meus-atletas/${athlete.id}/inscricoes`} className="mt-mc-8 inline-flex min-h-10 items-center font-mc-interface text-sm font-semibold text-mc-action hover:underline">Ver histórico de inscrições</Link> : null}
                    </div>
                  </div>
                </article>
              )
            })}
          </fieldset>
        )}
      </div>

      <aside className="space-y-6 lg:sticky lg:top-36">
        <section className="border border-mc-text-primary p-5">
          <p className="font-mc-interface text-[11px] font-semibold uppercase tracking-[0.18em] text-mc-text-secondary">Resumo da inscrição</p>
          <dl className="mt-4 space-y-3 font-mc-interface text-sm">
            <div className="flex justify-between gap-4"><dt className="text-mc-text-secondary">Valor por atleta</dt><dd className="font-semibold text-mc-text-primary">{money(event.valor_inscricao)}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-mc-text-secondary">Selecionados</dt><dd className="font-semibold text-mc-text-primary">{selected.length}</dd></div>
            <div className="flex justify-between gap-4 border-t border-mc-border pt-3"><dt className="font-semibold text-mc-text-primary">Total</dt><dd className="font-mc-display text-lg font-semibold text-mc-text-primary">{money(Math.round(event.valor_inscricao * 100) * selected.length / 100)}</dd></div>
          </dl>
        </section>

        <section className="border border-mc-border p-5">
          <h2 className="font-mc-display text-lg font-bold uppercase leading-none tracking-[-0.03em] text-mc-text-primary">Termos de inscrição — MVP-2026-09</h2>
          <p className="mt-3 font-mc-interface text-sm leading-6 text-mc-text-secondary">Confirmo que os dados esportivos estão corretos e que possuo autorização para inscrever os atletas selecionados. A categoria e o valor serão registrados no momento da inscrição. A inscrição ficará pendente de pagamento.</p>
          {event.regulamento_url ? <a href={event.regulamento_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-12 items-center font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] text-mc-text-primary hover:text-mc-action">Ler regulamento do evento</a> : null}
          <label className="mt-4 flex items-start gap-2 border-t border-mc-border pt-4 font-mc-interface text-sm text-mc-text-primary">
            <input type="checkbox" name="terms" checked={accepted} disabled={pending} onChange={e => setAccepted(e.target.checked)} required className="mt-0.5 h-5 w-5 shrink-0 border border-mc-border text-mc-action focus:ring-mc-focus" />
            Li e aceito os termos de inscrição.
          </label>
        </section>

        {message ? <Alert role="status">{message}</Alert> : null}
        <Button type="submit" size="large" disabled={pending || !accepted || !selected.length} className="w-full rounded-none">{pending ? 'Inscrevendo...' : 'Confirmar inscrições'}</Button>
      </aside>
    </form>
  )
}
