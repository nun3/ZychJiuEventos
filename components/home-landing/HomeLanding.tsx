'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import type { Event } from '@/components/ModernEventGrid'
import { ParticleTitle } from './ParticleTitle'
import { PixelCard } from './PixelCard'

const FALLBACK_IMAGES = [
  '/images/cinematic/karate-1.jpg',
  '/images/cinematic/mc-arena.jpg',
  '/images/cinematic/dojo-wide.jpg',
]

const STATUS_LABEL: Record<string, string> = {
  publicado: 'Publicado',
  inscricao: 'Inscrições abertas',
  pagamento: 'Pagamento',
  checagem: 'Checagem',
  chaves: 'Chaves publicadas',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
}

function dateBadge(dateObj?: string) {
  if (!dateObj) return 'EM BREVE'
  const date = new Date(`${dateObj}T12:00:00Z`)
  const day = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', timeZone: 'UTC' }).format(date)
  const month = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' })
    .format(date)
    .replace('.', '')
    .toUpperCase()
  return `${day} ${month}`
}

export function HomeLanding({ events, preview = false }: { events: Event[]; preview?: boolean }) {
  const trackRef = useRef<HTMLUListElement>(null)
  const [edge, setEdge] = useState({ start: true, end: true })

  const measure = useCallback(() => {
    const el = trackRef.current
    if (!el) return
    setEdge({ start: el.scrollLeft <= 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 })
  }, [])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [measure, events.length])

  const scrollByCard = (direction: 1 | -1) => {
    const el = trackRef.current
    if (!el) return
    const first = el.querySelector('li')
    const card = first ? first.getBoundingClientRect().width + 24 : 360
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollBy({ left: direction * card, behavior: reduced ? 'auto' : 'smooth' })
  }

  return (
    <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center px-4 sm:px-6">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-1.5 shadow-sm">
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-white motion-safe:animate-ping" />
        <span className="font-mc-interface text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-white/90">MC Combate</span>
      </div>

      <h1 id="home-hero-title" className="mt-3 w-full max-w-4xl">
        <ParticleTitle text="MEU CAMP" className="h-[140px] w-full sm:h-[190px] md:h-[210px]">
          <span className="sr-only">MEU CAMP</span>
        </ParticleTitle>
      </h1>

      <p className="-mt-1 hidden items-center gap-2 font-mc-interface text-sm text-white/60 md:flex">
        Passe o mouse ou clique no título para interagir com as partículas
      </p>
      <p className="mt-3 max-w-2xl text-pretty text-center font-mc-interface text-lg text-white/80">
        A principal plataforma para organização e inscrições em eventos de lutas.
      </p>

      <section aria-labelledby="home-events-title" className="mt-8 w-full">
        <div className="mb-1 flex items-end justify-between gap-4">
          <h2 id="home-events-title" className="font-mc-display text-lg font-semibold tracking-[-0.01em] text-white/90">
            Próximos campeonatos{preview ? ' · demonstração' : ''}
          </h2>
          {events.length > 1 ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Campeonatos anteriores"
                disabled={edge.start}
                onClick={() => scrollByCard(-1)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-white transition-colors hover:border-white disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <ChevronLeft aria-hidden="true" size={20} />
              </button>
              <button
                type="button"
                aria-label="Próximos campeonatos"
                disabled={edge.end}
                onClick={() => scrollByCard(1)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-white transition-colors hover:border-white disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <ChevronRight aria-hidden="true" size={20} />
              </button>
            </div>
          ) : null}
        </div>

        {events.length ? (
          <ul
            ref={trackRef}
            onScroll={measure}
            className="-mx-1 flex snap-x snap-mandatory gap-6 overflow-x-auto px-1 py-3 [scrollbar-width:none] motion-safe:scroll-smooth [&::-webkit-scrollbar]:hidden"
          >
            {events.map((event, index) => {
              const status = STATUS_LABEL[event.status || ''] || 'Campeonato'
              const open = event.status === 'inscricao'
              return (
                <li key={event.id} className="w-[300px] flex-none snap-center sm:w-[340px] md:w-[350px]">
                  <PixelCard className="h-[400px]">
                    <div className="relative h-[190px] w-full shrink-0 overflow-hidden rounded-t-3xl bg-[#22222a]">
                      <Image
                        src={event.image || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]}
                        alt=""
                        fill
                        priority={index < 2}
                        sizes="(min-width: 768px) 350px, 300px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#0d0d10] via-transparent to-black/40" />
                      <span className="absolute left-3 top-3 max-w-[60%] truncate rounded-full border border-white/20 bg-black/85 px-3 py-1 font-mc-interface text-xs font-bold uppercase text-white backdrop-blur">
                        {event.sport || 'Combate'}
                      </span>
                      <span className="absolute right-3 top-3 rounded-full bg-white px-3 py-1 font-mc-interface text-xs font-black uppercase text-black shadow-md">
                        {dateBadge(event.dateObj)}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col justify-between rounded-b-3xl bg-[#141418]/90 p-6 backdrop-blur-sm">
                      <div>
                        <h3 className="line-clamp-2 font-mc-display text-xl font-bold leading-7 text-white">{event.title}</h3>
                        <p className="mt-2 flex items-start gap-1.5 font-mc-interface text-[0.8125rem] text-white/60">
                          <MapPin aria-hidden="true" size={15} className="mt-0.5 shrink-0 text-white" />
                          <span className="line-clamp-2">{event.location}</span>
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                        <div className="min-w-0">
                          <span className="block font-mc-interface text-[0.8125rem] text-white/50">Situação</span>
                          <span className="block truncate font-mc-display text-base font-bold text-white">{status}</span>
                        </div>
                        <Link
                          href={event.href || `/eventos/${event.id}`}
                          className="inline-flex min-h-11 shrink-0 items-center rounded-full bg-white px-5 font-mc-interface text-xs font-bold text-black transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#141418] after:absolute after:inset-0 after:z-[3] after:content-['']"
                        >
                          {open ? 'Inscrever' : 'Ver evento'}
                          <span className="sr-only">: {event.title}</span>
                        </Link>
                      </div>
                    </div>
                  </PixelCard>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center font-mc-interface text-sm text-white/75">
            Os próximos campeonatos aparecerão aqui quando forem publicados.
          </p>
        )}
      </section>
    </div>
  )
}
