'use client'

import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarClock,
  ClipboardCheck,
  GitBranch,
  Layers3,
  Trophy,
  Wallet,
} from 'lucide-react'

const surfaces = [
  { segment: 'configuracao', label: 'Configuração', icon: Layers3 },
  { segment: 'checagem', label: 'Checagem', icon: ClipboardCheck },
  { segment: 'financeiro', label: 'Financeiro', icon: Wallet },
  { segment: 'chaves', label: 'Chaves', icon: GitBranch },
  { segment: 'programacao', label: 'Programação', icon: CalendarClock },
  { segment: 'resultados', label: 'Resultados', icon: Trophy },
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
    <Link href="/admin/eventos" className="inline-flex min-h-10 items-center gap-mc-8 font-semibold text-mc-action hover:underline">
      Voltar para eventos
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
    <nav ref={scrollerRef} aria-label="Operação do evento" className="mt-4 max-w-full overflow-x-auto rounded-t-mc-medium border-b border-mc-border bg-mc-surface">
      <div className="flex min-w-max gap-1 lg:min-w-0">
        {surfaces.map((item) => {
          const href = `/admin/eventos/${eventId}/${item.segment}`
          const active = item.segment === activeSegment
          const Icon = item.icon
          return (
            <Link
              key={item.segment}
              href={href}
              scroll={false}
              prefetch
              onClick={() => onIntent(item.segment)}
              aria-current={active ? 'page' : undefined}
              className={`inline-flex min-h-12 shrink-0 items-center justify-center gap-2 px-4 font-mc-interface text-sm font-semibold transition-colors duration-mc-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mc-focus lg:flex-1 ${
                active
                  ? 'border-b-2 border-mc-action bg-mc-action/5 text-mc-action'
                  : 'border-b-2 border-transparent text-mc-text-secondary hover:text-mc-text-primary'
              }`}
            >
              <Icon aria-hidden="true" size={16} />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
