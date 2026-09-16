'use client'

import { useMemo, useState } from 'react'
import { ClipboardList, Search } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import {
  MobileRecord,
  MobileRecordHeader,
  MobileRecordMeta,
  MobileRecordStatus,
  MobileRecordTitle,
} from '@/components/ui/MobileRecord'
import { Select } from '@/components/ui/Select'
import { StatusBadge, type StatusBadgeProps } from '@/components/ui/StatusBadge'

export type EventRegistrationItem = {
  id: string
  number: number
  athleteName: string
  teamName: string
  categoryName: string
  belt: string
  registeredWeight: number | null
  registrationStatus: string
  paymentStatus: string | null
  createdAt: string
}

const registrationLabels: Record<string, string> = {
  rascunho: 'Rascunho',
  pendente_pagamento: 'Pendente de pagamento',
  efetivada: 'Efetivada',
  expirada: 'Expirada',
  cancelada: 'Cancelada',
  estornada: 'Estornada',
}

const registrationVariants: Record<string, StatusBadgeProps['variant']> = {
  rascunho: 'neutral',
  pendente_pagamento: 'warning',
  efetivada: 'success',
  expirada: 'error',
  cancelada: 'error',
  estornada: 'error',
}

const paymentLabels: Record<string, string> = {
  aguardando: 'Pagamento aguardando',
  pago: 'Pagamento confirmado',
  expirado: 'Pagamento expirado',
  cancelado: 'Pagamento cancelado',
  estornado: 'Pagamento estornado',
}

const paymentVariants: Record<string, StatusBadgeProps['variant']> = {
  aguardando: 'warning',
  pago: 'success',
  expirado: 'error',
  cancelado: 'error',
  estornado: 'error',
}

function RegistrationStatus({ status }: { status: string }) {
  return <StatusBadge variant={registrationVariants[status] || 'neutral'}>{registrationLabels[status] || status.replaceAll('_', ' ')}</StatusBadge>
}

function PaymentStatus({ status }: { status: string | null }) {
  if (!status) return <StatusBadge variant="neutral">Sem pagamento vinculado</StatusBadge>
  return <StatusBadge variant={paymentVariants[status] || 'neutral'}>{paymentLabels[status] || status.replaceAll('_', ' ')}</StatusBadge>
}

function formatWeight(weight: number | null) {
  return weight === null ? 'Peso não informado' : `${weight.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg cadastrados`
}

const columns: Array<DataTableColumn<EventRegistrationItem>> = [
  {
    key: 'athlete',
    header: 'Inscrição / atleta',
    render: (registration) => (
      <div className="min-w-56">
        <p className="font-semibold text-mc-text-primary">{registration.athleteName}</p>
        <p className="mt-mc-4 text-xs text-mc-text-secondary">#{registration.number} · {registration.belt}</p>
      </div>
    ),
  },
  { key: 'team', header: 'Equipe', render: (registration) => <span className="min-w-40">{registration.teamName}</span> },
  {
    key: 'category',
    header: 'Categoria',
    render: (registration) => (
      <div className="min-w-48">
        <p>{registration.categoryName}</p>
        <p className="mt-mc-4 text-xs text-mc-text-secondary">{formatWeight(registration.registeredWeight)}</p>
      </div>
    ),
  },
  { key: 'registrationStatus', header: 'Inscrição', render: (registration) => <RegistrationStatus status={registration.registrationStatus} /> },
  { key: 'paymentStatus', header: 'Pagamento', render: (registration) => <PaymentStatus status={registration.paymentStatus} /> },
]

export default function EventRegistrationsList({ registrations }: { registrations: EventRegistrationItem[] }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')

  const filteredRegistrations = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR')
    return registrations.filter((registration) => {
      const matchesStatus = status === 'all' || registration.registrationStatus === status
      const searchable = `${registration.number} ${registration.athleteName} ${registration.teamName} ${registration.categoryName}`.toLocaleLowerCase('pt-BR')
      return matchesStatus && (!normalizedQuery || searchable.includes(normalizedQuery))
    })
  }, [query, registrations, status])

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-mc-border p-mc-16 sm:p-mc-20">
        <div className="grid gap-mc-12 md:grid-cols-[minmax(0,1fr)_16rem]">
          <label className="relative block">
            <span className="sr-only">Buscar inscrição</span>
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mc-text-secondary" size={18} />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar atleta, equipe, categoria ou número" className="pl-10" />
          </label>
          <label>
            <span className="sr-only">Filtrar por status da inscrição</span>
            <Select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">Todos os status</option>
              {Object.entries(registrationLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </Select>
          </label>
        </div>
        <p aria-live="polite" className="mt-mc-12 font-mc-interface text-sm text-mc-text-secondary">
          {filteredRegistrations.length} de {registrations.length} {registrations.length === 1 ? 'inscrição' : 'inscrições'}
        </p>
      </div>

      {filteredRegistrations.length ? (
        <>
          <DataTable rows={filteredRegistrations} columns={columns} getRowKey={(registration) => registration.id} caption="Inscrições reais do evento" className="hidden rounded-none border-0 lg:block" />
          <div className="space-y-mc-12 p-mc-12 lg:hidden">
            {filteredRegistrations.map((registration) => (
              <MobileRecord key={registration.id}>
                <MobileRecordHeader>
                  <div className="min-w-0">
                    <MobileRecordTitle className="truncate text-lg">{registration.athleteName}</MobileRecordTitle>
                    <MobileRecordMeta>Inscrição #{registration.number} · {registration.teamName}</MobileRecordMeta>
                  </div>
                  <RegistrationStatus status={registration.registrationStatus} />
                </MobileRecordHeader>
                <dl className="mt-mc-16 grid gap-mc-12 font-mc-interface text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-mc-text-secondary">Categoria</dt>
                    <dd className="mt-mc-4 text-mc-text-primary">{registration.categoryName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-mc-text-secondary">Cadastro</dt>
                    <dd className="mt-mc-4 text-mc-text-primary">{registration.belt} · {formatWeight(registration.registeredWeight)}</dd>
                  </div>
                </dl>
                <MobileRecordStatus><PaymentStatus status={registration.paymentStatus} /></MobileRecordStatus>
              </MobileRecord>
            ))}
          </div>
        </>
      ) : (
        <EmptyState icon={<ClipboardList size={32} />} title="Nenhuma inscrição encontrada" description="Ajuste a busca ou o filtro para ver outros inscritos." />
      )}
    </Card>
  )
}
