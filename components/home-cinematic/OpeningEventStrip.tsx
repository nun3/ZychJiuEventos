'use client'

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, MapPin, Search, Trophy, X } from 'lucide-react'
import { matchesEventQuery, type Event } from '@/components/ModernEventGrid'

const FALLBACK_IMAGES = [
  '/images/cinematic/karate-1.jpg',
  '/images/cinematic/mc-arena.jpg',
  '/images/cinematic/dojo-wide.jpg',
]
const AUTOPLAY_MS = 4500

function parseBadge(dateObj?: string) {
  if (!dateObj) return { month: 'DATA', day: '—' }
  const date = new Date(`${dateObj}T12:00:00Z`)
  const month = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' })
    .format(date)
    .replace('.', '')
    .toUpperCase()
  const day = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', timeZone: 'UTC' }).format(date)
  return { month, day }
}

export function HeroEventShowcase({
  events,
  preview = false,
  search = '',
  onSearchChange,
}: {
  events: Event[]
  preview?: boolean
  search?: string
  onSearchChange?: (value: string) => void
}) {
  const [localQuery, setLocalQuery] = useState(search)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    setLocalQuery(search)
  }, [search])

  const query = onSearchChange ? search : localQuery
  const matched = useMemo(() => events.filter((event) => matchesEventQuery(event, query)), [events, query])
  const count = matched.length
  const loop = count > 1

  // Com loop ativo, a trilha é [clone do último, ...matched, clone do primeiro] e começa na posição 1.
  const [trackPos, setTrackPos] = useState(loop ? 1 : 0)
  const [animate, setAnimate] = useState(true)
  const lockingRef = useRef(false)

  useEffect(() => {
    lockingRef.current = false
    setAnimate(false)
    setTrackPos(count > 1 ? 1 : 0)
  }, [count, query])

  useEffect(() => {
    if (animate) return
    const raf = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setAnimate(true))
    })
    return () => window.cancelAnimationFrame(raf)
  }, [animate])

  const slides = useMemo(() => {
    if (!loop) return matched
    return [matched[count - 1], ...matched, matched[0]]
  }, [matched, loop, count])

  const clampedPos = slides.length ? Math.min(Math.max(trackPos, 0), slides.length - 1) : 0
  const safeIndex = count
    ? loop
      ? (clampedPos - 1 + count) % count
      : 0
    : 0
  const current = matched[safeIndex]
  const badge = parseBadge(current?.dateObj)

  const updateQuery = (value: string) => {
    setLocalQuery(value)
    onSearchChange?.(value)
  }

  const step = (delta: number) => {
    if (!loop || lockingRef.current) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setAnimate(false)
      setTrackPos((pos) => ((pos - 1 + delta + count) % count) + 1)
      return
    }
    setAnimate(true)
    setTrackPos((pos) => {
      const next = pos + delta
      if (next === 0 || next === count + 1) lockingRef.current = true
      return next
    })
  }

  useEffect(() => {
    if (!loop || paused) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => {
      if (lockingRef.current) return
      setAnimate(true)
      setTrackPos((pos) => {
        const next = pos + 1
        if (next === count + 1) lockingRef.current = true
        return next
      })
    }, AUTOPLAY_MS)
    return () => window.clearInterval(timer)
  }, [loop, paused, count, clampedPos])

  const handleTransitionEnd = () => {
    if (!loop) return
    if (clampedPos === count + 1) {
      setAnimate(false)
      setTrackPos(1)
      lockingRef.current = false
    } else if (clampedPos === 0) {
      setAnimate(false)
      setTrackPos(count)
      lockingRef.current = false
    } else {
      lockingRef.current = false
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.target instanceof HTMLInputElement) return
    if (event.key === 'ArrowRight') { event.preventDefault(); step(1) }
    if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1) }
  }

  return (
    <div
      data-hero-showcase
      role="region"
      aria-roledescription="carrossel"
      aria-label="Próximos campeonatos"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false)
      }}
      className="relative isolate flex min-h-[21rem] w-full flex-col justify-between overflow-hidden rounded-mc-large border border-white/10 bg-mc-structure p-3.5 text-white shadow-mc-elevated will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:min-h-[26rem] sm:p-5 lg:h-[calc(100svh-7.5rem)] lg:max-h-[54rem]"
    >
      <div data-hero-showcase-img className="absolute inset-0 -z-10 overflow-hidden will-change-transform">
        {slides.length ? (
          <div
            data-showcase-track
            onTransitionEnd={handleTransitionEnd}
            style={{ transform: `translate3d(-${clampedPos * 100}%, 0, 0)` }}
            className={`flex h-full w-full ${animate ? 'transition-transform duration-700 ease-out motion-reduce:transition-none' : 'transition-none'}`}
          >
            {slides.map((event, index) => {
              const logicalIndex = loop ? (index - 1 + count) % count : index
              return (
                <div
                  key={`${event.id}-${index}`}
                  className="relative h-full w-full shrink-0"
                  aria-hidden={index !== clampedPos}
                >
                  <Image
                    src={event.image || FALLBACK_IMAGES[logicalIndex % FALLBACK_IMAGES.length]}
                    alt=""
                    fill
                    priority={logicalIndex === 0}
                    sizes="(min-width: 1024px) 52vw, 94vw"
                    className="object-cover"
                  />
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-white/30" aria-hidden="true">
            <Trophy size={64} strokeWidth={1.2} />
          </div>
        )}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-mc-nav-dark/55 via-transparent to-mc-nav-dark/85"
        />
      </div>

      {/* Barra de pesquisa glassmorphism integrada ao carrossel */}
      <div className="relative z-10 flex items-center justify-between gap-3">
        <form
          action="/eventos"
          method="get"
          className="flex min-h-11 w-full max-w-xs items-center gap-2.5 rounded-mc-full border border-white/20 bg-mc-nav-dark/45 px-4 text-sm text-white backdrop-blur-md transition-colors focus-within:border-white/60 focus-within:bg-mc-nav-dark/65"
        >
          <Search aria-hidden="true" size={15} className="shrink-0 text-white/70" />
          <label className="sr-only" htmlFor="home-event-search">Buscar eventos ou locais</label>
          <input
            id="home-event-search"
            type="search"
            name="q"
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder="Buscar eventos ou locais..."
            className="w-full bg-transparent font-mc-interface text-sm text-white placeholder:text-white/70 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query ? (
            <button
              type="button"
              aria-label="Limpar busca"
              onClick={() => updateQuery('')}
              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-mc-full text-white/80 hover:bg-white/15 hover:text-white"
            >
              <X aria-hidden="true" size={14} />
            </button>
          ) : null}
        </form>

        {loop ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              aria-label="Campeonato anterior"
              onClick={() => step(-1)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-mc-full border border-white/20 bg-mc-nav-dark/45 text-white backdrop-blur-md transition-colors hover:bg-mc-nav-dark/75"
            >
              <ChevronLeft aria-hidden="true" size={18} />
            </button>
            <button
              type="button"
              aria-label="Próximo campeonato"
              onClick={() => step(1)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-mc-full border border-white/20 bg-mc-nav-dark/45 text-white backdrop-blur-md transition-colors hover:bg-mc-nav-dark/75"
            >
              <ChevronRight aria-hidden="true" size={18} />
            </button>
          </div>
        ) : null}
      </div>

      {/* Card flutuante do evento ativo */}
      <div className="relative z-10" aria-live={paused ? 'polite' : 'off'}>
        {current ? (
          <div
            data-opening-card
            className="flex flex-wrap items-center justify-between gap-4 rounded-mc-large border border-white/15 bg-mc-nav-dark/85 p-3.5 backdrop-blur-md sm:flex-nowrap sm:p-4"
          >
            <div className="flex min-w-0 items-center gap-3.5">
              <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-mc-medium border border-white/15 bg-white/[0.07] leading-none">
                <span className="font-mc-interface text-[0.65rem] font-bold uppercase tracking-[0.14em] text-white/70">
                  {badge.month}
                </span>
                <span className="mt-1 font-mc-display text-xl font-bold text-white">{badge.day}</span>
              </div>
              <div className="min-w-0">
                <p className="font-mc-interface text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-blue-400">
                  Próximo evento
                  {loop ? ` · ${safeIndex + 1}/${count}` : ''}
                  {preview ? ' · demonstração' : ''}
                </p>
                <h2 className="mt-0.5 truncate font-mc-display text-base font-bold text-white sm:text-lg">
                  {current.title}
                </h2>
                <p className="mt-1 inline-flex items-center gap-1.5 truncate font-mc-interface text-xs text-white/75">
                  <MapPin aria-hidden="true" size={13} className="shrink-0 text-white/60" />
                  {current.location}
                </p>
              </div>
            </div>

            <Link
              href={current.href || `/eventos/${current.id}`}
              className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-mc-full bg-white px-4 font-mc-interface text-xs font-bold text-mc-text-primary transition-colors hover:bg-mc-surface-secondary"
            >
              Detalhes
              <ChevronRight aria-hidden="true" size={14} />
            </Link>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 rounded-mc-large border border-white/15 bg-mc-nav-dark/85 p-4 backdrop-blur-md">
            <p className="font-mc-interface text-sm text-white/85">
              {events.length
                ? `Nenhum evento encontrado para "${query}".`
                : 'Os próximos campeonatos aparecerão aqui quando forem publicados.'}
            </p>
            {query ? (
              <button
                type="button"
                onClick={() => updateQuery('')}
                className="inline-flex min-h-10 shrink-0 items-center rounded-mc-full bg-white px-4 font-mc-interface text-xs font-bold text-mc-text-primary"
              >
                Limpar
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
