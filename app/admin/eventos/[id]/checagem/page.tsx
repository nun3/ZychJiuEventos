import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, ClipboardList, Info } from 'lucide-react'
import InternalNavigation from '@/components/InternalNavigation'
import { Alert } from '@/components/ui/Alert'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageContainer } from '@/components/ui/PageContainer'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/lib/supabase/database.types'
import EventRegistrationsList, { type EventRegistrationItem } from './EventRegistrationsList'

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function snapshotRecord(snapshot: Json) {
  return snapshot && typeof snapshot === 'object' && !Array.isArray(snapshot)
    ? snapshot as Record<string, Json | undefined>
    : {}
}

function textValue(value: Json | undefined, fallback = 'Não informado') {
  return typeof value === 'string' && value.trim() ? value : fallback
}

function numberValue(value: Json | undefined) {
  return typeof value === 'number' ? value : null
}

export default async function EventRegistrationsPage({ params }: { params: { id: string } }) {
  if (!uuidPattern.test(params.id)) notFound()

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/admin/autenticacao?redirectTo=${encodeURIComponent(`/admin/eventos/${params.id}/checagem`)}`)

  const { data: event } = await supabase
    .from('events')
    .select('id, nome, organization_id, status')
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
    .select('id, numero, status, athlete_snapshot, category_snapshot, created_at, payment_registrations(payments(status))')
    .eq('event_id', event.id)
    .order('numero', { ascending: true })

  const registrations: EventRegistrationItem[] = (data || []).map((registration) => {
    const athlete = snapshotRecord(registration.athlete_snapshot)
    const category = snapshotRecord(registration.category_snapshot)
    const paymentStatuses = registration.payment_registrations
      .map((link) => link.payments?.status)
      .filter((status): status is NonNullable<typeof status> => Boolean(status))

    return {
      id: registration.id,
      number: registration.numero,
      athleteName: textValue(athlete.nome_completo, 'Atleta não informado'),
      teamName: textValue(athlete.team_name),
      categoryName: textValue(category.nome, 'Categoria não informada'),
      belt: textValue(athlete.faixa),
      registeredWeight: numberValue(athlete.peso_kg),
      registrationStatus: registration.status,
      paymentStatus: paymentStatuses.at(-1) || null,
      createdAt: registration.created_at,
    }
  })

  return (
    <div className="-mt-24 min-h-screen bg-mc-background">
      <InternalNavigation />
      <main className="py-mc-32 sm:py-mc-48">
        <PageContainer>
          <PageHeader
            title={`Inscritos — ${event.nome}`}
            description="Consulta operacional das inscrições reais deste evento. Use a busca para localizar atletas, equipes, categorias ou números de inscrição."
            breadcrumb={
              <Link href={`/admin/eventos/${event.id}/gerenciar`} className="inline-flex min-h-10 items-center gap-mc-8 font-semibold text-mc-action hover:underline">
                <ArrowLeft aria-hidden="true" size={18} />
                Voltar para gestão
              </Link>
            }
            actions={<StatusBadge variant="info">Evento: {event.status.replaceAll('_', ' ')}</StatusBadge>}
          />

          <Alert className="mt-mc-24" variant="info" icon={<Info size={20} />} title="Operação somente para consulta">
            Check-in e pesagem ainda não possuem persistência no modelo atual. Nenhuma ação operacional foi simulada nesta tela.
          </Alert>

          <section aria-labelledby="event-registrations-title" className="mt-mc-24">
            <h2 id="event-registrations-title" className="sr-only">Inscrições do evento</h2>
            {error ? (
              <Alert role="alert" variant="error" title="Não foi possível carregar os inscritos">
                Tente novamente. Nenhum dado foi alterado.
              </Alert>
            ) : registrations.length ? (
              <EventRegistrationsList registrations={registrations} />
            ) : (
              <EmptyState
                icon={<ClipboardList size={34} />}
                title="Nenhuma inscrição neste evento"
                description="As inscrições reais aparecerão aqui assim que forem cadastradas."
                className="rounded-mc-medium border border-mc-border bg-mc-surface"
              />
            )}
          </section>
        </PageContainer>
      </main>
    </div>
  )
}
