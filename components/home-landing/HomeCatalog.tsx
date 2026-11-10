'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { CalendarDays, CalendarRange, LayoutGrid, List, Search, SlidersHorizontal, X } from 'lucide-react'
import { states } from '@/components/EventFilters'
import { filterEvents, type Event } from '@/components/ModernEventGrid'
import { GlassSelect } from '@/components/ui/GlassSelect'
import { CatalogCard, CatalogListRow } from './CatalogCard'
import {
  isPastCatalogEvent,
  STATUS_GROUP_LABELS,
  statusGroup,
  type StatusGroup,
} from '@/lib/events/catalog-presentation'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { groupByMonth, monthLabel } from '@/lib/home/catalog-groups'

/** Quantas linhas aparecem por vez. O resto entra com "Mostrar mais" (evita uma lista de centenas de linhas). */
export const CATALOG_PAGE_SIZE = 9

type Tab = 'proximos' | 'passados'

const periodOptions = [
  { value: 'todos', label: 'Qualquer data' },
  { value: 'este-mes', label: 'Este mês' },
  { value: 'proximo-mes', label: 'Próximo mês' },
  { value: 'este-ano', label: 'Este ano' },
  { value: 'proximo-ano', label: 'Próximo ano' },
]

const fieldBase =
  'h-12 rounded-xl border border-slate-300 bg-white font-mc-interface text-sm text-slate-900 transition-[background-color,border-color,box-shadow] duration-mc-fast hover:bg-slate-50 focus-visible:outline-none focus-visible:border-mc-action focus-visible:shadow-[0_0_0_3px_rgba(37,99,235,0.18)]'

type View = 'grade' | 'lista'
const VIEW_KEY = 'mc-home-catalog-view'
const STATUS_CHIPS: StatusGroup[] = ['abertas', 'breve', 'andamento']

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
  const [statusFilter, setStatusFilter] = useState<StatusGroup | null>(null)
  const [view, setView] = useState<View>('grade')
  const wide = useMediaQuery('(min-width: 768px)')
  const rangeRef = useRef<HTMLDivElement>(null)
  const focusRow = useRef<number | null>(null)

  // A escolha Grade/Lista é conveniência por pessoa: lida depois da hidratação, com falha silenciosa.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(VIEW_KEY)
      if (saved === 'grade' || saved === 'lista') setView(saved)
    } catch { /* storage indisponível */ }
  }, [])
  const chooseView = (next: View) => {
    setView(next)
    try { window.localStorage.setItem(VIEW_KEY, next) } catch { /* storage indisponível */ }
  }

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
  // Chips de status só valem para os próximos; as contagens refletem os demais filtros.
  const statusCounts = useMemo(() => {
    const counts: Record<StatusGroup, number> = { abertas: 0, breve: 0, andamento: 0 }
    for (const event of upcoming) { const group = statusGroup(event.status); if (group) counts[group] += 1 }
    return counts
  }, [upcoming])
  const activeStatus = tab === 'proximos' ? statusFilter : null
  const visible = tab === 'proximos'
    ? (activeStatus ? upcoming.filter((event) => statusGroup(event.status) === activeStatus) : upcoming)
    : past

  // O lote volta a 8 sempre que aba ou filtros mudam.
  const signature = [tab, search, state, period, startDate, endDate, activeStatus].join('|')
  const [pageState, setPageState] = useState({ signature, shown: CATALOG_PAGE_SIZE })
  const shown = pageState.signature === signature ? pageState.shown : CATALOG_PAGE_SIZE
  const slice = useMemo(() => visible.slice(0, shown), [visible, shown])
  const remaining = visible.length - slice.length
  const groups = useMemo(() => groupByMonth(slice), [slice])
  const monthTotals = useMemo(() => new Map(groupByMonth(visible).map((group) => [group.key, group.events.length])), [visible])

  const activeFilters = Number(state !== 'Todos') + Number(period !== 'todos') + Number(Boolean(startDate || endDate))
  const hasFilter = Boolean(search || activeFilters || activeStatus)

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
    setSearch(''); setState('Todos'); setPeriod('todos'); setStartDate(''); setEndDate(''); setStatusFilter(null)
  }, [])

  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const next: Tab = tab === 'proximos' ? 'passados' : 'proximos'
    setTab(next)
    document.getElementById(`home-tab-${next}`)?.focus()
  }

  const copy = emptyCopy(events.length, tab, hasFilter)
  const stateLabel = states.find((option) => option.value === state)?.label ?? state
  const periodLabel = periodOptions.find((option) => option.value === period)?.label ?? period
  const removable = [
    search ? { key: 'busca', label: `“${search}”`, clear: () => setSearch('') } : null,
    state !== 'Todos' ? { key: 'estado', label: stateLabel, clear: () => setState('Todos') } : null,
    period !== 'todos' ? { key: 'periodo', label: periodLabel, clear: () => setPeriod('todos') } : null,
    startDate || endDate ? { key: 'intervalo', label: `${shortDate(startDate) || '…'} – ${shortDate(endDate) || '…'}`, clear: () => { setStartDate(''); setEndDate('') } } : null,
    activeStatus ? { key: 'status', label: STATUS_GROUP_LABELS[activeStatus], clear: () => setStatusFilter(null) } : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item))
  const rangeLabel = startDate || endDate ? `${shortDate(startDate) || '…'} – ${shortDate(endDate) || '…'}` : 'Intervalo'

  const chipBase = 'inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 font-mc-interface text-xs font-bold transition-colors duration-mc-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2'

  return (
    <section id="calendario" aria-labelledby="home-calendar-title" data-no-scroll-choreography className="relative scroll-mt-16 border-t border-slate-200 bg-slate-50 pb-16 pt-16 text-mc-text-primary sm:pt-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-8 lg:px-12 xl:px-20">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="font-mc-interface text-[11px] font-semibold uppercase tracking-[0.18em] text-mc-action">Calendário oficial MEU CAMP</p>
            <h2 id="home-calendar-title" className="mt-3 font-mc-display text-[clamp(2rem,4vw,3.25rem)] font-bold uppercase leading-[0.95] tracking-[-0.03em]">
              Encontre seu próximo campeonato
            </h2>
            <p className="mt-3 font-mc-interface text-sm leading-6 text-mc-text-secondary">Pesquise por nome, cidade ou data e compare os campeonatos publicados.</p>
          </div>
          <div role="tablist" aria-label="Quando o campeonato acontece" className="flex w-full border-b border-slate-300 lg:w-auto lg:gap-8">
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
                className={`relative min-h-12 flex-1 pb-3 text-center font-mc-interface text-[11px] font-bold uppercase tracking-[0.1em] transition-colors duration-mc-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus sm:text-xs lg:flex-none lg:tracking-[0.12em] ${tab === key ? 'text-mc-text-primary' : 'text-mc-text-secondary hover:text-mc-text-primary'}`}
              >
                {label}
                <span className="ml-2 font-semibold tabular-nums">({total})</span>
                {tab === key ? <span aria-hidden="true" className="absolute inset-x-0 -bottom-px h-0.5 bg-mc-action" /> : null}
              </button>
            ))}
          </div>
        </div>

        {events.length ? (
          <div role="search" aria-label="Filtros de campeonatos" className="relative z-[5] mt-7 space-y-3">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2.5 md:grid-cols-[minmax(0,1fr)_14rem_12.5rem_auto] md:gap-3">
              <label className={`${fieldBase} flex items-center gap-2.5 px-3.5 focus-within:border-mc-action focus-within:shadow-[0_0_0_3px_rgba(37,99,235,0.18)]`}>
                <Search aria-hidden="true" size={18} className="shrink-0 text-slate-500" />
                <input
                  id="home-event-search"
                  type="search"
                  aria-label="Nome do campeonato"
                  autoComplete="off"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={wide ? 'Buscar campeonato, cidade ou local…' : 'Buscar evento'}
                  className="h-full min-w-0 flex-1 bg-transparent text-sm text-slate-900 caret-mc-action outline-none placeholder:text-slate-500"
                />
              </label>

              <button
                type="button"
                aria-expanded={toolsOpen}
                aria-controls="home-event-tools"
                onClick={() => setToolsOpen((open) => !open)}
                className={`${fieldBase} inline-flex items-center gap-2 px-4 font-semibold md:hidden ${toolsOpen ? 'border-mc-action' : ''}`}
              >
                <SlidersHorizontal aria-hidden="true" size={18} className="text-slate-600" />
                Filtros
                {activeFilters ? <span className="grid h-5 min-w-5 place-items-center rounded-full bg-mc-action px-1.5 text-[11px] font-bold text-white">{activeFilters}</span> : null}
              </button>

              <div id="home-event-tools" className={`${toolsOpen ? 'grid' : 'hidden'} col-span-2 grid-cols-2 gap-2.5 md:contents`}>
                <GlassSelect tone="light" label="Estado" value={state} onChange={setState} onOpen={() => setRangeOpen(false)} options={states} />
                <GlassSelect tone="light" label="Período" value={period} onChange={setPeriod} onOpen={() => setRangeOpen(false)} options={periodOptions} />
                <div ref={rangeRef} className="relative col-span-2 md:col-span-1">
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    aria-expanded={rangeOpen}
                    aria-controls="home-event-range"
                    onClick={() => setRangeOpen((open) => !open)}
                    className={`${fieldBase} inline-flex w-full items-center justify-center gap-2 whitespace-nowrap px-4 font-semibold ${rangeOpen || startDate || endDate ? 'border-mc-action' : ''}`}
                  >
                    <CalendarRange aria-hidden="true" size={18} className="text-slate-600" />
                    <span>{rangeLabel}</span>
                  </button>
                  <div
                    id="home-event-range"
                    role="dialog"
                    aria-label="Intervalo de datas"
                    hidden={!rangeOpen}
                    className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-mc-elevated md:left-auto md:w-72"
                  >
                    <label className="mb-3 block font-mc-interface text-[11px] font-semibold uppercase tracking-[0.12em] text-mc-text-secondary">
                      De
                      <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className={`${fieldBase} mt-1.5 block h-11 w-full px-3`} />
                    </label>
                    <label className="mb-3 block font-mc-interface text-[11px] font-semibold uppercase tracking-[0.12em] text-mc-text-secondary">
                      Até
                      <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className={`${fieldBase} mt-1.5 block h-11 w-full px-3`} />
                    </label>
                    <button
                      type="button"
                      onClick={() => { setStartDate(''); setEndDate('') }}
                      className="h-10 w-full rounded-lg border border-slate-300 font-mc-interface text-xs font-semibold uppercase tracking-[0.1em] text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
                    >
                      Limpar intervalo
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              {tab === 'proximos' ? (
                <div role="group" aria-label="Filtrar por situação" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 [scrollbar-width:none]">
                  <button type="button" aria-pressed={!activeStatus} onClick={() => setStatusFilter(null)} className={`${chipBase} ${!activeStatus ? 'border-mc-structure bg-mc-structure text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}>
                    Todos <span className="tabular-nums opacity-70">{upcoming.length}</span>
                  </button>
                  {STATUS_CHIPS.map((group) => (
                    <button
                      key={group}
                      type="button"
                      aria-pressed={activeStatus === group}
                      disabled={!statusCounts[group] && activeStatus !== group}
                      onClick={() => setStatusFilter(activeStatus === group ? null : group)}
                      className={`${chipBase} disabled:cursor-not-allowed disabled:opacity-45 ${activeStatus === group ? 'border-mc-structure bg-mc-structure text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`}
                    >
                      {STATUS_GROUP_LABELS[group]} <span className="tabular-nums opacity-70">{statusCounts[group]}</span>
                    </button>
                  ))}
                </div>
              ) : <span />}
              <div role="group" aria-label="Modo de exibição" className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5">
                {([['grade', 'Grade', LayoutGrid], ['lista', 'Lista', List]] as const).map(([key, label, Icon]) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={view === key}
                    onClick={() => chooseView(key)}
                    className={`inline-flex min-h-10 items-center gap-1.5 rounded-md px-3 font-mc-interface text-xs font-bold transition-colors duration-mc-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus ${view === key ? 'bg-mc-structure text-white' : 'text-slate-700 hover:bg-slate-100'}`}
                  >
                    <Icon aria-hidden="true" size={16} />{label}
                  </button>
                ))}
              </div>
            </div>

            {removable.length ? (
              <div className="flex flex-wrap items-center gap-2">
                {removable.map((item) => (
                  <button key={item.key} type="button" onClick={item.clear} aria-label={`Remover filtro ${item.label}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 pl-3 pr-2 font-mc-interface text-xs font-semibold text-blue-900 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus">
                    {item.label}<X aria-hidden="true" size={14} />
                  </button>
                ))}
                <button type="button" onClick={clearAll} className="min-h-9 px-2 font-mc-interface text-xs font-bold text-mc-action underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus">
                  Limpar filtros
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        <div role="tabpanel" aria-labelledby={`home-tab-${tab}`} className="mt-4">
          {visible.length ? (
            <>
              <p aria-live="polite" className="font-mc-interface text-[13px] tabular-nums text-mc-text-secondary">
                {visible.length} {visible.length === 1 ? 'campeonato' : 'campeonatos'}{hasFilter ? ' com os filtros aplicados' : ''}
              </p>
              {groups.map((group) => (
                <div key={group.key}>
                  <h3 className="sticky top-16 z-[4] mt-4 flex items-baseline justify-between gap-3 border-b border-slate-300 bg-slate-50/95 py-3 font-mc-interface text-[11px] font-bold uppercase tracking-[0.16em] text-mc-text-primary backdrop-blur-sm sm:text-xs">
                    {monthLabel(group.key)}
                    <span className="font-semibold tabular-nums text-mc-text-secondary">
                      {monthTotals.get(group.key)} {monthTotals.get(group.key) === 1 ? 'campeonato' : 'campeonatos'}
                    </span>
                  </h3>
                  {view === 'grade' ? (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                      {group.events.map((event) => <CatalogCard key={event.id} event={event} index={slice.indexOf(event)} />)}
                    </div>
                  ) : (
                    <div>
                      {group.events.map((event) => <CatalogListRow key={event.id} event={event} index={slice.indexOf(event)} />)}
                    </div>
                  )}
                </div>
              ))}
              {visible.length > CATALOG_PAGE_SIZE ? (
                <div className="mt-9 flex flex-col items-center gap-3.5">
                  <p aria-live="polite" className="font-mc-interface text-[13px] tabular-nums text-mc-text-secondary">
                    Mostrando {slice.length} de {visible.length} campeonatos
                  </p>
                  {remaining > 0 ? (
                    <button
                      type="button"
                      onClick={loadMore}
                      className="min-h-12 rounded-full border border-slate-300 bg-white px-7 font-mc-interface text-xs font-bold uppercase tracking-[0.14em] text-mc-text-primary transition-colors duration-mc-fast hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2"
                    >
                      Mostrar mais {Math.min(CATALOG_PAGE_SIZE, remaining)}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </>
          ) : (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
              <CalendarDays aria-hidden="true" size={32} className="mx-auto mb-3 text-slate-400" />
              <h3 className="font-mc-display text-lg font-bold">{copy.title}</h3>
              <p className="mt-2 font-mc-interface text-sm text-mc-text-secondary">{copy.description}</p>
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
