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

function HubContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:px-8', className)} />
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
    <main className="min-h-screen bg-mc-background">
      <ModernNavbar />

      <section className="relative isolate overflow-hidden bg-mc-nav-dark pt-16 text-white">
        {event.imagem_cartaz_url ? (
          <>
            <Image
              src={event.imagem_cartaz_url}
              alt=""
              fill
              unoptimized
              priority
              sizes="100vw"
              className="-z-20 object-cover object-[center_40%] opacity-60 grayscale"
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-mc-nav-dark via-mc-nav-dark/95 to-mc-nav-dark/20" aria-hidden="true" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-mc-nav-dark/80 via-transparent to-mc-nav-dark/30" aria-hidden="true" />
          </>
        ) : null}
        <HubContainer className="pt-5">
          <div className="flex flex-wrap items-center justify-between gap-mc-12">
            <Link
              href="/eventos"
              className="inline-flex min-h-9 items-center gap-2 font-mc-interface text-sm font-semibold text-white/75 transition-colors duration-mc-fast hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Voltar para eventos
            </Link>
            <EventShareButton title={event.nome} />
          </div>

          <div className="mt-5 grid items-end gap-6 sm:grid-cols-[minmax(0,1fr)_14rem] lg:min-h-[16rem] lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-10">
            <div className="min-w-0 pb-6">
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

              <h1 className="mt-3 max-w-[42rem] text-balance font-mc-display text-[2.125rem] font-bold uppercase leading-[1.02] tracking-tight text-white md:text-5xl lg:text-[3.75rem]">
                {event.nome}
              </h1>

              <dl className="mt-6 grid gap-4 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-6">
                <div className="flex items-center gap-3 lg:border-r lg:border-white/15 lg:pr-6">
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

            {event.imagem_cartaz_url ? (
              <div className="relative mx-auto w-full max-w-[18rem] sm:mx-0">
                <div className="relative aspect-[4/5] overflow-hidden rounded-t-mc-small bg-mc-nav-dark/40 shadow-mc-elevated sm:aspect-square">
                  <Image
                    src={event.imagem_cartaz_url}
                    alt={`Cartaz de ${event.nome}`}
                    fill
                    unoptimized
                    className="object-contain object-bottom"
                    sizes="(min-width: 1024px) 256px, (min-width: 640px) 224px, 288px"
                  />
                </div>
              </div>
            ) : (
              <div className="hidden rounded-t-mc-small border border-white/10 bg-white/5 p-6 lg:flex lg:min-h-[16rem] lg:items-end">
                <p className="font-mc-display text-2xl font-semibold leading-tight text-white/85">{event.nome}</p>
              </div>
            )}
          </div>
        </HubContainer>
      </section>

      <EventPublicNavigation items={navItems} />

      <HubContainer className="py-6">
        <div className="grid items-start gap-5 lg:grid-cols-[13.75rem_minmax(0,1fr)_18.75rem]">
          <aside className="order-1 lg:sticky lg:top-32 lg:order-none">
            <EventContentSidebar sections={sections} />
          </aside>

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
                <ol className="mt-4">
                  {presentation.phases.map((phase, index) => {
                    const active = phase.timeline.state === 'atual'
                    return (
                      <li
                        key={phase.id}
                        className={cn(
                          'relative ml-1 border-l border-mc-border py-2 pl-5',
                          index === 0 ? 'pt-0' : '',
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            'absolute -left-1 top-3 h-2 w-2 rounded-full ring-2 ring-white',
                            index === 0 ? 'top-1.5' : '',
                            active ? 'bg-mc-action' : 'bg-mc-text-secondary',
                          )}
                        />
                        <div>
                          <div className="flex flex-wrap items-center gap-mc-8">
                            <p className="font-mc-interface text-sm font-medium text-mc-text-primary">
                              {getPublicPhaseLabel(phase.tipo)}
                            </p>
                            <StatusBadge variant={active ? 'success' : 'neutral'}>{phase.timeline.label}</StatusBadge>
                          </div>
                          <p className="mt-1 font-mc-interface text-xs leading-5 text-mc-text-secondary">
                            {formatPhaseWindow(phase.inicio, phase.fim, event.timezone)}
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
              <section id="local" className="scroll-mt-36 rounded-mc-small border border-mc-border bg-mc-surface p-4 sm:p-5">
                <h2 className="flex items-center gap-2 font-mc-display text-xl font-bold text-mc-text-primary">
                  <MapPin size={21} aria-hidden="true" className="text-mc-structure" />
                  Local
                </h2>
                <p className="mt-3 font-mc-interface text-sm font-semibold leading-6 text-mc-text-primary">{event.local}</p>
              </section>
            ) : null}
          </div>

          <aside className="order-3 space-y-mc-16 lg:sticky lg:top-32 lg:order-none">
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
