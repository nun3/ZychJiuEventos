'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

export default function InternalNavigation({
  canManageEvents = false,
  canManageOrganization = false,
  isPlatformAdmin = false,
  fluid = false,
}: {
  canManageEvents?: boolean
  canManageOrganization?: boolean
  isPlatformAdmin?: boolean
  fluid?: boolean
}) {
  const pathname = usePathname()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const items = [
    { href: '/dashboard', label: 'Visão geral', active: (path: string) => path === '/dashboard' },
    canManageEvents ? { href: '/admin/eventos', label: 'Eventos', active: (path: string) => path.startsWith('/admin/eventos') } : null,
    canManageOrganization ? { href: '/dashboard/organizacao', label: 'Organização', active: (path: string) => path.startsWith('/dashboard/organizacao') } : null,
    isPlatformAdmin ? { href: '/platform/organizacoes', label: 'Organizações', active: (path: string) => path.startsWith('/platform/organizacoes') } : null,
    isPlatformAdmin ? { href: '/platform/destaques', label: 'Destaques', active: (path: string) => path.startsWith('/platform/destaques') } : null,
    { href: '/dashboard/meus-atletas', label: 'Atletas', active: (path: string) => path.startsWith('/dashboard/meus-atletas') },
    { href: '/dashboard/inscricoes', label: 'Inscrições', active: (path: string) => path.startsWith('/dashboard/inscricoes') || path.startsWith('/dashboard/pagamentos') },
    { href: '/dashboard/meu-perfil', label: 'Perfil', active: (path: string) => path === '/dashboard/meu-perfil' || path === '/dashboard/alterar-cadastro' },
  ].filter((item): item is NonNullable<typeof item> => Boolean(item))

  useEffect(() => {
    const scroller = scrollerRef.current
    const active = scroller?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!scroller || !active || scroller.scrollWidth <= scroller.clientWidth) return
    const left = active.getBoundingClientRect().left - scroller.getBoundingClientRect().left + scroller.scrollLeft
    scroller.scrollLeft = Math.max(0, left - (scroller.clientWidth - active.offsetWidth) / 2)
  }, [pathname])

  return (
    <nav aria-label="Navegação da área interna" className="sticky top-16 z-40 border-b border-mc-border bg-white">
      <div
        ref={scrollerRef}
        className={fluid ? 'flex w-full overflow-x-auto px-4 sm:px-8 lg:px-12' : 'mx-auto flex max-w-7xl overflow-x-auto px-4 sm:px-6 lg:px-8'}
      >
        {items.map((item) => {
          const isActive = item.active(pathname)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`group relative inline-flex h-12 shrink-0 items-center px-3 font-mc-interface text-[0.8125rem] font-semibold uppercase tracking-[0.14em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mc-focus ${
                isActive ? 'text-mc-text-primary' : 'text-mc-text-secondary hover:text-mc-text-primary'
              }`}
            >
              {item.label}
              <span
                aria-hidden="true"
                className={`pointer-events-none absolute bottom-0 left-1/2 h-0.5 w-9 -translate-x-1/2 bg-mc-action transition-opacity duration-200 ${
                  isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              />
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
