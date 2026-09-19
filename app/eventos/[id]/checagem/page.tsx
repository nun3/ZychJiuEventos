import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ClipboardList, Info, UserRound } from 'lucide-react'
import ModernFooter from '@/components/ModernFooter'
import ModernNavbar from '@/components/ModernNavbar'
import {
  Alert,
  Card,
  DataTable,
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
  type DataTableColumn,
} from '@/components/ui'
import { getPublicEventChecking, type PublicCheckingAthlete } from '@/lib/events/public-checking'
import { createClient } from '@/lib/supabase/server'

const publicStatuses = ['publicado', 'inscricao', 'pagamento', 'checagem', 'chaves', 'em_andamento', 'concluido'] as const
const visibleStatuses = ['checagem', 'chaves', 'em_andamento', 'concluido'] as const

type SearchParams = {
  categoria?: string
  equipe?: string
}

function unique(values: Array<string | null>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value)))).sort((a, b) => a.localeCompare(b, 'pt-BR'))
}

function matchesFilters(athlete: PublicCheckingAthlete, filters: SearchParams) {
  if (filters.categoria && athlete.category !== filters.categoria) return false
  if (filters.equipe && athlete.team !== filters.equipe) return false
  return true
}

const columns: Array<DataTableColumn<PublicCheckingAthlete>> = [
  { key: 'name', header: 'Atleta', render: (athlete) => athlete.name },
  { key: 'team', header: 'Equipe', render: (athlete) => athlete.team || 'Sem equipe informada' },
  {
    key: 'occupancy',
    header: 'Situação',
    render: (athlete) => athlete.alone
      ? <StatusBadge variant="warning" icon={<UserRound size={14} />}>Atleta sozinho</StatusBadge>
      : <StatusBadge variant="neutral">Categoria com adversários</StatusBadge>,
  },
]

export default async function PublicCheckingPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: SearchParams
}) {
  const supabase = createClient()
  const [{ data: event }, checking] = await Promise.all([
    supabase
      .from('events')
      .select('id, nome, status')
      .eq('id', params.id)
      .in('status', publicStatuses)
      .maybeSingle(),
    getPublicEventChecking(params.id),
  ])

  if (!event) notFound()

  const filters: SearchParams = {
    categoria: searchParams.categoria?.trim() || undefined,
    equipe: searchParams.equipe?.trim() || undefined,
  }
  const visible = checking.athletes.filter((athlete) => matchesFilters(athlete, filters))
  const categories = unique(checking.athletes.map((athlete) => athlete.category))
  const teams = unique(checking.athletes.map((athlete) => athlete.team))
  const groups = categories
    .map((category) => ({
      category,
      athletes: visible.filter((athlete) => athlete.category === category),
    }))
    .filter((group) => group.athletes.length)

  return (
    <main className="min-h-screen bg-mc-background">
      <ModernNavbar />
      <PageContainer className="pb-mc-64 pt-32 sm:pt-36">
        <PageHeader
          title={`Checagem — ${event.nome}`}
          description="Lista pública das inscrições efetivadas. Nome completo de competição, equipe e categoria vigente."
          breadcrumb={
            <Link href={`/eventos/${event.id}`} className="inline-flex min-h-10 items-center gap-mc-8 rounded-mc-small px-mc-8 font-semibold text-mc-action hover:bg-mc-action/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus">
              <ArrowLeft aria-hidden="true" size={18} />
              Voltar para o evento
            </Link>
          }
          actions={
            <StatusBadge variant={visibleStatuses.includes(event.status as typeof visibleStatuses[number]) && checking.athletes.length ? 'success' : 'neutral'}>
              {checking.athletes.length ? 'Lista oficial' : 'Indisponível'}
            </StatusBadge>
          }
        />

        {checking.error ? (
          <Alert className="mt-mc-24" role="alert" variant="error" title="Não foi possível carregar a checagem">
            Tente novamente. Nenhum dado administrativo foi exposto.
          </Alert>
        ) : !checking.athletes.length ? (
          <EmptyState
            className="mt-mc-24 rounded-mc-medium border border-mc-border bg-mc-surface"
            icon={<ClipboardList size={34} />}
            title="Nenhuma inscrição efetivada nesta lista"
            description="A checagem pública aparece quando o evento está em checagem ou em fase posterior e há atletas efetivados."
          />
        ) : (
          <div className="mt-mc-24 space-y-mc-24">
            <Alert variant="info" icon={<Info size={20} />} title="Consulta pública">
              Somente nome completo de competição, equipe e categoria vigente. Pendentes, canceladas e estornadas não entram. Pedidos de alteração continuam no fluxo autenticado.
            </Alert>

            <Card className="p-mc-16 sm:p-mc-24">
              <form method="get" className="grid gap-mc-16 md:grid-cols-3 md:items-end">
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
                <button
                  type="submit"
                  className="inline-flex min-h-11 items-center justify-center rounded-mc-medium bg-mc-action px-mc-16 font-mc-interface text-sm font-semibold text-white transition-colors duration-mc-normal hover:bg-mc-action/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2"
                >
                  Filtrar
                </button>
              </form>
            </Card>

            {visible.length ? (
              <div className="space-y-mc-24">
                {groups.map((group) => (
                  <section key={group.category} aria-labelledby={`category-${group.category}`} className="space-y-mc-12">
                    <h2 id={`category-${group.category}`} className="font-mc-display text-mc-h2 text-mc-text-primary">{group.category}</h2>
                    <DataTable
                      rows={group.athletes}
                      columns={columns}
                      getRowKey={(athlete) => `${group.category}-${athlete.name}-${athlete.team || 'sem-equipe'}`}
                      caption={`Atletas efetivados em ${group.category}`}
                      className="hidden lg:block"
                    />
                    <div className="space-y-mc-12 lg:hidden">
                      {group.athletes.map((athlete) => (
                        <MobileRecord key={`${group.category}-${athlete.name}-${athlete.team || 'sem-equipe'}`}>
                          <MobileRecordHeader>
                            <div className="min-w-0">
                              <MobileRecordTitle className="truncate text-lg">{athlete.name}</MobileRecordTitle>
                              <MobileRecordMeta>{athlete.team || 'Sem equipe informada'}</MobileRecordMeta>
                            </div>
                            <StatusBadge variant={athlete.alone ? 'warning' : 'neutral'} icon={athlete.alone ? <UserRound size={14} /> : undefined}>
                              {athlete.alone ? 'Atleta sozinho' : 'Categoria com adversários'}
                            </StatusBadge>
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
              <EmptyState
                className="rounded-mc-medium border border-mc-border bg-mc-surface"
                title="Nenhum atleta neste filtro"
                description="Ajuste a categoria ou a equipe para ver a lista oficial."
              />
            )}
          </div>
        )}
      </PageContainer>
      <ModernFooter />
    </main>
  )
}
