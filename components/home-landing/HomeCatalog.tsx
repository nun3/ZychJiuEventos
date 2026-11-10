'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CalendarDays, CalendarRange, Search, SlidersHorizontal, Trophy } from 'lucide-react'
import { states } from '@/components/EventFilters'
import { filterEvents, type Event } from '@/components/ModernEventGrid'
import { GlassSelect } from '@/components/ui/GlassSelect'
import {
  catalogStatusLabel,
  countdownLabel,
  eventDateParts,
  isPastCatalogEvent,
  rowActions,
} from '@/lib/events/catalog-presentation'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { groupByMonth, monthLabel } from '@/lib/home/catalog-groups'

/** Quantas linhas aparecem por vez. O resto entra com "Mostrar mais" (evita uma lista de centenas de linhas). */
export const CATALOG_PAGE_SIZE = 8

type Tab = 'proximos' | 'passados'

const periodOptions = [
  { value: 'todos', label: 'Qualquer data' },
  { value: 'este-mes', label: 'Este mês' },
  { value: 'proximo-mes', label: 'Próximo mês' },
  { value: 'este-ano', label: 'Este ano' },
  { value: 'proximo-ano', label: 'Próximo ano' },
]

const fieldBase =
  'mc-glass-field h-12 rounded-xl font-mc-interface text-sm text-white transition-[background-color,border-color,box-shadow] duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:border-blue-300/80 focus-visible:shadow-[0_0_0_3px_rgba(37,99,235,0.28)]'

function emptyCopy(total: number, tab: Tab, filtered: boolean) {
  if (!total) return { title: 'Nenhum campeonato publicado', description: 'Os próximos campeonatos aparecerão aqui assim que forem publicados.' }
  if (filtered) return { title: 'Nenhum campeonato encontrado', description: 'Nenhum campeonato corresponde a esta aba e aos filtros. Limpe a busca ou troque a aba.' }
  return tab === 'passados'
    ? { title: 'Nenhum campeonato encerrado', description: 'Os campeonatos já realizados aparecem nesta aba.' }
    : { title: 'Nenhum campeonato futuro', description: 'Os próximos campeonatos aparecem nesta aba.' }
}

/**
 * Calendário da Home em vidro: abas, filtros (busca, estado, período, intervalo), meses agrupados
 * e carregamento em lotes. Reaproveita filterEvents e as regras de apresentação do catálogo oficial.
 */
export function HomeCatalog({ events, initialSearch = '' }: { events: Event[]; initialSearch?: string }) {
  const [tab, setTab] = useState<Tab>('proximos')
  const [search, setSearch] = useState(initialSearch)
  const [state, setState] = useState('Todos')
  const [period, setPeriod] = useState('todos')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [toolsOpen, setToolsOpen] = useState(false)
  const [rangeOpen, setRangeOpen] = useState(false)
  const wide = useMediaQuery('(min-width: 768px)')
  const rangeRef = useRef<HTMLDivElement>(null)
  const focusRow = useRef<number | null>(null)

  const filtered = useMemo(
    () => filterEvents(events, { eventType: 'Todos', sport: 'Todas', state, search, period, startDate, endDate }),
    [events, state, search, period, startDate, endDate],
  )
  const upcoming = useMemo(
    () => filtered.filter((event) => !isPastCatalogEvent(event.dateObj)).sort((a, b) => (a.dateObj || '9999-12-31').localeCompare(b.dateObj || '9999-12-31')),
    [filtered],
  )
  const past = useMemo(
    () => filtered.filter((event) => isPastCatalogEvent(event.dateObj)).sort((a, b) => (b.dateObj || '').localeCompare(a.dateObj || '')),
    [filtered],
  )
  const visible = tab === 'proximos' ? upcoming : past

  // O lote volta a 8 sempre que aba ou filtros mudam.
  const signature = [tab, search, state, period, startDate, endDate].join('|')
  const [pageState, setPageState] = useState({ signature, shown: CATALOG_PAGE_SIZE })
  const shown = pageState.signature === signature ? pageState.shown : CATALOG_PAGE_SIZE
  const slice = useMemo(() => visible.slice(0, shown), [visible, shown])
  const remaining = visible.length - slice.length
  const groups = useMemo(() => groupByMonth(slice), [slice])
  const monthTotals = useMemo(() => new Map(groupByMonth(visible).map((group) => [group.key, group.events.length])), [visible])

  const activeFilters = Number(state !== 'Todos') + Number(period !== 'todos') + Number(Boolean(startDate || endDate))
  const hasFilter = Boolean(search || activeFilters)

  const loadMore = () => {
    focusRow.current = slice.length
    setPageState({ signature, shown: shown + CATALOG_PAGE_SIZE })
  }

  // Depois de "Mostrar mais", o foco vai para a primeira linha nova (teclado e leitor de tela não perdem o lugar).
  useEffect(() => {
    if (focusRow.current === null) return
    document.getElementById(`home-catalog-row-${focusRow.current}`)?.focus()
    focusRow.current = null
  }, [shown])

  // Painel de intervalo: fecha com clique fora e Esc.
  useEffect(() => {
    if (!rangeOpen) return
    const onPointer = (event: PointerEvent) => { if (!rangeRef.current?.contains(event.target as Node)) setRangeOpen(false) }
    const onKey = (event: globalThis.KeyboardEvent) => { if (event.key === 'Escape') setRangeOpen(false) }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('pointerdown', onPointer); document.removeEventListener('keydown', onKey) }
  }, [rangeOpen])

  const clearAll = useCallback(() => {
    setSearch(''); setState('Todos'); setPeriod('todos'); setStartDate(''); setEndDate('')
  }, [])

  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const next: Tab = tab === 'proximos' ? 'passados' : 'proximos'
    setTab(next)
    document.getElementById(`home-tab-${next}`)?.focus()
  }

  const copy = emptyCopy(events.length, tab, hasFilter)
  const rangeLabel = startDate || endDate ? `${shortDate(startDate) || '…'} – ${shortDate(endDate) || '…'}` : 'Intervalo'

  return (
    <section id="calendario" aria-labelledby="home-calendar-title" data-no-scroll-choreography className="relative scroll-mt-16 bg-[linear-gradient(to_bottom,rgba(4,8,18,0),rgba(4,8,18,0.8)_160px,rgba(4,8,18,0.88))] pb-16 pt-20 text-white">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-8 lg:px-12 xl:px-20">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="font-mc-interface text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">Calendário oficial MEU CAMP</p>
            <h2 id="home-calendar-title" className="mt-3 font-mc-display text-[clamp(2.25rem,4vw,3.5rem)] font-bold uppercase leading-[0.92] tracking-[-0.03em]">
              Encontre seu próximo campeonato
            </h2>
          </div>
          <div role="tablist" aria-label="Quando o campeonato acontece" className="flex w-full border-b border-white/15 lg:w-auto lg:gap-8">
            {([
              ['proximos', 'Próximos campeonatos', upcoming.length],
              ['passados', 'Eventos passados', past.length],
            ] as const).map(([key, label, total]) => (
              <button
                key={key}
                id={`home-tab-${key}`}
                type="button"
                role="tab"
                aria-selected={tab === key}
                tabIndex={tab === key ? 0 : -1}
                onClick={() => setTab(key)}
                onKeyDown={onTabKey}
                className={`relative min-h-12 flex-1 pb-3 text-center font-mc-interface text-[11px] font-bold uppercase tracking-[0.1em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 sm:text-xs lg:flex-none lg:tracking-[0.12em] ${tab === key ? 'text-white' : 'text-white/50 hover:text-white/80'}`}
              >
                {label}
                <span className="ml-2 font-semibold tabular-nums">({total})</span>
                {tab === key ? <span aria-hidden="true" className="absolute inset-x-0 -bottom-px h-0.5 bg-mc-action" /> : null}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 max-w-3xl font-mc-interface text-sm leading-6 text-white/70">Pesquise campeonatos publicados por nome, cidade ou data.</p>

        {events.length ? (
          <div role="search" aria-label="Filtros de campeonatos" className="relative z-[5] mt-8 grid grid-cols-[minmax(0,1fr)_auto] gap-2.5 rounded-2xl border border-white/10 bg-white/[0.04] p-2.5 backdrop-blur-md md:grid-cols-[minmax(0,1fr)_14rem_12.5rem_auto] md:gap-3 md:p-3">
            <label className={`${fieldBase} flex items-center gap-2.5 px-3.5 focus-within:border-blue-300/80 focus-within:shadow-[0_0_0_3px_rgba(37,99,235,0.28)]`}>
              <Search aria-hidden="true" size={18} className="shrink-0 opacity-70" />
              <input
                id="home-event-search"
                type="search"
                aria-label="Nome do campeonato"
                autoComplete="off"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={wide ? 'Buscar campeonato, cidade ou local…' : 'Buscar evento'}
                className="h-full min-w-0 flex-1 bg-transparent text-sm text-white caret-blue-300 outline-none placeholder:text-white/45"
              />
            </label>

            <button
              type="button"
              aria-expanded={toolsOpen}
              aria-controls="home-event-tools"
              onClick={() => setToolsOpen((open) => !open)}
              className={`${fieldBase} inline-flex items-center gap-2 px-4 font-semibold md:hidden ${toolsOpen ? 'border-blue-300/80 bg-white/10' : ''}`}
            >
              <SlidersHorizontal aria-hidden="true" size={18} className="opacity-80" />
              Filtros
              {activeFilters ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-mc-action px-1.5 text-[11px] font-bold">{activeFilters}</span> : null}
            </button>

            <div id="home-event-tools" className={`${toolsOpen ? 'grid' : 'hidden'} col-span-2 grid-cols-2 gap-2.5 md:contents`}>
              <GlassSelect
                label="Estado"
                value={state}
                onChange={setState}
                onOpen={() => setRangeOpen(false)}
                options={states}
              />
              <GlassSelect
                label="Período"
                value={period}
                onChange={setPeriod}
                onOpen={() => setRangeOpen(false)}
                options={periodOptions}
              />
              <div ref={rangeRef} className="relative col-span-2 md:col-span-1">
                <button
                  type="button"
                  aria-haspopup="dialog"
                  aria-expanded={rangeOpen}
                  aria-controls="home-event-range"
                  onClick={() => setRangeOpen((open) => !open)}
                  className={`${fieldBase} inline-flex w-full items-center justify-center gap-2 whitespace-nowrap px-4 font-semibold ${rangeOpen || startDate || endDate ? 'border-blue-300/60 bg-white/10' : ''}`}
                >
                  <CalendarRange aria-hidden="true" size={18} className="opacity-80" />
                  <span>{rangeLabel}</span>
                </button>
                <div
                  id="home-event-range"
                  role="dialog"
                  aria-label="Intervalo de datas"
                  hidden={!rangeOpen}
                  className="mc-glass-pop absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 rounded-2xl p-3.5 md:left-auto md:w-72"
                >
                  <label className="mb-3 block font-mc-interface text-[11px] font-semibold uppercase tracking-[0.12em] text-white/55">
                    De
                    <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={`${fieldBase} mt-1.5 block h-11 w-full px-3`} />
                  </label>
                  <label className="mb-3 block font-mc-interface text-[11px] font-semibold uppercase tracking-[0.12em] text-white/55">
                    Até
                    <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className={`${fieldBase} mt-1.5 block h-11 w-full px-3`} />
                  </label>
                  <button
                    type="button"
                    onClick={() => { setStartDate(''); setEndDate('') }}
                    className="h-10 w-full rounded-lg border border-white/15 font-mc-interface text-xs font-semibold uppercase tracking-[0.1em] text-white/70 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                  >
                    Limpar intervalo
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div role="tabpanel" aria-labelledby={`home-tab-${tab}`} className="mt-2">
          {visible.length ? (
            <>
              {groups.map((group) => (
                <div key={group.key}>
                  <h3 className="sticky top-16 z-[4] mt-5 flex items-baseline justify-between gap-3 border-b border-white/20 bg-[rgba(6,10,22,0.74)] py-3 font-mc-interface text-[11px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-md first:mt-3 sm:text-xs">
                    {monthLabel(group.key)}
                    <span className="font-semibold tabular-nums text-white/55">
                      {monthTotals.get(group.key)} {monthTotals.get(group.key) === 1 ? 'campeonato' : 'campeonatos'}
                    </span>
                  </h3>
                  {group.events.map((event) => (
                    <CatalogRow key={event.id} event={event} index={slice.indexOf(event)} />
                  ))}
                </div>
              ))}
              {visible.length > CATALOG_PAGE_SIZE ? (
                <div className="mt-9 flex flex-col items-center gap-3.5">
                  <p aria-live="polite" className="font-mc-interface text-[13px] tabular-nums text-white/55">
                    Mostrando {slice.length} de {visible.length} campeonatos
                  </p>
                  {remaining > 0 ? (
                    <button
                      type="button"
                      onClick={loadMore}
                      className="min-h-12 rounded-full border border-white/20 bg-white/[0.07] px-7 font-mc-interface text-xs font-bold uppercase tracking-[0.14em] text-white backdrop-blur-md transition-colors hover:border-white/40 hover:bg-white/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                    >
                      Mostrar mais {Math.min(CATALOG_PAGE_SIZE, remaining)}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : (
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-12 text-center">
              <CalendarDays aria-hidden="true" size={32} className="mx-auto mb-3 text-white/45" />
              <h3 className="font-mc-display text-lg font-bold">{copy.title}</h3>
              <p className="mt-2 font-mc-interface text-sm text-white/70">{copy.description}</p>
              {hasFilter ? (
                <button
                  type="button"
                  onClick={clearAll}
                  className="mt-5 min-h-11 rounded-full border border-white/20 px-5 font-mc-interface text-xs font-bold uppercase tracking-[0.12em] text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
                >
                  Limpar filtros
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function shortDate(value: string) {
  return value ? value.split('-').reverse().slice(0, 2).join('/') : ''
}

function CatalogRow({ event, index }: { event: Event; index: number }) {
  const date = eventDateParts(event.dateObj)
  const actions = rowActions(event).filter((action) => !action.href.startsWith('#'))
  const [primary, secondary] = actions

  return (
    <article
      id={`home-catalog-row-${index}`}
      tabIndex={-1}
      className="grid grid-cols-[88px_minmax(0,1fr)] items-start gap-x-3.5 gap-y-1.5 border-b border-white/[0.12] py-[18px] outline-none [content-visibility:auto] [contain-intrinsic-size:auto_144px] [grid-template-areas:'thumb_date''thumb_info''act_act'] focus-visible:ring-2 focus-visible:ring-blue-300/70 md:grid-cols-[11rem_9rem_minmax(0,1fr)_11rem] md:items-center md:gap-6 md:py-6 md:[grid-template-areas:none]"
    >
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 [grid-area:date] md:block md:border-l-4 md:border-mc-action md:pl-3 md:[grid-area:auto]">
        <p className="flex items-baseline gap-2">
          <span className="font-mc-display text-2xl font-bold leading-none tracking-[-0.04em] tabular-nums md:text-4xl">{date?.day || '—'}</span>
          <span className="font-mc-display text-sm font-bold uppercase leading-none md:text-lg">{date?.month || event.date}</span>
        </p>
        <p className="font-mc-interface text-[10px] font-semibold uppercase leading-4 tracking-[0.08em] text-white/55 tabular-nums md:mt-2">
          {date ? `${date.year} · ` : null}
          {countdownLabel(event)}
        </p>
      </div>

      <div className="relative grid h-[88px] w-[88px] place-items-center overflow-hidden rounded-[10px] border border-white/10 bg-[linear-gradient(160deg,#103a5e,#0a2036)] [grid-area:thumb] md:h-24 md:w-36 md:[grid-area:auto]">
        {event.image ? (
          <Image src={event.image} alt="" fill sizes="144px" className="object-cover" />
        ) : (
          <Trophy aria-hidden="true" size={30} strokeWidth={1.4} className="text-blue-200" />
        )}
      </div>

      <div className="min-w-0 [grid-area:info] md:[grid-area:auto]">
        <p className="font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] text-blue-300">
          {catalogStatusLabel(event.status)}
          <span aria-hidden="true"> · </span>
          {event.sport || 'Jiu-Jitsu'}
        </p>
        <h4 className="mt-1 line-clamp-2 font-mc-display text-[17px] font-bold uppercase leading-tight tracking-[-0.02em] md:line-clamp-none md:text-2xl">{event.title}</h4>
        <p className="mt-1 line-clamp-2 font-mc-interface text-[13px] leading-snug text-white/70 md:mt-2 md:line-clamp-none md:text-sm">{event.location}</p>
        <p className="hidden font-mc-interface text-sm text-white/70 md:block">{date?.long || event.dateFull}</p>
      </div>

      <div className="mt-2 flex gap-2 [grid-area:act] md:mt-0 md:flex-col md:[grid-area:auto]">
        {primary ? (
          <Link href={primary.href} className="inline-flex min-h-[46px] flex-1 items-center justify-center whitespace-nowrap bg-white px-3.5 font-mc-interface text-[11px] font-bold uppercase tracking-[0.12em] text-mc-text-primary transition-colors hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060a16] md:min-h-11 md:flex-none">
            {primary.label}
          </Link>
        ) : null}
        {secondary ? (
          <Link href={secondary.href} className="inline-flex min-h-[46px] flex-1 items-center justify-center whitespace-nowrap border border-white/60 px-3.5 font-mc-interface text-[11px] font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060a16] md:min-h-11 md:flex-none">
            {secondary.label}
          </Link>
        ) : null}
      </div>
    </article>
  )
}
