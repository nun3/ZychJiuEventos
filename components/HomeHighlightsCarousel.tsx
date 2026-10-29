'use client'

import { useCallback, useEffect, useRef, useState, type FocusEvent, type KeyboardEvent, type TouchEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, CalendarDays, MapPin } from 'lucide-react'
import type { Event } from './ModernEventGrid'

const AUTOPLAY_MS = 6000

function eventDate(value?: string) {
  if (!value) return ''
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${value}T12:00:00Z`)).replace('.', '').toUpperCase().replace(/\sDE\s/g, ' ')
}

export default function HomeHighlightsCarousel({ events }: { events: Event[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [previousIndex, setPreviousIndex] = useState<number | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const touchStartRef = useRef<number | null>(null)
  const activeEvent = events[activeIndex]
  const hasNavigation = events.length > 1
  const backgroundIndexes = previousIndex === null ? [activeIndex] : [previousIndex, activeIndex]
  const select = useCallback((index: number) => {
    setActiveIndex((current) => {
      const next = (index + events.length) % events.length
      if (next !== current) setPreviousIndex(current)
      return next
    })
  }, [events.length])
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!hasNavigation) return
    if (event.key === 'ArrowLeft') { event.preventDefault(); select(activeIndex - 1) }
    if (event.key === 'ArrowRight') { event.preventDefault(); select(activeIndex + 1) }
    if (event.key === 'Home') { event.preventDefault(); select(0) }
    if (event.key === 'End') { event.preventDefault(); select(events.length - 1) }
  }
  const handleTouchEnd = (event: TouchEvent<HTMLElement>) => {
    if (touchStartRef.current === null || !hasNavigation) return
    const distance = event.changedTouches[0].clientX - touchStartRef.current
    if (Math.abs(distance) >= 48) select(distance > 0 ? activeIndex - 1 : activeIndex + 1)
    touchStartRef.current = null
    setIsPaused(false)
  }
  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    const next = event.relatedTarget
    if (next instanceof Node && event.currentTarget.contains(next)) return
    setIsPaused(false)
  }

  useEffect(() => {
    if (!hasNavigation) return

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    let intervalId: number | null = null

    const stop = () => {
      if (intervalId === null) return
      window.clearInterval(intervalId)
      intervalId = null
    }

    const advance = () => {
      setActiveIndex((current) => {
        const next = (current + 1) % events.length
        if (next !== current) setPreviousIndex(current)
        return next
      })
    }

    const sync = () => {
      stop()
      if (media.matches || isPaused) return
      intervalId = window.setInterval(advance, AUTOPLAY_MS)
    }

    sync()
    media.addEventListener('change', sync)
    return () => {
      stop()
      media.removeEventListener('change', sync)
    }
  }, [hasNavigation, events.length, isPaused, activeIndex])

  if (!activeEvent) return <section className="flex min-h-[32rem] items-center bg-mc-structure pt-20 text-white" aria-label="Destaques"><div className="w-full px-4 text-sm text-slate-200 sm:px-8 lg:px-12">Nenhum campeonato em destaque no momento.</div></section>

  return (
    <section
      className="relative overflow-hidden bg-mc-structure text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mc-focus"
      aria-roledescription="carrossel"
      aria-label="Campeonatos em destaque"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={handleBlur}
      onTouchStart={(event) => {
        touchStartRef.current = event.touches[0].clientX
        setIsPaused(true)
      }}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={() => {
        touchStartRef.current = null
        setIsPaused(false)
      }}
    >
      {backgroundIndexes.map((index) => {
        const event = events[index]
        const isActive = index === activeIndex
        return (
        <div
          key={event.id}
          className={`absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none ${isActive ? 'opacity-100' : 'opacity-0'}`}
          aria-hidden={!isActive}
          onTransitionEnd={() => { if (!isActive) setPreviousIndex(null) }}
        >
          <Image
            src={event.image!}
            alt=""
            fill
            priority={isActive && index === 0}
            sizes="100vw"
            quality={55}
            className="scale-[1.035] object-cover object-center blur-[5px] brightness-[0.62] saturate-[1.05]"
          />
        </div>
        )
      })}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,27,46,0.68)_0%,rgba(7,27,46,0.32)_22%,rgba(7,27,46,0.10)_52%,rgba(7,27,46,0.42)_100%)]" aria-hidden="true" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,27,46,0.38)_0%,rgba(7,27,46,0.08)_36%,rgba(7,27,46,0.70)_72%,rgba(7,27,46,0.96)_100%)]" aria-hidden="true" />

      <div className="relative z-10 h-[28rem] sm:h-[30rem] lg:h-[32rem]">

        <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-6 sm:px-8 sm:pb-7 lg:px-12 lg:pb-8 xl:px-20" role="group" aria-roledescription="slide" aria-label={`${activeIndex + 1} de ${events.length}`} aria-live="polite">
          <div className="grid items-end gap-4 lg:grid-cols-[minmax(18rem,1fr)_auto_auto_auto] lg:gap-0">
            <div className="min-w-0 lg:pr-7">
              <p className="mb-2 border-l-2 border-mc-action pl-3 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-blue-300">Campeonato em destaque</p>
              <h1 className="font-mc-display text-2xl font-bold uppercase leading-tight text-white sm:text-3xl lg:text-4xl">{activeEvent.title}</h1>
            </div>
            <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-100 lg:border-l lg:border-white/20 lg:px-5"><CalendarDays aria-hidden="true" size={18} className="shrink-0 text-blue-300" />{eventDate(activeEvent.dateObj)}</span>
            <span className="inline-flex items-start gap-2 text-sm font-medium text-slate-100 lg:max-w-72 lg:border-l lg:border-white/20 lg:px-5"><MapPin aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-blue-300" />{activeEvent.location}</span>
            <Link href={`/eventos/${activeEvent.id}`} className="inline-flex min-h-11 w-fit items-center gap-3 rounded-mc-small bg-mc-action px-5 text-xs font-bold uppercase tracking-[0.12em] text-white transition-colors duration-mc-normal hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-mc-structure">Ver campeonato <ArrowRight aria-hidden="true" size={16} /></Link>
          </div>
        </div>
      </div>

      <div className="relative z-10">
        {hasNavigation ? (
          <div>
            <div className="flex w-full items-center gap-2 px-3 pb-5 pt-3 sm:gap-4 sm:px-8 sm:pb-6 lg:px-12 lg:pb-7 lg:pt-4 xl:px-20">
              <button type="button" onClick={() => select(activeIndex - 1)} className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-white/30 text-white transition-colors hover:border-mc-action hover:bg-mc-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus" aria-label="Campeonato anterior"><ArrowLeft aria-hidden="true" size={19} /></button>
              <div className="flex flex-1 snap-x gap-2 overflow-x-auto px-1 [scrollbar-width:none] sm:gap-3" role="tablist" aria-label="Selecionar campeonato em destaque">
                {events.map((event, index) => (
                  <button key={event.id} type="button" role="tab" aria-selected={index === activeIndex} aria-label={`Mostrar ${event.title}`} onClick={() => select(index)} className={`relative aspect-[3/2] w-24 shrink-0 snap-start overflow-hidden rounded-mc-small border-2 shadow-[0_8px_22px_rgba(0,0,0,0.22)] transition-all duration-mc-normal motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus sm:w-40 lg:w-52 xl:w-64 ${index === activeIndex ? 'border-blue-400 opacity-100 shadow-[0_0_0_1px_rgba(37,99,235,0.50),0_0_20px_rgba(37,99,235,0.34)]' : 'border-white/20 opacity-80 hover:border-white/50 hover:opacity-100'}`}>
                    <Image src={event.image!} alt="" fill sizes="(max-width: 639px) 96px, (max-width: 1023px) 160px, (max-width: 1279px) 208px, 256px" className="object-cover" />
                    <span className="absolute inset-0 bg-mc-structure/[0.04]" aria-hidden="true" />
                  </button>
                ))}
              </div>
              <div className="hidden shrink-0 items-center gap-2 text-xs font-semibold tabular-nums text-blue-100 sm:flex" aria-label={`Slide ${activeIndex + 1} de ${events.length}`}>
                <span>{String(activeIndex + 1).padStart(2, '0')}</span><span className="text-white/40">/</span><span>{String(events.length).padStart(2, '0')}</span>
                <span className="ml-2 h-0.5 w-24 overflow-hidden rounded-full bg-white/20"><span className="block h-full bg-mc-action transition-[width] duration-mc-normal motion-reduce:transition-none" style={{ width: `${((activeIndex + 1) / events.length) * 100}%` }} /></span>
              </div>
              <button type="button" onClick={() => select(activeIndex + 1)} className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-white/30 text-white transition-colors hover:border-mc-action hover:bg-mc-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus" aria-label="Próximo campeonato"><ArrowRight aria-hidden="true" size={19} /></button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
