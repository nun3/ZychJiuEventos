import { notFound } from 'next/navigation'
import { Alert } from '@/components/ui/Alert'
import { PublicEventFrame } from '@/components/events/public-event/PublicEventFrame'
import { findPublicReleaseEvent } from '@/lib/events/public-access'
import { getPublicEventBrackets } from '@/lib/events/public-brackets'
import type { PublicEventStatus } from '@/lib/events/public-event-presentation'

export default async function PublicResultsPage({ params }: { params: { id: string } }) {
  const event = await findPublicReleaseEvent(params.id)
  if (!event) notFound()
  const brackets = await getPublicEventBrackets(params.id)
  const published = brackets.brackets.flatMap((bracket) =>
    bracket.groups
      .filter((group) => group.placements.length > 0)
      .map((group) => ({
        category: bracket.category,
        label: group.label,
        placements: [...group.placements].sort((a, b) => a.place - b.place),
      })),
  )

  return (
    <PublicEventFrame
      eventId={event.id}
      status={event.status as PublicEventStatus}
      current="resultados"
      kicker="Colocações oficiais"
      title={`Resultados — ${event.nome}`}
      lede="Colocações registradas nas chaves publicadas. Categoria sem confronto não gera campeão automático."
    >
      {brackets.error ? (
        <Alert className="mt-10" role="alert" variant="error" title="Não foi possível carregar os resultados">
          Tente novamente. Nenhum dado administrativo foi exposto.
        </Alert>
      ) : published.length === 0 ? (
        <section className="mt-12 border-y border-mc-border py-14">
          <h2 className="font-mc-display text-3xl font-bold uppercase leading-[0.95] tracking-[-0.03em] text-mc-text-primary">Nenhum resultado publicado</h2>
          <p className="mt-4 max-w-xl font-mc-interface text-base leading-7 text-mc-text-secondary">
            As colocações aparecem aqui quando a chave registra o encerramento do grupo.
          </p>
        </section>
      ) : (
        <div className="mt-12 space-y-12">
          {published.map((group) => (
            <section key={`${group.category}-${group.label}`} aria-label={`${group.category} ${group.label}`}>
              <h2 className="font-mc-display text-2xl font-bold uppercase leading-none tracking-[-0.03em]">{group.category}</h2>
              <p className="mt-2 font-mc-interface text-[11px] font-semibold uppercase tracking-[0.14em] text-mc-text-secondary">Grupo {group.label}</p>
              <ol className="mt-4 border-t border-mc-border">
                {group.placements.map((placement) => (
                  <li key={`${placement.place}-${placement.athlete.name}`} className="grid grid-cols-[3rem_minmax(0,1fr)] items-center gap-4 border-b border-mc-border py-3">
                    <span className="font-mc-display text-2xl font-bold leading-none text-mc-action">{placement.place}º</span>
                    <span className="min-w-0">
                      <span className="block truncate font-mc-interface font-semibold text-mc-text-primary">{placement.athlete.name}</span>
                      <span className="block truncate font-mc-interface text-sm text-mc-text-secondary">{placement.athlete.team || 'Sem equipe informada'}</span>
                    </span>
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