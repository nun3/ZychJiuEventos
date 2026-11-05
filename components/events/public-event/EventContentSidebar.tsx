'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/components/ui/utils'
import type { PublicEventSection, PublicEventSectionId } from '@/lib/events/public-event-presentation'

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
    <nav aria-label="Seções do evento" className="border-b border-mc-border">
      <ul className="flex gap-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {sections.map((section) => {
          const active = activeId === section.id
          return (
            <li key={section.id} className="shrink-0">
              <a
                href={`#${section.id}`}
                aria-current={active ? 'location' : undefined}
                className={cn(
                  'group relative inline-flex h-12 items-center px-3 font-mc-interface text-[0.8125rem] font-bold uppercase tracking-[0.14em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mc-focus',
                  active ? 'text-mc-text-primary' : 'text-mc-text-secondary hover:text-mc-text-primary',
                )}
              >
                {section.label}
                <span
                  aria-hidden="true"
                  className={cn(
                    'pointer-events-none absolute bottom-0 left-1/2 h-0.5 w-9 -translate-x-1/2 bg-mc-action transition-opacity duration-200',
                    active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                  )}
                />
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
