import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ClipboardList, MapPin } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import {
  MobileRecord,
  MobileRecordHeader,
  MobileRecordMeta,
  MobileRecordStatus,
  MobileRecordTitle,
} from '@/components/ui/MobileRecord'
import { PageContainer } from '@/components/ui/PageContainer'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge, type StatusBadgeProps } from '@/components/ui/StatusBadge'
import { createClient } from '@/lib/supabase/server'

const statusLabels: Record<string, string> = {
  rascunho: 'Rascunho',
  pendente_pagamento: 'Pendente de pagamento',
  efetivada: 'Efetivada',
  expirada: 'Expirada',
  cancelada: 'Cancelada',
  estornada: 'Estornada',
}

const statusVariants: Record<string, StatusBadgeProps['variant']> = {
  rascunho: 'neutral',
  pendente_pagamento: 'warning',
  efetivada: 'success',
  expirada: 'error',
  cancelada: 'error',
  estornada: 'error',
}

type RegistrationItem = {
  id: string
  numero: number
  status: string
  valor: number
  eventName: string
  eventDate: string
  eventLocation: string
  category: string
}

function RegistrationStatus({ status }: { status: string }) {
  return <StatusBadge variant={statusVariants[status] || 'neutral'}>{statusLabels[status] || status.replaceAll('_', ' ')}</StatusBadge>
}

export default async function AthleteRegistrationsPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const [{ data: athlete }, { data: registrations, error }] = await Promise.all([
    supabase.from('athletes').select('id, nome_completo').eq('id', params.id).maybeSingle(),
    supabase.from('registrations').select('id, numero, status, valor, created_at, events(nome, data_evento, local, status), category_snapshot').eq('athlete_id', params.id).order('created_at', { ascending: false }),
  ])
  if (!athlete) notFound()

  const items: RegistrationItem[] = (registrations || []).map((registration) => {
    const event = registration.events as unknown as { nome: string; data_evento: string; local: string; status: string } | null
    const snapshot = registration.category_snapshot
    const category = snapshot && typeof snapshot === 'object' && !Array.isArray(snapshot) && typeof snapshot.nome === 'string' ? snapshot.nome : 'A definir'
    return {
      id: registration.id,
      numero: registration.numero,
      status: registration.status,
      valor: registration.valor,
      eventName: event?.nome || 'Evento',
      eventDate: event ? new Date(`${event.data_evento}T12:00:00`).toLocaleDateString('pt-BR') : '',
      eventLocation: event?.local || '',
      category,
    }
  })
  const columns: Array<DataTableColumn<RegistrationItem>> = [
    {
      key: 'event',
      header: 'Evento',
      render: (item) => (
        <div className="min-w-56">
          <p className="font-semibold text-mc-text-primary">{item.eventName}</p>
          <p className="mt-mc-4 text-xs text-mc-text-secondary">{item.eventDate}{item.eventLocation ? ` · ${item.eventLocation}` : ''}</p>
        </div>
      ),
    },
    { key: 'number', header: 'Número', render: (item) => <span className="font-semibold">#{item.numero}</span> },
    { key: 'category', header: 'Categoria', render: (item) => item.category },
    { key: 'status', header: 'Situação', render: (item) => <RegistrationStatus status={item.status} /> },
    { key: 'amount', header: 'Valor', render: (item) => <span className="font-semibold">{item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span> },
  ]

  return (
    <main className="py-mc-32 sm:py-mc-48">
      <PageContainer>
        <PageHeader
          title={`Inscrições — ${athlete.nome_completo}`}
          description="Histórico real de inscrições permitido para esta conta."
          breadcrumb={<Link href="/dashboard/meus-atletas" className="inline-flex min-h-10 items-center gap-mc-8 font-semibold text-mc-action hover:underline"><ArrowLeft aria-hidden="true" size={18} />Voltar para atletas</Link>}
        />
        <div className="mt-mc-32">
          {error ? <Alert variant="error" role="alert">Não foi possível carregar as inscrições.</Alert> : null}
          {!error && !items.length ? (
            <EmptyState
              icon={<ClipboardList size={34} />}
              title="Nenhuma inscrição deste atleta"
              description="Quando este atleta for inscrito em um evento publicado, o histórico aparece aqui."
              action={<Link href="/eventos" className="inline-flex min-h-11 items-center font-mc-interface text-sm font-semibold text-mc-action hover:underline">Ver eventos publicados</Link>}
              className="rounded-mc-medium border border-mc-border bg-mc-surface"
            />
          ) : null}
          {!error && items.length ? (
            <>
              <DataTable rows={items} columns={columns} getRowKey={(item) => item.id} caption={`Inscrições de ${athlete.nome_completo}`} className="hidden md:block" tableClassName="min-w-[820px]" />
              <div className="space-y-mc-12 md:hidden">
                {items.map((item) => (
                  <MobileRecord key={item.id}>
                    <MobileRecordHeader>
                      <div className="min-w-0">
                        <MobileRecordTitle className="text-lg leading-6">{item.eventName}</MobileRecordTitle>
                        <MobileRecordMeta>Inscrição #{item.numero} · {item.eventDate}</MobileRecordMeta>
                      </div>
                    </MobileRecordHeader>
                    {item.eventLocation ? <p className="mt-mc-12 flex items-start gap-mc-8 font-mc-interface text-sm text-mc-text-secondary"><MapPin aria-hidden="true" size={17} className="mt-0.5 shrink-0 text-mc-action" />{item.eventLocation}</p> : null}
                    <dl className="mt-mc-16 grid grid-cols-2 gap-mc-12 border-y border-mc-border py-mc-12 font-mc-interface text-sm">
                      <div><dt className="text-mc-text-secondary">Categoria</dt><dd className="mt-mc-4 font-semibold text-mc-text-primary">{item.category}</dd></div>
                      <div><dt className="text-mc-text-secondary">Valor</dt><dd className="mt-mc-4 font-semibold text-mc-text-primary">{item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</dd></div>
                    </dl>
                    <MobileRecordStatus><RegistrationStatus status={item.status} /></MobileRecordStatus>
                  </MobileRecord>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </PageContainer>
    </main>
  )
}
