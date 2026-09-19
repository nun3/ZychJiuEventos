'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CalendarDays, ClipboardList, LayoutDashboard, UserRound, UsersRound } from 'lucide-react'

export default function InternalNavigation({ canManageEvents = false }: { canManageEvents?: boolean }) {
  const pathname = usePathname()
  const items = [
    { href: '/dashboard', label: 'Visão geral', icon: LayoutDashboard, active: (path: string) => path === '/dashboard' },
    canManageEvents ? { href: '/admin/eventos', label: 'Eventos', icon: CalendarDays, active: (path: string) => path.startsWith('/admin/eventos') } : null,
    { href: '/dashboard/meus-atletas', label: 'Atletas', icon: UsersRound, active: (path: string) => path.startsWith('/dashboard/meus-atletas') },
    { href: '/dashboard/inscricoes', label: 'Inscrições', icon: ClipboardList, active: (path: string) => path.startsWith('/dashboard/inscricoes') || path.startsWith('/dashboard/pagamentos') },
    { href: '/dashboard/meu-perfil', label: 'Perfil', icon: UserRound, active: (path: string) => path === '/dashboard/meu-perfil' || path === '/dashboard/alterar-cadastro' },
  ].filter((item): item is NonNullable<typeof item> => Boolean(item))

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
