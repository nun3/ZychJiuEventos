'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Award, CheckCircle2, Flag, Play, Scale, Trophy, Users } from 'lucide-react'
import { Alert, Button, Card, EmptyState, StatusBadge } from '@/components/ui'
import { formatFightDurationLabel } from '@/lib/events/fight-duration'
import {
  confirmGroupAwards,
  confirmGroupWeighIn,
  recordBracketMatchOutcome,
  startCategoryBracket,
  undoGroupAwards,
  undoGroupWeighIn,
  type ResultActionState,
} from './actions'
import type { GroupChecklistState, ResultBracket, ResultGroup, ResultMatch, ResultsPageData } from './data'

const bracketStatusNames = {
  publicada: 'Publicada',
  em_andamento: 'Em andamento',
  concluida: 'Concluída',
}

const topologyNames = {
  final_2: 'Final direta',
  copo_3: 'Copo com 3 atletas',
  semi_4: 'Semifinais com 4 atletas',
}

function statusBadge(status: ResultBracket['status']) {
  return (
    <StatusBadge variant={status === 'concluida' ? 'success' : status === 'em_andamento' ? 'info' : 'warning'}>
      {bracketStatusNames[status]}
    </StatusBadge>
  )
}

function matchLabel(match: ResultMatch) {
  return match.round === 'semifinal' ? `Semifinal ${match.order}` : 'Final'
}

function formatWhen(value: string | null) {
  if (!value) return null
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

function confirmedCaption(state: GroupChecklistState) {
  const when = formatWhen(state.confirmedAt)
  if (!when) return null
  return state.confirmedByName ? `${state.confirmedByName} · ${when}` : when
}

function GroupChecklist({
  eventId,
  group,
  disabled,
  onAction,
}: {
  eventId: string
  group: ResultGroup
  disabled: boolean
  onAction: (action: () => Promise<ResultActionState>) => void
}) {
  function formData(values: Record<string, string>) {
    const form = new FormData()
    Object.entries(values).forEach(([key, value]) => form.set(key, value))
    return form
  }

  const rows = [
    {
      key: 'weighIn',
      label: 'Pesagem',
      state: group.weighIn,
      confirmLabel: 'Marcar pesagem como realizada',
      undoLabel: 'Desfazer confirmação da pesagem',
      confirm: () => confirmGroupWeighIn(formData({ event_id: eventId, group_id: group.groupId })),
      undo: () => undoGroupWeighIn(formData({ event_id: eventId, group_id: group.groupId })),
      canConfirm: group.weighIn.status === 'pendente',
      showConfirm: group.weighIn.status === 'pendente',
      confirmDisabledReason: undefined,
      canUndo: group.weighIn.status === 'realizada' && group.awards.status !== 'realizada',
    },
    {
      key: 'result',
      label: 'Resultado',
      state: {
        status: group.resultStatus === 'registrado' ? 'realizada' : 'pendente',
        confirmedAt: null,
        confirmedBy: null,
        confirmedByName: null,
      } satisfies GroupChecklistState,
      confirmLabel: null,
      undoLabel: null,
      confirm: null,
      undo: null,
      canConfirm: false,
      showConfirm: false,
      confirmDisabledReason: undefined,
      canUndo: false,
    },
    {
      key: 'awards',
      label: 'Premiação',
      state: group.awards,
      confirmLabel: 'Marcar premiação como realizada',
      undoLabel: 'Desfazer confirmação da premiação',
      confirm: () => confirmGroupAwards(formData({ event_id: eventId, group_id: group.groupId })),
      undo: () => undoGroupAwards(formData({ event_id: eventId, group_id: group.groupId })),
      canConfirm: group.awards.status === 'pendente' && group.resultStatus === 'registrado',
      showConfirm: group.awards.status === 'pendente',
      confirmDisabledReason: group.resultStatus !== 'registrado' ? 'Conclua o resultado da subchave antes de marcar a premiação.' : undefined,
      canUndo: group.awards.status === 'realizada',
    },
  ] as const

  return (
    <section aria-label={`Checklist operacional da subchave ${group.label}`} className="border-b border-mc-border p-mc-16">
      <ul className="space-y-mc-12">
        {rows.map((row) => {
          const done = row.state.status === 'realizada' || (row.key === 'result' && group.resultStatus === 'registrado')
          const caption = row.key === 'result'
            ? (group.resultStatus === 'registrado' ? 'Colocações derivadas do domínio atual' : 'Aguardando o registro das lutas')
            : confirmedCaption(row.state)
          return (
            <li key={row.key} className="flex min-w-0 flex-col gap-mc-8 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-semibold text-mc-text-primary">{row.label}</p>
                <div className="mt-mc-4 flex flex-wrap items-center gap-mc-8">
                  <StatusBadge variant={done ? 'success' : 'warning'}>
                    {row.key === 'result'
                      ? (group.resultStatus === 'registrado' ? 'Registrado' : 'Pendente')
                      : (row.state.status === 'realizada' ? 'Realizada' : 'Pendente')}
                  </StatusBadge>
                  {caption ? <p className="text-sm text-mc-text-secondary">{caption}</p> : null}
                </div>
              </div>
              {row.confirm && row.showConfirm ? (
                <div className="flex flex-col gap-mc-8 sm:flex-row">
                  <Button
                    className="gap-mc-8"
                    disabled={disabled || !row.canConfirm}
                    title={row.confirmDisabledReason}
                    onClick={() => onAction(row.confirm)}
                  >
                    {row.key === 'weighIn' ? <Scale aria-hidden="true" size={18} /> : <Award aria-hidden="true" size={18} />}
                    {row.confirmLabel}
                  </Button>
                  {row.canUndo ? (
                    <Button
                      variant="outline"
                      disabled={disabled}
                      onClick={() => onAction(row.undo!)}
                    >
                      {row.undoLabel}
                    </Button>
                  ) : null}
                </div>
              ) : row.canUndo ? (
                <Button
                  variant="outline"
                  disabled={disabled}
                  onClick={() => onAction(row.undo!)}
                >
                  {row.undoLabel}
                </Button>
              ) : null}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

export default function ResultsWorkspace({ data }: { data: ResultsPageData }) {
  const router = useRouter()
  const [selectedBracketId, setSelectedBracketId] = useState(data.brackets[0]?.bracketId || '')
  const [winnerByMatch, setWinnerByMatch] = useState<Record<string, string>>({})
  const [feedback, setFeedback] = useState<ResultActionState | null>(null)
  const [pendingMatchId, setPendingMatchId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const selected = data.brackets.find((bracket) => bracket.bracketId === selectedBracketId) || data.brackets[0]

  useEffect(() => {
    if (selectedBracketId && !data.brackets.some((bracket) => bracket.bracketId === selectedBracketId)) {
      setSelectedBracketId(data.brackets[0]?.bracketId || '')
    }
  }, [data.brackets, selectedBracketId])

  function formData(values: Record<string, string>) {
    const form = new FormData()
    Object.entries(values).forEach(([key, value]) => form.set(key, value))
    return form
  }

  function runAction(action: () => Promise<ResultActionState>, matchId?: string) {
    setFeedback(null)
    setPendingMatchId(matchId || null)
    startTransition(() => {
      void action().then((result) => {
        setFeedback(result)
        setPendingMatchId(null)
        if (result.ok) {
          if (matchId) {
            setWinnerByMatch((current) => {
              const next = { ...current }
              delete next[matchId]
              return next
            })
          }
          router.refresh()
        }
      })
    })
  }

  if (!data.brackets.length) {
    return (
      <EmptyState
        className="mt-mc-24 rounded-mc-medium border border-mc-border bg-mc-surface"
        icon={<Users size={34} />}
        title="Nenhuma chave publicada"
        description="Publique uma chave antes de iniciar a operação de resultados."
      />
    )
  }

  if (!selected) return null

  return (
    <div className="mt-mc-24 grid items-start gap-mc-24 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <aside aria-labelledby="result-categories-title">
        <h2 id="result-categories-title" className="font-mc-display text-mc-h3 text-mc-text-primary">Categorias</h2>
        <label className="mt-mc-12 block lg:hidden">
          <span className="mb-mc-4 block text-sm font-semibold text-mc-text-primary">Categoria selecionada</span>
          <select
            value={selected.bracketId}
            onChange={(event) => {
              setSelectedBracketId(event.target.value)
              setFeedback(null)
            }}
            className="min-h-11 w-full rounded-mc-small border border-mc-border bg-mc-surface px-3 text-mc-text-primary focus:border-mc-focus focus:outline-none focus:ring-2 focus:ring-mc-focus/20"
          >
            {data.brackets.map((bracket) => <option key={bracket.bracketId} value={bracket.bracketId}>{bracket.category}</option>)}
          </select>
        </label>
        <div className="mt-mc-12 hidden space-y-mc-8 lg:block">
          {data.brackets.map((bracket) => {
            const isSelected = bracket.bracketId === selected.bracketId
            return (
              <button
                key={bracket.bracketId}
                type="button"
                aria-pressed={isSelected}
                onClick={() => {
                  setSelectedBracketId(bracket.bracketId)
                  setFeedback(null)
                }}
                className={`w-full rounded-mc-medium border p-mc-12 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus ${
                  isSelected ? 'border-mc-action bg-mc-action/5' : 'border-mc-border bg-mc-surface hover:bg-mc-surface-secondary'
                }`}
              >
                <span className="block font-semibold text-mc-text-primary">{bracket.category}</span>
                <span className="mt-mc-4 block text-sm text-mc-text-secondary">{formatFightDurationLabel(bracket.durationMinutes) || 'Duração não definida'}</span>
                <span className="mt-mc-8 block">{statusBadge(bracket.status)}</span>
              </button>
            )
          })}
        </div>
      </aside>

      <section aria-labelledby="selected-result-title" className="min-w-0">
        <Card className="p-mc-16 sm:p-mc-24">
          <div className="flex flex-col gap-mc-16 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-mc-8">
                <h2 id="selected-result-title" className="font-mc-display text-mc-h2 text-mc-text-primary">{selected.category}</h2>
                {statusBadge(selected.status)}
              </div>
              <p className="mt-mc-4 text-sm text-mc-text-secondary">Versão {selected.version} · {formatFightDurationLabel(selected.durationMinutes) || 'Duração não definida'}</p>
            </div>
            {selected.status === 'publicada' && selected.mode === 'competicao' ? (
              <Button
                className="gap-mc-8"
                disabled={isPending || data.event.status !== 'chaves'}
                title={data.event.status !== 'chaves' ? 'O evento precisa estar na fase de chaves.' : undefined}
                onClick={() => runAction(() => startCategoryBracket(formData({
                  event_id: data.event.id,
                  bracket_id: selected.bracketId,
                })))}
              >
                <Play aria-hidden="true" size={18} />
                {isPending ? 'Iniciando…' : 'Iniciar operação'}
              </Button>
            ) : null}
          </div>
        </Card>

        {feedback ? (
          <Alert className="mt-mc-16" role={feedback.ok ? 'status' : 'alert'} variant={feedback.ok ? 'success' : 'error'}>
            {feedback.message}
          </Alert>
        ) : null}

        {selected.mode === 'sem_confronto' ? (
          <Alert className="mt-mc-16" variant="info" title="Sem confronto">
            Esta categoria não possui luta, vencedor ou colocação automática.
          </Alert>
        ) : (
          <>
            {selected.status === 'publicada' ? (
              <Alert className="mt-mc-16" variant="warning" icon={<AlertTriangle size={20} />} title="Operação ainda não iniciada">
                Inicie a chave para liberar o registro dos confrontos. O primeiro início também avança o evento para “em andamento”. Pesagem já pode ser confirmada.
              </Alert>
            ) : null}
            <div className="mt-mc-16 space-y-mc-16">
              {selected.groups.map((group) => (
                <Card key={group.groupId} className="overflow-hidden">
                  <header className="flex flex-wrap items-center justify-between gap-mc-8 border-b border-mc-border bg-mc-surface-secondary p-mc-16">
                    <div>
                      <h3 className="font-mc-display text-mc-h3 text-mc-text-primary">Grupo {group.label}</h3>
                      <p className="mt-mc-4 text-sm text-mc-text-secondary">{topologyNames[group.topology]}</p>
                    </div>
                    <StatusBadge variant={group.status === 'concluido' ? 'success' : 'info'}>
                      {group.status === 'concluido' ? 'Grupo concluído' : group.status === 'aguardando' ? 'Aguardando' : 'Em operação'}
                    </StatusBadge>
                  </header>

                  <GroupChecklist
                    eventId={data.event.id}
                    group={group}
                    disabled={isPending}
                    onAction={runAction}
                  />
                  <div className="space-y-mc-12 p-mc-16">
                  {group.matches.map((match) => {
                    const winner = match.winnerEntryId === match.sideA?.entryId ? match.sideA : match.sideB
                    const selectedWinner = winnerByMatch[match.matchId] || ''
                    return (
                      <article key={match.matchId} className="rounded-mc-medium border border-mc-border p-mc-16">
                        <div className="flex flex-wrap items-center justify-between gap-mc-8">
                          <h4 className="font-semibold text-mc-text-primary">{matchLabel(match)}</h4>
                          <StatusBadge variant={match.status === 'pendente' ? 'neutral' : match.status === 'wo' ? 'warning' : 'success'}>
                            {match.status === 'pendente' ? 'Pendente' : match.status === 'wo' ? 'WO' : 'Concluído'}
                          </StatusBadge>
                        </div>

                        <div className="mt-mc-12 grid gap-mc-8 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
                          {[match.sideA, match.sideB].map((side, index) => (
                            <div key={index} className={`min-w-0 rounded-mc-small border p-mc-12 ${side?.entryId === match.winnerEntryId ? 'border-mc-success bg-mc-success/10' : 'border-mc-border bg-mc-surface-secondary'}`}>
                              <p className="break-words font-semibold text-mc-text-primary">{side?.name || 'Aguardando confronto anterior'}</p>
                              {side ? <p className="mt-mc-4 break-words text-sm text-mc-text-secondary">{side.team || 'Sem equipe informada'}</p> : null}
                              {side?.entryId === match.winnerEntryId ? (
                                <p className="mt-mc-8 flex items-center gap-mc-4 text-sm font-semibold text-mc-success">
                                  <CheckCircle2 aria-hidden="true" size={16} />
                                  Vencedor
                                </p>
                              ) : null}
                            </div>
                          )).reduce<React.ReactNode[]>((items, side, index) => {
                            if (index) items.push(<span key="versus" aria-hidden="true" className="text-center text-sm text-mc-text-secondary">×</span>)
                            items.push(side)
                            return items
                          }, [])}
                        </div>

                        {match.status === 'pendente' && match.canRecord && match.sideA && match.sideB ? (
                          <div className="mt-mc-16 border-t border-mc-border pt-mc-16">
                            <label htmlFor={`winner-${match.matchId}`} className="text-sm font-semibold text-mc-text-primary">Vencedor</label>
                            <select
                              id={`winner-${match.matchId}`}
                              value={selectedWinner}
                              onChange={(event) => setWinnerByMatch((current) => ({ ...current, [match.matchId]: event.target.value }))}
                              disabled={isPending}
                              className="mt-mc-8 min-h-11 w-full rounded-mc-small border border-mc-border bg-mc-surface px-3 text-mc-text-primary focus:border-mc-focus focus:outline-none focus:ring-2 focus:ring-mc-focus/20 disabled:opacity-60"
                            >
                              <option value="">Selecione o vencedor</option>
                              <option value={match.sideA.entryId}>{match.sideA.name}</option>
                              <option value={match.sideB.entryId}>{match.sideB.name}</option>
                            </select>
                            <div className="mt-mc-12 flex flex-col gap-mc-8 sm:flex-row">
                              <Button
                                className="gap-mc-8"
                                disabled={isPending || !selectedWinner}
                                onClick={() => runAction(
                                  () => recordBracketMatchOutcome(formData({
                                    event_id: data.event.id,
                                    match_id: match.matchId,
                                    winner_entry_id: selectedWinner,
                                    outcome: 'concluido',
                                  })),
                                  match.matchId,
                                )}
                              >
                                <Trophy aria-hidden="true" size={18} />
                                {pendingMatchId === match.matchId ? 'Registrando…' : 'Registrar vitória'}
                              </Button>
                              <Button
                                variant="outline"
                                className="gap-mc-8"
                                disabled={isPending || !selectedWinner}
                                onClick={() => {
                                  if (window.confirm('Registrar vitória por WO para o atleta selecionado?')) {
                                    runAction(
                                      () => recordBracketMatchOutcome(formData({
                                        event_id: data.event.id,
                                        match_id: match.matchId,
                                        winner_entry_id: selectedWinner,
                                        outcome: 'wo',
                                      })),
                                      match.matchId,
                                    )
                                  }
                                }}
                              >
                                <Flag aria-hidden="true" size={18} />
                                Registrar WO
                              </Button>
                            </div>
                          </div>
                        ) : match.status === 'pendente' ? (
                          <p className="mt-mc-12 text-sm text-mc-text-secondary">Aguardando a definição dos dois lados.</p>
                        ) : (
                          <p className="mt-mc-12 text-sm text-mc-text-secondary">
                            {match.status === 'wo' ? `Vitória por WO: ${winner?.name || 'atleta'}.` : `Vitória: ${winner?.name || 'atleta'}.`}
                          </p>
                        )}
                      </article>
                    )
                  })}
                </div>

                {group.placements.length ? (
                  <section aria-label={`Colocações do grupo ${group.label}`} className="border-t border-mc-border bg-mc-surface-secondary p-mc-16">
                    <h4 className="font-mc-display text-lg font-semibold text-mc-text-primary">Colocações</h4>
                    <ol className="mt-mc-12 grid gap-mc-8 sm:grid-cols-2">
                      {group.placements.map((placement, index) => (
                        <li key={`${placement.place}-${placement.athlete.entryId}`} className="flex min-w-0 items-start gap-mc-8 rounded-mc-small bg-mc-surface p-mc-12">
                          <span className="shrink-0 font-semibold text-mc-action">{placement.place}º</span>
                          <span className="min-w-0">
                            <span className="block break-words font-semibold text-mc-text-primary">{placement.athlete.name}</span>
                            <span className="block break-words text-sm text-mc-text-secondary">{placement.athlete.team || 'Sem equipe informada'}</span>
                          </span>
                          {placement.place === 3 && index > 2 ? <span className="sr-only">Segundo terceiro colocado</span> : null}
                        </li>
                      ))}
                    </ol>
                  </section>
                ) : null}
              </Card>
            ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
