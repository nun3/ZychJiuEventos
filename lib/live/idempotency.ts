import type { LiveEventType } from './lifecycle'

export type LiveIdempotencyCommand = {
  type: LiveEventType
  competitorSide: 'a' | 'b' | null
  value: number | null
  targetEventId: string | null
}

/** Mesma key só é replay válido quando o comando fingerprint bate. */
export function isIdenticalLiveCommand(existing: LiveIdempotencyCommand, incoming: LiveIdempotencyCommand): boolean {
  return existing.type === incoming.type
    && existing.competitorSide === incoming.competitorSide
    && existing.value === incoming.value
    && existing.targetEventId === incoming.targetEventId
}

/** Key estável por gesto físico (8–128 chars, exigência do domínio). */
export function createLiveIdempotencyKey(prefix = 'live'): string {
  const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  const key = `${prefix}-${id}`
  return key.length > 128 ? key.slice(0, 128) : key
}
