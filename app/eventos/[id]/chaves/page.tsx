import { notFound } from 'next/navigation'
import { Alert } from '@/components/ui/Alert'
import { PublicEventFrame } from '@/components/events/public-event/PublicEventFrame'
import { getPublicEventBrackets, type PublicBracketGroup } from '@/lib/events/public-brackets'
import { formatFightDurationLabel } from '@/lib/events/fight-duration'
import { findPublicReleaseEvent } from '@/lib/events/public-access'
import type { PublicEventStatus } from '@/lib/events/public-event-presentation'

const topologyNames = {
  final_2: 'Final direta',
  copo_3: 'Copo com 3 atletas',
  semi_4: 'Semifinais com 4 atletas',
}

function matchStatus(match: PublicBracketGroup['matches'][number]) {
  if (match.isWalkover || match.status === 'wo') return 'WO'
  if (match.status === 'concluido') return 'Concluído'
  return 'Pendente'
}

function Group({ group }: { group: PublicBracketGroup }) {
  return (
    <section aria-label={`Grupo ${group.label}`} className="border-t border-mc-border py-8 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h3 className="font-mc-display text-2xl font-bold uppercase leading-none tracking-[-0.03em] text-mc-text-primary">Grupo {group.label}</h3>
        <p className="font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] text-mc-text-secondary">{topologyNames[group.topology]}</p>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <ol aria-label={`Posições do grupo ${group.label}`} className="border-t border-mc-border">
          {group.slots.map((slot) => (
            <li key={slot.position} className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-mc-border py-3">
              <span className="border-l-4 border-mc-action pl-3 font-mc-display text-xl font-bold leading-none">{String(slot.position).padStart(2, '0')}</span>
              <span className="min-w-0">
                <span className="block truncate font-mc-interface font-semibold text-mc-text-primary">{slot.athlete}</span>
                <span className="block truncate font-mc-interface text-sm text-mc-text-secondary">{slot.team || 'Sem equipe informada'}</span>
              </span>
              {slot.role === 'copo' ? (
                <span className="font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] text-mc-text-primary">
                  <span aria-hidden="true" className="mr-2 inline-block h-2 w-2 bg-mc-action" />
                  Copo
                </span>
              ) : null}
            </li>
          ))}
        </ol>

        <div>
          <h4 className="font-mc-interface text-[11px] font-semibold uppercase tracking-[0.18em] text-mc-text-secondary">Confrontos</h4>
          <ol className="mt-3 border-t border-mc-border">
            {group.matches.map((match) => (
              <li key={`${match.round}-${match.order}`} className="grid items-center gap-3 border-b border-mc-border py-4 md:grid-cols-[minmax(0,1fr)_auto]">
                <div className="min-w-0">
                  <p className="font-mc-interface text-[11px] font-semibold uppercase tracking-[0.14em] text-mc-text-secondary">
                    {match.round === 'semifinal' ? `Semifinal ${match.order}` : 'Final'}
                  </p>
                  <p className="mt-1 font-mc-interface text-base font-semibold text-mc-text-primary">
                    <span className={match.winner === match.sideA ? 'text-mc-success' : undefined}>{match.sideA}</span>
                    <span className="mx-2 font-normal text-mc-text-secondary">×</span>
                    <span className={match.winner === match.sideB ? 'text-mc-success' : undefined}>{match.sideB}</span>
                  </p>
                  {match.winner ? (
                    <p className="mt-1 font-mc-interface text-sm font-semibold text-mc-text-primary">
                      {match.isWalkover ? `Vitória por WO: ${match.winner}` : `Vencedor: ${match.winner}`}
                    </p>
                  ) : null}
                </div>
                <p className="font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] text-mc-text-primary">
                  <span
                    aria-hidden="true"
                    className={`mr-2 inline-block h-2 w-2 ${match.status === 'pendente' ? 'bg-mc-text-secondary' : match.isWalkover ? 'bg-mc-warning' : 'bg-mc-success'}`}
                  />
                  {matchStatus(match)}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {group.placements.length ? (
        <div className="mt-8 border-t border-mc-border pt-6">
          <h4 className="font-mc-display text-xl font-bold uppercase leading-none tracking-[-0.03em] text-mc-text-primary">Colocações</h4>
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
        </div>
      ) : null}
    </section>
  )
}

export default async function PublicBracketsPage({ params }: { params: { id: string } }) {
  const event = await findPublicReleaseEvent(params.id)
  if (!event) notFound()
  const bracketResult = await getPublicEventBrackets(params.id)

  return (
    <PublicEventFrame
      eventId={event.id}
      status={event.status as PublicEventStatus}
      current="chaves"
      kicker="Composição oficial"
      title={`Chaves — ${event.nome}`}
      lede="Composição oficial publicada pela organização do evento."
    >
      {bracketResult.error ? (
        <Alert className="mt-10" role="alert" variant="error" title="Não foi possível carregar as chaves">
          Tente novamente. Nenhum dado administrativo foi exposto.
        </Alert>
      ) : !bracketResult.brackets.length ? (
        <section className="mt-12 border-y border-mc-border py-14">
          <h2 className="font-mc-display text-3xl font-bold uppercase leading-[0.95] tracking-[-0.03em] text-mc-text-primary">Nenhuma chave publicada</h2>
          <p className="mt-4 max-w-xl font-mc-interface text-base leading-7 text-mc-text-secondary">
            Rascunhos não são exibidos. As chaves oficiais aparecerão aqui após a publicação pela organização.
          </p>
        </section>
      ) : (
        <div className="mt-12 space-y-12">
          <p className="max-w-2xl font-mc-interface text-sm leading-6 text-mc-text-secondary">
            Esta página acompanha a composição oficial, o avanço dos vencedores, WO e colocações. A ordem das lutas por área está no horário. Placar por pontos não faz parte desta consulta.
          </p>

          {bracketResult.brackets.map((bracket) => {
            const duration = formatFightDurationLabel(bracket.durationMinutes, 'long')
            return (
              <section key={bracket.category} className="border-y border-mc-border py-8">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="font-mc-interface text-[11px] font-semibold uppercase tracking-[0.18em] text-mc-text-secondary">Categoria</p>
                    <h2 className="mt-2 font-mc-display text-3xl font-bold uppercase leading-[0.95] tracking-[-0.03em] text-mc-text-primary">{bracket.category}</h2>
                    {duration ? <p className="mt-2 font-mc-interface text-sm font-semibold text-mc-text-primary">{duration}</p> : null}
                  </div>
                  <p className="font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] text-mc-text-primary">
                    <span
                      aria-hidden="true"
                      className={`mr-2 inline-block h-2 w-2 ${bracket.status === 'concluida' ? 'bg-mc-success' : bracket.status === 'em_andamento' ? 'bg-mc-action' : 'bg-mc-warning'}`}
                    />
                    {bracket.status === 'concluida' ? 'Concluída' : bracket.status === 'em_andamento' ? 'Em andamento' : 'Publicada'}
                  </p>
                </div>

                {bracket.mode === 'sem_confronto' ? (
                  <div className="mt-8 border-t border-mc-border pt-6">
                    <p className="font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] text-mc-text-primary">
                      <span aria-hidden="true" className="mr-2 inline-block h-2 w-2 bg-mc-action" />
                      Sem confronto
                    </p>
                    <p className="mt-3 font-mc-interface text-base font-semibold text-mc-text-primary">{bracket.athlete?.name || 'Atleta não informado'}</p>
                    <p className="mt-1 font-mc-interface text-sm text-mc-text-secondary">{bracket.athlete?.team || 'Sem equipe informada'}</p>
                    <p className="mt-4 font-mc-interface text-sm text-mc-text-secondary">A categoria não possui confronto nem campeão automático.</p>
                  </div>
                ) : (
                  <div className="mt-6">
                    {bracket.groups.map((group) => <Group key={group.label} group={group} />)}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}
    </PublicEventFrame>
  )
}
