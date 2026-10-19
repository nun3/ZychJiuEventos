'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import AdminEventNav, {
  adminEventSurfaceFromPath,
  PendingAdminSurfaceProvider,
  type AdminEventSurface,
} from '@/components/AdminEventNav'
import { EventAdminHero } from '@/components/events/admin/EventAdminHero'
import { Coachmark } from '@/components/onboarding/Coachmark'
import type { CoachmarkId } from '@/components/onboarding/Coachmark'
import type { AdminEventHeroData } from '@/lib/events/admin-event-presentation'
import { ModuleLoading } from '@/components/events/admin/ModuleLoading'

const descriptions: Partial<Record<AdminEventSurface, string>> = {
  configuracao: 'As versões de categorias são imutáveis. Você pode ajustar a duração da luta depois, sem criar uma nova versão.',
  checagem: 'Lista oficial das inscrições efetivadas. Pendentes, expiradas, canceladas e estornadas não entram na checagem.',
  financeiro: 'Conciliação operacional das reservas e fechamento a partir das inscrições e pagamentos persistidos.',
  chaves: 'Gere a sugestão automática, ajuste o casamento em rascunho e publique a versão oficial.',
  programacao: 'Distribua subchaves por área e organize a numeração global das lutas.',
  resultados: 'Confirme pesagem e premiação por subchave. O resultado continua vindo das lutas já operadas.',
}

const coachmarks: Partial<Record<AdminEventSurface, CoachmarkId>> = {
  checagem: 'checagem',
  financeiro: 'financeiro',
  chaves: 'chaves',
  programacao: 'programacao',
  resultados: 'resultados',
}

type EventAdminShellProps = {
  event: AdminEventHeroData
  guidance: ReactNode
  children: ReactNode
}

/**
 * Cabeçalho das seis superfícies. O módulo entra como filho e, no clique,
 * dá lugar ao estado de carregando antes de o servidor responder.
 */
export function EventAdminShell({ event, guidance, children }: EventAdminShellProps) {
  const pathSurface = adminEventSurfaceFromPath(usePathname())
  const [pending, setPending] = useState<AdminEventSurface | null>(null)
  useEffect(() => {
    setPending(null)
  }, [pathSurface])
  const surface = pending || pathSurface
  if (!surface) return children

  const coachmark = coachmarks[surface]
  const waiting = Boolean(pending && pending !== pathSurface)

  return (
    <PendingAdminSurfaceProvider surface={surface}>
      <EventAdminHero event={event} description={descriptions[surface]} />
      {guidance}
      <AdminEventNav eventId={event.id} onIntent={setPending} />
      {coachmark ? (
        <div className="mt-2">
          <Coachmark id={coachmark} />
        </div>
      ) : null}
      {waiting ? <ModuleLoading /> : children}
    </PendingAdminSurfaceProvider>
  )
}
