import Link from 'next/link'
import { ArrowRight, CalendarDays, MapPin, Plus, UsersRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageContainer } from '@/components/ui/PageContainer'
import { PageHeader } from '@/components/ui/PageHeader'

const formatter = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' })

const operationalLinks = [
  {
    href: '/admin/eventos',
    title: 'Gerenciar eventos',
    description: 'Acesse configurações, status e ações das suas competições.',
    icon: CalendarDays,
  },
  {
    href: '/dashboard/meus-atletas',
    title: 'Consultar atletas',
    description: 'Encontre atletas, equipes e dados usados nas inscrições.',
    icon: UsersRound,
  },
]

export default async function DashboardHome() {
  const { data } = await createClient().from('events').select('id, nome, data_evento, local, imagem_cartaz_url').neq('status', 'rascunho').neq('status', 'cancelado').order('data_evento')
  const events = data || []

  return (
    <main className="py-mc-32 sm:py-mc-48">
      <PageContainer>
        <PageHeader
          title="Painel do organizador"
          description="Acesse as áreas principais para conduzir suas competições."
          actions={(
            <Link
              href="/admin/eventos/novo"
              className="inline-flex min-h-11 items-center justify-center gap-mc-8 rounded-mc-medium bg-mc-action px-mc-16 font-mc-interface text-sm font-semibold text-white transition-colors duration-mc-normal hover:bg-mc-action/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2"
            >
              <Plus aria-hidden="true" size={18} />
              Novo evento
            </Link>
          )}
        />

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
                <p className="mt-mc-4 font-mc-interface text-sm text-mc-text-secondary">Próximos eventos disponíveis na plataforma.</p>
              </div>
              <Link href="/#eventos" className="shrink-0 font-mc-interface text-sm font-semibold text-mc-action hover:underline">Ver calendário</Link>
            </div>

            {events.length ? (
              <Card className="mt-mc-16 divide-y divide-mc-border overflow-hidden">
                {events.slice(0, 6).map((event) => (
                  <Link
                    key={event.id}
                    href={`/eventos/${event.id}`}
                    className="group grid gap-mc-12 p-mc-16 transition-colors duration-mc-normal hover:bg-mc-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mc-focus sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-mc-24"
                  >
                    <span className="min-w-0">
                      <strong className="block truncate font-mc-interface font-semibold text-mc-text-primary">{event.nome}</strong>
                      <span className="mt-mc-8 flex items-start gap-mc-8 font-mc-interface text-sm text-mc-text-secondary">
                        <MapPin aria-hidden="true" size={17} className="mt-0.5 shrink-0 text-mc-action" />
                        {event.local}
                      </span>
                    </span>
                    <span className="flex items-center gap-mc-8 font-mc-interface text-sm font-semibold text-mc-text-primary">
                      <CalendarDays aria-hidden="true" size={17} className="text-mc-action" />
                      {formatter.format(new Date(`${event.data_evento}T12:00:00Z`))}
                    </span>
                  </Link>
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
