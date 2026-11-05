'use client'

import { useMemo, useState } from 'react'
import { CinematicStory } from '@/components/home-cinematic/CinematicStory'
import { type Event } from '@/components/ModernEventGrid'
import { getCinematicPreviewEvents } from '@/lib/home/cinematic-preview-events'

export default function HomeClient({
  events,
  highlights,
}: {
  events: Event[]
  highlights: Event[]
}) {
  const [search, setSearch] = useState('')
  const previewEvents = events.length === 0 && process.env.NODE_ENV === 'development'
  const catalog = useMemo(() => (previewEvents ? getCinematicPreviewEvents() : events), [events, previewEvents])
  const openingEvents = useMemo(
    () => (previewEvents || highlights.length === 0 ? catalog : highlights),
    [catalog, highlights, previewEvents],
  )

  return (
    <CinematicStory
      openingEvents={openingEvents}
      previewEvents={previewEvents}
      search={search}
      onSearchChange={setSearch}
    />
  )
}
