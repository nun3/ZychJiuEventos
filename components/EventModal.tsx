'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Calendar, MapPin, Trophy } from 'lucide-react'
import { Dialog } from '@/components/ui/Dialog'

interface EventModalProps {
  event: {
    id: string
    title: string
    type: string
    date: string
    dateFull: string
    location: string
    daysLeft: number
    image?: string
    description?: string
    organizer?: {
      name: string
      email: string
      phone: string
    }
  } | null
  isOpen: boolean
  onClose: () => void
}

export default function EventModal({ event, isOpen, onClose }: EventModalProps) {
  if (!event) return null

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title={event.title}
      description={event.type}
      className="max-w-3xl overflow-hidden p-0 [&>div:first-child]:p-6 [&>div:last-child]:mt-0"
    >
      <div>
        <div className="relative aspect-[16/8] overflow-hidden bg-mc-structure">
          {event.image ? (
            <Image
              src={event.image}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 767px) 100vw, 768px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-blue-200" aria-hidden="true">
              <Trophy size={52} strokeWidth={1.5} />
            </div>
          )}
        </div>

        <div className="p-mc-24 sm:p-mc-32">
          <dl className="grid gap-mc-16 border-y border-mc-border py-mc-16 font-mc-interface text-sm sm:grid-cols-2">
            <div className="flex items-start gap-mc-8">
              <Calendar aria-hidden="true" size={19} className="mt-0.5 shrink-0 text-mc-action" />
              <div>
                <dt className="font-semibold text-mc-text-primary">Data</dt>
                <dd className="mt-mc-4 text-mc-text-secondary">{event.date} · {event.dateFull}</dd>
              </div>
            </div>
            <div className="flex items-start gap-mc-8">
              <MapPin aria-hidden="true" size={19} className="mt-0.5 shrink-0 text-mc-action" />
              <div>
                <dt className="font-semibold text-mc-text-primary">Local</dt>
                <dd className="mt-mc-4 text-mc-text-secondary">{event.location}</dd>
              </div>
            </div>
          </dl>

          {event.description ? (
            <p className="mt-mc-24 font-mc-interface leading-6 text-mc-text-secondary">{event.description}</p>
          ) : null}

          <Link
            href={`/eventos/${event.id}`}
            onClick={onClose}
            className="mt-mc-24 inline-flex min-h-12 w-full items-center justify-center gap-mc-8 rounded-mc-medium bg-mc-action px-mc-24 font-mc-interface font-semibold text-white transition-colors duration-mc-normal hover:bg-mc-action/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2 sm:w-auto"
          >
            Ver detalhes do evento
            <ArrowRight aria-hidden="true" size={18} />
          </Link>
        </div>
      </div>
    </Dialog>
  )
}
