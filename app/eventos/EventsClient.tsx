'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import EventFilters from '@/components/EventFilters'
import ModernEventGrid, { type Event } from '@/components/ModernEventGrid'

const initialFilters = {
  eventType: 'Todos',
  sport: 'Todas',
  state: 'Todos',
  search: '',
  period: 'todos',
  startDate: '',
  endDate: '',
}

export default function EventsClient({ events }: { events: Event[] }) {
  const router = useRouter()
  const [filters, setFilters] = useState(initialFilters)

  return (
    <>
      {events.length ? <EventFilters onFilterChange={setFilters} /> : null}
      <ModernEventGrid
        events={events}
        filters={events.length ? filters : undefined}
        onEventClick={(event) => router.push(`/eventos/${event.id}`)}
      />
    </>
  )
}
