'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  applyLiveActionAction,
  createLiveSessionAction,
  refreshLiveSessionAction,
} from '@/app/admin/eventos/[id]/operacao/actions'
import type {
  LiveResultType,
  LiveSessionPayload,
  LiveSide,
  OperatorPageData,
  OperatorQueueMatch,
} from '@/app/admin/eventos/[id]/operacao/types'
import { createLiveIdempotencyKey } from '@/lib/live/idempotency'
import { canApplyLiveEvent, scoringAllowed, type LiveEventType } from '@/lib/live/lifecycle'
import { AreaPicker } from './AreaPicker'
import { FinishDialog } from './FinishDialog'
import { MatchQueue } from './MatchQueue'
import { OperatorClock } from './OperatorClock'
import { Scoreboard } from './Scoreboard'
import { SyncBadge, type SyncState } from './SyncBadge'

type PendingGesture = {
  fingerprint: string
  key: string
}

type Undoable = {
  eventId: string
  label: string
}

function fingerprint(parts: Array<string | number | null | undefined>) {
  return parts.map((part) => String(part ?? '')).join('|')
}

function undoLabel(type: LiveEventType, side: LiveSide | null, value: number | null, athleteName: string) {
  if (type === 'score') return `+${value ?? ''} ${athleteName}`.trim()
  if (type === 'advantage') return `Vantagem ${athleteName}`
  if (type === 'penalty') return `Penalidade ${athleteName}`
  return athleteName
}

export function OperatorBoard({
  data,
  initialAreaId,
  initialMatchId,
}: {
  data: OperatorPageData
  initialAreaId: string | null
  initialMatchId: string | null
}) {
  const router = useRouter()
  const [areaId, setAreaId] = useState<string | null>(initialAreaId)
  const [matchId, setMatchId] = useState<string | null>(initialMatchId)
  const [session, setSession] = useState<LiveSessionPayload | null>(null)
  const [sync, setSync] = useState<SyncState>('synced')
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [locked, setLocked] = useState(false)
  const [flash, setFlash] = useState(false)
  const [finishOpen, setFinishOpen] = useState(false)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [undoable, setUndoable] = useState<Undoable | null>(null)
  const pendingRef = useRef<PendingGesture | null>(null)
  const onlineRef = useRef(typeof navigator === 'undefined' ? true : navigator.onLine)

  const area = data.areas.find((item) => item.areaId === areaId) || null
  const queue = useMemo(() => (areaId ? data.queueByArea[areaId] || [] : []), [areaId, data.queueByArea])
  const current = useMemo<OperatorQueueMatch | null>(() => {
    if (!queue.length) return null
    if (matchId) return queue.find((item) => item.matchId === matchId) || queue[0]
    const active = queue.find((item) => item.session && !['finished', 'confirmed'].includes(item.session.status))
    return active || queue.find((item) => item.status === 'pendente') || queue[0]
  }, [queue, matchId])

  useEffect(() => {
    if (!current) {
      setSession(null)
      return
    }
    setMatchId(current.matchId)
    setSession(current.session || data.sessionsByMatchId[current.matchId] || null)
  }, [current, data.sessionsByMatchId])

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const onOnline = () => {
      onlineRef.current = true
      setSync('synced')
    }
    const onOffline = () => {
      onlineRef.current = false
      setSync('offline')
    }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  const selectArea = useCallback((nextAreaId: string) => {
    setAreaId(nextAreaId)
    setMatchId(null)
    setUndoable(null)
    setMessage(null)
    router.replace(`/admin/eventos/${data.event.id}/operacao?areaId=${nextAreaId}`)
  }, [data.event.id, router])

  const selectMatch = useCallback((nextMatchId: string) => {
    setMatchId(nextMatchId)
    setUndoable(null)
    setMessage(null)
    if (areaId) {
      router.replace(`/admin/eventos/${data.event.id}/operacao?areaId=${areaId}&matchId=${nextMatchId}`)
    }
  }, [areaId, data.event.id, router])

  const syncSession = useCallback(async (targetSessionId: string) => {
    setSync('updating')
    const result = await refreshLiveSessionAction({ eventId: data.event.id, sessionId: targetSessionId })
    if (!result.ok || !result.session) {
      setSync(onlineRef.current ? 'error' : 'offline')
      setMessage(result.ok === false ? result.message : 'Falha ao sincronizar.')
      return null
    }
    setSession(result.session)
    setSync('synced')
    return result.session
  }, [data.event.id])

  useEffect(() => {
    if (!session || !['running', 'paused'].includes(session.status)) return
    const id = window.setInterval(() => {
      void syncSession(session.id)
    }, 2000)
    return () => window.clearInterval(id)
  }, [session?.id, session?.status, syncSession])

  const handleConflict = useCallback(async (next: LiveSessionPayload | null | undefined) => {
    setLocked(true)
    setSync('conflict')
    setMessage('Outra mesa atualizou esta luta. O placar foi sincronizado.')
    if (next) setSession(next)
    else if (session) await syncSession(session.id)
    setFlash(true)
    window.setTimeout(() => setFlash(false), 900)
    pendingRef.current = null
    setBusy(false)
    setLocked(false)
  }, [session, syncSession])

  const runCreate = useCallback(async () => {
    if (!current || !areaId || busy || locked) return
    const fp = fingerprint(['create', current.matchId, areaId])
    if (!pendingRef.current || pendingRef.current.fingerprint !== fp) {
      pendingRef.current = { fingerprint: fp, key: createLiveIdempotencyKey('create') }
    }
    setBusy(true)
    setSync('updating')
    setMessage(null)
    const result = await createLiveSessionAction({
      eventId: data.event.id,
      matchId: current.matchId,
      areaId,
      idempotencyKey: pendingRef.current.key,
    })
    setBusy(false)
    if (!result.ok) {
      setSync('error')
      setMessage(result.message)
      return
    }
    pendingRef.current = null
    setSession(result.session)
    setSync('synced')
  }, [areaId, busy, current, data.event.id, locked])

  const runAction = useCallback(async (input: {
    actionType: LiveEventType
    competitorSide?: LiveSide | null
    actionValue?: number | null
    targetEventId?: string | null
    winnerSide?: LiveSide | null
    resultType?: LiveResultType | null
    athleteName?: string
  }) => {
    if (!session || busy || locked) return
    if (!canApplyLiveEvent(session.status, input.actionType)) return
    if (['score', 'advantage', 'penalty'].includes(input.actionType) && !scoringAllowed(session.status)) return

    const fp = fingerprint([
      input.actionType,
      session.id,
      input.competitorSide,
      input.actionValue,
      input.targetEventId,
      input.winnerSide,
      input.resultType,
    ])
    if (!pendingRef.current || pendingRef.current.fingerprint !== fp) {
      pendingRef.current = { fingerprint: fp, key: createLiveIdempotencyKey(input.actionType) }
    }

    setBusy(true)
    setSync('updating')
    setMessage(null)
    const result = await applyLiveActionAction({
      eventId: data.event.id,
      sessionId: session.id,
      expectedVersion: session.version,
      actionType: input.actionType,
      idempotencyKey: pendingRef.current.key,
      competitorSide: input.competitorSide ?? null,
      actionValue: input.actionValue ?? null,
      targetEventId: input.targetEventId ?? null,
      winnerSide: input.winnerSide ?? null,
      resultType: input.resultType ?? null,
    })

    if (result.conflict) {
      await handleConflict(result.session)
      return
    }

    setBusy(false)
    if (!result.ok) {
      setSync('error')
      setMessage(result.message)
      return
    }

    pendingRef.current = null
    setSession(result.session)
    setSync('synced')

    if (['score', 'advantage', 'penalty'].includes(input.actionType) && result.session.lastEventId) {
      setUndoable({
        eventId: result.session.lastEventId,
        label: undoLabel(
          input.actionType,
          input.competitorSide ?? null,
          input.actionValue ?? null,
          input.athleteName || (input.competitorSide === 'b' ? 'Lado B' : 'Lado A'),
        ),
      })
    }
    if (input.actionType === 'undo') setUndoable(null)
    if (input.actionType === 'finish') setFinishOpen(false)
  }, [busy, data.event.id, handleConflict, locked, session])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!session || locked || busy || !scoringAllowed(session.status)) return
      if (event.target instanceof HTMLElement) {
        const tag = event.target.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || event.target.isContentEditable) return
      }
      const map: Record<string, { side: LiveSide; value: number }> = {
        '1': { side: 'a', value: 2 },
        '2': { side: 'a', value: 3 },
        '3': { side: 'a', value: 4 },
        '8': { side: 'b', value: 2 },
        '9': { side: 'b', value: 3 },
        '0': { side: 'b', value: 4 },
      }
      const hit = map[event.key]
      if (!hit) return
      event.preventDefault()
      const athleteName = hit.side === 'a' ? (current?.sideA?.name || 'Lado A') : (current?.sideB?.name || 'Lado B')
      void runAction({
        actionType: 'score',
        competitorSide: hit.side,
        actionValue: hit.value,
        athleteName,
      })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [busy, current, locked, runAction, session])

  if (!areaId || !area) {
    return (
      <div className="flex min-h-screen items-center bg-[#071B2E] px-4 py-8 text-white">
        <AreaPicker areas={data.areas} onSelect={selectArea} />
      </div>
    )
  }

  const lifecycleButtons: Array<{ type: LiveEventType; label: string }> = [
    { type: 'call', label: 'Chamar' },
    { type: 'on_mat', label: 'No tatame' },
    { type: 'start', label: 'Iniciar' },
    { type: 'pause', label: 'Pausar' },
    { type: 'resume', label: 'Retomar' },
    { type: 'finish', label: 'Encerrar' },
  ]

  const controlsDisabled = busy || locked || !session

  return (
    <div className="min-h-screen bg-[#071B2E] text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#071B2E]/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-blue-300">
              Área {area.number} · {area.name}
            </p>
            <h1 className="truncate font-mc-display text-lg font-bold sm:text-xl">{data.event.name}</h1>
          </div>
          <SyncBadge state={sync} />
          <time className="hidden text-sm tabular-nums text-slate-300 sm:inline" dateTime={new Date(nowMs).toISOString()}>
            {new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(nowMs)}
          </time>
          <Link
            href={`/admin/eventos/${data.event.id}/programacao`}
            className="inline-flex min-h-11 items-center rounded-full border border-white/25 px-4 text-sm font-semibold hover:border-mc-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
          >
            Sair da operação
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-5 lg:px-6 lg:py-5">
        <section className="space-y-4">
          {message ? (
            <div role="status" className="rounded-2xl bg-mc-warning/15 px-4 py-3 text-sm font-medium text-amber-100 ring-1 ring-mc-warning/40">
              {message}
            </div>
          ) : null}

          {current ? (
            <div className="rounded-3xl bg-black/25 p-4 ring-1 ring-white/10 sm:p-5">
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-slate-400">
                Luta #{current.fightNumber} · {current.round === 'final' ? 'Final' : 'Semifinal'} · {current.category}
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <p className="truncate font-mc-display text-xl font-bold uppercase sm:text-2xl">{current.sideA?.name || 'A definir'}</p>
                <p className="truncate font-mc-display text-xl font-bold uppercase sm:text-2xl sm:text-right">{current.sideB?.name || 'A definir'}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl bg-black/25 p-6 ring-1 ring-white/10">
              <p className="font-mc-display text-xl font-bold">Nenhuma luta nesta área</p>
            </div>
          )}

          {session ? (
            <>
              <OperatorClock
                nowMs={nowMs}
                projection={{
                  status: session.status,
                  durationSeconds: session.durationSeconds,
                  startedAt: session.startedAt,
                  pausedAt: session.pausedAt,
                  finishedAt: session.finishedAt,
                  accumulatedPauseMs: session.accumulatedPauseMs,
                }}
              />
              <Scoreboard session={session} sideA={current?.sideA || null} sideB={current?.sideB || null} flash={flash} />
            </>
          ) : current ? (
            <div className="rounded-3xl bg-black/25 p-6 text-center ring-1 ring-white/10">
              <p className="text-slate-300">Abra a sessão ao vivo para operar o placar.</p>
              <button
                type="button"
                disabled={busy || locked}
                onClick={() => void runCreate()}
                className="mt-4 inline-flex min-h-12 min-w-[12rem] items-center justify-center rounded-2xl bg-mc-action px-5 font-bold text-white disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Abrir luta
              </button>
            </div>
          ) : null}

          {session ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                {(['a', 'b'] as const).map((side) => {
                  const athlete = side === 'a' ? current?.sideA : current?.sideB
                  const name = athlete?.name || (side === 'a' ? 'Lado A' : 'Lado B')
                  const enabled = Boolean(session && scoringAllowed(session.status) && !controlsDisabled)
                  return (
                    <div key={side} className="rounded-3xl bg-black/25 p-3 ring-1 ring-white/10">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">{name}</p>
                      <div className="grid grid-cols-3 gap-2">
                        {[2, 3, 4].map((value) => (
                          <button
                            key={value}
                            type="button"
                            disabled={!enabled}
                            aria-label={`Somar ${value} pontos para ${name}`}
                            onClick={() => void runAction({ actionType: 'score', competitorSide: side, actionValue: value, athleteName: name })}
                            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-mc-action text-lg font-bold disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                          >
                            +{value}
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          disabled={!enabled}
                          aria-label={`Vantagem para ${name}`}
                          onClick={() => void runAction({ actionType: 'advantage', competitorSide: side, athleteName: name })}
                          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white/10 text-sm font-bold disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
                        >
                          Vantagem
                        </button>
                        <button
                          type="button"
                          disabled={!enabled}
                          aria-label={`Penalidade para ${name}`}
                          onClick={() => void runAction({ actionType: 'penalty', competitorSide: side, athleteName: name })}
                          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white/10 text-sm font-bold disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
                        >
                          Penalidade
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="flex flex-wrap gap-2">
                {lifecycleButtons.map((item) => {
                  const allowed = canApplyLiveEvent(session.status, item.type)
                  if (!allowed) return null
                  if (item.type === 'finish') {
                    return (
                      <button
                        key={item.type}
                        type="button"
                        disabled={controlsDisabled}
                        onClick={() => setFinishOpen(true)}
                        className="inline-flex min-h-12 min-w-[7.5rem] items-center justify-center rounded-xl bg-mc-error px-4 font-bold disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                      >
                        {item.label}
                      </button>
                    )
                  }
                  return (
                    <button
                      key={item.type}
                      type="button"
                      disabled={controlsDisabled}
                      onClick={() => void runAction({ actionType: item.type })}
                      className="inline-flex min-h-12 min-w-[7.5rem] items-center justify-center rounded-xl bg-white/10 px-4 font-bold disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
                    >
                      {item.label}
                    </button>
                  )
                })}
              </div>

              {undoable && canApplyLiveEvent(session.status, 'undo') ? (
                <button
                  type="button"
                  disabled={controlsDisabled}
                  onClick={() => void runAction({ actionType: 'undo', targetEventId: undoable.eventId })}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-white/25 px-4 font-semibold disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus sm:w-auto"
                  aria-label={`Desfazer ${undoable.label}`}
                >
                  Desfazer: {undoable.label}
                </button>
              ) : null}

              {session.status === 'finished' ? (
                <div className="rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
                  <p className="font-semibold">Luta encerrada</p>
                  {data.canConfirm ? (
                    <button
                      type="button"
                      disabled={controlsDisabled || !canApplyLiveEvent(session.status, 'confirm')}
                      onClick={() => void runAction({ actionType: 'confirm' })}
                      className="mt-3 inline-flex min-h-12 items-center justify-center rounded-xl bg-mc-success px-5 font-bold text-white disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      Confirmar resultado
                    </button>
                  ) : (
                    <p className="mt-2 text-sm text-slate-300">Aguardando confirmação da organização.</p>
                  )}
                </div>
              ) : null}

              {session.status === 'confirmed' ? (
                <p className="rounded-2xl bg-mc-success/15 px-4 py-3 text-sm font-semibold text-green-100 ring-1 ring-mc-success/30">
                  Resultado confirmado. Esta luta está terminal no domínio LIVE.
                </p>
              ) : null}
            </div>
          ) : null}
        </section>

        <MatchQueue items={queue} currentMatchId={current?.matchId || null} onSelect={selectMatch} />
      </main>

      {session && finishOpen ? (
        <FinishDialog
          key={`${session.id}:${session.version}`}
          open={finishOpen}
          session={session}
          sideA={current?.sideA || null}
          sideB={current?.sideB || null}
          busy={busy}
          onCancel={() => setFinishOpen(false)}
          onConfirm={(winnerSide, resultType) => {
            void runAction({ actionType: 'finish', winnerSide, resultType })
          }}
        />
      ) : null}
    </div>
  )
}
