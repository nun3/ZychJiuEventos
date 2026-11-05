'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CalendarDays, Clock3, CreditCard, MapPin, Plus, Trophy, UsersRound } from 'lucide-react'
import { DashboardPageHero } from '@/components/dashboard/DashboardPageHero'
import { EventProgress } from '@/components/onboarding/EventProgress'
import { Alert } from '@/components/ui/Alert'
import { PageContainer } from '@/components/ui/PageContainer'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  MobileRecord,
  MobileRecordActions,
  MobileRecordHeader,
  MobileRecordMeta,
  MobileRecordTitle,
} from '@/components/ui/MobileRecord'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { adminEventStatusLabel, adminEventStatusVariant, formatAdminEventDate } from '@/lib/events/admin-event-presentation'
import type { OrganizerChampionship, OrganizerEventRow } from '@/lib/onboarding/dashboard-facts'
import { adminEventContinuePath } from '@/lib/onboarding/event-guidance'
import { EventRowMenu } from './EventRowMenu'

const formatter = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' })

const metrics = [
  { key: 'total', label: 'Total', icon: CalendarDays, iconClass: 'bg-mc-action text-white' },
  { key: 'inscricao', label: 'Em inscrições', icon: UsersRound, iconClass: 'bg-mc-success text-white' },
  { key: 'pagamento', label: 'Em pagamento', icon: CreditCard, iconClass: 'bg-mc-info text-white' },
  { key: 'em_andamento', label: 'Em andamento', icon: Clock3, iconClass: 'bg-mc-warning text-white' },
  { key: 'concluido', label: 'Concluídos', icon: Trophy, iconClass: 'bg-mc-text-secondary text-white' },
] as const

function EventStatus({ status, onDark }: { status: string; onDark?: boolean }) {
  return (
    <StatusBadge onDark={onDark} variant={adminEventStatusVariant(status)}>
      {adminEventStatusLabel(status)}
    </StatusBadge>
  )
}

function ManageLink({ eventId, eventName, status }: { eventId: string; eventName: string; status: string }) {
  return (
    <Link
      href={adminEventContinuePath(eventId, status)}
      aria-label={`Gerenciar evento ${eventName}`}
      className="inline-flex min-h-12 flex-1 items-center justify-center gap-1.5 bg-mc-text-primary px-3 font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-colors duration-200 hover:bg-mc-structure focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
    >
      Gerenciar evento
      <ArrowRight aria-hidden="true" size={16} />
    </Link>
  )
}

export function EventsHub({
  cards,
  rows,
  error,
}: {
  cards: OrganizerChampionship[]
  rows: OrganizerEventRow[]
  error: boolean
}) {
  const [view, setView] = useState<'cards' | 'table'>('cards')
  const counts = {
    total: cards.length,
    inscricao: cards.filter((event) => event.status === 'inscricao').length,
    pagamento: cards.filter((event) => event.status === 'pagamento').length,
    em_andamento: cards.filter((event) => event.status === 'em_andamento').length,
    concluido: cards.filter((event) => event.status === 'concluido').length,
  }

  const columns: Array<DataTableColumn<OrganizerEventRow>> = [
    {
      key: 'event',
      header: 'Evento',
      render: (event) => (
        <div className="min-w-64">
          <p className="font-semibold text-mc-text-primary">{event.nome}</p>
          <p className="mt-mc-4 flex items-start gap-mc-8 text-mc-text-secondary">
            <MapPin aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
            {event.local}
          </p>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Data',
      render: (event) => (
        <div className="min-w-28">
          <p className="font-semibold">{formatter.format(new Date(`${event.data_evento}T12:00:00Z`))}</p>
          <p className="mt-mc-4 text-xs text-mc-text-secondary">{event.timezone}</p>
        </div>
      ),
    },
    { key: 'status', header: 'Fase', render: (event) => <EventStatus status={event.status} /> },
    {
      key: 'actions',
      header: 'Ações',
      render: (event) => (
        <div className="flex items-center justify-end gap-2">
          <ManageLink eventId={event.id} eventName={event.nome} status={event.status} />
          <EventRowMenu eventId={event.id} eventName={event.nome} status={event.status} />
        </div>
      ),
      className: 'w-56',
    },
  ]

  const heroImage = cards.find((event) => event.imagem_cartaz_url?.trim())?.imagem_cartaz_url

  return (
    <div className="py-5 sm:py-7">
      <PageContainer fluid className="space-y-5">
        <DashboardPageHero
          title="Eventos"
          description="Gerencie todos os seus campeonatos em um só lugar."
          imageSrc={heroImage}
          actions={(
            <Link
              href="/admin/eventos/novo"
              className="inline-flex min-h-12 items-center justify-center gap-2 bg-white px-4 font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] text-mc-text-primary transition-colors duration-200 hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Plus aria-hidden="true" size={18} />
              Novo evento
            </Link>
          )}
        />
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {metrics.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.key} className="flex min-h-20 items-center gap-3 border border-mc-border bg-mc-surface px-3 py-3 first:border-l-4 first:border-l-mc-action sm:px-4">
                <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center ${item.iconClass}`}>
                  <Icon aria-hidden="true" size={19} />
                </span>
                <div>
                  <dt className="font-mc-interface text-xs text-mc-text-secondary">{item.label}</dt>
                  <dd className="mt-0.5 font-mc-display text-xl font-semibold leading-6 text-mc-text-primary">{counts[item.key]}</dd>
                </div>
              </div>
            )
          })}
        </dl>

        {error ? <Alert variant="error" role="alert" className="mt-4">Não foi possível carregar os eventos.</Alert> : null}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border border-mc-border bg-mc-surface px-2">
          <div role="tablist" aria-label="Visões dos campeonatos" className="flex">
            <button
              type="button"
              role="tab"
              id="tab-meus-eventos"
              aria-selected={view === 'cards'}
              aria-controls="meus-eventos"
              onClick={() => setView('cards')}
              className={`group relative inline-flex h-12 items-center px-3 font-mc-interface text-[0.8125rem] font-bold uppercase tracking-[0.14em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mc-focus ${
                view === 'cards' ? 'text-mc-text-primary' : 'text-mc-text-secondary hover:text-mc-text-primary'
              }`}
            >
              Meus eventos
              <span aria-hidden="true" className={`pointer-events-none absolute bottom-0 left-1/2 h-0.5 w-9 -translate-x-1/2 bg-mc-action ${view === 'cards' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
            </button>
            <button
              type="button"
              role="tab"
              id="tab-todos-os-eventos"
              aria-selected={view === 'table'}
              aria-controls="todos-os-eventos"
              onClick={() => setView('table')}
              className={`group relative inline-flex h-12 items-center px-3 font-mc-interface text-[0.8125rem] font-bold uppercase tracking-[0.14em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mc-focus ${
                view === 'table' ? 'text-mc-text-primary' : 'text-mc-text-secondary hover:text-mc-text-primary'
              }`}
            >
              Todos os eventos
              <span aria-hidden="true" className={`pointer-events-none absolute bottom-0 left-1/2 h-0.5 w-9 -translate-x-1/2 bg-mc-action ${view === 'table' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setView('table')}
            className="inline-flex min-h-10 items-center px-2 font-mc-interface text-xs font-semibold text-mc-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
          >
            Ver todos
          </button>
        </div>

        {view === 'cards' ? (
          <section id="meus-eventos" role="tabpanel" aria-labelledby="tab-meus-eventos" className="mt-4">
            <h2 className="mb-3 font-mc-display text-lg text-mc-text-primary">Meus eventos</h2>
            {cards.length ? (
              <div className="grid items-stretch gap-5 sm:grid-cols-2 min-[1100px]:grid-cols-3 min-[1400px]:grid-cols-4">
              {cards.map((event) => {
                const dateLabel = formatAdminEventDate(event.data_evento)
                const poster = event.imagem_cartaz_url?.trim() || null
                return (
                  <article
                    key={event.id}
                    aria-label={event.nome}
                    className="flex h-full min-w-0 flex-col border border-mc-border bg-mc-surface transition-colors duration-200 hover:border-mc-text-primary"
                  >
                    <div className="relative h-32 overflow-hidden bg-mc-structure sm:h-36">
                      {poster ? (
                        <Image
                          src={poster}
                          alt=""
                          fill
                          sizes="(max-width: 639px) 100vw, (max-width: 1099px) 50vw, (max-width: 1399px) 33vw, 25vw"
                          quality={55}
                          className="object-cover object-center"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-white/80"><Trophy size={22} aria-hidden="true" /></div>
                      )}
                      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-mc-text-primary/60 to-transparent" />
                      <div className="absolute left-3 top-3 bg-mc-text-primary/55 px-2 py-1">
                        <EventStatus onDark status={event.status} />
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="line-clamp-2 min-h-12 font-mc-display text-lg font-semibold leading-6 text-mc-text-primary">{event.nome}</h3>
                      <p className="mt-1 min-h-11 space-y-1 font-mc-interface text-sm text-mc-text-secondary">
                        {dateLabel ? (
                          <span className="flex items-center gap-1.5">
                            <CalendarDays aria-hidden="true" size={14} />
                            {dateLabel}
                          </span>
                        ) : null}
                        {event.local ? (
                          <span className="flex items-start gap-1.5">
                            <MapPin aria-hidden="true" size={14} className="mt-0.5 shrink-0" />
                            {event.local}
                          </span>
                        ) : null}
                      </p>
                      <div className="mt-2 min-w-0 overflow-hidden">
                        <EventProgress variant="compact" steps={event.steps} label={`Fase de ${event.nome}`} />
                      </div>
                      <div className="mt-auto flex items-center gap-2 pt-3">
                        <ManageLink eventId={event.id} eventName={event.nome} status={event.status} />
                        <EventRowMenu eventId={event.id} eventName={event.nome} status={event.status} />
                      </div>
                    </div>
                  </article>
                )
              })}
              </div>
            ) : (
              <EmptyState
                title="Nenhum campeonato ainda"
                description="Sem evento não há fase para acompanhar. O próximo passo é criar o primeiro rascunho."
                action={<Link href="/admin/eventos/novo" className="font-mc-interface font-semibold text-mc-action hover:underline">Criar evento</Link>}
                className="mx-auto max-w-xl border border-mc-border bg-mc-surface"
              />
            )}
          </section>
        ) : (
          <section id="todos-os-eventos" role="tabpanel" aria-labelledby="tab-todos-os-eventos" className="mt-4">
            <h2 className="mb-3 font-mc-display text-xl text-mc-text-primary">Todos os eventos</h2>
            {rows.length ? (
              <>
              <DataTable
                rows={rows}
                columns={columns}
                getRowKey={(event) => event.id}
                caption="Todos os eventos da organização"
                className="hidden md:block"
                tableClassName="min-w-0"
              />
              <div className="space-y-3 md:hidden">
                {rows.map((event) => (
                  <MobileRecord key={event.id}>
                    <MobileRecordHeader>
                      <MobileRecordTitle className="text-lg leading-6">{event.nome}</MobileRecordTitle>
                      <EventStatus status={event.status} />
                    </MobileRecordHeader>
                    <MobileRecordMeta className="mt-3 space-y-2">
                      <p className="flex items-center gap-2">
                        <CalendarDays aria-hidden="true" size={16} className="text-mc-action" />
                        {formatter.format(new Date(`${event.data_evento}T12:00:00Z`))}
                      </p>
                      <p className="flex items-start gap-2">
                        <MapPin aria-hidden="true" size={16} className="mt-0.5 shrink-0 text-mc-action" />
                        {event.local}
                      </p>
                      <p className="text-xs text-mc-text-secondary">{event.timezone}</p>
                    </MobileRecordMeta>
                    <MobileRecordActions>
                      <div className="flex items-center justify-end gap-2">
                        <ManageLink eventId={event.id} eventName={event.nome} status={event.status} />
                        <EventRowMenu eventId={event.id} eventName={event.nome} status={event.status} />
                      </div>
                    </MobileRecordActions>
                  </MobileRecord>
                ))}
              </div>
              </>
            ) : (
              <EmptyState
                icon={<CalendarDays size={32} />}
                title="Nenhum evento cadastrado"
                description="A organização ainda não tem campeonato. O próximo passo é criar o primeiro rascunho."
                action={<Link href="/admin/eventos/novo" className="font-mc-interface font-semibold text-mc-action hover:underline">Criar evento</Link>}
                className="mx-auto max-w-xl rounded-mc-medium border border-mc-border bg-mc-surface shadow-mc-subtle"
              />
            )}
          </section>
        )}
      </PageContainer>
    </div>
  )
}
