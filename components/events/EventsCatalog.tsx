'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CalendarDays, Trophy } from 'lucide-react'
import EventFilters from '@/components/EventFilters'
import { filterEvents, type Event } from '@/components/ModernEventGrid'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  catalogStatusLabel,
  countdownLabel,
  eventDateParts,
  isPastCatalogEvent,
  rowActions,
} from '@/lib/events/catalog-presentation'

const solidAction = 'inline-flex min-h-11 w-full items-center justify-center bg-mc-text-primary px-5 text-center font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-colors duration-200 hover:bg-mc-structure focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus sm:w-auto md:w-full'
const lineAction = 'inline-flex min-h-11 w-full items-center justify-center border border-mc-text-primary bg-mc-surface px-5 text-center font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] text-mc-text-primary transition-colors duration-200 hover:bg-mc-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus sm:w-auto md:w-full'

export function EventsCatalog({
  events,
  initialSearch = '',
  preview = false,
}: {
  events: Event[]
  initialSearch?: string
  preview?: boolean
}) {
  const [tab, setTab] = useState<'proximos' | 'passados'>('proximos')
  const [filters, setFilters] = useState({
    eventType: 'Todos',
    sport: 'Todas',
    state: 'Todos',
    search: initialSearch,
    period: 'todos',
    startDate: '',
    endDate: '',
  })

  const filtered = useMemo(() => filterEvents(events, filters), [events, filters])
  const upcoming = useMemo(() => filtered.filter((event) => !isPastCatalogEvent(event.dateObj)), [filtered])
  const past = useMemo(() => filtered.filter((event) => isPastCatalogEvent(event.dateObj)), [filtered])
  const visible = tab === 'proximos' ? upcoming : past

  return (
    <section id="eventos" className="scroll-mt-20 bg-mc-surface py-12 sm:py-16" aria-labelledby="events-title">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-8 lg:px-12 xl:px-20">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="font-mc-interface text-[11px] font-semibold uppercase tracking-[0.18em] text-mc-text-secondary">
              {preview ? 'Calendário de demonstração' : 'Calendário oficial MEU CAMP'}
            </p>
            <h2 id="events-title" className="mt-3 font-mc-display text-[clamp(2.25rem,4vw,3.5rem)] font-bold uppercase leading-[0.9] tracking-[-0.03em] text-mc-text-primary">
              Encontre seu próximo campeonato
            </h2>
          </div>
          <div role="tablist" aria-label="Quando o campeonato acontece" className="flex gap-8 border-b border-mc-border">
            <TabButton
              selected={tab === 'proximos'}
              onSelect={() => setTab('proximos')}
              label="Próximos campeonatos"
              count={upcoming.length}
            />
            <TabButton
              selected={tab === 'passados'}
              onSelect={() => setTab('passados')}
              label="Eventos passados"
              count={past.length}
            />
          </div>
        </div>

        <p className="mt-6 max-w-3xl font-mc-interface text-sm leading-6 text-mc-text-secondary">
          {preview
            ? 'Os campeonatos abaixo são fictícios e servem só para ensaiar o calendário. Nenhum deles foi publicado.'
            : 'Pesquise campeonatos publicados por nome, cidade ou data.'}
        </p>

        {events.length ? (
          <div className="mt-8 bg-mc-surface-secondary p-3 sm:p-4">
            <EventFilters variant="toolbar" initialSearch={filters.search} onFilterChange={setFilters} />
          </div>
        ) : null}

        {visible.length ? (
          <div className="mt-2" role="tabpanel">
            {visible.map((event) => <EventCalendarRow key={event.id} event={event} />)}
          </div>
        ) : (
          <EmptyState
            icon={<CalendarDays size={32} />}
            title={emptyCopy(events.length, tab, filters).title}
            description={emptyCopy(events.length, tab, filters).description}
            className="mt-8 border border-mc-border bg-mc-surface"
          />
        )}
      </div>
    </section>
  )
}

function emptyCopy(
  total: number,
  tab: 'proximos' | 'passados',
  filters: { state: string; search: string; period: string; startDate: string; endDate: string },
) {
  if (!total) {
    return {
      title: 'Nenhum campeonato publicado',
      description: 'Os próximos campeonatos aparecerão aqui assim que forem publicados.',
    }
  }
  const filtered = Boolean(filters.search || filters.startDate || filters.endDate || filters.state !== 'Todos' || filters.period !== 'todos')
  if (filtered) {
    return {
      title: 'Nenhum campeonato encontrado',
      description: 'Nenhum campeonato corresponde a esta aba e aos filtros. Limpe a busca ou troque a aba.',
    }
  }
  return tab === 'passados'
    ? { title: 'Nenhum campeonato encerrado', description: 'Os campeonatos já realizados aparecem nesta aba.' }
    : { title: 'Nenhum campeonato futuro', description: 'Os próximos campeonatos aparecem nesta aba.' }
}

function TabButton({
  selected,
  onSelect,
  label,
  count,
}: {
  selected: boolean
  onSelect: () => void
  label: string
  count: number
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      onClick={onSelect}
      className={`relative min-h-12 pb-3 font-mc-interface text-xs font-bold uppercase tracking-[0.12em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus ${selected ? 'text-mc-text-primary' : 'text-mc-text-secondary hover:text-mc-text-primary'}`}
    >
      {label}
      <span className="ml-2 font-semibold">({count})</span>
      {selected ? <span aria-hidden="true" className="absolute inset-x-0 -bottom-px h-0.5 bg-mc-action" /> : null}
    </button>
  )
}

function EventCalendarRow({ event }: { event: Event }) {
  const date = eventDateParts(event.dateObj)
  const [primary, secondary] = rowActions(event)
  const sport = event.sport || 'Jiu-Jitsu'

  return (
    <article className="grid items-center gap-4 border-b border-mc-border py-6 md:grid-cols-[11rem_9.5rem_minmax(0,1fr)_11rem] md:gap-6">
      <div className="border-l-4 border-mc-action pl-3">
        <p className="flex items-baseline gap-2 text-mc-text-primary">
          <span className="font-mc-display text-4xl font-bold leading-none tracking-[-0.04em]">{date?.day || '—'}</span>
          <span className="font-mc-display text-lg font-bold uppercase leading-none">{date?.month || event.date}</span>
        </p>
        <p className="mt-2 font-mc-interface text-[10px] font-semibold uppercase leading-4 tracking-[0.08em] text-mc-text-secondary">
          {date ? `${date.year} · ` : null}
          {countdownLabel(event)}
        </p>
      </div>

      <div className="relative h-24 w-full overflow-hidden bg-mc-structure md:w-36">
        {event.image ? (
          <Image src={event.image} alt="" fill sizes="144px" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-blue-200" aria-hidden="true">
            <Trophy size={28} strokeWidth={1.4} />
          </div>
        )}
        <span className="absolute left-2 top-2 bg-white/95 px-1.5 py-0.5 font-mc-interface text-[10px] font-bold uppercase tracking-[0.08em] text-mc-text-primary">
          {sport}
        </span>
      </div>

      <div className="min-w-0">
        <p className="font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] text-mc-action">
          {catalogStatusLabel(event.status)}
        </p>
        <h3 className="mt-1 font-mc-display text-xl font-bold uppercase leading-tight tracking-[-0.02em] text-mc-text-primary sm:text-2xl">
          {event.title}
        </h3>
        <p className="mt-2 font-mc-interface text-sm text-mc-text-secondary">{event.location}</p>
        <p className="font-mc-interface text-sm text-mc-text-secondary">{date?.long || event.dateFull}</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row md:flex-col">
        <RowLink action={primary} className={solidAction} />
        <RowLink action={secondary} className={lineAction} />
      </div>
    </article>
  )
}

function RowLink({ action, className }: { action: { href: string; label: string }; className: string }) {
  if (action.href.startsWith('#')) {
    return <a href={action.href} className={className}>{action.label}</a>
  }
  return <Link href={action.href} className={className}>{action.label}</Link>
}
