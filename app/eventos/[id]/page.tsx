import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import type { HTMLAttributes } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  Clock3,
  CreditCard,
  Download,
  FileText,
  GitBranch,
  MapPin,
  Trophy,
  SquarePen,
} from 'lucide-react'
import ModernNavbar from '@/components/ModernNavbar'
import ModernFooter from '@/components/ModernFooter'
import EventCategoriesPreview from '@/components/events/public-event/EventCategoriesPreview'
import EventContentSidebar from '@/components/events/public-event/EventContentSidebar'
import EventPublicNavigation from '@/components/events/public-event/EventPublicNavigation'
import EventShareButton from '@/components/events/public-event/EventShareButton'
import { StatusBadge } from '@/components/ui'
import { findPublicReleaseEvent } from '@/lib/events/public-access'
import {
  buildPublicEventSections,
  formatPhaseWindow,
  formatPublicEventDate,
  getPublicEventNavItems,
  getPublicEventPresentation,
  getPublicPhaseLabel,
} from '@/lib/events/public-event-presentation'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/components/ui/utils'
import type { SportCategoryCatalog } from '@/lib/events/category-resolver'

const phaseIcons = {
  inscricao: SquarePen,
  pagamento: CreditCard,
  checagem: ClipboardList,
  chaves: GitBranch,
}

function HubContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('w-full px-4 sm:px-8 lg:px-12 xl:px-20', className)} />
}

export default async function EventPage({ params }: { params: { id: string } }) {
  noStore()
  const supabase = createClient()
  const event = await findPublicReleaseEvent(params.id)
  if (!event) notFound()

  const [{ data: phases }, { data: rules }] = await Promise.all([
    supabase.from('event_phases').select('id, tipo, inicio, fim').eq('event_id', event.id).order('inicio'),
    supabase
      .from('category_rule_sets')
      .select(
        'id, nome, versao, category_catalog_id, event_categories(id, nome, genero, idade_min, idade_max, peso_min_kg, peso_max_kg, fight_duration_minutes, ativa, ordem, faixa_min_ordem, faixa_max_ordem, catalog_category_id), category_catalog:sport_category_catalogs(id, versao, modality, sport_category_definitions(id, catalog_id, codigo, nome, divisao_etaria, idade_min, idade_max, genero, faixa_min_ordem, faixa_max_ordem, peso_min_kg, peso_max_kg, ordem))',
      )
      .eq('event_id', event.id)
      .eq('ativo', true)
      .order('versao', { ascending: false })
      .limit(1),
  ])

  const presentation = getPublicEventPresentation({
    status: event.status,
    phases,
    informacoes: event.informacoes,
  })
  const dateInfo = formatPublicEventDate(event.data_evento, event.timezone)
  const registrationPhase = presentation.phases.find((phase) => phase.tipo === 'inscricao')
  const activeRules = rules?.[0]
  const categories = activeRules?.event_categories ?? []
  const rawCatalog = activeRules?.category_catalog
  const categoryCatalog: SportCategoryCatalog | null = rawCatalog && (rawCatalog.modality === 'gi' || rawCatalog.modality === 'no_gi')
    ? {
        id: rawCatalog.id,
        version: rawCatalog.versao,
        modality: rawCatalog.modality === 'gi' ? 'gi' : 'no_gi',
        categories: rawCatalog.sport_category_definitions.flatMap((definition) =>
          definition.genero === 'M' || definition.genero === 'F' || definition.genero === 'U'
            ? [{ ...definition, genero: definition.genero }]
            : [],
        ),
      }
    : null
  const hasDocuments = Boolean(event.regulamento_url || event.tabela_peso_url)
  const hasLocation = Boolean(event.local?.trim())
  const sections = buildPublicEventSections({
    hasOverview: Boolean(presentation.overviewText),
    hasPhases: presentation.phases.length > 0,
    hasCategories: categories.length > 0,
    hasDocuments,
    hasLocation,
  })
  const navItems = getPublicEventNavItems({
    eventId: event.id,
    status: event.status,
    current: 'informacoes',
  })
  const secondaryLinks = presentation.prioritizeOperationalLinks
    ? ([
        { href: `/eventos/${event.id}/programacao`, label: 'Consultar programação', icon: Clock3 },
        { href: `/eventos/${event.id}/chaves`, label: 'Consultar chaves', icon: GitBranch },
      ] as const)
    : ([
        { href: `/eventos/${event.id}/chaves`, label: 'Consultar chaves', icon: GitBranch },
        { href: `/eventos/${event.id}/programacao`, label: 'Consultar programação', icon: Clock3 },
      ] as const)

  return (
    <main id="conteudo-principal" className="min-h-screen bg-mc-background">
      <ModernNavbar overlayAtTop />

      <section className="relative isolate flex min-h-[27rem] overflow-hidden bg-mc-nav-dark pt-20 text-white sm:min-h-[29rem] lg:min-h-[30rem]">
        {event.imagem_cartaz_url ? (
          <>
            <Image
              src={event.imagem_cartaz_url}
              alt=""
              fill
              priority
              sizes="100vw"
              quality={60}
              className="-z-20 scale-[1.025] object-cover object-center blur-[4px] brightness-[0.58] saturate-110"
            />
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(7,27,46,0.82)_0%,rgba(7,27,46,0.48)_42%,rgba(7,27,46,0.18)_72%,rgba(7,27,46,0.44)_100%)]" aria-hidden="true" />
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(7,27,46,0.42)_0%,rgba(7,27,46,0.08)_38%,rgba(7,27,46,0.88)_100%)]" aria-hidden="true" />
          </>
        ) : null}
        <HubContainer className="flex flex-1 flex-col pt-5">
          <div className="flex flex-wrap items-center justify-between gap-mc-12">
            <Link
              href="/eventos"
              className="inline-flex min-h-9 items-center gap-2 font-mc-interface text-sm font-semibold text-white/75 transition-colors duration-mc-fast hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Voltar para campeonatos
            </Link>
            <EventShareButton title={event.nome} />
          </div>

          <div className="mt-auto flex min-h-[17rem] items-end pb-7 pt-8 sm:min-h-[18rem] sm:pb-8 lg:min-h-[19rem] lg:pb-9">
            <div className="min-w-0 max-w-5xl">
              <p className="inline-flex min-h-6 items-center gap-2 rounded-mc-full bg-white/15 px-2.5 font-mc-interface text-xs font-medium text-white">
                <span
                  aria-hidden="true"
                  className={cn(
                    'h-2 w-2 rounded-full',
                    presentation.eventStatus.badgeVariant === 'success' ? 'bg-green-400' : 'bg-blue-300',
                  )}
                />
                {presentation.eventStatus.label}
              </p>

              <h1 className="mt-3 max-w-5xl text-balance font-mc-display text-[2.125rem] font-bold uppercase leading-[1.02] tracking-tight text-white md:text-5xl lg:text-[3.75rem]">
                {event.nome}
              </h1>

              <dl className="mt-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
                <div className="flex items-center gap-3 sm:border-r sm:border-white/20 sm:pr-6">
                  <CalendarDays aria-hidden="true" className="shrink-0 text-white" size={24} />
                  <div>
                    <dt className="sr-only">Data</dt>
                    <dd className="font-mc-interface text-sm font-semibold text-white">{dateInfo.long}</dd>
                    <dd className="mt-1 font-mc-interface text-xs capitalize text-white/85">{dateInfo.weekday}</dd>
                  </div>
                </div>
                {hasLocation ? (
                  <div className="flex items-center gap-3">
                    <MapPin aria-hidden="true" className="shrink-0 text-white" size={24} />
                    <div>
                      <dt className="sr-only">Local</dt>
                      <dd className="font-mc-interface text-sm font-semibold text-white">{event.local}</dd>
                    </div>
                  </div>
                ) : null}
              </dl>
            </div>

          </div>
        </HubContainer>
      </section>

      <EventPublicNavigation items={navItems} />

      <HubContainer className="py-8 sm:py-10">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,72fr)_minmax(19rem,28fr)] lg:gap-6">
          <div className="order-1 lg:order-none lg:col-span-2">
            <EventContentSidebar sections={sections} />
          </div>

          <div className="order-2 min-w-0 space-y-mc-16 lg:order-none">
            {presentation.overviewText ? (
              <section id="visao-geral" className="scroll-mt-36 rounded-mc-small border border-mc-border bg-mc-surface p-4 sm:p-5">
                <h2 className="flex items-center gap-2 font-mc-display text-xl font-bold text-mc-text-primary">
                  <FileText size={21} aria-hidden="true" />
                  Visão geral
                </h2>
                <p className="mt-3 whitespace-pre-line font-mc-interface text-sm leading-6 text-mc-text-secondary">
                  {presentation.overviewText}
                </p>
              </section>
            ) : null}

            {presentation.phases.length ? (
              <section id="cronograma" className="scroll-mt-36 rounded-mc-small border border-mc-border bg-mc-surface p-4 sm:p-5">
                <h2 className="flex items-center gap-2 font-mc-display text-xl font-bold text-mc-text-primary">
                  <Clock3 size={21} aria-hidden="true" className="text-mc-structure" />
                  Prazos e fases
                </h2>
                <p className="mt-2 font-mc-interface text-xs text-mc-text-secondary">
                  Datas e horários em {event.timezone.trim()}.
                </p>
                <ol className="mt-6 grid md:grid-cols-4">
                  {presentation.phases.map((phase, index) => {
                    const active = phase.timeline.state === 'atual'
                    const completed = phase.timeline.state === 'concluida'
                    const PhaseIcon = phaseIcons[phase.tipo]
                    const [start, end] = formatPhaseWindow(phase.inicio, phase.fim, event.timezone).split(' até ')
                    return (
                      <li
                        key={phase.id}
                        className="relative grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 pb-5 last:pb-0 md:block md:px-2 md:pb-0 md:text-center"
                      >
                        {index < presentation.phases.length - 1 ? (
                          <span
                            aria-hidden="true"
                            className={cn(
                              'absolute bottom-0 left-5 top-10 w-px md:bottom-auto md:left-[calc(50%+1.25rem)] md:right-[calc(-50%+1.25rem)] md:top-5 md:h-0.5 md:w-auto',
                              completed ? 'bg-mc-success' : active ? 'bg-mc-action/60' : 'bg-mc-border',
                            )}
                          />
                        ) : null}
                        <span
                          aria-hidden="true"
                          className={cn(
                            'relative z-10 inline-flex h-10 w-10 items-center justify-center rounded-full border md:mx-auto',
                            completed
                              ? 'border-mc-success bg-mc-success text-white'
                              : active
                                ? 'border-mc-action bg-mc-action text-white shadow-[0_0_0_5px_rgba(37,99,235,0.10)]'
                                : 'border-mc-border bg-mc-surface-secondary text-mc-text-secondary',
                          )}
                        >
                          <PhaseIcon size={18} />
                        </span>
                        <div className="min-w-0 md:mt-3">
                          <p className={cn('font-mc-interface text-sm font-semibold', active ? 'text-mc-action' : 'text-mc-text-primary')}>
                            {getPublicPhaseLabel(phase.tipo)}
                          </p>
                          <div className="mt-1 md:flex md:justify-center">
                            <StatusBadge variant={active ? 'info' : completed ? 'success' : 'neutral'}>{phase.timeline.label}</StatusBadge>
                          </div>
                          <p className="mt-2 font-mc-interface text-xs leading-5 text-mc-text-secondary">
                            <span className="block">{start}</span>
                            {end ? <span className="block">até {end}</span> : null}
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              </section>
            ) : null}

            {activeRules && categories.length > 0 ? (
              <div id="categorias" className="scroll-mt-36 rounded-mc-small border border-mc-border bg-mc-surface p-4 sm:p-5">
                <EventCategoriesPreview
                  version={activeRules.versao}
                  categories={categories}
                  eventId={event.id}
                  eventDate={event.data_evento}
                  catalog={categoryCatalog}
                  showRegistrationCta={presentation.showRegistrationCta}
                />
              </div>
            ) : null}

            {hasDocuments ? (
              <section id="documentos" className="scroll-mt-36 rounded-mc-small border border-mc-border bg-mc-surface p-4 sm:p-5">
                <h2 className="flex items-center gap-2 font-mc-display text-xl font-bold text-mc-text-primary">
                  <FileText size={21} aria-hidden="true" />
                  Regulamento e documentos
                </h2>
                <ul className="mt-mc-16 divide-y divide-mc-border border-y border-mc-border">
                  {event.regulamento_url ? (
                    <li>
                      <a
                        href={event.regulamento_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex min-h-14 items-center justify-between gap-mc-12 py-mc-12 font-mc-interface text-sm font-semibold text-mc-text-primary transition-colors hover:text-mc-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Download size={16} aria-hidden="true" />
                          Regulamento
                        </span>
                        <span className="text-mc-action">Abrir</span>
                      </a>
                    </li>
                  ) : null}
                  {event.tabela_peso_url ? (
                    <li>
                      <a
                        href={event.tabela_peso_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex min-h-14 items-center justify-between gap-mc-12 py-mc-12 font-mc-interface text-sm font-semibold text-mc-text-primary transition-colors hover:text-mc-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Download size={16} aria-hidden="true" />
                          Tabela de peso
                        </span>
                        <span className="text-mc-action">Abrir</span>
                      </a>
                    </li>
                  ) : null}
                </ul>
              </section>
            ) : null}

            {hasLocation ? (
              <section id="local" className="scroll-mt-36 overflow-hidden rounded-mc-small border border-mc-border bg-mc-surface">
                <div className="flex items-start gap-4 bg-gradient-to-r from-mc-action/[0.08] to-transparent p-4 sm:p-5">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mc-action/10 text-mc-action">
                    <MapPin size={21} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-mc-interface text-xs font-semibold uppercase tracking-[0.14em] text-mc-text-secondary">Local do campeonato</p>
                    <h2 className="mt-1 font-mc-display text-xl font-bold text-mc-text-primary">{event.local}</h2>
                  </div>
                </div>
              </section>
            ) : null}
          </div>

          <aside className="order-3 space-y-mc-16 lg:sticky lg:top-36 lg:order-none">
            <section aria-labelledby="inscricao-titulo" className="overflow-hidden rounded-mc-small border border-mc-border bg-mc-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="inscricao-titulo" className="flex items-center gap-2 font-mc-display text-base font-bold text-mc-text-primary">
                  <Trophy size={18} aria-hidden="true" className="text-mc-structure" />
                  Inscrição
                </h2>
                <StatusBadge variant={presentation.registrationStatus.badgeVariant}>
                  {presentation.registrationStatus.label}
                </StatusBadge>
              </div>
              <div className="mt-4">
                <p className="font-mc-interface text-[10px] uppercase text-mc-text-secondary">Valor da inscrição</p>
                <p className="mt-1 font-mc-display text-2xl font-bold tracking-tight text-mc-text-primary">
                  {event.valor_inscricao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
                {registrationPhase && presentation.showRegistrationCta ? (
                  <p className="mt-mc-12 font-mc-interface text-xs text-mc-text-secondary">
                    Prazo: {formatPhaseWindow(registrationPhase.inicio, registrationPhase.fim, event.timezone)}
                  </p>
                ) : null}
                <p className="mt-2 font-mc-interface text-xs leading-5 text-mc-text-secondary">
                  {presentation.registrationStatus.hint}
                </p>

                <div className="mt-4 space-y-2">
                  {presentation.showRegistrationCta ? (
                    <Link
                      href={`/eventos/${event.id}/inscricao/cadastrar-atleta`}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-mc-small bg-mc-action px-3 font-mc-interface text-xs font-semibold text-white transition-colors duration-mc-normal hover:bg-mc-action/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2"
                    >
                      <SquarePen size={16} aria-hidden="true" />
                      Fazer inscrição
                    </Link>
                  ) : null}

                  {presentation.primaryAction === 'informacoes' && !presentation.showRegistrationCta ? (
                    <p className="font-mc-interface text-xs font-medium text-mc-text-secondary">
                      Consulte as informações do evento enquanto as inscrições não abrem.
                    </p>
                  ) : null}

                  {secondaryLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-mc-small border border-mc-text-secondary/40 bg-mc-surface px-3 font-mc-interface text-xs font-semibold text-mc-text-primary transition-colors duration-mc-normal hover:bg-mc-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
                    >
                      <item.icon size={16} aria-hidden="true" />
                      {item.label}
                    </Link>
                  ))}

                  {presentation.showCheckingLink ? (
                    <Link
                      href={`/eventos/${event.id}/checagem`}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-mc-small border border-mc-text-secondary/40 bg-mc-surface px-3 font-mc-interface text-xs font-semibold text-mc-text-primary transition-colors duration-mc-normal hover:bg-mc-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
                    >
                      <ClipboardList size={16} aria-hidden="true" />
                      Consultar checagem
                    </Link>
                  ) : null}
                </div>
              </div>
            </section>
          </aside>
        </div>
      </HubContainer>

      <ModernFooter />
    </main>
  )
}
