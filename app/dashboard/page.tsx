import Link from 'next/link'
import { ArrowRight, CalendarDays, ClipboardList, MapPin, Plus, UsersRound } from 'lucide-react'
import { getDashboardActor } from '@/lib/auth/dashboard-actor'
import { createClient } from '@/lib/supabase/server'
import { Alert } from '@/components/ui/Alert'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageContainer } from '@/components/ui/PageContainer'
import { PageHeader } from '@/components/ui/PageHeader'

const formatter = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' })
const checkingStatuses = ['checagem', 'chaves', 'em_andamento', 'concluido']

export default async function DashboardHome({ searchParams }: { searchParams: { erro?: string } }) {
  const supabase = createClient()
  const actor = await getDashboardActor()
  const { data } = await supabase.from('events').select('id, nome, data_evento, local, status, imagem_cartaz_url').neq('status', 'rascunho').neq('status', 'cancelado').order('data_evento')
  const events = data || []
  const isProfessor = Boolean(actor?.isProfessor)
  const canManageEvents = Boolean(actor?.canManageEvents)

  const operationalLinks = [
    canManageEvents ? {
      href: '/admin/eventos',
      title: 'Gerenciar eventos',
      description: 'Acesse configurações, status e ações das suas competições.',
      icon: CalendarDays,
    } : null,
    {
      href: '/dashboard/meus-atletas',
      title: isProfessor ? 'Minha equipe e atletas' : 'Consultar atletas',
      description: isProfessor
        ? 'Crie sua equipe, cadastre atletas vinculados e mantenha os dados das inscrições.'
        : 'Encontre atletas, equipes e dados usados nas inscrições.',
      icon: UsersRound,
    },
    {
      href: '/dashboard/inscricoes',
      title: 'Inscrições e pagamentos',
      description: 'Acompanhe as inscrições e os pagamentos que você gerencia.',
      icon: ClipboardList,
    },
  ].filter((item): item is NonNullable<typeof item> => Boolean(item))

  return (
    <main className="py-mc-32 sm:py-mc-48">
      <PageContainer>
        <PageHeader
          title={canManageEvents ? 'Painel do organizador' : isProfessor ? 'Painel do professor' : 'Painel'}
          description={canManageEvents
            ? 'Acesse as áreas principais para conduzir suas competições.'
            : isProfessor
              ? 'Gerencie sua equipe, inscreva atletas e acompanhe a checagem pública.'
              : 'Acompanhe inscrições e os eventos publicados.'}
          actions={canManageEvents ? (
            <Link
              href="/admin/eventos/novo"
              className="inline-flex min-h-11 items-center justify-center gap-mc-8 rounded-mc-medium bg-mc-action px-mc-16 font-mc-interface text-sm font-semibold text-white transition-colors duration-mc-normal hover:bg-mc-action/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2"
            >
              <Plus aria-hidden="true" size={18} />
              Novo evento
            </Link>
          ) : null}
        />

        {searchParams.erro === 'sem_permissao' ? (
          <Alert variant="error" role="alert" className="mt-mc-24" title="Acesso administrativo negado">
            Esta conta não administra eventos. Use a equipe, as inscrições e a checagem pública.
          </Alert>
        ) : null}

        <div className="mt-mc-32 grid gap-mc-24 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <section aria-labelledby="operations-title">
            <h2 id="operations-title" className="font-mc-display text-mc-h2 text-mc-text-primary">Áreas de operação</h2>
            <Card className="mt-mc-16 divide-y divide-mc-border overflow-hidden">
              {operationalLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex min-h-24 items-center gap-mc-16 p-mc-16 transition-colors duration-mc-normal hover:bg-mc-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mc-focus sm:p-mc-24"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-mc-medium bg-mc-action/10 text-mc-action">
                    <item.icon aria-hidden="true" size={22} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block font-mc-interface font-semibold text-mc-text-primary">{item.title}</strong>
                    <span className="mt-mc-4 block font-mc-interface text-sm leading-5 text-mc-text-secondary">{item.description}</span>
                  </span>
                  <ArrowRight aria-hidden="true" size={18} className="shrink-0 text-mc-text-secondary transition-transform duration-mc-normal group-hover:translate-x-0.5" />
                </Link>
              ))}
            </Card>
          </section>

          <section aria-labelledby="published-events-title">
            <div className="flex items-end justify-between gap-mc-16">
              <div>
                <h2 id="published-events-title" className="font-mc-display text-mc-h2 text-mc-text-primary">Competições publicadas</h2>
                <p className="mt-mc-4 font-mc-interface text-sm text-mc-text-secondary">Inscreva atletas e consulte a checagem pública quando ela estiver aberta.</p>
              </div>
              <Link href="/eventos" className="shrink-0 font-mc-interface text-sm font-semibold text-mc-action hover:underline">Ver calendário</Link>
            </div>

            {events.length ? (
              <Card className="mt-mc-16 divide-y divide-mc-border overflow-hidden">
                {events.slice(0, 6).map((event) => (
                  <div key={event.id} className="grid gap-mc-12 p-mc-16 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-mc-24">
                    <Link
                      href={`/eventos/${event.id}`}
                      className="group min-w-0 rounded-mc-small focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
                    >
                      <strong className="block truncate font-mc-interface font-semibold text-mc-text-primary group-hover:text-mc-action">{event.nome}</strong>
                      <span className="mt-mc-8 flex items-start gap-mc-8 font-mc-interface text-sm text-mc-text-secondary">
                        <MapPin aria-hidden="true" size={17} className="mt-0.5 shrink-0 text-mc-action" />
                        {event.local}
                      </span>
                    </Link>
                    <div className="flex flex-col items-start gap-mc-8 font-mc-interface text-sm font-semibold sm:items-end">
                      <span className="inline-flex items-center gap-mc-8 text-mc-text-primary">
                        <CalendarDays aria-hidden="true" size={17} className="text-mc-action" />
                        {formatter.format(new Date(`${event.data_evento}T12:00:00Z`))}
                      </span>
                      {event.status === 'inscricao' ? (
                        <Link href={`/eventos/${event.id}/inscricao/cadastrar-atleta`} className="text-mc-action hover:underline">Inscrever atletas</Link>
                      ) : null}
                      {checkingStatuses.includes(event.status) ? (
                        <Link href={`/eventos/${event.id}/checagem`} className="text-mc-action hover:underline">Consultar checagem</Link>
                      ) : null}
                    </div>
                  </div>
                ))}
              </Card>
            ) : (
              <EmptyState
                icon={<CalendarDays size={32} />}
                title="Nenhuma competição publicada"
                description="Os eventos publicados aparecerão aqui."
                className="mt-mc-16 rounded-mc-medium border border-mc-border bg-mc-surface"
              />
            )}
          </section>
        </div>
      </PageContainer>
    </main>
  )
}
