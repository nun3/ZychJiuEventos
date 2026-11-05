'use client'

import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const surfaces = [
  { segment: 'configuracao', label: 'Configuração' },
  { segment: 'checagem', label: 'Checagem' },
  { segment: 'financeiro', label: 'Financeiro' },
  { segment: 'chaves', label: 'Chaves' },
  { segment: 'programacao', label: 'Programação' },
  { segment: 'operacao', label: 'Operação LIVE' },
  { segment: 'resultados', label: 'Resultados' },
] as const

export type AdminEventSurface = (typeof surfaces)[number]['segment']

export function adminEventSurfaceFromPath(pathname: string): AdminEventSurface | null {
  const segment = pathname.split('?')[0].split('/').filter(Boolean).pop()
  return surfaces.find((item) => item.segment === segment)?.segment ?? null
}

const PendingAdminSurfaceContext = createContext<AdminEventSurface | null>(null)

export function PendingAdminSurfaceProvider({
  surface,
  children,
}: {
  surface: AdminEventSurface | null
  children: ReactNode
}) {
  return <PendingAdminSurfaceContext.Provider value={surface}>{children}</PendingAdminSurfaceContext.Provider>
}

export function useAdminEventSurface() {
  const pending = useContext(PendingAdminSurfaceContext)
  const fromPath = adminEventSurfaceFromPath(usePathname())
  return pending || fromPath
}

export function adminEventBackLink() {
  return (
    <Link href="/admin/eventos" className="inline-flex min-h-12 items-center font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] text-mc-text-secondary transition-colors duration-200 hover:text-mc-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus">
      Eventos
    </Link>
  )
}

export default function AdminEventNav({
  eventId,
  onIntent,
}: {
  eventId: string
  onIntent: (surface: AdminEventSurface) => void
}) {
  const scrollerRef = useRef<HTMLElement>(null)
  const activeSegment = useAdminEventSurface()

  useEffect(() => {
    const scroller = scrollerRef.current
    const active = scroller?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!scroller || !active || scroller.scrollWidth <= scroller.clientWidth) return
    const left = active.getBoundingClientRect().left - scroller.getBoundingClientRect().left + scroller.scrollLeft
    scroller.scrollLeft = Math.max(0, left - (scroller.clientWidth - active.offsetWidth) / 2)
  }, [activeSegment])

  return (
    <nav
      ref={scrollerRef}
      aria-label="Operação do evento"
      className="mt-4 max-w-full overflow-x-auto border-b border-mc-border bg-mc-surface [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div className="flex min-w-max lg:min-w-0">
        {surfaces.map((item) => {
          const href = `/admin/eventos/${eventId}/${item.segment}`
          const active = item.segment === activeSegment
          return (
            <Link
              key={item.segment}
              href={href}
              scroll={false}
              prefetch
              onClick={() => onIntent(item.segment)}
              aria-current={active ? 'page' : undefined}
              className={`group relative inline-flex h-12 shrink-0 items-center justify-center px-3 font-mc-interface text-[0.8125rem] font-bold uppercase tracking-[0.14em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mc-focus lg:flex-1 ${
                active ? 'text-mc-text-primary' : 'text-mc-text-secondary hover:text-mc-text-primary'
              }`}
            >
              {item.label}
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute bottom-0 left-1/2 h-0.5 w-9 -translate-x-1/2 bg-mc-action transition-opacity duration-200 ${
                  active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              />
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
