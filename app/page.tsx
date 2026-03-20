'use client'

import { useState } from 'react'
import ModernNavbar from '@/components/ModernNavbar'
import ModernHero from '@/components/ModernHero'
import EventFilters from '@/components/EventFilters'
import ModernEventGrid, { Event } from '@/components/ModernEventGrid'
import ModernFooter from '@/components/ModernFooter'
import EventModal from '@/components/EventModal'

export default function Home() {
  const [filters, setFilters] = useState({
    eventType: 'Todos',
    sport: 'Todas',
    state: 'Todos',
    search: '',
    period: 'todos',
    startDate: '',
    endDate: '',
  })

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
  }

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setTimeout(() => setSelectedEvent(null), 300)
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] relative">
      <ModernNavbar />
      <ModernHero />
      <div id="eventos" className="w-full bg-white min-h-screen" style={{ overflow: 'visible' }}>
        <div className="max-w-[1920px] mx-auto px-5 py-7" style={{ overflow: 'visible' }}>
          <div style={{ transform: 'scale(0.9)', transformOrigin: 'top center' }}>
            <EventFilters onFilterChange={handleFilterChange} />
            <ModernEventGrid filters={filters} onEventClick={handleEventClick} />
          </div>
        </div>
      </div>
      <ModernFooter />
      <EventModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </main>
  )
}

