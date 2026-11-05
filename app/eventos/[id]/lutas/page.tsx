import { notFound } from 'next/navigation'
import { Alert } from '@/components/ui/Alert'
import { PublicEventFrame } from '@/components/events/public-event/PublicEventFrame'
import { findPublicReleaseEvent } from '@/lib/events/public-access'
import { getPublicEventSchedule } from '@/lib/events/public-schedule'
import type { PublicEventStatus } from '@/lib/events/public-event-presentation'

function statusLabel(status: string, walkover: boolean) {
  if (status === 'wo' || walkover) return 'WO'
  if (status === 'concluido') return 'Concluída'
  return 'Pendente'
}

export default async function PublicMatchesPage({ params }: { params: { id: string } }) {
  const event = await findPublicReleaseEvent(params.id)
  if (!event) notFound()
  const schedule = await getPublicEventSchedule(params.id)

  return (
    <PublicEventFrame
      eventId={event.id}
      status={event.status as PublicEventStatus}
      current="lutas"
      kicker="Confrontos oficiais"
      title={`Lutas — ${event.nome}`}
      lede="As lutas publicadas na programação, na ordem do número global. Rascunho de área não aparece aqui."
    >
      {schedule.error ? (
        <Alert className="mt-10" role="alert" variant="error" title="Não foi possível carregar as lutas">
          Tente novamente. Nenhum dado administrativo foi exposto.
        </Alert>
      ) : schedule.matches.length === 0 ? (
        <section className="mt-12 border-y border-mc-border py-14">
          <h2 className="font-mc-display text-3xl font-bold uppercase leading-[0.95] tracking-[-0.03em] text-mc-text-primary">Nenhuma luta publicada</h2>
          <p className="mt-4 max-w-xl font-mc-interface text-base leading-7 text-mc-text-secondary">
            Os confrontos entram nesta lista quando a organização publica o horário.
          </p>
        </section>
      ) : (
        <ol className="mt-12 border-t border-mc-border">
          {schedule.matches.map((match) => (
            <li key={match.fightNumber} className="grid items-center gap-3 border-b border-mc-border py-4 md:grid-cols-[5rem_minmax(0,1fr)_auto]">
              <p className="border-l-4 border-mc-action pl-3 font-mc-display text-2xl font-bold leading-none">{String(match.fightNumber).padStart(2, '0')}</p>
              <div className="min-w-0">
                <p className="font-mc-interface text-[11px] font-semibold uppercase tracking-[0.14em] text-mc-text-secondary">
                  {match.category} · Área {match.areaNumber}
                </p>
                <p className="mt-1 font-mc-interface text-base font-semibold text-mc-text-primary">
                  {match.sideA.name} <span className="font-normal text-mc-text-secondary">×</span> {match.sideB.name}
                </p>
              </div>
              <p className="font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] text-mc-text-primary">
                <span aria-hidden="true" className={`mr-2 inline-block h-2 w-2 ${match.status === 'pendente' ? 'bg-mc-text-secondary' : match.isWalkover ? 'bg-mc-warning' : 'bg-mc-success'}`} />
                {statusLabel(match.status, match.isWalkover)}
              </p>
            </li>
          ))}
        </ol>
      )}
    </PublicEventFrame>
  )
}
