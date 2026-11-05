import { notFound } from 'next/navigation'
import { Alert } from '@/components/ui/Alert'
import { FormField } from '@/components/ui/FormField'
import { Select } from '@/components/ui/Select'
import { PublicEventFrame } from '@/components/events/public-event/PublicEventFrame'
import { getPublicEventSchedule, type PublicScheduleMatch } from '@/lib/events/public-schedule'
import { formatFightDurationLabel } from '@/lib/events/fight-duration'
import { findPublicReleaseEvent } from '@/lib/events/public-access'
import type { PublicEventStatus } from '@/lib/events/public-event-presentation'

type SearchParams = {
  area?: string
  categoria?: string
  equipe?: string
  professor?: string
}

function unique(values: Array<string | number>) {
  return Array.from(new Set(values.map(String))).sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }))
}

function roundLabel(match: PublicScheduleMatch) {
  return match.round === 'final' ? 'Final' : `Semifinal ${match.order}`
}

function sideLine(side: PublicScheduleMatch['sideA']) {
  if (!side.resolved) return side.name
  const parts = [side.name, side.team, side.professor].filter(Boolean)
  return parts.join(' — ')
}

function matchesFilters(match: PublicScheduleMatch, filters: SearchParams) {
  if (filters.area && String(match.areaNumber) !== filters.area) return false
  if (filters.categoria && match.category !== filters.categoria) return false
  if (filters.equipe && match.sideA.team !== filters.equipe && match.sideB.team !== filters.equipe) return false
  if (filters.professor && match.sideA.professor !== filters.professor && match.sideB.professor !== filters.professor) return false
  return true
}

function statusLabel(match: PublicScheduleMatch) {
  if (match.isWalkover || match.status === 'wo') return 'WO'
  if (match.status === 'concluido') return 'Concluída'
  return 'Pendente'
}

function MatchRecord({ match }: { match: PublicScheduleMatch }) {
  const duration = formatFightDurationLabel(match.durationMinutes, 'long')
  return (
    <article aria-label={`Luta ${match.fightNumber}`} className="grid items-center gap-3 border-b border-mc-border py-4 md:grid-cols-[5rem_minmax(0,1fr)_auto]">
      <p className="border-l-4 border-mc-action pl-3 font-mc-display text-2xl font-bold leading-none">{String(match.fightNumber).padStart(2, '0')}</p>
      <div className="min-w-0">
        <p className="font-mc-interface text-[11px] font-semibold uppercase tracking-[0.14em] text-mc-text-secondary">
          Luta {match.fightNumber} · Área {match.areaNumber} — {match.areaName} · {match.category} · Subchave {match.groupLabel} · {roundLabel(match)}{duration ? ` · ${duration}` : ''}
        </p>
        <p className="mt-1 font-mc-interface text-base font-semibold text-mc-text-primary">
          <span className={match.winner === match.sideA.name ? 'text-mc-success' : undefined}>{sideLine(match.sideA)}</span>
          <span className="mx-2 font-normal text-mc-text-secondary">×</span>
          <span className={match.winner === match.sideB.name ? 'text-mc-success' : undefined}>{sideLine(match.sideB)}</span>
        </p>
        {match.winner ? (
          <p className="mt-1 font-mc-interface text-sm font-semibold text-mc-text-primary">
            {match.isWalkover ? `Vitória por WO: ${match.winner}` : `Vencedor: ${match.winner}`}
          </p>
        ) : null}
      </div>
      <p className="font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] text-mc-text-primary">
        <span aria-hidden="true" className={`mr-2 inline-block h-2 w-2 ${match.status === 'pendente' ? 'bg-mc-text-secondary' : match.isWalkover ? 'bg-mc-warning' : 'bg-mc-success'}`} />
        {statusLabel(match)}
      </p>
    </article>
  )
}

export default async function PublicSchedulePage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: SearchParams
}) {
  const event = await findPublicReleaseEvent(params.id)
  if (!event) notFound()
  const schedule = await getPublicEventSchedule(params.id)

  const filters: SearchParams = {
    area: searchParams.area?.trim() || undefined,
    categoria: searchParams.categoria?.trim() || undefined,
    equipe: searchParams.equipe?.trim() || undefined,
    professor: searchParams.professor?.trim() || undefined,
  }
  const visible = schedule.matches.filter((match) => matchesFilters(match, filters))
  const areas = unique(schedule.matches.map((match) => match.areaNumber))
  const categories = unique(schedule.matches.map((match) => match.category))
  const teams = unique(
    schedule.matches.flatMap((match) => [match.sideA.team, match.sideB.team]).filter((team): team is string => Boolean(team)),
  )
  const professors = unique(
    schedule.matches.flatMap((match) => [match.sideA.professor, match.sideB.professor]).filter((professor): professor is string => Boolean(professor)),
  )

  return (
    <PublicEventFrame
      eventId={event.id}
      status={event.status as PublicEventStatus}
      current="programacao"
      kicker="Ordem oficial"
      title={`Horário — ${event.nome}`}
      lede="Ordem oficial das lutas por número global e área. Rascunhos não são exibidos."
    >
        {schedule.error ? (
          <Alert className="mt-10" role="alert" variant="error" title="Não foi possível carregar a programação">
            Tente novamente. Nenhum dado administrativo foi exposto.
          </Alert>
        ) : !schedule.matches.length ? (
          <section className="mt-12 border-y border-mc-border py-14">
            <h2 className="font-mc-display text-3xl font-bold uppercase leading-[0.95] tracking-[-0.03em] text-mc-text-primary">Nenhuma programação publicada</h2>
            <p className="mt-4 max-w-xl font-mc-interface text-base leading-7 text-mc-text-secondary">
              A ordem oficial das lutas aparecerá aqui depois que a organização publicar a programação.
            </p>
          </section>
        ) : (
          <div className="mt-12 space-y-8">
            <p className="max-w-2xl font-mc-interface text-sm leading-6 text-mc-text-secondary">
              A fila segue o número global da luta. Filtre por área, categoria, equipe ou professor operacional da inscrição. A duração oficial aparece como Tempo quando a organização a configurou.
            </p>

            <form method="get" className="grid gap-4 border-y border-mc-border py-6 md:grid-cols-5 md:items-end">
                <FormField id="area" label="Área">
                  <Select name="area" defaultValue={filters.area || ''}>
                    <option value="">Todas</option>
                    {areas.map((area) => {
                      const sample = schedule.matches.find((match) => String(match.areaNumber) === area)
                      return (
                        <option key={area} value={area}>
                          Área {area}{sample ? ` — ${sample.areaName}` : ''}
                        </option>
                      )
                    })}
                  </Select>
                </FormField>
                <FormField id="categoria" label="Categoria">
                  <Select name="categoria" defaultValue={filters.categoria || ''}>
                    <option value="">Todas</option>
                    {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                  </Select>
                </FormField>
                <FormField id="equipe" label="Equipe">
                  <Select name="equipe" defaultValue={filters.equipe || ''}>
                    <option value="">Todas</option>
                    {teams.map((team) => <option key={team} value={team}>{team}</option>)}
                  </Select>
                </FormField>
                <FormField id="professor" label="Professor">
                  <Select name="professor" defaultValue={filters.professor || ''} aria-label="Filtrar por professor">
                    <option value="">Todos</option>
                    {professors.map((professor) => <option key={professor} value={professor}>{professor}</option>)}
                  </Select>
                </FormField>
                <button
                  type="submit"
                  className="inline-flex min-h-12 items-center justify-center bg-mc-text-primary px-4 font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-colors duration-200 hover:bg-mc-structure focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
                >
                  Filtrar
                </button>
              </form>

            {filters.professor ? (
              <h2 className="font-mc-display text-mc-h2 text-mc-text-primary">Lutas do professor {filters.professor}</h2>
            ) : filters.equipe ? (
              <h2 className="font-mc-display text-mc-h2 text-mc-text-primary">Lutas da equipe {filters.equipe}</h2>
            ) : null}

            {visible.length ? (
              <ol className="border-t border-mc-border">
                {visible.map((match) => (
                  <li key={match.fightNumber}>
                    <MatchRecord match={match} />
                  </li>
                ))}
              </ol>
            ) : (
              <section className="border-y border-mc-border py-14">
                <h2 className="font-mc-display text-3xl font-bold uppercase leading-[0.95] tracking-[-0.03em] text-mc-text-primary">Nenhuma luta neste filtro</h2>
                <p className="mt-4 max-w-xl font-mc-interface text-base leading-7 text-mc-text-secondary">
                  Ajuste área, categoria, equipe ou professor para ver a fila oficial.
                </p>
              </section>
            )}
          </div>
        )}
    </PublicEventFrame>
  )
}
