'use client'

import { useMemo, useState } from 'react'
import { CalendarDays } from 'lucide-react'
import EventFilters from '@/components/EventFilters'
import EditorialEventCard from '@/components/EditorialEventCard'
import HomeHighlightsCarousel from '@/components/HomeHighlightsCarousel'
import { filterEvents, type Event } from '@/components/ModernEventGrid'
import { EmptyState } from '@/components/ui/EmptyState'

export default function HomeClient({ events, highlights, initialSearch = '' }: { events: Event[]; highlights: Event[]; initialSearch?: string }) {
  const [filters, setFilters] = useState({ eventType: 'Todos', sport: 'Todas', state: 'Todos', search: initialSearch, period: 'todos', startDate: '', endDate: '' })
  const filteredEvents = useMemo(() => filterEvents(events, filters), [events, filters])

  return (
    <>
      <HomeHighlightsCarousel events={highlights} />
      <section id="eventos" className="scroll-mt-20 bg-mc-background py-mc-48 sm:py-mc-64" aria-labelledby="events-title">
        <div className="mx-auto w-full px-4 sm:px-8 lg:px-12 xl:px-20">
          <div className="max-w-3xl">
            <p className="font-mc-interface text-sm font-semibold uppercase tracking-[0.16em] text-mc-action">
              Calendário MEU CAMP
            </p>
            <h1 id="events-title" className="mt-mc-8 font-mc-display text-3xl font-semibold leading-tight text-mc-text-primary sm:text-mc-h1">
              Encontre seu próximo campeonato.
            </h1>
            <p className="mt-mc-12 font-mc-interface text-mc-body text-mc-text-secondary">
              Pesquise campeonatos publicados por nome, estado ou data.
            </p>
          </div>

          {events.length ? (
            <div className="mt-mc-32 border-b border-mc-border pb-mc-32">
              <EventFilters variant="toolbar" initialSearch={initialSearch} onFilterChange={setFilters} />
            </div>
          ) : null}

          {filteredEvents.length ? (
            <section className="mt-mc-32" aria-labelledby="upcoming-events-title">
              <div className="flex flex-wrap items-end justify-between gap-mc-12">
                <h2 id="upcoming-events-title" className="font-mc-display text-mc-h2 font-bold uppercase tracking-[-0.02em] text-mc-text-primary">
                  Próximos campeonatos
                </h2>
                <p className="font-mc-interface text-sm text-mc-text-secondary">
                  {filteredEvents.length} {filteredEvents.length === 1 ? 'campeonato' : 'campeonatos'}
                </p>
              </div>
              <div className="mt-mc-24 grid gap-mc-24 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredEvents.map((event) => <EditorialEventCard key={event.id} event={event} />)}
              </div>
            </section>
          ) : (
            <EmptyState
              icon={<CalendarDays size={32} />}
              title={events.length ? 'Nenhum campeonato encontrado' : 'Nenhum campeonato publicado'}
              description={events.length
                ? 'Nenhum campeonato corresponde aos filtros. Limpe a busca ou o período para ver o calendário completo.'
                : 'Os próximos campeonatos aparecerão aqui assim que forem publicados.'}
              className="mt-mc-32 rounded-mc-small border border-mc-border bg-mc-surface"
            />
          )}
        </div>
      </section>
    </>
  )
}
