'use client'

import { useMemo, useState, useTransition } from 'react'
import { ArrowDown, ArrowUp, Lock, MapPinned, Plus, Send, Unlink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Alert, Button, Card, Input, Select, StatusBadge } from '@/components/ui'
import { formatFightDurationLabel } from '@/lib/events/fight-duration'
import {
  assignGroup,
  publishSchedule,
  reorderSchedule,
  saveArea,
  toggleArea,
  unassignGroup,
  type ScheduleActionState,
} from './actions'
import type { ScheduleGroup, ScheduleMatch, SchedulePageData } from './data'

type ScheduledMatch = ScheduleMatch & {
  groupId: string
  groupLabel: string
  category: string
  areaId: string
}

const initialState: ScheduleActionState = { ok: true, message: '' }

function roundLabel(match: ScheduleMatch) {
  return match.round === 'final' ? 'Final' : `Semifinal ${match.order}`
}

function sideLabel(match: ScheduleMatch, side: 'A' | 'B') {
  const athlete = side === 'A' ? match.sideA : match.sideB
  if (athlete) return athlete.team ? `${athlete.name} — ${athlete.team}` : athlete.name
  return match.round === 'final' ? 'Vencedor de semifinal' : 'A definir'
}

function groupMatches(group: ScheduleGroup): ScheduledMatch[] {
  if (!group.areaId) return []
  return group.matches
    .filter((match) => match.fightNumber !== null)
    .map((match) => ({
      ...match,
      groupId: group.groupId,
      groupLabel: group.label,
      category: group.category,
      areaId: group.areaId as string,
    }))
}

export default function ScheduleWorkspace({ data }: { data: SchedulePageData }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState(initialState)
  const activeAreas = data.schedule.areas.filter((area) => area.active)
  const globalQueue = useMemo(
    () => data.schedule.groups.flatMap(groupMatches).sort((a, b) => (a.fightNumber || 0) - (b.fightNumber || 0)),
    [data.schedule.groups],
  )
  const assignedGroups = data.schedule.groups.filter((group) => group.areaId)
  const unassignedCount = data.schedule.groups.length - assignedGroups.length
  const editable = data.schedule.editable

  function execute(action: (formData: FormData) => Promise<ScheduleActionState>, formData: FormData) {
    setFeedback(initialState)
    startTransition(async () => {
      const result = await action(formData)
      setFeedback(result)
      if (result.ok) router.refresh()
    })
  }

  function reorder(matchId: string, direction: -1 | 1) {
    const currentIndex = globalQueue.findIndex((match) => match.matchId === matchId)
    const nextIndex = currentIndex + direction
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= globalQueue.length) return
    const matchIds = globalQueue.map((match) => match.matchId)
    ;[matchIds[currentIndex], matchIds[nextIndex]] = [matchIds[nextIndex], matchIds[currentIndex]]
    const formData = new FormData()
    formData.set('event_id', data.event.id)
    formData.set('match_ids', JSON.stringify(matchIds))
    execute(reorderSchedule, formData)
  }

  return (
    <div className="mt-mc-24 space-y-mc-24">
      {feedback.message ? (
        <Alert role="status" variant={feedback.ok ? 'success' : 'error'} title={feedback.ok ? 'Operação concluída' : 'Não foi possível concluir'}>
          {feedback.message}
        </Alert>
      ) : null}

      {!editable ? (
        <Alert variant={data.schedule.status === 'publicada' ? 'info' : 'warning'} icon={<Lock size={20} />} title="Programação congelada">
          {data.schedule.status === 'publicada'
            ? 'A programação foi publicada. Os números, as áreas e as lacunas históricas não podem mais ser alterados.'
            : 'A programação só pode ser editada na fase de chaves.'}
        </Alert>
      ) : null}

      <dl className="grid gap-mc-12 sm:grid-cols-3">
        <div className="rounded-mc-medium border border-mc-border bg-mc-surface p-mc-16 shadow-mc-subtle">
          <dt className="font-mc-interface text-sm text-mc-text-secondary">Áreas ativas</dt>
          <dd className="mt-mc-8 font-mc-display text-mc-h3 text-mc-text-primary">{activeAreas.length}</dd>
        </div>
        <div className="rounded-mc-medium border border-mc-border bg-mc-surface p-mc-16 shadow-mc-subtle">
          <dt className="font-mc-interface text-sm text-mc-text-secondary">Subchaves</dt>
          <dd className="mt-mc-8 font-mc-display text-mc-h3 text-mc-text-primary">{data.schedule.groups.length}</dd>
        </div>
        <div className="rounded-mc-medium border border-mc-border bg-mc-surface p-mc-16 shadow-mc-subtle">
          <dt className="font-mc-interface text-sm text-mc-text-secondary">Sem área</dt>
          <dd className="mt-mc-8 flex items-center gap-mc-8">
            <span className="font-mc-display text-mc-h3 text-mc-text-primary">{unassignedCount}</span>
            <StatusBadge variant={unassignedCount === 0 ? 'success' : 'warning'}>
              {unassignedCount === 0 ? 'Completo' : 'Pendente'}
            </StatusBadge>
          </dd>
        </div>
      </dl>

      <section aria-labelledby="areas-title" className="rounded-mc-medium border border-mc-border bg-mc-surface p-mc-16 shadow-mc-subtle sm:p-mc-24">
        <div className="flex flex-col gap-mc-12 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-start gap-mc-12">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-mc-medium bg-mc-action/10 text-mc-action" aria-hidden="true">
              <MapPinned size={20} />
            </span>
            <div>
              <h2 id="areas-title" className="font-mc-display text-mc-h3 text-mc-text-primary">Áreas do evento</h2>
              <p className="mt-mc-4 text-sm text-mc-text-secondary">Use número e nome ou cor para identificação operacional.</p>
            </div>
          </div>
          <StatusBadge variant="info" icon={<MapPinned size={14} />}>
            {activeAreas.length} {activeAreas.length === 1 ? 'área ativa' : 'áreas ativas'}
          </StatusBadge>
        </div>

        {editable ? (
          <form
            className="mt-mc-16 grid gap-mc-12 rounded-mc-medium border border-mc-border bg-mc-surface-secondary p-mc-16 sm:grid-cols-[8rem_1fr_auto]"
            onSubmit={(event) => {
              event.preventDefault()
              execute(saveArea, new FormData(event.currentTarget))
              event.currentTarget.reset()
            }}
          >
            <input type="hidden" name="event_id" value={data.event.id} />
            <div>
              <label htmlFor="new-area-number" className="mb-mc-4 block text-sm font-semibold text-mc-text-primary">Número</label>
              <Input id="new-area-number" name="number" type="number" min={1} max={999} required disabled={pending} />
            </div>
            <div>
              <label htmlFor="new-area-name" className="mb-mc-4 block text-sm font-semibold text-mc-text-primary">Nome ou cor</label>
              <Input id="new-area-name" name="name" maxLength={60} placeholder="Ex.: Verde" required disabled={pending} />
            </div>
            <Button className="self-end" type="submit" disabled={pending}>
              <Plus aria-hidden="true" size={18} />
              <span className="ml-mc-8">Adicionar área</span>
            </Button>
          </form>
        ) : null}

        <div className="mt-mc-16 grid gap-mc-12 md:grid-cols-2">
          {data.schedule.areas.map((area) => (
            <Card key={area.areaId} className="border-mc-border p-mc-16 shadow-none">
              <div className="mb-mc-12 flex items-center gap-mc-12">
                <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-mc-medium bg-mc-structure font-mc-display text-sm font-bold text-white" aria-hidden="true">
                  {area.number}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-mc-text-primary">{area.name}</p>
                  <StatusBadge className="mt-mc-4" variant={area.active ? 'success' : 'neutral'}>
                    {area.active ? 'Ativa' : 'Inativa'}
                  </StatusBadge>
                </div>
              </div>
              <form
                className="grid gap-mc-12 sm:grid-cols-[7rem_1fr_auto]"
                onSubmit={(event) => {
                  event.preventDefault()
                  execute(saveArea, new FormData(event.currentTarget))
                }}
              >
                <input type="hidden" name="event_id" value={data.event.id} />
                <input type="hidden" name="area_id" value={area.areaId} />
                <div>
                  <label htmlFor={`area-number-${area.areaId}`} className="mb-mc-4 block text-sm font-semibold text-mc-text-primary">Número</label>
                  <Input id={`area-number-${area.areaId}`} name="number" type="number" min={1} max={999} defaultValue={area.number} required disabled={!editable || pending} />
                </div>
                <div>
                  <label htmlFor={`area-name-${area.areaId}`} className="mb-mc-4 block text-sm font-semibold text-mc-text-primary">Nome ou cor</label>
                  <Input id={`area-name-${area.areaId}`} name="name" maxLength={60} defaultValue={area.name} required disabled={!editable || pending} />
                </div>
                {editable ? <Button className="self-end" type="submit" variant="outline" disabled={pending}>Salvar</Button> : null}
              </form>
              {editable ? (
                <div className="mt-mc-12 flex justify-end border-t border-mc-border pt-mc-12">
                  <Button
                    size="small"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => {
                      const formData = new FormData()
                      formData.set('event_id', data.event.id)
                      formData.set('area_id', area.areaId)
                      formData.set('active', String(!area.active))
                      execute(toggleArea, formData)
                    }}
                  >
                    {area.active ? 'Desativar' : 'Ativar'}
                  </Button>
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="groups-title" className="rounded-mc-medium border border-mc-border bg-mc-surface p-mc-16 shadow-mc-subtle sm:p-mc-24">
        <div className="flex flex-wrap items-center justify-between gap-mc-12">
          <div>
            <h2 id="groups-title" className="font-mc-display text-mc-h3 text-mc-text-primary">Subchaves e áreas</h2>
            <p className="mt-mc-4 text-sm text-mc-text-secondary">A área é aplicada à subchave inteira, incluindo semifinais e final.</p>
          </div>
          <StatusBadge variant={unassignedCount === 0 ? 'success' : 'warning'}>
            {unassignedCount === 0 ? 'Todas atribuídas' : `${unassignedCount} sem área`}
          </StatusBadge>
        </div>

        {data.schedule.groups.length === 0 ? (
          <Alert className="mt-mc-16" variant="info" title="Nenhuma programação para montar">
            Ainda não há subchave oficial. Sem chave publicada não há área, número de luta nem fila. Publique as chaves com confronto e volte para programar.
          </Alert>
        ) : (
          <div className="mt-mc-16 divide-y divide-mc-border overflow-hidden rounded-mc-medium border border-mc-border bg-mc-surface-secondary/40">
            {data.schedule.groups.map((group) => {
              const area = data.schedule.areas.find((item) => item.areaId === group.areaId)
              return (
                <div key={group.groupId} className="grid gap-mc-12 p-mc-16 md:grid-cols-[1fr_minmax(14rem,18rem)_auto] md:items-center">
                  <div className="min-w-0">
                    <p className="font-semibold text-mc-text-primary">{group.category} — Subchave {group.label}</p>
                    <p className="mt-mc-4 text-sm text-mc-text-secondary">
                      {group.matches.length} {group.matches.length === 1 ? 'luta' : 'lutas'} · {group.topology.replace('_', ' ')} · {formatFightDurationLabel(group.durationMinutes) || 'Duração não definida'}
                    </p>
                  </div>
                  {editable ? (
                    <div>
                      <label htmlFor={`group-area-${group.groupId}`} className="sr-only">Área da subchave {group.label}</label>
                      <Select
                        id={`group-area-${group.groupId}`}
                        value={group.areaId || ''}
                        disabled={pending || activeAreas.length === 0}
                        onChange={(event) => {
                          if (!event.target.value) return
                          const formData = new FormData()
                          formData.set('event_id', data.event.id)
                          formData.set('group_id', group.groupId)
                          formData.set('area_id', event.target.value)
                          execute(assignGroup, formData)
                        }}
                      >
                        <option value="">Selecionar área</option>
                        {activeAreas.map((item) => <option key={item.areaId} value={item.areaId}>Área {item.number} — {item.name}</option>)}
                      </Select>
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-mc-text-primary">
                      {area ? `Área ${area.number} — ${area.name}` : 'Sem área'}
                    </p>
                  )}
                  {editable && group.areaId ? (
                    <Button
                      size="small"
                      variant="ghost"
                      disabled={pending}
                      onClick={() => {
                        const formData = new FormData()
                        formData.set('event_id', data.event.id)
                        formData.set('group_id', group.groupId)
                        execute(unassignGroup, formData)
                      }}
                    >
                      <Unlink aria-hidden="true" size={16} />
                      <span className="ml-mc-8">Remover</span>
                    </Button>
                  ) : <span />}
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section aria-labelledby="queues-title" className="rounded-mc-medium border border-mc-border bg-mc-surface p-mc-16 shadow-mc-subtle sm:p-mc-24">
        <div className="flex flex-col gap-mc-12 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="queues-title" className="font-mc-display text-mc-h3 text-mc-text-primary">Filas por área</h2>
            <p className="mt-mc-4 text-sm text-mc-text-secondary">Cada fila deriva da ordem crescente do número global da luta.</p>
          </div>
          {editable && globalQueue.length > 0 ? (
            <Button
              disabled={pending || unassignedCount > 0}
              onClick={() => {
                const formData = new FormData()
                formData.set('event_id', data.event.id)
                execute(publishSchedule, formData)
              }}
            >
              <Send aria-hidden="true" size={17} />
              <span className="ml-mc-8">Publicar programação</span>
            </Button>
          ) : null}
        </div>

        <div className="mt-mc-16 grid gap-mc-16 lg:grid-cols-2">
          {activeAreas.map((area) => {
            const queue = globalQueue.filter((match) => match.areaId === area.areaId)
            return (
              <Card key={area.areaId} className="overflow-hidden border-mc-border shadow-none">
                <div className="flex items-center justify-between gap-mc-12 border-b border-mc-border bg-mc-surface-secondary px-mc-16 py-mc-12">
                  <div className="flex min-w-0 items-center gap-mc-12">
                    <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-mc-medium bg-mc-structure font-mc-display text-sm font-bold text-white" aria-hidden="true">
                      {area.number}
                    </span>
                    <h3 className="truncate font-mc-display text-mc-h3 text-mc-text-primary">{area.name}</h3>
                  </div>
                  <StatusBadge variant="info">{queue.length} {queue.length === 1 ? 'luta' : 'lutas'}</StatusBadge>
                </div>
                {queue.length === 0 ? (
                  <p className="p-mc-16 text-sm text-mc-text-secondary">Nenhuma subchave atribuída.</p>
                ) : (
                  <ol className="divide-y divide-mc-border">
                    {queue.map((match) => {
                      const globalIndex = globalQueue.findIndex((item) => item.matchId === match.matchId)
                      return (
                        <li key={match.matchId} className="grid grid-cols-[auto_1fr] gap-mc-12 p-mc-12 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-mc-16">
                          <span className="inline-flex h-11 min-w-11 items-center justify-center rounded-mc-medium bg-mc-action px-2 font-mc-display text-sm font-bold text-white" aria-label={`Luta ${match.fightNumber}`}>
                            {match.fightNumber}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-mc-text-primary">{match.category} — {match.groupLabel}</p>
                            <p className="mt-mc-4 font-mc-interface text-xs font-semibold uppercase tracking-wide text-mc-text-secondary">{roundLabel(match)}</p>
                            <p className="mt-mc-4 break-words text-sm text-mc-text-secondary">{sideLabel(match, 'A')}</p>
                            <p className="break-words text-sm text-mc-text-secondary">× {sideLabel(match, 'B')}</p>
                            {match.status !== 'pendente' ? (
                              <StatusBadge className="mt-mc-8" variant={match.status === 'wo' ? 'warning' : 'success'}>
                                {match.status === 'wo' ? 'WO' : 'Concluída'}
                              </StatusBadge>
                            ) : null}
                          </div>
                          {editable ? (
                            <div className="col-start-2 flex gap-mc-8 sm:col-start-auto">
                              <Button aria-label={`Mover luta ${match.fightNumber} para cima`} size="small" variant="outline" disabled={pending || globalIndex === 0} onClick={() => reorder(match.matchId, -1)}>
                                <ArrowUp aria-hidden="true" size={16} />
                              </Button>
                              <Button aria-label={`Mover luta ${match.fightNumber} para baixo`} size="small" variant="outline" disabled={pending || globalIndex === globalQueue.length - 1} onClick={() => reorder(match.matchId, 1)}>
                                <ArrowDown aria-hidden="true" size={16} />
                              </Button>
                            </div>
                          ) : null}
                        </li>
                      )
                    })}
                  </ol>
                )}
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}
