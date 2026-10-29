'use client'

import { formatMatchClock, remainingMatchMs, type LiveClockProjection } from '@/lib/live/clock'
import type { LiveStatus } from '@/lib/live/lifecycle'

const STATE_LABEL: Record<string, string> = {
  scheduled: 'Pronta',
  called: 'Chamada',
  on_mat: 'No tatame',
  running: 'Em andamento',
  paused: 'Pausada',
  finished: 'Encerrada',
  confirmed: 'Confirmada',
}

function visualState(status: LiveStatus): 'ready' | 'running' | 'paused' | 'finished' {
  if (status === 'running') return 'running'
  if (status === 'paused') return 'paused'
  if (status === 'finished' || status === 'confirmed') return 'finished'
  return 'ready'
}

const RING: Record<string, string> = {
  ready: 'ring-white/20 text-white',
  running: 'ring-mc-success/50 text-white',
  paused: 'ring-mc-warning/60 text-amber-100',
  finished: 'ring-mc-action/40 text-slate-100',
}

export function OperatorClock({
  projection,
  nowMs,
}: {
  projection: LiveClockProjection
  nowMs: number
}) {
  const remaining = remainingMatchMs(projection, nowMs)
  const state = visualState(projection.status)
  return (
    <div className={`mx-auto flex w-full max-w-md flex-col items-center rounded-[2rem] bg-black/35 px-6 py-5 ring-2 ${RING[state]}`}>
      <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-slate-300">
        {STATE_LABEL[projection.status] || projection.status}
      </p>
      <p
        className="mt-1 font-mc-display text-6xl font-bold tabular-nums leading-none tracking-tight motion-reduce:transition-none sm:text-7xl lg:text-8xl"
        aria-live={projection.status === 'running' ? 'off' : 'polite'}
        aria-label={`Tempo restante ${formatMatchClock(remaining)}`}
      >
        {formatMatchClock(remaining)}
      </p>
    </div>
  )
}
