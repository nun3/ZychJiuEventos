import { notFound } from 'next/navigation'
import { Alert } from '@/components/ui/Alert'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { FormField } from '@/components/ui/FormField'
import {
  MobileRecord,
  MobileRecordHeader,
  MobileRecordMeta,
  MobileRecordStatus,
  MobileRecordTitle,
} from '@/components/ui/MobileRecord'
import { Select } from '@/components/ui/Select'
import { PublicEventFrame } from '@/components/events/public-event/PublicEventFrame'
import { findPublicReleaseEvent } from '@/lib/events/public-access'
import { getPublicEventChecking, type PublicCheckingAthlete } from '@/lib/events/public-checking'
import type { PublicEventStatus } from '@/lib/events/public-event-presentation'

const visibleStatuses = ['checagem', 'chaves', 'em_andamento', 'concluido'] as const

type SearchParams = {
  categoria?: string
  equipe?: string
  professor?: string
}

function unique(values: Array<string | null>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value)))).sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

function matchesFilters(athlete: PublicCheckingAthlete, filters: SearchParams) {
  if (filters.categoria && athlete.category !== filters.categoria) return false
  if (filters.equipe && athlete.team !== filters.equipe) return false
  if (filters.professor && athlete.professor !== filters.professor) return false
  return true
}

const columns: Array<DataTableColumn<PublicCheckingAthlete>> = [
  { key: 'name', header: 'Atleta', render: (athlete) => athlete.name },
  { key: 'team', header: 'Equipe', render: (athlete) => athlete.team || 'Sem equipe informada' },
  { key: 'professor', header: 'Professor', render: (athlete) => athlete.professor || 'Sem professor informado' },
  {
    key: 'occupancy',
    header: 'Situação',
    render: (athlete) => (
      <p className="font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] text-mc-text-primary">
        <span aria-hidden="true" className={`mr-2 inline-block h-2 w-2 ${athlete.alone ? 'bg-mc-warning' : 'bg-mc-text-secondary'}`} />
        {athlete.alone ? 'Atleta sozinho' : 'Categoria com adversários'}
      </p>
    ),
  },
]

export default async function PublicCheckingPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: SearchParams
}) {
  const event = await findPublicReleaseEvent(params.id)
  if (!event) notFound()
  const checking = await getPublicEventChecking(params.id)

  const filters: SearchParams = {
    categoria: searchParams.categoria?.trim() || undefined,
    equipe: searchParams.equipe?.trim() || undefined,
    professor: searchParams.professor?.trim() || undefined,
  }
  const visible = checking.athletes.filter((athlete) => matchesFilters(athlete, filters))
  const categories = unique(checking.athletes.map((athlete) => athlete.category))
  const teams = unique(checking.athletes.map((athlete) => athlete.team))
  const professors = unique(checking.athletes.map((athlete) => athlete.professor))
  const groups = categories
    .map((category) => ({
      category,
      athletes: visible.filter((athlete) => athlete.category === category),
    }))
    .filter((group) => group.athletes.length)

  const listOfficial = visibleStatuses.includes(event.status as typeof visibleStatuses[number]) && checking.athletes.length

  return (
    <PublicEventFrame
      eventId={event.id}
      status={event.status as PublicEventStatus}
      current="checagem"
      kicker="Lista oficial"
      title={`Checagem — ${event.nome}`}
      lede="Lista pública das inscrições efetivadas. Nome completo de competição, equipe, professor operacional e categoria vigente."
    >
      {checking.error ? (
        <Alert className="mt-10" role="alert" variant="error" title="Não foi possível carregar a checagem">
          Tente novamente. Nenhum dado administrativo foi exposto.
        </Alert>
      ) : !checking.athletes.length ? (
        <section className="mt-12 border-y border-mc-border py-14">
          <h2 className="font-mc-display text-3xl font-bold uppercase leading-[0.95] tracking-[-0.03em] text-mc-text-primary">Nenhuma inscrição efetivada nesta lista</h2>
          <p className="mt-4 max-w-xl font-mc-interface text-base leading-7 text-mc-text-secondary">
            A checagem pública aparece quando o evento está em checagem ou em fase posterior e há atletas efetivados.
          </p>
        </section>
      ) : (
        <div className="mt-12 space-y-8">
          <p className="max-w-2xl font-mc-interface text-sm leading-6 text-mc-text-secondary">
            Somente nome completo de competição, equipe, professor operacional e categoria vigente. Pendentes, canceladas e estornadas não entram. Pedidos de alteração continuam no fluxo autenticado.
            {listOfficial ? ' Lista oficial.' : ''}
          </p>

          <form method="get" className="grid gap-4 border-y border-mc-border py-6 md:grid-cols-4 md:items-end">
            <FormField id="categoria" label="Categoria">
              <Select name="categoria" defaultValue={filters.categoria || ''} aria-label="Filtrar por categoria">
                <option value="">Todas</option>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </Select>
            </FormField>
            <FormField id="equipe" label="Equipe">
              <Select name="equipe" defaultValue={filters.equipe || ''} aria-label="Filtrar por equipe">
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

          {visible.length ? (
            <div className="space-y-10">
              {groups.map((group) => (
                <section key={group.category} aria-labelledby={`category-${group.category}`} className="space-y-3">
                  <h2 id={`category-${group.category}`} className="font-mc-display text-2xl font-bold uppercase leading-none tracking-[-0.03em] text-mc-text-primary">{group.category}</h2>
                  <DataTable
                    rows={group.athletes}
                    columns={columns}
                    getRowKey={(athlete) => `${group.category}-${athlete.name}-${athlete.team || 'sem-equipe'}-${athlete.professor || 'sem-professor'}`}
                    caption={`Atletas efetivados em ${group.category}`}
                    className="hidden rounded-none border-mc-border lg:block"
                  />
                  <div className="space-y-0 lg:hidden">
                    {group.athletes.map((athlete) => (
                      <MobileRecord key={`${group.category}-${athlete.name}-${athlete.team || 'sem-equipe'}-${athlete.professor || 'sem-professor'}`} className="rounded-none">
                        <MobileRecordHeader>
                          <div className="min-w-0">
                            <MobileRecordTitle className="truncate text-lg">{athlete.name}</MobileRecordTitle>
                            <MobileRecordMeta>{athlete.team || 'Sem equipe informada'}{athlete.professor ? ` · ${athlete.professor}` : ''}</MobileRecordMeta>
                          </div>
                          <p className="font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] text-mc-text-primary">
                            <span aria-hidden="true" className={`mr-2 inline-block h-2 w-2 ${athlete.alone ? 'bg-mc-warning' : 'bg-mc-text-secondary'}`} />
                            {athlete.alone ? 'Atleta sozinho' : 'Categoria com adversários'}
                          </p>
                        </MobileRecordHeader>
                        <MobileRecordStatus>
                          <p className="font-mc-interface text-sm text-mc-text-secondary">{group.category}</p>
                        </MobileRecordStatus>
                      </MobileRecord>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <section className="border-y border-mc-border py-14">
              <h2 className="font-mc-display text-3xl font-bold uppercase leading-[0.95] tracking-[-0.03em] text-mc-text-primary">Nenhum atleta neste filtro</h2>
              <p className="mt-4 max-w-xl font-mc-interface text-base leading-7 text-mc-text-secondary">
                Ajuste a categoria, a equipe ou o professor para ver a lista oficial.
              </p>
            </section>
          )}
        </div>
      )}
    </PublicEventFrame>
  )
}
