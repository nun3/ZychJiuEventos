'use client'

import { CalendarDays } from 'lucide-react'
import NetflixEventCard from './NetflixEventCard'
import { EmptyState } from '@/components/ui/EmptyState'

export interface Event {
  id: string
  title: string
  type: string
  date: string
  dateFull: string
  location: string
  daysLeft: number
  image?: string
  description?: string
  eventType?: string
  sport?: string
  state?: string
  dateObj?: string
}

interface FilterState { eventType: string; sport: string; state: string; search: string; period: string; startDate: string; endDate: string }

export function filterEvents(events: Event[], filters: FilterState): Event[] {
  return events.filter((event) => {
    if (filters.eventType !== 'Todos' && event.eventType !== filters.eventType) return false
    if (filters.sport !== 'Todas' && event.sport !== filters.sport) return false
    if (filters.state !== 'Todos' && event.state !== filters.state) return false
    if (filters.search && !event.title.toLowerCase().includes(filters.search.toLowerCase())) return false
    const eventDate = event.dateObj ? new Date(`${event.dateObj}T12:00:00`) : null
    if (filters.startDate && eventDate && eventDate < new Date(`${filters.startDate}T00:00:00`)) return false
    if (filters.endDate && eventDate && eventDate > new Date(`${filters.endDate}T23:59:59`)) return false
    if (filters.period !== 'todos' && eventDate) {
      const today = new Date()
      if (filters.period === 'este-mes' && (eventDate.getMonth() !== today.getMonth() || eventDate.getFullYear() !== today.getFullYear())) return false
      if (filters.period === 'proximo-mes') {
        const next = new Date(today.getFullYear(), today.getMonth() + 1, 1)
        if (eventDate.getMonth() !== next.getMonth() || eventDate.getFullYear() !== next.getFullYear()) return false
      }
      if (filters.period === 'este-ano' && eventDate.getFullYear() !== today.getFullYear()) return false
      if (filters.period === 'proximo-ano' && eventDate.getFullYear() !== today.getFullYear() + 1) return false
    }
    return true
  })
}

export default function ModernEventGrid({ events, filters, onEventClick }: { events: Event[]; filters?: FilterState; onEventClick?: (event: Event) => void }) {
  const filtered = filters ? filterEvents(events, filters) : events
  return (
    <section className="mt-mc-32" aria-live="polite">
      {filtered.length ? (
        <div className="grid gap-mc-24 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((event) => (
            <NetflixEventCard key={event.id} event={event} onClick={() => onEventClick?.(event)} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<CalendarDays size={32} />}
          title="Nenhum evento encontrado"
          description="Tente remover alguns filtros para consultar todas as competições publicadas."
          className="rounded-mc-large border border-mc-border bg-mc-surface-secondary"
        />
      )}
    </section>
  )
}
