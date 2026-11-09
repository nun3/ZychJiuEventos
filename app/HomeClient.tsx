'use client'

import { useMemo } from 'react'
import { HomeLanding } from '@/components/home-landing/HomeLanding'
import { type Event } from '@/components/ModernEventGrid'
import { getCinematicPreviewEvents } from '@/lib/home/cinematic-preview-events'

export default function HomeClient({
  events,
  highlights,
}: {
  events: Event[]
  highlights: Event[]
}) {
  const previewEvents = events.length === 0 && process.env.NODE_ENV === 'development'
  const catalog = useMemo(() => (previewEvents ? getCinematicPreviewEvents() : events), [events, previewEvents])
  const openingEvents = useMemo(
    () => (previewEvents || highlights.length === 0 ? catalog : highlights),
    [catalog, highlights, previewEvents],
  )

  return (
    <section
      data-hero
      aria-label="Abertura"
      className="relative isolate flex min-h-[100svh] items-center overflow-x-clip overflow-y-hidden bg-mc-nav-dark pb-10 pt-24 text-white"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-70 [background-image:radial-gradient(rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:24px_24px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[350px] w-[700px] max-w-full -translate-x-1/2 rounded-full bg-white/5 blur-[140px]"
      />
      <HomeLanding events={openingEvents} preview={previewEvents} />
    </section>
  )
}
