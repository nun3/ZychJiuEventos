/**
 * Agrupamento do calendário por mês (puro, testável sem DOM).
 * A entrada já vem ordenada (futuros crescentes, passados decrescentes); a ordem é preservada.
 */

export const NO_DATE_KEY = 'sem-data'

export interface MonthGroup<T> {
  /** "AAAA-MM" ou NO_DATE_KEY. */
  key: string
  events: T[]
}

export function groupByMonth<T extends { dateObj?: string }>(events: T[]): MonthGroup<T>[] {
  const groups: MonthGroup<T>[] = []
  for (const event of events) {
    const key = event.dateObj && /^\d{4}-\d{2}/.test(event.dateObj) ? event.dateObj.slice(0, 7) : NO_DATE_KEY
    const last = groups[groups.length - 1]
    if (last && last.key === key) last.events.push(event)
    else groups.push({ key, events: [event] })
  }
  return groups
}

export function monthLabel(key: string) {
  if (key === NO_DATE_KEY) return 'Data a definir'
  const [year, month] = key.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, 15, 12)))
}
