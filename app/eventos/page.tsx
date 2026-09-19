import type { Metadata } from 'next'
import ModernFooter from '@/components/ModernFooter'
import ModernNavbar from '@/components/ModernNavbar'
import { PageContainer } from '@/components/ui/PageContainer'
import { getPublicEvents } from '@/lib/events/public-events'
import EventsClient from './EventsClient'

export const metadata: Metadata = {
  title: 'Eventos | Meu Camp',
  description: 'Consulte os eventos publicados no Meu Camp.',
}

export default async function EventsPage() {
  const events = await getPublicEvents()

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-mc-surface-secondary">
      <ModernNavbar />
      <section id="eventos" className="pt-28 sm:pt-32" aria-labelledby="events-page-title">
        <PageContainer>
          <div className="max-w-3xl">
            <p className="font-mc-interface text-sm font-semibold uppercase tracking-[0.16em] text-mc-action">
              Calendário de competições
            </p>
            <h1 id="events-page-title" className="mt-mc-8 font-mc-display text-3xl font-semibold leading-tight text-mc-text-primary sm:text-mc-h1">
              Eventos
            </h1>
            <p className="mt-mc-12 font-mc-interface text-mc-body text-mc-text-secondary">
              Encontre competições publicadas do MEU CAMP e consulte a ficha, a checagem e a programação de cada evento.
            </p>
          </div>

          <div className="mt-mc-32">
            <EventsClient events={events} />
          </div>
        </PageContainer>
      </section>
      <ModernFooter />
    </main>
  )
}
