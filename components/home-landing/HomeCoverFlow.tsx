'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Event } from '@/components/ModernEventGrid'
import { catalogStatusLabel, countdownLabel, eventDateParts, featuredActions } from '@/lib/events/catalog-presentation'
import { buildCoverSlides, coverPose, nextIndex, relativeCoverPosition } from '@/lib/home/cover-flow'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import styles from './HomeCoverFlow.module.css'

const AUTOPLAY_MS = 6000
const SWIPE_PX = 50

const primaryButton =
  'inline-flex min-h-12 items-center justify-center bg-white px-8 font-mc-interface text-sm font-bold uppercase tracking-[0.14em] text-mc-text-primary transition-colors duration-200 hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-mc-nav-dark'
const lineButton =
  'inline-flex min-h-12 items-center justify-center border border-white/70 px-8 font-mc-interface text-sm font-bold uppercase tracking-[0.14em] text-white transition-colors duration-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-mc-nav-dark'
const pill =
  'mb-6 inline-flex min-h-7 items-center rounded-full bg-mc-action px-4 font-mc-interface text-[10px] font-bold uppercase tracking-[0.14em] text-white sm:text-xs'
const kicker = 'mb-2 font-mc-interface text-sm font-semibold uppercase tracking-[0.22em] text-white/80'
const titleClass =
  'mb-6 line-clamp-3 break-words font-mc-display text-4xl font-bold uppercase leading-none tracking-[-0.04em] text-white sm:text-6xl lg:text-7xl'
const arrow =
  'absolute top-1/2 z-40 inline-flex -translate-y-1/2 rounded-full border border-white/10 bg-mc-nav-dark/40 p-3 text-white/70 backdrop-blur-md transition-colors hover:border-white/30 hover:bg-mc-nav-dark/80 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:p-4'

/**
 * Abertura da Home: Cover Flow 3D de campeonatos em destaque.
 * Eventos reais primeiro; frases de estratégia de luta preenchem os espaços vazios e são
 * substituídas por eventos conforme eles aparecem.
 */
export function HomeCoverFlow({ events }: { events: Event[] }) {
  const slides = useMemo(() => buildCoverSlides(events), [events])
  const count = slides.length
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [active, setActive] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [tick, setTick] = useState(0)
  const swipeStart = useRef<number | null>(null)

  const safeActive = count ? active % count : 0
  const paused = hovered || focused || hidden

  const step = useCallback(
    (delta: number) => {
      setActive((index) => nextIndex(index, count, delta))
      setTick((value) => value + 1)
    },
    [count],
  )
  const goTo = useCallback((index: number) => {
    setActive(index)
    setTick((value) => value + 1)
  }, [])

  // Autoplay: pausa com mouse/foco/aba oculta; desligado com prefers-reduced-motion. `tick` reinicia o relógio após interação.
  useEffect(() => {
    if (reduced || paused || count < 2) return
    const timer = window.setInterval(() => setActive((index) => nextIndex(index, count, 1)), AUTOPLAY_MS)
    return () => window.clearInterval(timer)
  }, [reduced, paused, count, tick])

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden)
    onVisibility()
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowRight') { event.preventDefault(); step(1) }
    if (event.key === 'ArrowLeft') { event.preventDefault(); step(-1) }
  }
  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.isPrimary && event.button === 0) swipeStart.current = event.clientX
  }
  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    const start = swipeStart.current
    swipeStart.current = null
    if (start === null) return
    const delta = event.clientX - start
    if (Math.abs(delta) > SWIPE_PX) step(delta < 0 ? 1 : -1)
  }

  const current = slides[safeActive]
  const currentLabel = current.kind === 'event' ? current.event.title : `Estratégia de luta: ${current.strategy.theme}`

  return (
    <section
      aria-roledescription="carrossel"
      aria-label="Campeonatos em destaque"
      data-no-scroll-choreography
      className={styles.stage}
      onKeyDown={onKeyDown}
      onPointerEnter={(event) => event.pointerType === 'mouse' && setHovered(true)}
      onPointerLeave={(event) => event.pointerType === 'mouse' && setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false) }}
    >
      <h1 id="home-hero-title" className="sr-only">MEU CAMP: campeonatos de jiu-jitsu</h1>

      <div className={`${styles.flow} touch-pan-y`} onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
        {slides.map((slide, index) => {
          const position = relativeCoverPosition(index, safeActive, count)
          const isActive = position === 0
          return (
            <article
              key={slide.key}
              data-pos={coverPose(position)}
              aria-hidden={!isActive}
              aria-label={slide.kind === 'event' ? slide.event.title : `Estratégia de luta: ${slide.strategy.theme}`}
              onClick={() => { if (!isActive) goTo(index) }}
              className={`${styles.card} mc-glass ${isActive ? '' : 'cursor-pointer'}`}
            >
              {slide.kind === 'event' ? (
                <EventSlide event={slide.event} isActive={isActive} priority={index === 0} />
              ) : (
                <StrategySlide theme={slide.strategy.theme} phrase={slide.strategy.phrase} isActive={isActive} />
              )}
            </article>
          )
        })}
      </div>

      {count > 1 ? (
        <>
          <button type="button" aria-label="Campeonato anterior" onClick={() => step(-1)} className={`${arrow} left-4 sm:left-10`}>
            <ChevronLeft aria-hidden="true" size={24} />
          </button>
          <button type="button" aria-label="Próximo campeonato" onClick={() => step(1)} className={`${arrow} right-4 sm:right-10`}>
            <ChevronRight aria-hidden="true" size={24} />
          </button>
          <div className="absolute bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1">
            {slides.map((slide, index) => (
              <button
                key={slide.key}
                type="button"
                aria-label={`Mostrar ${slide.kind === 'event' ? slide.event.title : `frase ${slide.strategy.theme}`}`}
                aria-current={index === safeActive ? 'true' : undefined}
                onClick={() => goTo(index)}
                className="group flex h-6 items-center px-0.5 focus-visible:outline-none"
              >
                <span
                  className={`block h-1 rounded-full transition-all duration-300 motion-reduce:transition-none group-focus-visible:ring-2 group-focus-visible:ring-mc-focus ${
                    index === safeActive ? 'w-8 bg-mc-action' : 'w-4 bg-slate-300 group-hover:bg-slate-400'
                  }`}
                />
              </button>
            ))}
          </div>
        </>
      ) : null}

      <p className="sr-only" aria-live="polite">{`Slide ${safeActive + 1} de ${count}. ${currentLabel}`}</p>
    </section>
  )
}

function EventSlide({ event, isActive, priority }: { event: Event; isActive: boolean; priority: boolean }) {
  const date = eventDateParts(event.dateObj)
  const [primary, secondary] = featuredActions(event)
  // Âncoras de demonstração (#experimentar-demo) só existem em /eventos; na Home só entram ações de navegação real.
  const actions = [primary, secondary].filter((action) => !action.href.startsWith('#'))
  const Title = isActive ? 'h2' : 'p'

  return (
    <>
      {event.image ? (
        <Image
          src={event.image}
          alt=""
          fill
          priority={priority}
          sizes="(min-width: 1024px) 900px, (min-width: 640px) 600px, 320px"
          className={`object-cover ${styles.photo}`}
        />
      ) : null}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_55%,rgba(4,10,22,0.5),rgba(4,10,22,0.12)_70%)]" />
      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
        <p className={pill}>
          {catalogStatusLabel(event.status)}
          <span aria-hidden="true" className="px-2">·</span>
          {countdownLabel(event)}
        </p>
        <p className={kicker}>{event.sport || 'Jiu-Jitsu'}</p>
        <Title className={titleClass}>{event.title}</Title>
        <p className="mb-9 max-w-xl font-mc-interface text-xs text-white/85 sm:text-sm">
          {date ? date.long : event.dateFull}
          <span aria-hidden="true" className="hidden px-2 sm:inline">·</span>
          <span className="mt-2 block sm:mt-0 sm:inline">{event.location}</span>
        </p>
        <div className={`${styles.actions} w-full flex-col items-center gap-3 sm:w-auto sm:flex-row`}>
          {actions.map((action, i) => (
            <Link key={action.href} href={action.href} className={`${i === 0 ? primaryButton : lineButton} w-full sm:w-auto sm:whitespace-nowrap`}>
              {action.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}

function StrategySlide({ theme, phrase, isActive }: { theme: string; phrase: string; isActive: boolean }) {
  const Title = isActive ? 'h2' : 'p'
  return (
    <>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_55%,rgba(4,10,22,0.5),rgba(4,10,22,0.12)_70%)]" />
      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
        <p className={pill}>Estratégia de luta</p>
        <p className={kicker}>Jiu-Jitsu</p>
        <Title className={titleClass}>{theme}</Title>
        <p className="max-w-xl font-mc-interface text-base italic leading-relaxed text-white sm:text-xl">{phrase}</p>
      </div>
    </>
  )
}
