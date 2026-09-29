'use client'

import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import EventFilters from '@/components/EventFilters'
import EditorialEventCard from '@/components/EditorialEventCard'
import { filterEvents, type Event } from '@/components/ModernEventGrid'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageContainer } from '@/components/ui/PageContainer'

export default function HomeClient({ events }: { events: Event[] }) {
  const [filters, setFilters] = useState({ eventType: 'Todos', sport: 'Todas', state: 'Todos', search: '', period: 'todos', startDate: '', endDate: '' })
  const filteredEvents = filterEvents(events, filters)
  const [featuredEvent, ...upcomingEvents] = filteredEvents

  return (
    <>
      <section id="eventos" className="scroll-mt-20 bg-mc-background pb-mc-64 pt-28 sm:pt-32" aria-labelledby="events-title">
        <PageContainer>
          <div className="max-w-3xl">
            <p className="font-mc-interface text-sm font-semibold uppercase tracking-[0.16em] text-mc-action">
              Calendário MEU CAMP
            </p>
            <h1 id="events-title" className="mt-mc-8 font-mc-display text-3xl font-semibold leading-tight text-mc-text-primary sm:text-mc-h1">
              Encontre seu próximo campeonato.
            </h1>
            <p className="mt-mc-12 font-mc-interface text-mc-body text-mc-text-secondary">
              Pesquise competições publicadas por nome, estado ou data.
            </p>
          </div>

          <div className="mt-mc-32">
            {events.length ? <EventFilters onFilterChange={setFilters} /> : null}

            {featuredEvent ? (
              <div className="mt-mc-48">
                <section aria-labelledby="featured-events-title">
                  <h2 id="featured-events-title" className="font-mc-display text-mc-h2 font-bold uppercase tracking-[-0.02em] text-mc-text-primary">
                    Eventos em destaque
                  </h2>
                  <div className="mt-mc-24">
                    <EditorialEventCard event={featuredEvent} featured />
                  </div>
                </section>

                {upcomingEvents.length ? (
                  <section className="mt-mc-64" aria-labelledby="upcoming-events-title">
                    <h2 id="upcoming-events-title" className="font-mc-display text-mc-h2 font-bold uppercase tracking-[-0.02em] text-mc-text-primary">
                      Próximos campeonatos
                    </h2>
                    <div className="mt-mc-24 grid gap-mc-32 sm:grid-cols-2 lg:grid-cols-3">
                      {upcomingEvents.map((event) => <EditorialEventCard key={event.id} event={event} />)}
                    </div>
                  </section>
                ) : null}
              </div>
            ) : (
              <EmptyState
                icon={<CalendarDays size={32} />}
                title={events.length ? 'Nenhum evento encontrado' : 'Nenhuma competição publicada'}
                description={events.length
                  ? 'Nenhum evento corresponde aos filtros. Limpe a busca ou o período para ver o calendário completo.'
                  : 'Os próximos campeonatos aparecerão aqui assim que forem publicados.'}
                className="mt-mc-32 rounded-mc-small border border-mc-border bg-mc-surface"
              />
            )}
          </div>
        </PageContainer>
      </section>

      <section className="border-y border-mc-border bg-mc-surface-secondary py-mc-48 sm:py-mc-64" aria-labelledby="platform-title">
        <PageContainer className="grid gap-mc-32 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-mc-64">
          <div>
            <p className="font-mc-interface text-sm font-semibold uppercase tracking-[0.16em] text-mc-action">
              MEU CAMP
            </p>
            <h2 id="platform-title" className="mt-mc-8 font-mc-display text-3xl font-semibold leading-tight text-mc-text-primary sm:text-mc-h1">
              A competição conecta todo mundo.
            </h2>
          </div>
          <div className="divide-y divide-mc-border border-y border-mc-border">
            <div className="grid gap-mc-8 py-mc-24 sm:grid-cols-[9rem_1fr] sm:gap-mc-24">
              <h3 className="font-mc-interface font-semibold text-mc-text-primary">Atletas</h3>
              <p className="font-mc-interface leading-6 text-mc-text-secondary">Encontram eventos, realizam inscrições e acompanham sua participação.</p>
            </div>
            <div className="grid gap-mc-8 py-mc-24 sm:grid-cols-[9rem_1fr] sm:gap-mc-24">
              <h3 className="font-mc-interface font-semibold text-mc-text-primary">Professores</h3>
              <p className="font-mc-interface leading-6 text-mc-text-secondary">Gerenciam a equipe, inscrevem atletas e acompanham a checagem pública.</p>
            </div>
            <div className="grid gap-mc-8 py-mc-24 sm:grid-cols-[9rem_1fr] sm:gap-mc-24">
              <h3 className="font-mc-interface font-semibold text-mc-text-primary">Responsáveis</h3>
              <p className="font-mc-interface leading-6 text-mc-text-secondary">Cuidam do cadastro e das inscrições dos atletas sob sua responsabilidade.</p>
            </div>
            <div className="grid gap-mc-8 py-mc-24 sm:grid-cols-[9rem_1fr] sm:gap-mc-24">
              <h3 className="font-mc-interface font-semibold text-mc-text-primary">Organizadores</h3>
              <p className="font-mc-interface leading-6 text-mc-text-secondary">Conduzem eventos, inscrições, chaves e pagamentos em uma única plataforma.</p>
            </div>
          </div>
        </PageContainer>
      </section>
    </>
  )
}
