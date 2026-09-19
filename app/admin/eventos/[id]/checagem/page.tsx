import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ClipboardList, Info } from 'lucide-react'
import AdminEventNav, { adminEventBackLink } from '@/components/AdminEventNav'
import InternalNavigation from '@/components/InternalNavigation'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageContainer } from '@/components/ui/PageContainer'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/database.types'
import EventActions from '../../EventActions'
import EventRegistrationsList, { type EventRegistrationItem } from './EventRegistrationsList'
import ReviewCategoryChange from './ReviewCategoryChange'
import LockChecagem from './LockChecagem'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function snapshotRecord(snapshot: Json) {
  return snapshot && typeof snapshot === 'object' && !Array.isArray(snapshot)
    ? snapshot as Record<string, Json | undefined>
    : {}
}

function textValue(value: Json | undefined | string | null, fallback = 'Não informado') {
  return typeof value === 'string' && value.trim() ? value : fallback
}

function numberValue(value: Json | undefined) {
  if (typeof value === 'number') return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export default async function EventRegistrationsPage({ params }: { params: { id: string } }) {
  if (!uuidPattern.test(params.id)) notFound()

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/admin/autenticacao?redirectTo=${encodeURIComponent(`/admin/eventos/${params.id}/checagem`)}`)

  const { data: event } = await supabase
    .from('events')
    .select('id, nome, organization_id, status, checagem_travada_em')
    .eq('id', params.id)
    .maybeSingle()

  if (!event) notFound()

  const [{ data: membership }, { data: platformRole }] = await Promise.all([
    supabase.from('organization_members').select('role').eq('organization_id', event.organization_id).eq('user_id', user.id).in('role', ['owner', 'organizer']).limit(1).maybeSingle(),
    supabase.from('platform_user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').maybeSingle(),
  ])

  if (!membership && !platformRole) redirect('/dashboard?erro=sem_permissao')

  const { data, error } = await supabase
    .from('registrations')
    .select('id, numero, status, category_id, current_category_id, athlete_snapshot, category_snapshot, operational_professor_name, created_at, payment_registrations(payments(status))')
    .eq('event_id', event.id)
    .eq('status', 'efetivada')
    .order('numero', { ascending: true })

  const { data: ruleSets } = await supabase
    .from('category_rule_sets')
    .select('event_categories(id, nome)')
    .eq('event_id', event.id)

  const categoryNames = new Map(
    (ruleSets || []).flatMap((ruleSet) => (ruleSet.event_categories || []).map((category) => [category.id, category.nome] as const)),
  )

  const { data: pendingRequests } = await supabase
    .from('category_change_requests')
    .select('id, reason, created_at, current_category_id, requested_category_id, registrations!inner(id, numero, event_id, athlete_snapshot)')
    .eq('status', 'pendente')
    .eq('registrations.event_id', event.id)
    .order('created_at', { ascending: true })

  const mapped: EventRegistrationItem[] = (data || []).map((registration) => {
    const athlete = snapshotRecord(registration.athlete_snapshot)
    const category = snapshotRecord(registration.category_snapshot)
    const currentCategoryId = registration.current_category_id || registration.category_id
    const currentCategoryName = categoryNames.get(currentCategoryId) || textValue(category.nome, 'Categoria não informada')
    const originalCategoryName = textValue(category.nome, 'Categoria não informada')
    const paymentStatuses = registration.payment_registrations
      .map((link) => link.payments?.status)
      .filter((status): status is NonNullable<typeof status> => Boolean(status))

    return {
      id: registration.id,
      number: registration.numero,
      athleteName: textValue(athlete.nome_completo, 'Atleta não informado'),
      teamName: textValue(athlete.team_name),
      professorName: textValue(registration.operational_professor_name, 'Sem professor informado'),
      categoryName: currentCategoryName,
      originalCategoryName: currentCategoryId === registration.category_id ? undefined : originalCategoryName,
      belt: textValue(athlete.faixa),
      registeredWeight: numberValue(athlete.peso_kg),
      paymentStatus: paymentStatuses.at(-1) || null,
      createdAt: registration.created_at,
      isAloneInCategory: false,
    }
  })

  const categoryCounts = mapped.reduce<Record<string, number>>((counts, registration) => {
    counts[registration.categoryName] = (counts[registration.categoryName] || 0) + 1
    return counts
  }, {})

  const registrations = mapped.map((registration) => ({
    ...registration,
    isAloneInCategory: categoryCounts[registration.categoryName] === 1,
  }))

  const locked = Boolean(event.checagem_travada_em)

  return (
    <div className="-mt-24 min-h-screen bg-mc-background">
      <InternalNavigation canManageEvents />
      <main className="py-mc-32 sm:py-mc-48">
        <PageContainer>
          <PageHeader
            title={`Checagem — ${event.nome}`}
            description="Lista oficial das inscrições efetivadas deste evento. Pendentes, expiradas, canceladas e estornadas não entram na checagem."
            breadcrumb={adminEventBackLink()}
            actions={<StatusBadge variant={locked ? 'warning' : 'info'}>{locked ? 'Checagem travada' : `Evento: ${event.status.replaceAll('_', ' ')}`}</StatusBadge>}
          />
          <AdminEventNav eventId={event.id} current="checagem" />

          <Alert className="mt-mc-24" variant="info" icon={<Info size={20} />} title={locked ? 'Lista travada' : 'Lista oficial'}>
            {locked
              ? 'A checagem está travada. Solicitações e decisões de categoria ficam bloqueadas.'
              : 'A categoria exibida é a alocação vigente. O snapshot original permanece congelado. Professores e responsáveis solicitam mudança quando o atleta está sozinho; a organização aprova ou recusa.'}
          </Alert>

          {!locked && event.status === 'checagem' ? <LockChecagem eventId={event.id} /> : null}

          {locked && event.status === 'checagem' ? (
            <section className="mt-mc-24 rounded-mc-medium border border-mc-border bg-mc-surface p-mc-16" aria-labelledby="advance-to-brackets-title">
              <h2 id="advance-to-brackets-title" className="font-mc-display text-mc-h3 text-mc-text-primary">Avançar para chaves</h2>
              <p className="mt-mc-8 text-sm text-mc-text-secondary">
                A lista oficial está travada. Esta ação só muda a fase do evento. A geração das chaves continua na tela de chaves.
              </p>
              <div className="mt-mc-12">
                <EventActions eventId={event.id} status={event.status} checkingLocked />
              </div>
            </section>
          ) : null}

          {event.status === 'chaves' ? (
            <Alert className="mt-mc-24" variant="success" title="Fase de chaves aberta">
              A checagem permanece travada. Gere as chaves na operação correspondente.
              <Link href={`/admin/eventos/${event.id}/chaves`} className="mt-mc-12 inline-flex min-h-10 items-center font-semibold text-mc-action hover:underline">
                Ir para as chaves
              </Link>
            </Alert>
          ) : null}

          {pendingRequests?.length ? (
            <section aria-labelledby="pending-category-changes-title" className="mt-mc-24">
              <h2 id="pending-category-changes-title" className="font-mc-display text-mc-h3 text-mc-text-primary">Solicitações pendentes</h2>
              <ul className="mt-mc-16 space-y-mc-12">
                {pendingRequests.map((request) => {
                  const linked = request.registrations
                  const registration = Array.isArray(linked) ? linked[0] : linked
                  const athlete = snapshotRecord(registration?.athlete_snapshot ?? {})
                  return (
                    <li key={request.id} className="rounded-mc-medium border border-mc-border bg-mc-surface p-mc-16">
                      <p className="font-semibold text-mc-text-primary">{textValue(athlete.nome_completo)} · inscrição #{registration?.numero}</p>
                      <p className="mt-mc-8 text-sm text-mc-text-secondary">
                        {categoryNames.get(request.current_category_id) || 'Categoria atual'} → {categoryNames.get(request.requested_category_id) || 'Categoria solicitada'}
                      </p>
                      <p className="mt-mc-8 text-sm text-mc-text-primary">{request.reason}</p>
                      <ReviewCategoryChange requestId={request.id} eventId={event.id} locked={locked} />
                    </li>
                  )
                })}
              </ul>
            </section>
          ) : null}

          <section aria-labelledby="event-registrations-title" className="mt-mc-24">
            <h2 id="event-registrations-title" className="sr-only">Inscrições efetivadas do evento</h2>
            {error ? (
              <Alert role="alert" variant="error" title="Não foi possível carregar a checagem">
                Tente novamente. Nenhum dado foi alterado.
              </Alert>
            ) : registrations.length ? (
              <EventRegistrationsList registrations={registrations} />
            ) : (
              <EmptyState
                icon={<ClipboardList size={34} />}
                title="Nenhuma inscrição efetivada"
                description="A checagem só lista atletas com pagamento confirmado ou baixa manual."
                className="rounded-mc-medium border border-mc-border bg-mc-surface"
              />
            )}
          </section>
        </PageContainer>
      </main>
    </div>
  )
}
