import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CalendarDays, MapPin, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import InternalNavigation from '@/components/InternalNavigation'
import { Alert } from '@/components/ui/Alert'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  MobileRecord,
  MobileRecordActions,
  MobileRecordHeader,
  MobileRecordMeta,
  MobileRecordTitle,
} from '@/components/ui/MobileRecord'
import { PageContainer } from '@/components/ui/PageContainer'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge, type StatusBadgeProps } from '@/components/ui/StatusBadge'
import EventActions from './EventActions'

const labels: Record<string, string> = {
  rascunho: 'Rascunho',
  publicado: 'Publicado',
  inscricao: 'Inscrições',
  pagamento: 'Pagamento',
  checagem: 'Checagem',
  chaves: 'Chaves',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

const statusVariants: Record<string, StatusBadgeProps['variant']> = {
  rascunho: 'warning',
  publicado: 'info',
  inscricao: 'success',
  pagamento: 'warning',
  checagem: 'info',
  chaves: 'info',
  em_andamento: 'success',
  concluido: 'neutral',
  cancelado: 'error',
}

const formatter = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' })

type EventItem = {
  id: string
  nome: string
  data_evento: string
  local: string
  status: string
  timezone: string
  checagem_travada_em: string | null
}

function EventStatus({ status }: { status: string }) {
  return <StatusBadge variant={statusVariants[status] || 'neutral'}>{labels[status] || status}</StatusBadge>
}

function EventLinks({ event }: { event: EventItem }) {
  return (
    <div>
      <div className="flex flex-wrap gap-x-mc-16 gap-y-mc-8 font-mc-interface text-sm font-semibold">
        <Link href={`/admin/eventos/${event.id}/configuracao`} className="inline-flex min-h-10 items-center text-mc-action hover:underline">Configurar</Link>
        <Link href={`/admin/eventos/${event.id}/checagem`} className="inline-flex min-h-10 items-center text-mc-action hover:underline">Checagem</Link>
        <Link href={`/admin/eventos/${event.id}/financeiro`} className="inline-flex min-h-10 items-center text-mc-action hover:underline">Financeiro</Link>
        <Link href={`/admin/eventos/${event.id}/chaves`} className="inline-flex min-h-10 items-center text-mc-action hover:underline">Chaves</Link>
        <Link href={`/admin/eventos/${event.id}/programacao`} className="inline-flex min-h-10 items-center text-mc-action hover:underline">Programação</Link>
        <Link href={`/admin/eventos/${event.id}/resultados`} className="inline-flex min-h-10 items-center text-mc-action hover:underline">Resultados</Link>
        {event.status === 'rascunho' ? <Link href={`/admin/eventos/${event.id}/editar`} className="inline-flex min-h-10 items-center text-mc-action hover:underline">Editar</Link> : null}
        {event.status !== 'rascunho' ? <Link href={`/eventos/${event.id}`} className="inline-flex min-h-10 items-center text-mc-action hover:underline">Página pública</Link> : null}
      </div>
      <EventActions eventId={event.id} status={event.status} checkingLocked={Boolean(event.checagem_travada_em)} />
    </div>
  )
}

export default async function OrganizerEventsPage() {
  const supabase = createClient()
  const { data: authData } = await supabase.auth.getUser()
  if (!authData.user) redirect('/admin/autenticacao?redirectTo=%2Fadmin%2Feventos')

  const { data: membership } = await supabase.from('organization_members')
    .select('organization_id, role, organizations(nome)').in('role', ['owner', 'organizer']).limit(1).maybeSingle()
  if (!membership) redirect('/dashboard?erro=sem_permissao')

  const { data: events, error } = await supabase.from('events')
    .select('id, nome, data_evento, local, status, timezone, checagem_travada_em').eq('organization_id', membership.organization_id)
    .order('data_evento', { ascending: true })
  const organization = membership.organizations as unknown as { nome: string } | null
  const eventItems = (events || []) as EventItem[]

  const columns: Array<DataTableColumn<EventItem>> = [
    {
      key: 'event',
      header: 'Evento',
      render: (event) => (
        <div className="min-w-64">
          <p className="font-semibold text-mc-text-primary">{event.nome}</p>
          <p className="mt-mc-4 flex items-start gap-mc-8 text-mc-text-secondary"><MapPin aria-hidden="true" size={16} className="mt-0.5 shrink-0" />{event.local}</p>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Data',
      render: (event) => (
        <div className="min-w-28">
          <p className="font-semibold">{formatter.format(new Date(`${event.data_evento}T12:00:00Z`))}</p>
          <p className="mt-mc-4 text-xs text-mc-text-secondary">{event.timezone}</p>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (event) => <EventStatus status={event.status} /> },
    { key: 'actions', header: 'Ações', render: (event) => <EventLinks event={event} />, className: 'min-w-72' },
  ]

  return (
    <div className="-mt-24 min-h-screen bg-mc-background">
      <InternalNavigation canManageEvents />
      <main className="py-mc-32 sm:py-mc-48">
        <PageContainer>
          <PageHeader
            title="Eventos"
            description={<>Organização: <strong className="font-semibold text-mc-text-primary">{organization?.nome || 'Organização'}</strong> · Papel: <strong className="font-semibold text-mc-text-primary">{membership.role}</strong></>}
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

          {error ? (
            <Alert variant="error" role="alert" className="mt-mc-24">Não foi possível carregar os eventos.</Alert>
          ) : null}

          {!error && eventItems.length === 0 ? (
            <EmptyState
              icon={<CalendarDays size={34} />}
              title="Nenhum evento cadastrado"
              description="Crie o primeiro rascunho da organização para iniciar a operação."
              action={<Link href="/admin/eventos/novo" className="font-mc-interface font-semibold text-mc-action hover:underline">Criar evento</Link>}
              className="mt-mc-32 rounded-mc-medium border border-mc-border bg-mc-surface"
            />
          ) : null}

          {!error && eventItems.length ? (
            <section className="mt-mc-32" aria-labelledby="events-list-title">
              <h2 id="events-list-title" className="sr-only">Lista de eventos</h2>
              <DataTable
                rows={eventItems}
                columns={columns}
                getRowKey={(event) => event.id}
                caption="Eventos da organização"
                className="hidden md:block"
                tableClassName="min-w-[900px]"
              />

              <div className="space-y-mc-12 md:hidden">
                {eventItems.map((event) => (
                  <MobileRecord key={event.id}>
                    <MobileRecordHeader>
                      <MobileRecordTitle className="text-lg leading-6">{event.nome}</MobileRecordTitle>
                      <EventStatus status={event.status} />
                    </MobileRecordHeader>
                    <MobileRecordMeta className="mt-mc-12 space-y-mc-8">
                      <p className="flex items-center gap-mc-8"><CalendarDays aria-hidden="true" size={17} className="text-mc-action" />{formatter.format(new Date(`${event.data_evento}T12:00:00Z`))}</p>
                      <p className="flex items-start gap-mc-8"><MapPin aria-hidden="true" size={17} className="mt-0.5 shrink-0 text-mc-action" />{event.local}</p>
                    </MobileRecordMeta>
                    <MobileRecordActions><EventLinks event={event} /></MobileRecordActions>
                  </MobileRecord>
                ))}
              </div>
            </section>
          ) : null}
        </PageContainer>
      </main>
    </div>
  )
}
