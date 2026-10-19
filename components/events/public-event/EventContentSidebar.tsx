'use client'

import { useEffect, useState } from 'react'
import {
  CalendarDays,
  FileText,
  MapPin,
  UsersRound,
} from 'lucide-react'
import { cn } from '@/components/ui/utils'
import type { PublicEventSection, PublicEventSectionId } from '@/lib/events/public-event-presentation'

const sectionIcons: Record<PublicEventSectionId, typeof CalendarDays> = {
  'visao-geral': FileText,
  cronograma: CalendarDays,
  categorias: UsersRound,
  documentos: FileText,
  local: MapPin,
}

export default function EventContentSidebar({ sections }: { sections: PublicEventSection[] }) {
  const [activeId, setActiveId] = useState<PublicEventSectionId | ''>(sections[0]?.id ?? '')

  useEffect(() => {
    if (!sections.length) return
    const nodes = sections
      .map((section) => document.getElementById(section.id))
      .filter((node): node is HTMLElement => Boolean(node))
    if (!nodes.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        const nextId = visible[0]?.target?.id
        if (nextId && sections.some((section) => section.id === nextId)) {
          setActiveId(nextId as PublicEventSectionId)
        }
      },
      { rootMargin: '-18% 0px -55% 0px', threshold: [0.12, 0.4, 0.7] },
    )

    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [sections])

  if (!sections.length) return null

  return (
    <nav aria-label="Seções do evento" className="overflow-hidden rounded-mc-small border border-mc-border bg-mc-surface">
      <ul className="flex gap-1 overflow-x-auto px-1">
        {sections.map((section) => {
          const Icon = sectionIcons[section.id]
          const active = activeId === section.id
          return (
            <li key={section.id} className="shrink-0">
              <a
                href={`#${section.id}`}
                aria-current={active ? 'location' : undefined}
                className={cn(
                  'relative inline-flex min-h-12 items-center gap-2 px-3 font-mc-interface text-sm font-semibold transition-colors duration-mc-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mc-focus sm:px-4',
                  active ? 'text-mc-action' : 'text-mc-text-secondary hover:text-mc-text-primary',
                )}
              >
                <Icon size={16} aria-hidden="true" className="shrink-0" />
                {section.label}
                {active ? <span className="absolute inset-x-3 bottom-0 h-0.5 bg-mc-action" aria-hidden="true" /> : null}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
