export const FIGHT_DURATION_MIN_MINUTES = 0.5
export const FIGHT_DURATION_MAX_MINUTES = 20
export const FIGHT_DURATION_STEP_MINUTES = 0.5

export function isValidFightDurationMinutes(value: number): boolean {
  if (!Number.isFinite(value)) return false
  if (value < FIGHT_DURATION_MIN_MINUTES || value > FIGHT_DURATION_MAX_MINUTES) return false
  return Math.abs(value * 2 - Math.round(value * 2)) < 1e-8
}

export function normalizeFightDurationMinutes(value: number): number {
  return Math.round(value * 2) / 2
}

export function parseFightDurationInput(raw: string): { ok: true; value: number | null } | { ok: false } {
  const trimmed = raw.trim()
  if (!trimmed) return { ok: true, value: null }
  const value = Number(trimmed.replace(',', '.'))
  if (!isValidFightDurationMinutes(value)) return { ok: false }
  return { ok: true, value: normalizeFightDurationMinutes(value) }
}

export function parseFightDurationMinutes(value: unknown): number | null {
  if (value == null || value === '') return null
  const numeric = typeof value === 'number' ? value : typeof value === 'string' ? Number(value.replace(',', '.')) : NaN
  return Number.isFinite(numeric) ? numeric : null
}

export function formatFightDurationLabel(minutes: number | null | undefined, style: 'short' | 'long' = 'short'): string | null {
  const value = parseFightDurationMinutes(minutes)
  if (value == null) return null
  const amount = value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
  if (style === 'long') {
    return value === 1 ? `Tempo: ${amount} minuto` : `Tempo: ${amount} minutos`
  }
  return `${amount} min`
}
