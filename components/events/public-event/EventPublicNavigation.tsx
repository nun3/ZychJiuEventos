import Link from 'next/link'
import { ClipboardList, FileText, GitBranch, CalendarDays } from 'lucide-react'
import { cn } from '@/components/ui/utils'
import type { PublicEventNavItem } from '@/lib/events/public-event-presentation'

const icons: Record<string, typeof FileText> = {
  informacoes: FileText,
  checagem: ClipboardList,
  chaves: GitBranch,
  programacao: CalendarDays,
}

export default function EventPublicNavigation({ items }: { items: PublicEventNavItem[] }) {
  return (
    <nav
      aria-label="Navegação do campeonato"
      className="sticky top-20 z-30 border-b border-white/10 bg-mc-nav-dark"
    >
      <div className="flex w-full gap-1 overflow-x-auto px-4 sm:px-8 lg:gap-2 lg:px-12 xl:px-20">
        {items.map((item) => {
          const Icon = icons[item.id] ?? FileText
          return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={item.current ? 'page' : undefined}
            className={cn(
              'relative inline-flex min-h-12 shrink-0 items-center gap-2 px-3 font-mc-interface text-sm font-medium transition-colors duration-mc-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white lg:px-4',
              item.current ? 'text-white' : 'text-white/65 hover:text-white',
            )}
          >
            <Icon size={17} aria-hidden="true" />{item.label}
            {item.current ? (
              <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-mc-action" aria-hidden="true" />
            ) : null}
          </Link>
        )})}
      </div>
    </nav>
  )
}
