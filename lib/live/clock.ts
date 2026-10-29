import type { LiveStatus } from './lifecycle'

export type LiveClockProjection = {
  status: LiveStatus
  durationSeconds: number
  startedAt: string | null
  pausedAt: string | null
  finishedAt?: string | null
  accumulatedPauseMs: number
}

/** Tempo restante em ms a partir da projeção persistida. Fontes oficiais são timestamps do servidor. */
export function remainingMatchMs(projection: LiveClockProjection, nowMs = Date.now()): number {
  const durationMs = projection.durationSeconds * 1000
  if (!projection.startedAt || projection.status === 'scheduled' || projection.status === 'called' || projection.status === 'on_mat') {
    return durationMs
  }

  const startedAt = Date.parse(projection.startedAt)
  if (!Number.isFinite(startedAt)) throw new Error('started_at inválido.')

  let referenceNow = nowMs
  if ((projection.status === 'finished' || projection.status === 'confirmed') && projection.finishedAt) {
    const finishedAt = Date.parse(projection.finishedAt)
    if (!Number.isFinite(finishedAt)) throw new Error('finished_at inválido.')
    referenceNow = finishedAt
  }

  let pausedMs = projection.accumulatedPauseMs
  if (projection.status === 'paused' && projection.pausedAt) {
    const pausedAt = Date.parse(projection.pausedAt)
    if (!Number.isFinite(pausedAt)) throw new Error('paused_at inválido.')
    pausedMs += Math.max(0, referenceNow - pausedAt)
  }

  const elapsed = Math.max(0, referenceNow - startedAt - pausedMs)
  return Math.max(0, durationMs - elapsed)
}

export function formatMatchClock(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
