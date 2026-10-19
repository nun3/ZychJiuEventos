import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, MapPin } from 'lucide-react'
import { StatusBadge } from '@/components/ui/StatusBadge'
import {
  adminEventStatusLabel,
  adminEventStatusVariant,
  formatAdminEventDate,
  type AdminEventHeroData,
} from '@/lib/events/admin-event-presentation'
import { cn } from '@/components/ui/utils'

type EventAdminHeroProps = {
  event: AdminEventHeroData | null
  description?: string
  badges?: ReactNode
  className?: string
}

export function EventAdminHero({ event, description, badges, className }: EventAdminHeroProps) {
  const dateLabel = formatAdminEventDate(event?.data_evento)
  const local = event?.local?.trim() || null
  const poster = event?.imagem_cartaz_url?.trim() || '/images/home1.png'

  return (
    <header
      className={cn(
        'relative overflow-hidden rounded-mc-medium bg-mc-structure shadow-mc-subtle',
        className,
      )}
    >
      <div
        className="absolute inset-0 bg-mc-structure grayscale"
        style={
          poster
            ? {
                backgroundImage: `linear-gradient(105deg, rgba(12, 48, 73, 0.92) 0%, rgba(12, 48, 73, 0.78) 45%, rgba(12, 48, 73, 0.55) 100%), url(${poster})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : {
                backgroundImage:
                  'linear-gradient(135deg, #0C3049 0%, #0a2438 55%, #123a56 100%)',
              }
        }
        aria-hidden="true"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-r from-mc-text-primary/80 via-mc-text-primary/40 to-transparent" />
      <div className="relative px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <Link
          href="/admin/eventos"
          className="inline-flex min-h-11 items-center gap-1.5 font-mc-interface text-sm font-semibold text-white/85 transition-colors duration-mc-fast hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
        >
          <ArrowLeft aria-hidden="true" size={16} />
          Voltar para eventos
        </Link>

        <div className="mt-2 flex items-center justify-between gap-8">
          <div className="min-w-0 flex-1">
            <h1 className="break-words font-mc-display text-2xl font-semibold leading-8 text-white sm:text-3xl sm:leading-10">
              {event?.nome || 'Evento'}
            </h1>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              {dateLabel ? (
                <p className="inline-flex items-center gap-mc-8 font-mc-interface text-sm text-white/90">
                  <CalendarDays aria-hidden="true" size={16} className="shrink-0" />
                  <span>{dateLabel}</span>
                </p>
              ) : null}
              {local ? (
                <p className="inline-flex items-center gap-mc-8 font-mc-interface text-sm text-white/90">
                  <MapPin aria-hidden="true" size={16} className="shrink-0" />
                  <span>{local}</span>
                </p>
              ) : null}
              {event ? (
                <StatusBadge
                  variant={adminEventStatusVariant(event.status)}
                  className="bg-white/15 text-white ring-1 ring-white/20"
                >
                  {adminEventStatusLabel(event.status)}
                </StatusBadge>
              ) : null}
              {badges}
            </div>

            {description ? (
              <p className="mt-3 max-w-3xl font-mc-interface text-xs leading-5 text-white/85">
                {description}
              </p>
            ) : null}
          </div>
          <p className="hidden shrink-0 border-l-2 border-mc-action py-2 pl-5 font-mc-interface text-xs font-semibold uppercase leading-6 tracking-[0.2em] text-white xl:block">
            Mais do que<br />competição,<br />comunidade.
          </p>
        </div>
      </div>
    </header>
  )
}
