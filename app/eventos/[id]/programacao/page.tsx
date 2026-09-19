import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CalendarClock, CheckCircle2, Flag, Info } from 'lucide-react'
import ModernFooter from '@/components/ModernFooter'
import ModernNavbar from '@/components/ModernNavbar'
import {
  Alert,
  Card,
  EmptyState,
  FormField,
  MobileRecord,
  MobileRecordHeader,
  MobileRecordMeta,
  MobileRecordStatus,
  MobileRecordTitle,
  PageContainer,
  PageHeader,
  Select,
  StatusBadge,
} from '@/components/ui'
import { getPublicEventSchedule, type PublicScheduleMatch } from '@/lib/events/public-schedule'
import { formatFightDurationLabel } from '@/lib/events/fight-duration'
import { createClient } from '@/lib/supabase/server'

const publicStatuses = ['publicado', 'inscricao', 'pagamento', 'checagem', 'chaves', 'em_andamento', 'concluido'] as const

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

function MatchRecord({ match }: { match: PublicScheduleMatch }) {
  const duration = formatFightDurationLabel(match.durationMinutes, 'long')
  return (
    <MobileRecord aria-label={`Luta ${match.fightNumber}`}>
      <MobileRecordHeader>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-mc-text-secondary">Luta</p>
          <MobileRecordTitle className="mt-mc-4">Luta {match.fightNumber}</MobileRecordTitle>
        </div>
        <StatusBadge variant={match.status === 'pendente' ? 'neutral' : match.isWalkover ? 'warning' : 'success'}>
          {match.status === 'pendente' ? 'Pendente' : match.isWalkover ? 'WO' : 'Concluída'}
        </StatusBadge>
      </MobileRecordHeader>
      <MobileRecordMeta>
        Área {match.areaNumber} — {match.areaName} · {match.category} · Subchave {match.groupLabel} · {roundLabel(match)}{duration ? ` · ${duration}` : ''}
      </MobileRecordMeta>
      <div className="mt-mc-16 grid min-w-0 gap-mc-8 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-start">
        <p className={`break-words font-semibold ${match.winner === match.sideA.name ? 'text-mc-success' : 'text-mc-text-primary'}`}>
          {sideLine(match.sideA)}
        </p>
        <span aria-hidden="true" className="text-sm text-mc-text-secondary">×</span>
        <p className={`break-words font-semibold sm:text-right ${match.winner === match.sideB.name ? 'text-mc-success' : 'text-mc-text-primary'}`}>
          {sideLine(match.sideB)}
        </p>
      </div>
      {match.winner ? (
        <MobileRecordStatus>
          <p className={`flex items-center gap-mc-4 text-sm font-semibold ${match.isWalkover ? 'text-mc-warning' : 'text-mc-success'}`}>
            {match.isWalkover ? <Flag aria-hidden="true" size={16} /> : <CheckCircle2 aria-hidden="true" size={16} />}
            {match.isWalkover ? `Vitória por WO: ${match.winner}` : `Vencedor: ${match.winner}`}
          </p>
        </MobileRecordStatus>
      ) : null}
    </MobileRecord>
  )
}

export default async function PublicSchedulePage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: SearchParams
}) {
  const supabase = createClient()
  const [{ data: event }, schedule] = await Promise.all([
    supabase
      .from('events')
      .select('id, nome, status')
      .eq('id', params.id)
      .in('status', publicStatuses)
      .maybeSingle(),
    getPublicEventSchedule(params.id),
  ])

  if (!event) notFound()

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
    <main className="min-h-screen bg-mc-background">
      <ModernNavbar />
      <PageContainer className="pb-mc-64 pt-32 sm:pt-36">
        <PageHeader
          title={`Programação — ${event.nome}`}
          description="Ordem oficial das lutas por número global e área. Rascunhos não são exibidos."
          breadcrumb={
            <Link href={`/eventos/${event.id}`} className="inline-flex min-h-10 items-center gap-mc-8 rounded-mc-small px-mc-8 font-semibold text-mc-action hover:bg-mc-action/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus">
              <ArrowLeft aria-hidden="true" size={18} />
              Voltar para o evento
            </Link>
          }
          actions={<StatusBadge variant={schedule.matches.length ? 'success' : 'neutral'}>{schedule.matches.length ? 'Publicada' : 'Indisponível'}</StatusBadge>}
        />

        {schedule.error ? (
          <Alert className="mt-mc-24" role="alert" variant="error" title="Não foi possível carregar a programação">
            Tente novamente. Nenhum dado administrativo foi exposto.
          </Alert>
        ) : !schedule.matches.length ? (
          <EmptyState
            className="mt-mc-24 rounded-mc-medium border border-mc-border bg-mc-surface"
            icon={<CalendarClock size={34} />}
            title="Nenhuma programação publicada"
            description="A ordem oficial das lutas aparecerá aqui depois que a organização publicar a programação."
          />
        ) : (
          <div className="mt-mc-24 space-y-mc-24">
            <Alert variant="info" icon={<Info size={20} />} title="Consulta oficial">
              A fila segue o número global da luta. Filtre por área, categoria, equipe ou professor operacional da inscrição. A duração oficial aparece como Tempo quando a organização a configurou.
            </Alert>

            <Card className="p-mc-16 sm:p-mc-24">
              <form method="get" className="grid gap-mc-16 md:grid-cols-5 md:items-end">
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
                  className="inline-flex min-h-11 items-center justify-center rounded-mc-medium bg-mc-action px-mc-16 font-mc-interface text-sm font-semibold text-white transition-colors duration-mc-normal hover:bg-mc-action/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2"
                >
                  Filtrar
                </button>
              </form>
            </Card>

            {filters.professor ? (
              <h2 className="font-mc-display text-mc-h2 text-mc-text-primary">Lutas do professor {filters.professor}</h2>
            ) : filters.equipe ? (
              <h2 className="font-mc-display text-mc-h2 text-mc-text-primary">Lutas da equipe {filters.equipe}</h2>
            ) : null}

            {visible.length ? (
              <ol className="space-y-mc-12">
                {visible.map((match) => (
                  <li key={match.fightNumber}>
                    <MatchRecord match={match} />
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState
                className="rounded-mc-medium border border-mc-border bg-mc-surface"
                title="Nenhuma luta neste filtro"
                description="Ajuste área, categoria, equipe ou professor para ver a fila oficial."
              />
            )}
          </div>
        )}
      </PageContainer>
      <ModernFooter />
    </main>
  )
}
