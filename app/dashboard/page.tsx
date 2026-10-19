import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, Building2, CalendarDays, ClipboardList, ExternalLink, HelpCircle, MapPin, Newspaper, UsersRound } from 'lucide-react'
import { getDashboardActor } from '@/lib/auth/dashboard-actor'
import { getPublicOrganizationScope } from '@/lib/events/public-organization'
import { createClient } from '@/lib/supabase/server'
import { DashboardPageHero } from '@/components/dashboard/DashboardPageHero'
import { EventCover } from '@/components/dashboard/EventCover'
import { panelClass, PanelColumns } from '@/components/dashboard/PanelColumns'
import { Alert } from '@/components/ui/Alert'
import { PageContainer } from '@/components/ui/PageContainer'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { FirstStepsChecklistCard } from '@/components/onboarding/FirstStepsChecklist'
import { loadDashboardChecklist } from '@/lib/onboarding/dashboard-facts'
import { adminEventStatusLabel, adminEventStatusVariant } from '@/lib/events/admin-event-presentation'

const dateFormat = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' })
const monthFormat = new Intl.DateTimeFormat('pt-BR', { month: 'short', timeZone: 'UTC' })
const focus = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2'

export default async function DashboardHome({ searchParams }: { searchParams: { erro?: string } }) {
  const supabase = createClient()
  const actor = await getDashboardActor()
  if (!actor) redirect('/login?redirectTo=%2Fdashboard')
  if (actor.needsSportsProfile) redirect('/dashboard/completar-cadastro-esportivo')
  const accountName = actor.name.trim() || (await supabase.auth.getUser()).data.user?.email?.split('@')[0] || ''
  const scope = getPublicOrganizationScope()
  let events: Array<{ id: string; nome: string; data_evento: string; local: string; status: string; imagem_cartaz_url: string | null }> = []
  let eventsError = scope.mode === 'blocked'
  if (scope.mode !== 'blocked') {
    let query = supabase.from('events').select('id, nome, data_evento, local, status, imagem_cartaz_url').neq('status', 'rascunho').neq('status', 'cancelado').order('data_evento')
    if (scope.mode === 'restricted') query = query.eq('organization_id', scope.organizationId)
    const result = await query
    events = result.data || []
    eventsError = Boolean(result.error)
  }
  let athletesQuery = supabase.from('athletes').select('id', { count: 'exact', head: true })
  if (scope.mode === 'restricted') athletesQuery = athletesQuery.eq('organization_id', scope.organizationId)
  const [athletes, organizations, own, managed, checklist] = await Promise.all([
    scope.mode === 'blocked' ? Promise.resolve({ count: null, error: true }) : athletesQuery,
    supabase.from('organization_members').select('organization_id', { count: 'exact', head: true }).eq('user_id', actor.userId),
    supabase.from('athletes').select('id').eq('user_id', actor.userId),
    supabase.from('athlete_managers').select('athlete_id').eq('manager_id', actor.userId),
    loadDashboardChecklist(actor, events.length > 0),
  ])
  const athleteIds = Array.from(new Set([...(own.data || []).map(item => item.id), ...(managed.data || []).map(item => item.athlete_id)]))
  let registrations: { count: number | null; error: unknown } = { count: 0, error: null }
  if (scope.mode === 'blocked' || own.error || managed.error) {
    registrations = { count: null, error: true }
  } else if (athleteIds.length) {
    let query = supabase.from('registrations').select('id, events!inner(organization_id)', { count: 'exact', head: true }).in('athlete_id', athleteIds)
    if (scope.mode === 'restricted') query = query.eq('events.organization_id', scope.organizationId)
    registrations = await query
  }
  const metrics = [
    { label: 'Atletas', value: athletes.error ? null : athletes.count, note: 'Acessíveis à sua conta', icon: UsersRound, color: 'bg-mc-action/10 text-mc-action' },
    { label: 'Inscrições', value: registrations.error ? null : registrations.count, note: 'Suas e dos atletas vinculados', icon: ClipboardList, color: 'bg-mc-action/10 text-mc-action' },
    { label: 'Organizações', value: organizations.error ? null : organizations.count, note: 'Vínculos da sua conta', icon: Building2, color: 'bg-mc-warning/10 text-mc-warning' },
    { label: 'Eventos publicados', value: eventsError ? null : events.length, note: 'No calendário acessível', icon: CalendarDays, color: 'bg-mc-success/10 text-mc-success' },
  ]
  const links = [
    actor.canManageOrganization ? { href: '/dashboard/organizacao', title: 'Organização', description: 'Gerencie membros e permissões.', icon: Building2 } : null,
    { href: '/dashboard/meus-atletas', title: 'Atletas', description: 'Consulte e gerencie seus atletas.', icon: UsersRound },
    { href: '/dashboard/inscricoes', title: 'Inscrições', description: 'Acompanhe inscrições e pagamentos.', icon: ClipboardList },
    { href: '/eventos', title: 'Calendário público', description: 'Veja e compartilhe os próximos eventos.', icon: CalendarDays },
    actor.hasSelfAthlete ? { href: '/eventos', title: 'Fazer minha inscrição', description: 'Escolha um campeonato para participar.', icon: ClipboardList } : null,
    actor.isPlatformAdmin ? { href: '/platform/organizacoes', title: 'Organizações da plataforma', description: 'Administre organizações e proprietários.', icon: Building2 } : null,
  ].filter((link): link is NonNullable<typeof link> => Boolean(link))
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  const upcoming = events.filter(event => event.data_evento >= today && event.status !== 'concluido').slice(0, 4)

  return (
    <main className="py-5 sm:py-7">
      <PageContainer fluid className="space-y-5">
        {searchParams.erro === 'sem_permissao' ? <Alert variant="error" role="alert" title="Acesso administrativo negado">Esta conta não administra eventos. Use a equipe, as inscrições e a checagem pública.</Alert> : null}
        <DashboardPageHero
          title={accountName ? `Olá, ${accountName.split(' ')[0]}` : 'Olá!'}
          description={(
            <>
              <span className="block font-mc-display text-xl font-semibold text-white sm:text-2xl">Seu painel</span>
              <span className="mt-2 block">Aqui você acompanha a sua conta, organiza sua equipe, inscrições e o calendário.{actor.canManageEvents ? ' O gerenciamento dos campeonatos está na aba Eventos.' : ''}</span>
            </>
          )}
        />
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {metrics.map(metric => <div key={metric.label} className="flex min-w-0 items-start gap-3 rounded-mc-medium border border-mc-border bg-mc-surface p-4 shadow-mc-subtle">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-mc-medium ${metric.color}`}><metric.icon aria-hidden="true" size={22} /></span>
                <div className="min-w-0"><dt className="text-sm font-semibold text-mc-text-primary">{metric.label}</dt><dd className="mt-1 font-mc-display text-3xl font-bold leading-8 text-mc-text-primary">{metric.value === null ? '—' : metric.value}</dd><p className="mt-1 text-sm leading-5 text-mc-text-secondary">{metric.value === null ? 'Não foi possível carregar' : metric.note}</p></div>
              </div>)}
            </dl>

            {checklist ? <FirstStepsChecklistCard userId={actor.userId} checklist={checklist} /> : null}

        <PanelColumns
          main={(
            <>
            <section aria-labelledby="operations-title" className={panelClass}>
              <h2 id="operations-title" className="font-mc-display text-xl font-bold text-mc-text-primary">Áreas de operação</h2>
              <p className="mt-1 text-sm text-mc-text-secondary">Acesse rapidamente as principais áreas da sua conta.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {links.map(link => <Link key={link.title} href={link.href} className={`group flex min-w-0 items-start gap-3 rounded-mc-medium border border-mc-border p-4 transition-colors hover:border-mc-action/30 hover:bg-mc-surface-secondary ${focus}`}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-mc-small bg-mc-action/10 text-mc-action"><link.icon size={22} aria-hidden="true" /></span>
                  <span className="min-w-0 flex-1"><strong className="block text-sm text-mc-text-primary">{link.title}</strong><span className="mt-1 block text-sm leading-5 text-mc-text-secondary">{link.description}</span></span><ArrowRight size={16} aria-hidden="true" className="mt-1 shrink-0 text-mc-text-secondary transition-transform group-hover:translate-x-0.5" />
                </Link>)}
              </div>
            </section>

            <section aria-labelledby="published-title" className={panelClass}>
              <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="published-title" className="font-mc-display text-xl font-bold text-mc-text-primary">Competições publicadas</h2><Link href="/eventos" className={`inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-mc-action ${focus}`}>Ver calendário completo <ArrowRight size={16} aria-hidden="true" /></Link></div>
              <p className="mt-1 text-sm leading-5 text-mc-text-secondary">Consulte os campeonatos e acesse suas páginas públicas.</p>
              {eventsError ? <Alert variant="error" className="mt-4">Não foi possível carregar o calendário.</Alert> : events.length ? <div className="mt-4 grid gap-4 md:grid-cols-3">
                {events.slice(0, 3).map(event => <article key={event.id} className="flex min-w-0 flex-col overflow-hidden rounded-mc-medium border border-mc-border">
                  <div className="relative"><EventCover src={event.imagem_cartaz_url} name={event.nome} /><span className="absolute left-2 top-2 rounded-mc-full bg-mc-surface"><StatusBadge variant={adminEventStatusVariant(event.status)}>{adminEventStatusLabel(event.status)}</StatusBadge></span></div>
                  <div className="flex flex-1 flex-col p-3"><h3 className={event.imagem_cartaz_url ? 'break-words font-mc-display text-lg font-semibold leading-6 text-mc-text-primary' : 'sr-only'}>{event.nome}</h3><p className="mt-2 flex gap-2 text-sm text-mc-text-secondary"><CalendarDays size={15} aria-hidden="true" className="shrink-0 text-mc-action" />{dateFormat.format(new Date(`${event.data_evento}T12:00:00Z`))}</p><p className="mt-2 flex gap-2 text-sm leading-5 text-mc-text-secondary"><MapPin size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-mc-action" />{event.local}</p>
                    <Link href={`/eventos/${event.id}`} aria-label={`Ver página pública de ${event.nome}`} className={`mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-mc-small bg-mc-action/10 px-3 text-sm font-semibold text-mc-action ${focus}`}>Ver página pública <ExternalLink size={14} aria-hidden="true" /></Link>
                    {event.status === 'inscricao' ? <Link href={`/eventos/${event.id}/inscricao/cadastrar-atleta`} className={`mt-2 inline-flex min-h-10 items-center justify-center text-sm font-semibold text-mc-action ${focus}`}>{actor.hasSelfAthlete ? 'Fazer minha inscrição' : 'Inscrever atletas'}</Link> : null}
                    {['checagem', 'chaves', 'em_andamento', 'concluido'].includes(event.status) ? <Link href={`/eventos/${event.id}/checagem`} className={`mt-2 inline-flex min-h-10 items-center justify-center text-sm text-mc-action ${focus}`}>Consultar checagem</Link> : null}
                  </div>
                </article>)}
              </div> : <p className="py-8 text-sm text-mc-text-secondary">Nenhuma competição publicada no calendário.</p>}
            </section>
            </>
          )}
          aside={(
          <aside aria-label="Calendário e informações" className="min-w-0 space-y-5">
            <section className={panelClass} aria-labelledby="upcoming-title">
              <div className="flex items-center justify-between gap-3"><h2 id="upcoming-title" className="font-mc-display text-lg font-bold text-mc-text-primary">Próximos eventos</h2><Link href="/eventos" className={`inline-flex min-h-10 items-center text-xs font-semibold text-mc-action ${focus}`}>Ver todos →</Link></div>
              <div className="mt-3 divide-y divide-mc-border">{upcoming.map(event => <Link key={event.id} href={`/eventos/${event.id}`} className={`flex items-start gap-3 py-4 ${focus}`}>
                <time dateTime={event.data_evento} className="flex w-12 shrink-0 flex-col items-center rounded-mc-medium bg-mc-action/10 py-2 text-mc-structure"><span className="font-mc-display text-xl font-bold">{event.data_evento.slice(8, 10)}</span><span className="text-xs uppercase">{monthFormat.format(new Date(`${event.data_evento}T12:00:00Z`)).replace('.', '')}</span></time>
                <span className="min-w-0"><strong className="block break-words text-sm leading-5 text-mc-text-primary">{event.nome}</strong><span className="mt-1 block text-xs leading-5 text-mc-text-secondary">{event.local}</span></span>
              </Link>)}</div>
              {!upcoming.length ? <p className="py-4 text-sm text-mc-text-secondary">{eventsError ? 'Calendário indisponível no momento.' : 'Nenhum próximo evento no calendário.'}</p> : null}
            </section>
            <section className={panelClass} aria-labelledby="news-title"><h2 id="news-title" className="font-mc-display text-lg font-bold text-mc-text-primary">Notícias e comunicados</h2><Newspaper size={24} aria-hidden="true" className="mt-5 text-mc-action" /><p className="mt-3 text-sm leading-6 text-mc-text-secondary">Nenhuma notícia publicada por enquanto.</p><Link href="/noticias" className={`mt-3 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-mc-action ${focus}`}>Acessar notícias <ArrowRight size={16} aria-hidden="true" /></Link></section>
            <section className={panelClass} aria-labelledby="help-title"><div className="flex gap-3"><HelpCircle size={28} aria-hidden="true" className="shrink-0 text-mc-action" /><div><h2 id="help-title" className="font-mc-display text-lg font-bold text-mc-text-primary">Precisa de ajuda?</h2><p className="mt-2 text-sm leading-6 text-mc-text-secondary">Entre em contato com a equipe do MEU CAMP.</p></div></div><a href="mailto:contato@meucamp.com.br" className={`mt-4 flex min-h-11 items-center justify-center gap-2 rounded-mc-small bg-mc-action/10 text-sm font-semibold text-mc-action ${focus}`}>Falar com o suporte <ArrowRight size={16} aria-hidden="true" /></a></section>
          </aside>
          )}
        />
      </PageContainer>
    </main>
  )
}
