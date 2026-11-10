import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import type { HTMLAttributes } from 'react'
import { ClipboardList, Clock3, Download, GitBranch, SquarePen } from 'lucide-react'
import ModernNavbar from '@/components/ModernNavbar'
import ModernFooter from '@/components/ModernFooter'
import EventCategoriesPreview from '@/components/events/public-event/EventCategoriesPreview'
import EventContentSidebar from '@/components/events/public-event/EventContentSidebar'
import EventPublicNavigation from '@/components/events/public-event/EventPublicNavigation'
import EventShareButton from '@/components/events/public-event/EventShareButton'
import { PublicEventHero, PublicHeroLink } from '@/components/events/public-event/PublicEventHero'
import { PublicEventVenueMap, type PublicVenueMapProps } from '@/components/events/public-event/PublicEventVenueMap'
import { PublicEventVenueGeo } from '@/components/events/public-event/PublicEventVenueGeo'
import type { Event } from '@/components/ModernEventGrid'
import { findPublicReleaseEvent } from '@/lib/events/public-access'
import { catalogStatusLabel, eventDateParts } from '@/lib/events/catalog-presentation'
import {
  buildPublicEventSections,
  formatPhaseWindow,
  formatPublicEventDate,
  getPublicEventNavItems,
  getPublicEventPresentation,
  getPublicPhaseLabel,
  type PublicBadgeVariant,
} from '@/lib/events/public-event-presentation'
import { getDevelopmentPreviewEvent } from '@/lib/home/cinematic-preview-events'
import { geocodeAddress } from '@/lib/location/lookup'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/components/ui/utils'
import type { SportCategoryCatalog } from '@/lib/events/category-resolver'

const solidAction = 'inline-flex min-h-12 w-full items-center justify-center gap-2 bg-mc-text-primary px-4 font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-colors duration-200 hover:bg-mc-structure focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus'
const lineAction = 'inline-flex min-h-12 items-center justify-center gap-2 border border-mc-text-primary px-4 font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] text-mc-text-primary transition-colors duration-200 hover:bg-mc-text-primary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus'
const lineActionFull = `${lineAction} w-full`
const sectionTitle = 'font-mc-display text-3xl font-bold uppercase leading-[0.95] tracking-[-0.03em] text-mc-text-primary'

function statusMark(variant: PublicBadgeVariant) {
  if (variant === 'success') return 'bg-mc-success'
  if (variant === 'warning') return 'bg-mc-warning'
  if (variant === 'error') return 'bg-mc-error'
  if (variant === 'info') return 'bg-mc-action'
  return 'bg-mc-text-secondary'
}

function MarkedStatus({ label, variant, light = false }: { label: string; variant: PublicBadgeVariant; light?: boolean }) {
  return (
    <p className={`font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] ${light ? 'text-white' : 'text-mc-text-primary'}`}>
      <span aria-hidden="true" className={`mr-2 inline-block h-2 w-2 ${light && variant === 'neutral' ? 'bg-white' : statusMark(variant)}`} />
      {label}
    </p>
  )
}

function HubContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn('w-full px-4 sm:px-8 lg:px-12 xl:px-20', className)} />
}

function PreviewChampionship({ event }: { event: Event }) {
  const date = eventDateParts(event.dateObj)
  const meta = [date?.long, event.location].filter(Boolean).join(' · ')
  return (
    <main id="conteudo-principal" className="min-h-screen overflow-x-clip bg-mc-background pt-16">
      <ModernNavbar />
      <PublicEventHero
        title={event.title}
        imageUrl={event.image}
        statusLabel={catalogStatusLabel(event.status)}
        meta={meta}
        note="Campeonato fictício para ensaiar a página. Nada foi publicado. Inscrição, chaves e placar acontecem só na demonstração deste navegador."
        share={<EventShareButton title={event.title} />}
        actions={<PublicHeroLink href="/eventos#experimentar-demo">Experimentar sem cadastro</PublicHeroLink>}
      />
      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-8 lg:px-12 xl:px-20">
        <p className="font-mc-interface text-[11px] font-semibold uppercase tracking-[0.18em] text-mc-text-secondary">Status publicado</p>
        <h2 className={`mt-3 max-w-3xl ${sectionTitle}`}>Sem inscrição, sem chaves e sem cobrança.</h2>
        <p className="mt-5 max-w-2xl font-mc-interface text-base leading-7 text-mc-text-secondary">
          Neste ensaio o campeonato está publicado e as inscrições ainda não abriram. No evento real, esta mesma tela mostra os prazos, o valor, as categorias e os documentos gravados pelo organizador.
        </p>
      </section>
      <ModernFooter />
    </main>
  )
}

export default async function EventPage({ params }: { params: { id: string } }) {
  if (params.id.startsWith('preview-')) {
    const preview = getDevelopmentPreviewEvent(params.id)
    if (!preview) notFound()
    return <PreviewChampionship event={preview} />
  }

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
  const hasStructuredVenue = Boolean(
    event.local_nome?.trim() ||
      event.local_logradouro?.trim() ||
      event.local_cidade?.trim() ||
      event.local?.trim(),
  )
  const hasLocation = hasStructuredVenue
  const venue = {
    nome: event.local_nome,
    logradouro: event.local_logradouro,
    numero: event.local_numero,
    complemento: event.local_complemento,
    bairro: event.local_bairro,
    cidade: event.local_cidade,
    uf: event.local_uf,
    cep: event.local_cep,
    latitude: typeof event.local_latitude === 'number' ? event.local_latitude : null,
    longitude: typeof event.local_longitude === 'number' ? event.local_longitude : null,
    fallbackLocal: event.local,
  } satisfies Omit<PublicVenueMapProps, 'precision'>

  const sections = buildPublicEventSections({
    hasOverview: Boolean(presentation.overviewText),
    hasLocation,
    hasValues: true,
    hasPhases: presentation.phases.length > 0,
    hasCategories: categories.length > 0,
    hasDocuments,
    hasChecking: presentation.showCheckingLink,
    hasBrackets: true,
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

  const meta = [dateInfo.dateOnlyLabel, hasLocation ? event.local : null].filter(Boolean).join(' · ')

  return (
    <main id="conteudo-principal" className="min-h-screen overflow-x-clip bg-mc-background pt-16">
      <ModernNavbar />
      <PublicEventHero
        title={event.nome}
        imageUrl={event.imagem_cartaz_url}
        statusLabel={presentation.eventStatus.label}
        meta={meta}
        share={<EventShareButton title={event.nome} />}
        actions={presentation.showRegistrationCta ? (
          <PublicHeroLink href={`/eventos/${event.id}/inscricao/cadastrar-atleta`}>Fazer inscrição</PublicHeroLink>
        ) : undefined}
      />
      <EventPublicNavigation items={navItems} />

      <HubContainer className="py-8 sm:py-10">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,72fr)_minmax(19rem,28fr)] lg:gap-6">
          <div className="order-1 lg:order-none lg:col-span-2">
            <EventContentSidebar sections={sections} />
          </div>

          <div className="order-2 min-w-0 space-y-mc-16 lg:order-none">
            {presentation.overviewText ? (
              <section id="sobre" className="scroll-mt-36 border-b border-mc-border py-8">
                <h2 className={sectionTitle}>Sobre o evento</h2>
                <p className="mt-4 max-w-3xl whitespace-pre-line font-mc-interface text-base leading-7 text-mc-text-secondary">
                  {presentation.overviewText}
                </p>
              </section>
            ) : null}

            {hasLocation ? (
              <section id="local" className="scroll-mt-36 border-b border-mc-border py-8">
                <h2 className={sectionTitle}>Local do evento</h2>
                {/* O geocoding externo (Nominatim) não bloqueia a página: o endereço aparece já e o mapa chega por streaming. */}
                <Suspense fallback={<PublicEventVenueMap {...venue} latitude={null} longitude={null} precision={null} mapPending />}>
                  <PublicEventVenueGeo venue={venue} />
                </Suspense>
              </section>
            ) : null}

            <section id="valores" className="scroll-mt-36 border-b border-mc-border py-8">
              <h2 className={sectionTitle}>Valor da inscrição</h2>
              <div className="mt-6 border-l-4 border-mc-action pl-3">
                <p className="font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] text-mc-text-secondary">
                  Valor publicado
                </p>
                <p className="mt-1 font-mc-display text-4xl font-bold leading-none tracking-[-0.04em] text-mc-text-primary">
                  {event.valor_inscricao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              <p className="mt-4 max-w-2xl font-mc-interface text-base leading-7 text-mc-text-secondary">
                {presentation.registrationStatus.hint}
              </p>
              {registrationPhase ? (
                <p className="mt-3 font-mc-interface text-sm text-mc-text-secondary">
                  Janela de inscrição: {formatPhaseWindow(registrationPhase.inicio, registrationPhase.fim, event.timezone)}
                </p>
              ) : null}
            </section>

            {presentation.phases.length ? (
              <section id="cronograma" className="scroll-mt-36 border-b border-mc-border py-8">
                <h2 className={sectionTitle}>Prazos e fases</h2>
                <p className="mt-3 font-mc-interface text-sm text-mc-text-secondary">
                  Datas e horários em {event.timezone.trim()}.
                </p>
                <ol className="mt-8 divide-y divide-mc-border border-y border-mc-border">
                  {presentation.phases.map((phase, index) => {
                    const active = phase.timeline.state === 'atual'
                    const completed = phase.timeline.state === 'concluida'
                    const [start, end] = formatPhaseWindow(phase.inicio, phase.fim, event.timezone).split(' até ')
                    return (
                      <li key={phase.id} className="grid items-center gap-4 py-5 md:grid-cols-[5.5rem_minmax(0,1fr)_auto]">
                        <div className="border-l-4 border-mc-action pl-3">
                          <p className="font-mc-display text-3xl font-bold leading-none tracking-[-0.04em]">{String(index + 1).padStart(2, '0')}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="font-mc-display text-xl font-bold uppercase leading-tight">{getPublicPhaseLabel(phase.tipo)}</p>
                          <p className="mt-1 font-mc-interface text-sm text-mc-text-secondary">
                            {start}{end ? ` até ${end}` : ''}
                          </p>
                        </div>
                        <MarkedStatus label={phase.timeline.label} variant={active ? 'info' : completed ? 'success' : 'neutral'} />
                      </li>
                    )
                  })}
                </ol>
              </section>
            ) : null}

            {activeRules && categories.length > 0 ? (
              <div id="categorias" className="scroll-mt-36 border-b border-mc-border py-8">
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
              <section id="documentos" className="scroll-mt-36 border-b border-mc-border py-8">
                <h2 className={sectionTitle}>Regulamento</h2>
                <ul className="mt-6 divide-y divide-mc-border border-y border-mc-border">
                  {event.regulamento_url ? (
                    <li>
                      <a
                        href={event.regulamento_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex min-h-14 items-center justify-between gap-4 py-3 font-mc-interface text-sm font-semibold text-mc-text-primary transition-colors hover:text-mc-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
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
                        className="flex min-h-14 items-center justify-between gap-4 py-3 font-mc-interface text-sm font-semibold text-mc-text-primary transition-colors hover:text-mc-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
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

            {presentation.showCheckingLink ? (
              <section id="checagem" className="scroll-mt-36 border-b border-mc-border py-8">
                <h2 className={sectionTitle}>Checagem</h2>
                <p className="mt-4 max-w-2xl font-mc-interface text-base leading-7 text-mc-text-secondary">
                  A lista pública de participantes efetivados fica disponível na checagem do campeonato.
                </p>
                <Link href={`/eventos/${event.id}/checagem`} className={`${lineAction} mt-6`}>
                  <ClipboardList size={16} aria-hidden="true" />
                  Consultar checagem
                </Link>
              </section>
            ) : null}

            <section id="chaves" className="scroll-mt-36 border-b border-mc-border py-8">
              <h2 className={sectionTitle}>Chaves</h2>
              <p className="mt-4 max-w-2xl font-mc-interface text-base leading-7 text-mc-text-secondary">
                A composição oficial das chaves aparece quando a organização publica. Rascunho não entra nesta página.
              </p>
              <Link href={`/eventos/${event.id}/chaves`} className={`${lineAction} mt-6`}>
                <GitBranch size={16} aria-hidden="true" />
                Consultar chaves
              </Link>
            </section>
          </div>

          <aside className="order-3 lg:sticky lg:top-36 lg:order-none">
            <section aria-labelledby="inscricao-titulo" className="border border-mc-text-primary p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 id="inscricao-titulo" className="font-mc-display text-2xl font-bold uppercase leading-none">Inscrição</h2>
                <MarkedStatus label={presentation.registrationStatus.label} variant={presentation.registrationStatus.badgeVariant} />
              </div>
              <div className="mt-6 border-l-4 border-mc-action pl-3">
                <p className="font-mc-interface text-[11px] font-bold uppercase tracking-[0.14em] text-mc-text-secondary">Valor da inscrição</p>
                <p className="mt-1 font-mc-display text-4xl font-bold leading-none tracking-[-0.04em] text-mc-text-primary">
                  {event.valor_inscricao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              {registrationPhase && presentation.showRegistrationCta ? (
                <p className="mt-4 font-mc-interface text-sm text-mc-text-secondary">
                  Prazo: {formatPhaseWindow(registrationPhase.inicio, registrationPhase.fim, event.timezone)}
                </p>
              ) : null}
              <p className="mt-3 font-mc-interface text-sm leading-6 text-mc-text-secondary">
                {presentation.registrationStatus.hint}
              </p>

              <div className="mt-6 flex flex-col gap-3">
                {presentation.showRegistrationCta ? (
                  <Link href={`/eventos/${event.id}/inscricao/cadastrar-atleta`} className={solidAction}>
                    <SquarePen size={16} aria-hidden="true" />
                    Fazer inscrição
                  </Link>
                ) : null}

                {presentation.primaryAction === 'informacoes' && !presentation.showRegistrationCta ? (
                  <p className="font-mc-interface text-sm text-mc-text-secondary">
                    Consulte as informações do evento enquanto as inscrições não abrem.
                  </p>
                ) : null}

                {secondaryLinks.map((item) => (
                  <Link key={item.href} href={item.href} className={lineActionFull}>
                    <item.icon size={16} aria-hidden="true" />
                    {item.label}
                  </Link>
                ))}

                {presentation.showCheckingLink ? (
                  <Link href={`/eventos/${event.id}/checagem`} className={lineActionFull}>
                    <ClipboardList size={16} aria-hidden="true" />
                    Consultar checagem
                  </Link>
                ) : null}
              </div>
            </section>
          </aside>
        </div>
      </HubContainer>

      <ModernFooter />
    </main>
  )
}
