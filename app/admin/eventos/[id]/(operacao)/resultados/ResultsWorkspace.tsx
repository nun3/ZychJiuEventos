'use client'

import { useEffect, useMemo, useState, useTransition, type ReactNode } from 'react'
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

function placeTone(place: number) {
  if (place === 1) return 'border-mc-warning/40 bg-mc-warning/10 text-mc-warning'
  if (place === 2) return 'border-mc-border bg-mc-surface-secondary text-mc-text-secondary'
  if (place === 3) return 'border-mc-action/30 bg-mc-action/10 text-mc-action'
  return 'border-mc-border bg-mc-surface text-mc-text-secondary'
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
      icon: Scale,
      state: group.weighIn,
      confirmLabel: 'Marcar pesagem como realizada',
      undoLabel: 'Desfazer confirmação da pesagem',
      confirm: () => confirmGroupWeighIn(formData({ event_id: eventId, group_id: group.groupId })),
      undo: () => undoGroupWeighIn(formData({ event_id: eventId, group_id: group.groupId })),
      canConfirm: group.weighIn.status === 'pendente',
      showConfirm: group.weighIn.status === 'pendente',
      confirmDisabledReason: undefined as string | undefined,
      canUndo: group.weighIn.status === 'realizada' && group.awards.status !== 'realizada',
    },
    {
      key: 'result',
      label: 'Resultado',
      icon: Trophy,
      state: {
        status: group.resultStatus === 'registrado' ? 'realizada' : 'pendente',
        confirmedAt: null,
        confirmedBy: null,
        confirmedByName: null,
      } satisfies GroupChecklistState,
      confirmLabel: null as string | null,
      undoLabel: null as string | null,
      confirm: null as (() => Promise<ResultActionState>) | null,
      undo: null as (() => Promise<ResultActionState>) | null,
      canConfirm: false,
      showConfirm: false,
      confirmDisabledReason: undefined as string | undefined,
      canUndo: false,
    },
    {
      key: 'awards',
      label: 'Premiação',
      icon: Award,
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
    <section aria-label={`Checklist operacional da subchave ${group.label}`} className="border-b border-mc-border bg-mc-surface-secondary/40 p-mc-16">
      <ol className="grid gap-mc-12 md:grid-cols-3">
        {rows.map((row, index) => {
          const done = row.state.status === 'realizada' || (row.key === 'result' && group.resultStatus === 'registrado')
          const caption = row.key === 'result'
            ? (group.resultStatus === 'registrado' ? 'Colocações derivadas do domínio atual' : 'Aguardando o registro das lutas')
            : confirmedCaption(row.state)
          const Icon = row.icon
          return (
            <li key={row.key} className="rounded-mc-medium border border-mc-border bg-mc-surface p-mc-12 shadow-mc-subtle">
              <div className="flex items-start gap-mc-12">
                <span
                  className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-mc-medium ${
                    done ? 'bg-mc-success text-white' : 'bg-mc-warning/15 text-mc-warning'
                  }`}
                  aria-hidden="true"
                >
                  {done ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-mc-interface text-xs font-semibold uppercase tracking-wide text-mc-text-secondary">
                    {index + 1}. {row.label}
                  </p>
                  <div className="mt-mc-8 flex flex-wrap items-center gap-mc-8">
                    <StatusBadge variant={done ? 'success' : 'warning'}>
                      {row.key === 'result'
                        ? (group.resultStatus === 'registrado' ? 'Registrado' : 'Pendente')
                        : (row.state.status === 'realizada' ? 'Realizada' : 'Pendente')}
                    </StatusBadge>
                  </div>
                  {caption ? <p className="mt-mc-8 text-sm text-mc-text-secondary">{caption}</p> : null}
                  {row.confirm && row.showConfirm ? (
                    <div className="mt-mc-12 flex flex-col gap-mc-8">
                      <Button
                        size="small"
                        className="gap-mc-8"
                        disabled={disabled || !row.canConfirm}
                        title={row.confirmDisabledReason}
                        onClick={() => onAction(row.confirm!)}
                      >
                        <Icon aria-hidden="true" size={16} />
                        {row.confirmLabel}
                      </Button>
                      {row.canUndo ? (
                        <Button size="small" variant="outline" disabled={disabled} onClick={() => onAction(row.undo!)}>
                          {row.undoLabel}
                        </Button>
                      ) : null}
                    </div>
                  ) : row.canUndo ? (
                    <Button
                      size="small"
                      variant="outline"
                      className="mt-mc-12"
                      disabled={disabled}
                      onClick={() => onAction(row.undo!)}
                    >
                      {row.undoLabel}
                    </Button>
                  ) : null}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
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

  const summary = useMemo(() => {
    const bracketsInProgress = data.brackets.filter((bracket) => bracket.status === 'em_andamento').length
    const bracketsDone = data.brackets.filter((bracket) => bracket.status === 'concluida').length
    const pendingMatches = data.brackets.reduce(
      (count, bracket) => count + bracket.groups.reduce(
        (groupCount, group) => groupCount + group.matches.filter((match) => match.status === 'pendente').length,
        0,
      ),
      0,
    )
    return {
      total: data.brackets.length,
      inProgress: bracketsInProgress,
      done: bracketsDone,
      pendingMatches,
    }
  }, [data.brackets])

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
        title="Nenhum resultado disponível"
        description="Ainda não há chave publicada. Sem chave oficial não há luta, pesagem nem colocação. Publique a chave e a programação antes de operar."
      />
    )
  }

  if (!selected) return null

  return (
    <div className="mt-mc-24 space-y-mc-24">
      <dl className="grid gap-mc-12 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-mc-medium border border-mc-border bg-mc-surface p-mc-16 shadow-mc-subtle">
          <dt className="font-mc-interface text-sm text-mc-text-secondary">Categorias oficiais</dt>
          <dd className="mt-mc-8 font-mc-display text-mc-h3 text-mc-text-primary">{summary.total}</dd>
        </div>
        <div className="rounded-mc-medium border border-mc-border bg-mc-surface p-mc-16 shadow-mc-subtle">
          <dt className="font-mc-interface text-sm text-mc-text-secondary">Em andamento</dt>
          <dd className="mt-mc-8 font-mc-display text-mc-h3 text-mc-text-primary">{summary.inProgress}</dd>
        </div>
        <div className="rounded-mc-medium border border-mc-border bg-mc-surface p-mc-16 shadow-mc-subtle">
          <dt className="font-mc-interface text-sm text-mc-text-secondary">Concluídas</dt>
          <dd className="mt-mc-8 font-mc-display text-mc-h3 text-mc-text-primary">{summary.done}</dd>
        </div>
        <div className="rounded-mc-medium border border-mc-border bg-mc-surface p-mc-16 shadow-mc-subtle">
          <dt className="font-mc-interface text-sm text-mc-text-secondary">Lutas pendentes</dt>
          <dd className="mt-mc-8 flex items-center gap-mc-8">
            <span className="font-mc-display text-mc-h3 text-mc-text-primary">{summary.pendingMatches}</span>
            <StatusBadge variant={summary.pendingMatches ? 'warning' : 'success'}>
              {summary.pendingMatches ? 'Pendentes' : 'Em dia'}
            </StatusBadge>
          </dd>
        </div>
      </dl>

      <div className="grid items-start gap-mc-24 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside aria-labelledby="result-categories-title" className="rounded-mc-medium border border-mc-border bg-mc-surface p-mc-16 shadow-mc-subtle">
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
              {data.brackets.map((bracket) => (
                <option key={bracket.bracketId} value={bracket.bracketId}>{bracket.category}</option>
              ))}
            </select>
          </label>
          <div className="mt-mc-12 hidden max-h-[70vh] space-y-mc-8 overflow-y-auto lg:block">
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
                  className={`w-full rounded-mc-medium border p-mc-12 text-left transition-colors duration-mc-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus ${
                    isSelected
                      ? 'border-mc-action bg-mc-action/5 shadow-mc-subtle'
                      : 'border-mc-border bg-mc-surface hover:bg-mc-surface-secondary'
                  }`}
                >
                  <span className="block font-semibold text-mc-text-primary">{bracket.category}</span>
                  <span className="mt-mc-4 block text-sm text-mc-text-secondary">
                    {formatFightDurationLabel(bracket.durationMinutes) || 'Duração não definida'}
                  </span>
                  <span className="mt-mc-8 block">{statusBadge(bracket.status)}</span>
                </button>
              )
            })}
          </div>
        </aside>

        <section aria-labelledby="selected-result-title" className="min-w-0">
          <Card className="p-mc-16 shadow-mc-subtle sm:p-mc-24">
            <div className="flex flex-col gap-mc-16 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-mc-8">
                  <h2 id="selected-result-title" className="font-mc-display text-mc-h2 text-mc-text-primary">{selected.category}</h2>
                  {statusBadge(selected.status)}
                </div>
                <p className="mt-mc-4 text-sm text-mc-text-secondary">
                  Versão {selected.version} · {formatFightDurationLabel(selected.durationMinutes) || 'Duração não definida'}
                </p>
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
                  <Card key={group.groupId} className="overflow-hidden shadow-mc-subtle">
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
                      <h4 className="font-semibold text-mc-text-primary">Confrontos</h4>
                      {group.matches.map((match) => {
                        const winner = match.winnerEntryId === match.sideA?.entryId ? match.sideA : match.sideB
                        const selectedWinner = winnerByMatch[match.matchId] || ''
                        return (
                          <article key={match.matchId} className="overflow-hidden rounded-mc-medium border border-mc-border bg-mc-surface shadow-mc-subtle">
                            <div className="flex flex-wrap items-center justify-between gap-mc-8 border-b border-mc-border bg-mc-surface-secondary px-mc-16 py-mc-12">
                              <h5 className="font-semibold text-mc-text-primary">{matchLabel(match)}</h5>
                              <StatusBadge variant={match.status === 'pendente' ? 'neutral' : match.status === 'wo' ? 'warning' : 'success'}>
                                {match.status === 'pendente' ? 'Pendente' : match.status === 'wo' ? 'WO' : 'Concluído'}
                              </StatusBadge>
                            </div>

                            <div className="grid gap-mc-8 p-mc-16 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
                              {([match.sideA, match.sideB] as const).map((side, index) => (
                                <div
                                  key={index}
                                  className={`min-w-0 rounded-mc-medium border p-mc-12 ${
                                    side?.entryId === match.winnerEntryId
                                      ? 'border-mc-success bg-mc-success/10'
                                      : 'border-mc-border bg-mc-surface-secondary'
                                  }`}
                                >
                                  <p className="break-words font-semibold text-mc-text-primary">
                                    {side?.name || 'Aguardando confronto anterior'}
                                  </p>
                                  {side ? (
                                    <p className="mt-mc-4 break-words text-sm text-mc-text-secondary">
                                      {side.team || 'Sem equipe informada'}
                                    </p>
                                  ) : null}
                                  {side?.entryId === match.winnerEntryId ? (
                                    <p className="mt-mc-8 flex items-center gap-mc-4 text-sm font-semibold text-mc-success">
                                      <CheckCircle2 aria-hidden="true" size={16} />
                                      Vencedor
                                    </p>
                                  ) : null}
                                </div>
                              )).reduce<ReactNode[]>((items, side, index) => {
                                if (index) {
                                  items.push(
                                    <span key="versus" aria-hidden="true" className="text-center font-mc-interface text-xs font-bold uppercase tracking-wide text-mc-text-secondary">
                                      versus
                                    </span>,
                                  )
                                }
                                items.push(side)
                                return items
                              }, [])}
                            </div>

                            {match.status === 'pendente' && match.canRecord && match.sideA && match.sideB ? (
                              <div className="border-t border-mc-border px-mc-16 pb-mc-16 pt-mc-12">
                                <label htmlFor={`winner-${match.matchId}`} className="text-sm font-semibold text-mc-text-primary">
                                  Vencedor
                                </label>
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
                              <p className="border-t border-mc-border px-mc-16 py-mc-12 text-sm text-mc-text-secondary">
                                Aguardando a definição dos dois lados.
                              </p>
                            ) : (
                              <p className="border-t border-mc-border px-mc-16 py-mc-12 text-sm text-mc-text-secondary">
                                {match.status === 'wo'
                                  ? `Vitória por WO: ${winner?.name || 'atleta'}.`
                                  : `Vitória: ${winner?.name || 'atleta'}.`}
                              </p>
                            )}
                          </article>
                        )
                      })}
                    </div>

                    {group.placements.length ? (
                      <section aria-label={`Colocações do grupo ${group.label}`} className="border-t border-mc-border bg-mc-surface-secondary p-mc-16">
                        <div className="flex items-center gap-mc-8">
                          <Trophy aria-hidden="true" className="text-mc-action" size={18} />
                          <h4 className="font-mc-display text-lg font-semibold text-mc-text-primary">Colocações</h4>
                        </div>
                        <ol className="mt-mc-12 grid gap-mc-8 sm:grid-cols-2 lg:grid-cols-3">
                          {group.placements.map((placement, index) => (
                            <li
                              key={`${placement.place}-${placement.athlete.entryId}`}
                              className={`flex min-w-0 items-start gap-mc-12 rounded-mc-medium border p-mc-12 ${placeTone(placement.place)}`}
                            >
                              <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-mc-medium bg-mc-structure font-mc-display text-sm font-bold text-white">
                                {placement.place}º
                              </span>
                              <span className="min-w-0">
                                <span className="block break-words font-semibold text-mc-text-primary">{placement.athlete.name}</span>
                                <span className="block break-words text-sm text-mc-text-secondary">
                                  {placement.athlete.team || 'Sem equipe informada'}
                                </span>
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
    </div>
  )
}
