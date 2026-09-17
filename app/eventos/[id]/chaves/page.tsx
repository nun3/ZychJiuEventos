import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, GitBranch, Info, Trophy } from 'lucide-react'
import ModernFooter from '@/components/ModernFooter'
import ModernNavbar from '@/components/ModernNavbar'
import { Alert, Card, EmptyState, PageContainer, PageHeader, StatusBadge } from '@/components/ui'
import { getPublicEventBrackets, type PublicBracketGroup } from '@/lib/events/public-brackets'
import { createClient } from '@/lib/supabase/server'

const publicStatuses = ['publicado', 'inscricao', 'pagamento', 'checagem', 'chaves', 'em_andamento', 'concluido'] as const

const topologyNames = {
  final_2: 'Final direta',
  copo_3: 'Copo com 3 atletas',
  semi_4: 'Semifinais com 4 atletas',
}

function Group({ group }: { group: PublicBracketGroup }) {
  return (
    <section aria-label={`Grupo ${group.label}`} className="border-t border-mc-border py-mc-24 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-mc-8">
        <h3 className="font-mc-display text-mc-h3 text-mc-text-primary">Grupo {group.label}</h3>
        <StatusBadge variant="neutral">{topologyNames[group.topology]}</StatusBadge>
      </div>

      <div className="mt-mc-16 grid gap-mc-24 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <ol aria-label={`Posições do grupo ${group.label}`} className="space-y-mc-8">
          {group.slots.map((slot) => (
            <li key={slot.position} className={`flex min-w-0 items-start gap-mc-12 rounded-mc-small border p-mc-12 ${slot.role === 'copo' ? 'border-mc-info/40 bg-mc-info/10' : 'border-mc-border bg-mc-surface-secondary'}`}>
              <span className="shrink-0 font-mono text-sm font-semibold text-mc-text-secondary">{String(slot.position).padStart(2, '0')}</span>
              <span className="min-w-0 flex-1">
                <span className="block break-words font-semibold text-mc-text-primary">{slot.athlete}</span>
                <span className="mt-mc-4 block break-words text-sm text-mc-text-secondary">{slot.team || 'Sem equipe informada'}</span>
              </span>
              {slot.role === 'copo' ? <StatusBadge variant="info">Copo</StatusBadge> : null}
            </li>
          ))}
        </ol>

        <div>
          <h4 className="font-semibold text-mc-text-primary">Confrontos</h4>
          <ol className="mt-mc-8 space-y-mc-8">
            {group.matches.map((match) => (
              <li key={`${match.round}-${match.order}`} className="rounded-mc-small border border-mc-border p-mc-12">
                <p className="text-xs font-semibold uppercase tracking-wide text-mc-text-secondary">
                  {match.round === 'semifinal' ? `Semifinal ${match.order}` : 'Final'}
                </p>
                <div className="mt-mc-8 grid min-w-0 gap-mc-8 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
                  <span className="break-words font-semibold text-mc-text-primary">{match.sideA}</span>
                  <span aria-hidden="true" className="text-sm text-mc-text-secondary">×</span>
                  <span className="break-words font-semibold text-mc-text-primary sm:text-right">{match.sideB}</span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

export default async function PublicBracketsPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const [{ data: event }, bracketResult] = await Promise.all([
    supabase
      .from('events')
      .select('id, nome, status')
      .eq('id', params.id)
      .in('status', publicStatuses)
      .maybeSingle(),
    getPublicEventBrackets(params.id),
  ])

  if (!event) notFound()

  return (
    <main className="min-h-screen bg-mc-background">
      <ModernNavbar />
      <PageContainer className="pb-mc-64 pt-32 sm:pt-36">
        <PageHeader
          title={`Chaves — ${event.nome}`}
          description="Composição oficial publicada pela organização do evento."
          breadcrumb={
            <Link href={`/eventos/${event.id}`} className="inline-flex min-h-10 items-center gap-mc-8 rounded-mc-small px-mc-8 font-semibold text-mc-action hover:bg-mc-action/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus">
              <ArrowLeft aria-hidden="true" size={18} />
              Voltar para o evento
            </Link>
          }
          actions={<StatusBadge variant="success">Chaves publicadas</StatusBadge>}
        />

        {bracketResult.error ? (
          <Alert className="mt-mc-24" role="alert" variant="error" title="Não foi possível carregar as chaves">
            Tente novamente. Nenhum dado administrativo foi exposto.
          </Alert>
        ) : !bracketResult.brackets.length ? (
          <EmptyState
            className="mt-mc-24 rounded-mc-medium border border-mc-border bg-mc-surface"
            icon={<GitBranch size={34} />}
            title="Nenhuma chave publicada"
            description="Rascunhos não são exibidos. As chaves oficiais aparecerão aqui após a publicação pela organização."
          />
        ) : (
          <div className="mt-mc-24 space-y-mc-24">
            <Alert variant="info" icon={<Info size={20} />} title="Consulta oficial">
              Esta página mostra somente a composição publicada. Resultados, WO e programação ainda não fazem parte desta consulta.
            </Alert>

            {bracketResult.brackets.map((bracket) => (
              <Card key={bracket.category} className="overflow-hidden">
                <header className="flex flex-col gap-mc-12 border-b border-mc-border bg-mc-surface-secondary p-mc-16 sm:flex-row sm:items-center sm:justify-between sm:p-mc-24">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-mc-text-secondary">Categoria</p>
                    <h2 className="mt-mc-4 break-words font-mc-display text-mc-h2 text-mc-text-primary">{bracket.category}</h2>
                  </div>
                  <StatusBadge variant="success">Publicada</StatusBadge>
                </header>

                {bracket.mode === 'sem_confronto' ? (
                  <div className="p-mc-24">
                    <div className="flex items-start gap-mc-12">
                      <Trophy aria-hidden="true" className="mt-0.5 shrink-0 text-mc-text-secondary" size={24} />
                      <div className="min-w-0">
                        <StatusBadge variant="info">Sem confronto</StatusBadge>
                        <p className="mt-mc-12 break-words font-semibold text-mc-text-primary">{bracket.athlete?.name || 'Atleta não informado'}</p>
                        <p className="mt-mc-4 break-words text-sm text-mc-text-secondary">{bracket.athlete?.team || 'Sem equipe informada'}</p>
                        <p className="mt-mc-12 text-sm text-mc-text-secondary">A categoria não possui confronto nem campeão automático.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-mc-16 sm:p-mc-24">
                    {bracket.groups.map((group) => <Group key={group.label} group={group} />)}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </PageContainer>
      <ModernFooter />
    </main>
  )
}
