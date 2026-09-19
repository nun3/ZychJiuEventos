'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { CheckCircle2, UserRound, UsersRound } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/StatusBadge'
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
        <div className="flex flex-col gap-mc-8 border-b border-mc-border pb-mc-16 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-mc-display text-mc-h2 text-mc-text-primary">Atletas disponíveis</h2>
            <p className="mt-mc-4 font-mc-interface text-sm text-mc-text-secondary">A categoria é calculada com os dados esportivos atuais e a data do evento.</p>
          </div>
          <StatusBadge variant={selected.length ? 'info' : 'neutral'} className="self-start sm:self-auto">{selected.length} {selected.length === 1 ? 'selecionado' : 'selecionados'}</StatusBadge>
        </div>

        {!athletes.length ? (
          <EmptyState
            icon={<UsersRound size={34} />}
            title="Nenhum atleta gerenciado"
            description="Cadastre um atleta antes de iniciar a inscrição."
            action={<Link href="/dashboard/meus-atletas" className="font-mc-interface font-semibold text-mc-action hover:underline">Cadastrar atleta</Link>}
            className="rounded-mc-medium border border-mc-border bg-mc-surface"
          />
        ) : (
          <fieldset disabled={pending} className="space-y-mc-12">
            <legend className="sr-only">Selecione os atletas para inscrição</legend>
            {athletes.map(athlete => {
              const result = categorize(athlete, event.data_evento, categories)
              const registered = registeredIds.includes(athlete.id) || completed.includes(athlete.id)
              const unavailable = registered || !result.category
              return (
                <Card key={athlete.id} className={`p-mc-16 transition-colors duration-mc-normal ${selected.includes(athlete.id) ? 'border-mc-action bg-mc-action/5' : ''}`}>
                  <div className="flex items-start gap-mc-12">
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
                        {registered ? (
                          <StatusBadge variant="warning">Inscrição ativa</StatusBadge>
                        ) : result.category ? (
                          <StatusBadge variant="success" icon={<CheckCircle2 size={14} />}>Elegível</StatusBadge>
                        ) : (
                          <StatusBadge variant="error">Sem categoria</StatusBadge>
                        )}
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
                </Card>
              )
            })}
          </fieldset>
        )}
      </div>

      <aside className="space-y-mc-16 lg:sticky lg:top-32">
        <Card className="p-mc-16 sm:p-mc-24">
          <UserRound aria-hidden="true" size={25} className="text-mc-action" />
          <p className="mt-mc-16 font-mc-interface text-xs font-semibold uppercase tracking-wide text-mc-text-secondary">Resumo da inscrição</p>
          <dl className="mt-mc-12 space-y-mc-12 font-mc-interface text-sm">
            <div className="flex justify-between gap-mc-16"><dt className="text-mc-text-secondary">Valor por atleta</dt><dd className="font-semibold text-mc-text-primary">{money(event.valor_inscricao)}</dd></div>
            <div className="flex justify-between gap-mc-16"><dt className="text-mc-text-secondary">Selecionados</dt><dd className="font-semibold text-mc-text-primary">{selected.length}</dd></div>
            <div className="flex justify-between gap-mc-16 border-t border-mc-border pt-mc-12"><dt className="font-semibold text-mc-text-primary">Total</dt><dd className="font-mc-display text-lg font-semibold text-mc-text-primary">{money(Math.round(event.valor_inscricao * 100) * selected.length / 100)}</dd></div>
          </dl>
        </Card>

        <Card variant="subtle" className="bg-mc-surface-secondary p-mc-16 sm:p-mc-24">
          <h2 className="font-mc-display text-lg font-semibold text-mc-text-primary">Termos de inscrição — MVP-2026-09</h2>
          <p className="mt-mc-8 font-mc-interface text-sm leading-5 text-mc-text-secondary">Confirmo que os dados esportivos estão corretos e que possuo autorização para inscrever os atletas selecionados. A categoria e o valor serão registrados no momento da inscrição. A inscrição ficará pendente de pagamento.</p>
          {event.regulamento_url ? <a href={event.regulamento_url} target="_blank" rel="noreferrer" className="mt-mc-8 inline-flex min-h-10 items-center font-mc-interface text-sm font-semibold text-mc-action hover:underline">Ler regulamento do evento</a> : null}
          <label className="mt-mc-16 flex items-start gap-mc-8 border-t border-mc-border pt-mc-16 font-mc-interface text-sm text-mc-text-primary">
            <input type="checkbox" name="terms" checked={accepted} disabled={pending} onChange={e => setAccepted(e.target.checked)} required className="mt-0.5 h-5 w-5 shrink-0 rounded border-mc-border text-mc-action focus:ring-mc-focus" />
            Li e aceito os termos de inscrição.
          </label>
        </Card>

        {message ? <Alert role="status">{message}</Alert> : null}
        <Button type="submit" size="large" disabled={pending || !accepted || !selected.length} className="w-full">{pending ? 'Inscrevendo...' : 'Confirmar inscrições'}</Button>
      </aside>
    </form>
  )
}
