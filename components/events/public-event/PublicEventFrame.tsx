import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import ModernFooter from '@/components/ModernFooter'
import ModernNavbar from '@/components/ModernNavbar'
import EventPublicNavigation from '@/components/events/public-event/EventPublicNavigation'
import { getPublicEventNavItems, type PublicEventStatus } from '@/lib/events/public-event-presentation'

export function PublicEventFrame({
  eventId,
  status,
  current,
  kicker,
  title,
  lede,
  children,
}: {
  eventId: string
  status: PublicEventStatus
  current: 'informacoes' | 'participantes' | 'checagem' | 'chaves' | 'lutas' | 'programacao' | 'resultados'
  kicker: string
  title: string
  lede: string
  children: ReactNode
}) {
  const navItems = getPublicEventNavItems({ eventId, status, current })
  return (
    <main id="conteudo-principal" className="min-h-screen bg-mc-background">
      <ModernNavbar />
      <div className="pt-16">
        <EventPublicNavigation items={navItems} />
      </div>
      <div className="w-full px-4 pb-16 pt-10 sm:px-8 lg:px-12 xl:px-20">
        <Link href={`/eventos/${eventId}`} className="inline-flex min-h-12 items-center gap-2 font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] text-mc-text-secondary transition-colors duration-200 hover:text-mc-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus">
          <ArrowLeft aria-hidden="true" size={16} />
          Evento
        </Link>
        <p className="mt-8 font-mc-interface text-[11px] font-semibold uppercase tracking-[0.18em] text-mc-text-secondary">{kicker}</p>
        <h1 className="mt-3 max-w-4xl font-mc-display text-4xl font-bold uppercase leading-[0.95] tracking-[-0.03em] text-mc-text-primary sm:text-5xl">{title}</h1>
        <p className="mt-4 max-w-2xl font-mc-interface text-base leading-7 text-mc-text-secondary">{lede}</p>
        {children}
      </div>
      <ModernFooter />
    </main>
  )
}
