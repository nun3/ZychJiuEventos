import { notFound } from 'next/navigation'
import { Alert } from '@/components/ui/Alert'
import { PublicEventFrame } from '@/components/events/public-event/PublicEventFrame'
import { findPublicReleaseEvent } from '@/lib/events/public-access'
import { getPublicEventChecking, type PublicCheckingAthlete } from '@/lib/events/public-checking'
import type { PublicEventStatus } from '@/lib/events/public-event-presentation'

function initial(name: string) {
  return name.trim().charAt(0).toUpperCase() || '?'
}

export default async function PublicParticipantsPage({ params }: { params: { id: string } }) {
  const event = await findPublicReleaseEvent(params.id)
  if (!event) notFound()
  const checking = await getPublicEventChecking(params.id)
  const groups: { category: string; athletes: PublicCheckingAthlete[] }[] = []
  for (const athlete of checking.athletes) {
    const group = groups.find((item) => item.category === athlete.category)
    if (group) group.athletes.push(athlete)
    else groups.push({ category: athlete.category, athletes: [athlete] })
  }

  return (
    <PublicEventFrame
      eventId={event.id}
      status={event.status as PublicEventStatus}
      current="participantes"
      kicker="Lista pública"
      title={`Participantes — ${event.nome}`}
      lede="Nome, equipe e categoria das inscrições efetivadas. A projeção pública não inclui foto, ranking, país nem peso."
    >
      {checking.error ? (
        <Alert className="mt-10" role="alert" variant="error" title="Não foi possível carregar os participantes">
          Tente novamente. Nenhum dado administrativo foi exposto.
        </Alert>
      ) : checking.athletes.length === 0 ? (
        <section className="mt-12 border-y border-mc-border py-14">
          <h2 className="font-mc-display text-3xl font-bold uppercase leading-[0.95] tracking-[-0.03em] text-mc-text-primary">Nenhum participante na lista pública</h2>
          <p className="mt-4 max-w-xl font-mc-interface text-base leading-7 text-mc-text-secondary">
            A lista reúne as inscrições efetivadas quando a checagem está liberada. Antes disso, esta seção fica vazia.
          </p>
        </section>
      ) : (
        <div className="mt-12 space-y-12">
          {groups.map((group) => (
            <section key={group.category} aria-label={group.category}>
              <h2 className="font-mc-display text-2xl font-bold uppercase leading-none tracking-[-0.03em] text-mc-text-primary">{group.category}</h2>
              <ol className="mt-4 border-t border-mc-border">
                {group.athletes.map((athlete) => (
                  <li key={`${group.category}-${athlete.name}`} className="grid grid-cols-[3rem_minmax(0,1fr)] items-center gap-4 border-b border-mc-border py-3 sm:grid-cols-[3rem_minmax(0,1.4fr)_minmax(0,1fr)]">
                    <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center bg-mc-nav-dark font-mc-display text-lg font-bold text-white">
                      {initial(athlete.name)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-mc-interface text-base font-semibold text-mc-text-primary">{athlete.name}</span>
                      <span className="mt-0.5 block truncate font-mc-interface text-sm text-mc-text-secondary">{athlete.team || 'Sem equipe informada'}</span>
                    </span>
                    <span className="col-start-2 font-mc-interface text-sm text-mc-text-secondary sm:col-start-auto">{athlete.category}</span>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </PublicEventFrame>
  )
}
