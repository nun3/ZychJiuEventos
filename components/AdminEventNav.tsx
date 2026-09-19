import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const surfaces = [
  { segment: 'configuracao', label: 'Configurar' },
  { segment: 'checagem', label: 'Checagem' },
  { segment: 'financeiro', label: 'Financeiro' },
  { segment: 'chaves', label: 'Chaves' },
  { segment: 'programacao', label: 'Programação' },
  { segment: 'resultados', label: 'Resultados' },
] as const

export type AdminEventSurface = (typeof surfaces)[number]['segment']

export function adminEventBackLink() {
  return (
    <Link href="/admin/eventos" className="inline-flex min-h-10 items-center gap-mc-8 font-semibold text-mc-action hover:underline">
      <ArrowLeft aria-hidden="true" size={18} />
      Voltar para eventos
    </Link>
  )
}

export default function AdminEventNav({ eventId, current }: { eventId: string; current: AdminEventSurface }) {
  return (
    <nav aria-label="Operação do evento" className="mt-mc-16 overflow-x-auto border-b border-mc-border">
      <div className="flex min-w-max gap-mc-4">
        {surfaces.map((item) => {
          const href = `/admin/eventos/${eventId}/${item.segment}`
          const active = item.segment === current
          return (
            <Link
              key={item.segment}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={`inline-flex min-h-11 items-center px-mc-12 font-mc-interface text-sm font-semibold transition-colors duration-mc-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mc-focus ${
                active ? 'border-b-2 border-mc-action text-mc-action' : 'border-b-2 border-transparent text-mc-text-secondary hover:text-mc-text-primary'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
