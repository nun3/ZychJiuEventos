'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Event } from '@/components/ModernEventGrid'
import {
  catalogStatusLabel,
  countdownLabel,
  eventDateParts,
  featuredActions,
  isPreviewCatalogEvent,
} from '@/lib/events/catalog-presentation'

const COMPANIONS = [
  '/images/cinematic/bjj-2.jpg',
  '/images/cinematic/dojo-wide.jpg',
  '/images/cinematic/bjj-1.jpg',
]

const heroButton = 'inline-flex min-h-12 items-center justify-center bg-white px-6 font-mc-interface text-xs font-bold uppercase tracking-[0.14em] text-mc-text-primary transition-colors duration-200 hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-mc-nav-dark'

function stageImages(event: Event, index: number) {
  const primary = event.image?.trim() || COMPANIONS[index % COMPANIONS.length]
  const companion =
    COMPANIONS.find((src) => src !== primary) ||
    COMPANIONS[(index + 1) % COMPANIONS.length]
  return { primary, companion }
}

export function EventsFeaturedStage({ events }: { events: Event[] }) {
  const [index, setIndex] = useState(0)
  const count = events.length
  const safeIndex = count ? index % count : 0
  const event = events[safeIndex]

  if (!event) {
    return (
      <section className="flex min-h-[calc(100svh-4rem)] items-end bg-mc-nav-dark px-4 pb-16 pt-24 text-white sm:px-8 lg:px-12">
        <div className="max-w-3xl">
          <h1 className="font-mc-display text-4xl font-bold uppercase leading-[0.95] tracking-[-0.03em] sm:text-6xl">
            Encontre seu próximo campeonato
          </h1>
          <p className="mt-4 max-w-xl font-mc-interface text-base text-white/75">
            Os campeonatos publicados aparecem aqui. Enquanto isso, o fluxo pode ser ensaiado sem criar conta.
          </p>
          <a href="#experimentar-demo" className={`${heroButton} mt-8`}>
            Experimentar sem cadastro
          </a>
        </div>
      </section>
    )
  }

  const date = eventDateParts(event.dateObj)
  const [primary, secondary] = featuredActions(event)
  const preview = isPreviewCatalogEvent(event)
  const show = (next: number) => setIndex((next + count) % count)
  const { primary: stagePrimary, companion: stageCompanion } = stageImages(event, safeIndex)

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Campeonatos em destaque"
      className="relative flex min-h-[calc(100svh-4rem)] items-center overflow-hidden bg-mc-nav-dark text-white"
    >
      <div className="absolute inset-0 grid sm:grid-cols-2">
        <div className="relative min-h-full">
          <Image
            src={stagePrimary}
            alt=""
            fill
            priority
            sizes="(min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
        <div className="relative hidden sm:block" aria-hidden="true">
          <Image
            src={stageCompanion}
            alt=""
            fill
            sizes="50vw"
            className="object-cover"
          />
        </div>
      </div>
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(var(--mc-nav-dark)/0.82),rgb(var(--mc-nav-dark)/0.28)_68%)]" />

      {count > 1 ? (
        <>
          <button
            type="button"
            aria-label="Campeonato anterior"
            onClick={() => show(safeIndex - 1)}
            className="absolute left-3 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-mc-nav-dark/55 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-6"
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Próximo campeonato"
            onClick={() => show(safeIndex + 1)}
            className="absolute right-3 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center bg-mc-nav-dark/55 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-6"
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </>
      ) : null}

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-14 py-24 text-center sm:px-20">
        <p className="sr-only" aria-live="polite">
          Campeonato {safeIndex + 1} de {count}. {event.title}
        </p>
        <p className="inline-flex min-h-7 items-center rounded-full bg-mc-action px-3 font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em]">
          {catalogStatusLabel(event.status)}
          <span aria-hidden="true" className="px-2">·</span>
          {countdownLabel(event)}
        </p>
        <p className="mt-5 font-mc-interface text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">
          {event.sport || 'Jiu-Jitsu'}
        </p>
        <h1 className="mt-3 font-mc-display text-[clamp(2rem,5vw,4.25rem)] font-bold uppercase leading-[0.92] tracking-[-0.03em]">
          {event.title}
        </h1>
        <p className="mt-5 max-w-2xl font-mc-interface text-sm leading-6 text-white/85 sm:text-base">
          {date ? date.long : event.date}
          <span aria-hidden="true"> · </span>
          {event.location}
        </p>
        <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row">
          <FeaturedLink action={primary} />
          <FeaturedLink action={secondary} />
        </div>
        {preview ? (
          <p className="mt-5 max-w-md font-mc-interface text-xs leading-5 text-white/70">
            Campeonato fictício para ensaiar a página. Nada foi publicado e a inscrição abre a demonstração neste navegador.
          </p>
        ) : null}
      </div>

      {count > 1 ? (
        <div className="absolute inset-x-0 bottom-6 z-10 flex items-center justify-center gap-2">
          {events.map((item, itemIndex) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Mostrar ${item.title}`}
              aria-current={itemIndex === safeIndex ? 'true' : undefined}
              onClick={() => show(itemIndex)}
              className={`h-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${itemIndex === safeIndex ? 'w-8 bg-mc-action' : 'w-4 bg-white/45'}`}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}

function FeaturedLink({ action }: { action: { href: string; label: string } }) {
  if (action.href.startsWith('#')) {
    return <a href={action.href} className={heroButton}>{action.label}</a>
  }
  return <Link href={action.href} className={heroButton}>{action.label}</Link>
}
