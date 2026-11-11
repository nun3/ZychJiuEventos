import { RECOGNIZED_BELT_NAMES } from '../categorization'

export type BeltName = (typeof RECOGNIZED_BELT_NAMES)[number]
export type BeltInfo = { belt: BeltName; grau: number }

/** Sem atleta vinculado (responsável, professor) ou sem faixa reconhecida: faixa branca, sem graus. */
export const DEFAULT_BELT: BeltInfo = { belt: 'branca', grau: 0 }

export const MAX_GRAU = 4

export const BELT_COLORS: Record<BeltName, { fill: string; stroke: string }> = {
  branca: { fill: '#ffffff', stroke: '#94a3b8' },
  cinza: { fill: '#9ca3af', stroke: '#6b7280' },
  amarela: { fill: '#facc15', stroke: '#ca8a04' },
  laranja: { fill: '#fb923c', stroke: '#c2410c' },
  verde: { fill: '#22c55e', stroke: '#15803d' },
  azul: { fill: '#2563eb', stroke: '#1e3a8a' },
  roxa: { fill: '#7e22ce', stroke: '#4c1d95' },
  marrom: { fill: '#78350f', stroke: '#451a03' },
  preta: { fill: '#111827', stroke: '#000000' },
}

export function clampGrau(value: unknown): number {
  const n = Math.trunc(Number(value))
  return Number.isFinite(n) ? Math.min(MAX_GRAU, Math.max(0, n)) : 0
}

function parseBeltName(faixa: string | null | undefined): BeltName | null {
  const name = (faixa ?? '').trim().toLowerCase().replace(/^faixa\s+/, '').split(/\s+/)[0] as BeltName
  return RECOGNIZED_BELT_NAMES.includes(name) ? name : null
}

/** A faixa foi informada e é reconhecida (diferente de cair na faixa branca por padrão). */
export function isDeclaredBelt(faixa: string | null | undefined): boolean {
  return parseBeltName(faixa) !== null
}

export function normalizeBelt(faixa: string | null | undefined, grau?: unknown): BeltInfo {
  const name = parseBeltName(faixa)
  if (!name) return DEFAULT_BELT
  return { belt: name, grau: clampGrau(grau) }
}

export function beltLabel({ belt, grau }: BeltInfo) {
  const color = belt.charAt(0).toUpperCase() + belt.slice(1)
  return `Faixa ${color.toLowerCase()}${grau ? `, ${grau} ${grau === 1 ? 'grau' : 'graus'}` : ''}`
}

/** Cores do aro quando a faixa não foi informada: neutro, sem cortes (não se presume faixa nenhuma). */
export const NEUTRAL_RING = { fill: '#e2e8f0', stroke: '#cbd5e1' } as const

/** Espaçamento angular uniforme entre os traços de grau na tarja, em graus. */
export const RING_MARK_STEP = 11

/** Meia-abertura da tarja preta (segmento do aro à direita, centrado em 0° = 3 horas): cabe 4 traços com folga. */
export const TARJA_HALF_ANGLE = ((MAX_GRAU - 1) / 2) * RING_MARK_STEP + 8

/**
 * Ângulos (graus, 0 = 3 horas, sentido horário) dos traços brancos de grau sobre a tarja: um por grau, uniformemente
 * espaçados e simétricos em torno de 0. 0 graus → nenhum traço (a tarja aparece vazia).
 */
export function graduationMarkAngles(grau: number): number[] {
  const n = clampGrau(grau)
  return Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * RING_MARK_STEP)
}
