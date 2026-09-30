'use client'

import { useState, type KeyboardEvent, type TouchEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, CalendarDays, MapPin } from 'lucide-react'
import type { Event } from './ModernEventGrid'

const statusLabels: Record<string, string> = {
  publicado: 'Evento publicado',
  inscricao: 'Inscrições abertas',
  pagamento: 'Pagamento',
  checagem: 'Checagem',
  chaves: 'Chaves publicadas',
  em_andamento: 'Em andamento',
  concluido: 'Evento concluído',
}

function eventDate(value?: string) {
  if (!value) return ''
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${value}T12:00:00Z`))
    .replace('.', '')
    .toUpperCase()
    .replace(/\sDE\s/g, ' ')
}

export default function HomeHighlightsCarousel({ events }: { events: Event[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const activeEvent = events[activeIndex]
  const hasNavigation = events.length > 1

  const select = (index: number) => setActiveIndex((index + events.length) % events.length)
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!hasNavigation) return
    if (event.key === 'ArrowLeft') { event.preventDefault(); select(activeIndex - 1) }
    if (event.key === 'ArrowRight') { event.preventDefault(); select(activeIndex + 1) }
    if (event.key === 'Home') { event.preventDefault(); select(0) }
    if (event.key === 'End') { event.preventDefault(); select(events.length - 1) }
  }
  const handleTouchEnd = (event: TouchEvent<HTMLElement>) => {
    if (touchStart === null || !hasNavigation) return
    const distance = event.changedTouches[0].clientX - touchStart
    if (Math.abs(distance) >= 48) select(distance > 0 ? activeIndex - 1 : activeIndex + 1)
    setTouchStart(null)
  }

  if (!activeEvent) {
    return (
      <section className="bg-mc-structure pt-20 text-white" aria-label="Destaques">
        <div className="mx-auto max-w-7xl px-4 py-mc-24 font-mc-interface text-sm text-slate-200 sm:px-6 lg:px-8">
          Nenhum campeonato em destaque no momento.
        </div>
      </section>
    )
  }

  return (
    <section
      className="bg-mc-structure pt-20 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mc-focus"
      aria-roledescription="carrossel"
      aria-label="Destaques da plataforma"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onTouchStart={(event) => setTouchStart(event.touches[0].clientX)}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative min-h-[430px] overflow-hidden sm:min-h-[500px] lg:min-h-[540px]">
        <Image
          key={activeEvent.id}
          src={activeEvent.image!}
          alt={`Banner do evento ${activeEvent.title}`}
          fill
          priority={activeIndex === 0}
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-mc-structure via-mc-structure/75 to-mc-structure/15" aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-t from-mc-structure/80 via-transparent to-mc-structure/10" aria-hidden="true" />

        <div className="relative mx-auto flex min-h-[430px] max-w-7xl items-end px-4 pb-32 pt-mc-48 sm:min-h-[500px] sm:px-6 sm:pb-36 lg:min-h-[540px] lg:items-center lg:px-8 lg:pb-32">
          <div className="max-w-2xl" role="group" aria-roledescription="slide" aria-label={`${activeIndex + 1} de ${events.length}`}>
            <p className="font-mc-interface text-xs font-bold uppercase tracking-[0.18em] text-blue-200">
              {statusLabels[activeEvent.status || ''] || 'Campeonato'}
            </p>
            <h2 className="mt-mc-12 line-clamp-3 font-mc-display text-3xl font-bold uppercase leading-tight text-white sm:text-4xl lg:text-mc-display">
              {activeEvent.title}
            </h2>
            <div className="mt-mc-16 flex flex-col gap-mc-8 font-mc-interface text-sm font-medium text-slate-100 sm:flex-row sm:flex-wrap sm:gap-x-mc-24">
              <span className="inline-flex items-center gap-mc-8"><CalendarDays aria-hidden="true" size={18} />{eventDate(activeEvent.dateObj)}</span>
              <span className="inline-flex items-start gap-mc-8"><MapPin aria-hidden="true" size={18} className="mt-0.5 shrink-0" />{activeEvent.location}</span>
            </div>
            <Link
              href={`/eventos/${activeEvent.id}`}
              className="mt-mc-24 inline-flex min-h-11 items-center gap-mc-8 rounded-mc-small bg-mc-action px-mc-16 font-mc-interface text-sm font-bold uppercase tracking-[0.08em] text-white transition-colors duration-mc-normal hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-mc-structure"
            >
              Ver evento <ArrowRight aria-hidden="true" size={17} />
            </Link>
          </div>
        </div>

        {hasNavigation ? (
          <div className="absolute inset-x-0 bottom-0 bg-mc-structure/90 backdrop-blur-sm">
            <div className="mx-auto flex max-w-7xl items-center gap-mc-12 px-4 py-mc-12 sm:px-6 lg:px-8">
              <button type="button" onClick={() => select(activeIndex - 1)} className="hidden min-h-11 min-w-11 items-center justify-center text-white hover:text-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus sm:inline-flex" aria-label="Destaque anterior">
                <ArrowLeft aria-hidden="true" size={20} />
              </button>
              <div className="flex flex-1 snap-x gap-mc-8 overflow-x-auto" role="tablist" aria-label="Selecionar destaque">
                {events.map((event, index) => (
                  <button
                    key={event.id}
                    type="button"
                    role="tab"
                    aria-selected={index === activeIndex}
                    aria-label={`Mostrar ${event.title}`}
                    onClick={() => select(index)}
                    className={`relative h-16 w-28 shrink-0 snap-start overflow-hidden border-2 transition-colors duration-mc-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus ${index === activeIndex ? 'border-mc-action' : 'border-white/25 hover:border-white/60'}`}
                  >
                    <Image src={event.image!} alt="" fill sizes="112px" className="object-cover" />
                    <span className="absolute inset-0 bg-mc-structure/20" aria-hidden="true" />
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => select(activeIndex + 1)} className="hidden min-h-11 min-w-11 items-center justify-center text-white hover:text-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus sm:inline-flex" aria-label="Próximo destaque">
                <ArrowRight aria-hidden="true" size={20} />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
