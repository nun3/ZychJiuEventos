'use client'

import Image from 'next/image'
import { ArrowRight, Calendar, MapPin, Trophy } from 'lucide-react'

interface EventCardProps {
  event: {
    id: string
    title: string
    type: string
    date: string
    dateFull: string
    location: string
    daysLeft: number
    image?: string
  }
  onClick: () => void
}

export default function NetflixEventCard({ event, onClick }: EventCardProps) {
  return (
    <article className="h-full overflow-hidden rounded-mc-large border border-mc-border bg-mc-surface shadow-mc-subtle transition-shadow duration-mc-normal hover:shadow-mc-elevated">
      <button
        type="button"
        onClick={onClick}
        className="group flex h-full w-full flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mc-focus"
        aria-label={`Ver detalhes de ${event.title}`}
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-mc-structure">
          {event.image ? (
            <Image
              src={event.image}
              alt=""
              fill
              className="object-cover transition-transform duration-mc-slow group-hover:scale-[1.02]"
              sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-blue-200" aria-hidden="true">
              <Trophy size={44} strokeWidth={1.5} />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-mc-24">
          <p className="font-mc-interface text-xs font-semibold uppercase tracking-[0.12em] text-mc-action">{event.type}</p>
          <h3 className="mt-mc-8 font-mc-display text-xl font-semibold leading-7 text-mc-text-primary transition-colors duration-mc-normal group-hover:text-mc-action">
            {event.title}
          </h3>

          <dl className="mt-mc-24 space-y-mc-12 border-t border-mc-border pt-mc-16 font-mc-interface text-sm text-mc-text-secondary">
            <div className="flex items-start gap-mc-8">
              <Calendar aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-mc-action" />
              <div>
                <dt className="sr-only">Data</dt>
                <dd>{event.date} <span className="text-mc-text-secondary/70">· {event.dateFull}</span></dd>
              </div>
            </div>
            <div className="flex items-start gap-mc-8">
              <MapPin aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-mc-action" />
              <div>
                <dt className="sr-only">Local</dt>
                <dd>{event.location}</dd>
              </div>
            </div>
          </dl>

          <span className="mt-mc-24 inline-flex items-center gap-mc-8 font-mc-interface text-sm font-semibold text-mc-action">
            Ver detalhes
            <ArrowRight aria-hidden="true" size={17} className="transition-transform duration-mc-normal group-hover:translate-x-0.5" />
          </span>
        </div>
      </button>
    </article>
  )
}
