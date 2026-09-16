'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, LayoutDashboard, UserRound, UsersRound } from 'lucide-react'

const items = [
  { href: '/dashboard', label: 'Visão geral', icon: LayoutDashboard, active: (pathname: string) => pathname === '/dashboard' },
  { href: '/admin/eventos', label: 'Eventos', icon: CalendarDays, active: (pathname: string) => pathname.startsWith('/admin/eventos') },
  { href: '/dashboard/meus-atletas', label: 'Atletas', icon: UsersRound, active: (pathname: string) => pathname.startsWith('/dashboard/meus-atletas') },
  { href: '/dashboard/meu-perfil', label: 'Perfil', icon: UserRound, active: (pathname: string) => pathname === '/dashboard/meu-perfil' || pathname === '/dashboard/alterar-cadastro' },
]

export default function InternalNavigation() {
  const pathname = usePathname()

  return (
    <nav aria-label="Navegação da área interna" className="sticky top-20 z-40 border-b border-mc-border bg-mc-surface">
      <div className="mx-auto flex max-w-7xl overflow-x-auto px-4 sm:px-6 lg:px-8">
        {items.map((item) => {
          const isActive = item.active(pathname)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={`inline-flex min-h-14 shrink-0 items-center gap-mc-8 border-b-2 px-mc-12 font-mc-interface text-sm font-semibold transition-colors duration-mc-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mc-focus sm:px-mc-16 ${
                isActive
                  ? 'border-mc-action text-mc-action'
                  : 'border-transparent text-mc-text-secondary hover:text-mc-text-primary'
              }`}
            >
              <item.icon aria-hidden="true" size={18} />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
