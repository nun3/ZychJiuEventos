import Image from 'next/image'
import Link from 'next/link'
import { Clock, MapPin, Trophy } from 'lucide-react'
import type { Event } from '@/components/ModernEventGrid'
import { cardActions, catalogStatusLabel, countdownLabel, eventDateParts, statusTone } from '@/lib/events/catalog-presentation'

const toneClass = {
  open: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  soon: 'border-blue-200 bg-blue-50 text-blue-800',
  live: 'border-amber-200 bg-amber-50 text-amber-800',
  done: 'border-slate-200 bg-slate-100 text-slate-600',
} as const

const primaryCta =
  'inline-flex min-h-11 flex-1 items-center justify-center whitespace-nowrap rounded-lg bg-mc-structure px-4 font-mc-interface text-xs font-bold uppercase tracking-[0.1em] text-white transition-colors duration-mc-fast hover:bg-mc-nav-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2'
const secondaryCta =
  'relative z-10 inline-flex min-h-11 flex-1 items-center justify-center whitespace-nowrap rounded-lg border border-mc-action px-4 font-mc-interface text-xs font-bold uppercase tracking-[0.1em] text-mc-action transition-colors duration-mc-fast hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2'

function StatusBadge({ status, className = '' }: { status?: string; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 font-mc-interface text-[11px] font-bold uppercase tracking-[0.08em] ${toneClass[statusTone(status)]} ${className}`}>
      {catalogStatusLabel(status)}
    </span>
  )
}

function Poster({ event, sizes, className }: { event: Event; sizes: string; className: string }) {
  return (
    <div className={`relative grid place-items-center overflow-hidden bg-[linear-gradient(160deg,#103a5e,#0a2036)] ${className}`}>
      {event.image ? (
        <Image src={event.image} alt="" fill sizes={sizes} className="object-cover" />
      ) : (
        <Trophy aria-hidden="true" size={34} strokeWidth={1.4} className="text-blue-200" />
      )}
    </div>
  )
}

/** Card da grade: reconhecimento rápido (cartaz + data + status) e uma próxima ação. O card inteiro abre o evento. */
export function CatalogCard({ event, index }: { event: Event; index: number }) {
  const date = eventDateParts(event.dateObj)
  const { details, contextual } = cardActions(event)
  const action = contextual && !contextual.href.startsWith('#') ? contextual : null

  return (
    <article
      id={`home-catalog-row-${index}`}
      tabIndex={-1}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-mc-subtle outline-none transition-[box-shadow,transform] duration-mc-fast hover:-translate-y-0.5 hover:shadow-mc-elevated focus-visible:ring-2 focus-visible:ring-mc-focus motion-reduce:transform-none [content-visibility:auto] [contain-intrinsic-size:auto_420px]"
    >
      <div className="relative">
        <Poster event={event} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="aspect-[2/1] w-full sm:aspect-[16/9]" />
        <StatusBadge status={event.status} className="absolute left-3 top-3 shadow-mc-subtle" />
        {date ? (
          <div aria-hidden="true" className="absolute right-3 top-3 w-14 rounded-xl bg-white py-1.5 text-center shadow-mc-subtle">
            <p className="font-mc-display text-xl font-bold leading-none tabular-nums text-mc-text-primary">{date.day}</p>
            <p className="mt-0.5 font-mc-interface text-[10px] font-bold uppercase tracking-[0.08em] text-mc-action">{date.month}</p>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="min-w-0">
          <p className="font-mc-interface text-[11px] font-semibold uppercase tracking-[0.14em] text-mc-text-secondary">{event.sport || 'Jiu-Jitsu'}</p>
          <h4 className="mt-1 line-clamp-2 font-mc-display text-lg font-bold uppercase leading-tight tracking-[-0.01em] text-mc-text-primary">
            {/* Link esticado: a área do card inteiro é clicável, com um único nome acessível. */}
            <Link href={details.href} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
              {event.title}
            </Link>
          </h4>
        </div>
        <ul className="space-y-1.5 font-mc-interface text-sm text-mc-text-secondary">
          <li className="flex items-start gap-2">
            <MapPin aria-hidden="true" size={16} className="mt-0.5 shrink-0" />
            <span className="line-clamp-2">{event.location}</span>
          </li>
          <li className="flex items-center gap-2">
            <Clock aria-hidden="true" size={16} className="shrink-0" />
            <span><span className="sr-only">Data: </span>{date?.long || event.dateFull} · <span className="font-semibold text-mc-text-primary">{countdownLabel(event)}</span></span>
          </li>
        </ul>
        <div className="mt-auto flex gap-2 pt-2">
          <span className={primaryCta} aria-hidden="true">{details.label}</span>
          {action ? <Link href={action.href} className={secondaryCta}>{action.label}</Link> : null}
        </div>
      </div>
    </article>
  )
}

/** Linha da lista: colunas alinhadas (data, evento, local, status, ação) para comparar vários eventos. */
export function CatalogListRow({ event, index }: { event: Event; index: number }) {
  const date = eventDateParts(event.dateObj)
  const { details, contextual } = cardActions(event)
  const action = contextual && !contextual.href.startsWith('#') ? contextual : null

  return (
    <article
      id={`home-catalog-row-${index}`}
      tabIndex={-1}
      className="grid grid-cols-[72px_minmax(0,1fr)] items-start gap-x-3.5 gap-y-3 border-b border-slate-200 py-4 outline-none [content-visibility:auto] [contain-intrinsic-size:auto_140px] focus-visible:ring-2 focus-visible:ring-mc-focus md:grid-cols-[6.5rem_8rem_minmax(0,1fr)_auto] md:items-center md:gap-6 md:py-5"
    >
      <div className="md:border-l-4 md:border-mc-action md:pl-3">
        <p className="flex items-baseline gap-1.5">
          <span className="font-mc-display text-2xl font-bold leading-none tabular-nums text-mc-text-primary md:text-3xl">{date?.day || '—'}</span>
          <span className="font-mc-display text-sm font-bold uppercase text-mc-action">{date?.month || event.date}</span>
        </p>
        <p className="mt-1 font-mc-interface text-[10px] font-semibold uppercase leading-4 tracking-[0.06em] text-mc-text-secondary">{date?.year}</p>
      </div>
      <Poster event={event} sizes="128px" className="hidden h-20 w-32 rounded-lg md:grid" />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={event.status} />
          <span className="font-mc-interface text-xs font-semibold text-mc-text-secondary">{countdownLabel(event)}</span>
        </div>
        <h4 className="mt-1.5 line-clamp-2 font-mc-display text-base font-bold uppercase leading-tight text-mc-text-primary md:text-xl">{event.title}</h4>
        <p className="mt-1 line-clamp-2 flex items-start gap-1.5 font-mc-interface text-[13px] leading-snug text-mc-text-secondary md:text-sm">
          <MapPin aria-hidden="true" size={15} className="mt-0.5 shrink-0" />{event.location}
        </p>
        <p className="hidden font-mc-interface text-sm text-mc-text-secondary md:block">{date?.long || event.dateFull}</p>
      </div>
      <div className="col-span-2 flex gap-2 md:col-span-1 md:w-44 md:flex-col">
        <Link href={details.href} className={`${primaryCta} md:flex-none`}>{details.label}</Link>
        {action ? <Link href={action.href} className={`${secondaryCta} md:flex-none`}>{action.label}</Link> : null}
      </div>
    </article>
  )
}
