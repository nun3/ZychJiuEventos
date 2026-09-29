import Image from 'next/image'
import Link from 'next/link'
import { Trophy } from 'lucide-react'
import type { Event } from './ModernEventGrid'

interface EditorialEventCardProps {
  event: Event
  featured?: boolean
}

function formatEventDate(event: Event) {
  if (!event.dateObj) return event.date.toUpperCase()

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
    .format(new Date(`${event.dateObj}T12:00:00Z`))
    .replace('.', '')
    .toUpperCase()
    .replace(/\sDE\s/g, ' ')
}

const eventStatusLabels: Record<string, string> = {
  publicado: 'Em breve',
  inscricao: 'Inscrições abertas',
  pagamento: 'Em breve',
  checagem: 'Em breve',
  chaves: 'Em breve',
  em_andamento: 'Em andamento',
  concluido: 'Encerrado',
}

export default function EditorialEventCard({ event, featured = false }: EditorialEventCardProps) {
  const sport = event.sport || 'Jiu-Jitsu'
  const statusLabel = event.status ? eventStatusLabels[event.status] : 'Campeonato'
  const contextualStatus = event.resultsPublished
    ? 'Resultados disponíveis'
    : event.status === 'em_andamento'
      ? 'Evento em andamento'
      : event.daysLeft > 0
        ? `Faltam ${event.daysLeft} ${event.daysLeft === 1 ? 'dia' : 'dias'}`
        : null

  return (
    <article className={featured ? 'max-w-5xl' : 'h-full'}>
      <Link
        href={`/eventos/${event.id}`}
        className="group flex h-full flex-col overflow-hidden rounded-mc-small border border-mc-border bg-mc-surface shadow-mc-subtle transition-shadow duration-mc-normal hover:shadow-mc-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2"
        aria-label={`Ver detalhes de ${event.title}`}
      >
        <div className="relative aspect-video w-full overflow-hidden bg-mc-structure">
          {event.image ? (
            <Image
              src={event.image}
              alt={`Banner do evento ${event.title}`}
              fill
              className="object-cover transition-transform duration-mc-slow group-hover:scale-[1.025]"
              sizes={featured
                ? '(max-width: 1023px) 100vw, 1024px'
                : '(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw'}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-blue-200" aria-hidden="true">
              <Trophy size={featured ? 64 : 48} strokeWidth={1.4} />
            </div>
          )}
        </div>

        <div className="relative flex flex-1 flex-col px-mc-24 pb-mc-24 pt-mc-32">
          <span
            className="absolute left-mc-24 top-0 h-1 w-20 -translate-y-1/2 bg-mc-action transition-[width] duration-mc-normal group-hover:w-28"
            aria-hidden="true"
          />

          <p className="font-mc-interface text-xs font-semibold uppercase tracking-[0.14em] text-mc-action">
            {statusLabel} <span aria-hidden="true">•</span> {sport}
          </p>
          <h3 className={`${featured ? 'text-2xl sm:text-3xl' : 'text-xl'} mt-mc-8 font-mc-display font-bold uppercase leading-tight text-mc-text-primary`}>
            {event.title}
          </h3>

          <dl className="mt-mc-24 space-y-mc-8 font-mc-interface text-sm text-mc-text-secondary">
            <div>
              <dt className="sr-only">Data</dt>
              <dd className="font-semibold tracking-[0.06em] text-mc-text-primary">{formatEventDate(event)}</dd>
            </div>
            <div>
              <dt className="sr-only">Local</dt>
              <dd>{event.location}</dd>
            </div>
          </dl>

          {contextualStatus ? (
            <p className="mt-mc-24 border-t border-mc-border pt-mc-16 font-mc-interface text-xs font-semibold uppercase tracking-[0.14em] text-mc-text-secondary">
              {contextualStatus}
            </p>
          ) : null}
        </div>
      </Link>
    </article>
  )
}
