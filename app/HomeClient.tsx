'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import ModernHero from '@/components/ModernHero'
import EventFilters from '@/components/EventFilters'
import ModernEventGrid, { Event } from '@/components/ModernEventGrid'
import { PageContainer } from '@/components/ui/PageContainer'

const EventModal = dynamic(() => import('@/components/EventModal'))

export default function HomeClient({ events }: { events: Event[] }) {
  const [filters, setFilters] = useState({ eventType: 'Todos', sport: 'Todas', state: 'Todos', search: '', period: 'todos', startDate: '', endDate: '' })
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  return (
    <>
      <ModernHero />

      <section id="eventos" className="scroll-mt-20 bg-mc-surface py-mc-48 sm:py-mc-64" aria-labelledby="events-title">
        <PageContainer>
          <div className="max-w-3xl">
            <p className="font-mc-interface text-sm font-semibold uppercase tracking-[0.16em] text-mc-action">
              Calendário de competições
            </p>
            <h2 id="events-title" className="mt-mc-8 font-mc-display text-3xl font-semibold leading-tight text-mc-text-primary sm:text-mc-h1">
              Eventos disponíveis
            </h2>
            <p className="mt-mc-12 font-mc-interface text-mc-body text-mc-text-secondary">
              Consulte as competições publicadas e encontre a próxima oportunidade de participar.
            </p>
          </div>

          <div className="mt-mc-32">
            <EventFilters onFilterChange={setFilters} />
            <ModernEventGrid events={events} filters={filters} onEventClick={setSelectedEvent} />
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

      {selectedEvent ? <EventModal event={selectedEvent} isOpen onClose={() => setSelectedEvent(null)} /> : null}
    </>
  )
}
