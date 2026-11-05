'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import type { PublicEventNavItem } from '@/lib/events/public-event-presentation'

export default function EventPublicNavigation({ items }: { items: PublicEventNavItem[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const currentId = items.find((item) => item.current)?.id

  useEffect(() => {
    const scroller = scrollerRef.current
    const active = scroller?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!scroller || !active || scroller.scrollWidth <= scroller.clientWidth) return
    const left = active.getBoundingClientRect().left - scroller.getBoundingClientRect().left + scroller.scrollLeft
    scroller.scrollLeft = Math.max(0, left - (scroller.clientWidth - active.offsetWidth) / 2)
  }, [currentId])

  return (
    <nav aria-label="Navegação do campeonato" className="sticky top-16 z-30 border-b border-white/10 bg-mc-nav-dark">
      <div ref={scrollerRef} className="flex w-full overflow-x-auto px-4 [scrollbar-width:none] sm:px-8 lg:px-12 xl:px-20 [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            aria-current={item.current ? 'page' : undefined}
            className={`group relative inline-flex h-12 shrink-0 items-center px-3 font-mc-interface text-[0.8125rem] font-bold uppercase tracking-[0.14em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white ${
              item.current ? 'text-white' : 'text-white/65 hover:text-white'
            }`}
          >
            {item.label}
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute bottom-0 left-1/2 h-0.5 w-9 -translate-x-1/2 bg-mc-action transition-opacity duration-200 ${
                item.current ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
            />
          </Link>
        ))}
      </div>
    </nav>
  )
}
