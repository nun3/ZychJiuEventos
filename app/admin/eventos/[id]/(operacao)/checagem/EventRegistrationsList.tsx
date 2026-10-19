'use client'

import { useMemo, useState } from 'react'
import { ClipboardList, Search, UserRound } from 'lucide-react'
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
  professorName: string
  categoryName: string
  belt: string
  registeredWeight: number | null
  paymentStatus: string | null
  createdAt: string
  isAloneInCategory: boolean
  originalCategoryName?: string
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

function PaymentStatus({ status }: { status: string | null }) {
  if (!status) return <StatusBadge variant="neutral">Sem pagamento vinculado</StatusBadge>
  return <StatusBadge variant={paymentVariants[status] || 'neutral'}>{paymentLabels[status] || status.replaceAll('_', ' ')}</StatusBadge>
}

function OccupancyStatus({ isAlone }: { isAlone: boolean }) {
  if (isAlone) {
    return (
      <StatusBadge variant="warning" icon={<UserRound size={14} />}>
        Atleta sozinho
      </StatusBadge>
    )
  }
  return <StatusBadge variant="neutral">Categoria com adversários</StatusBadge>
}

function formatWeight(weight: number | null) {
  return weight === null ? 'Peso não informado' : `${weight.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg cadastrados`
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, 'pt-BR'))
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
  { key: 'professor', header: 'Professor', render: (registration) => <span className="min-w-40">{registration.professorName}</span> },
  {
    key: 'category',
    header: 'Categoria',
    render: (registration) => (
      <div className="min-w-48">
        <p>{registration.categoryName}</p>
        {registration.originalCategoryName ? (
          <p className="mt-mc-4 text-xs text-mc-text-secondary">Original: {registration.originalCategoryName}</p>
        ) : null}
        <p className="mt-mc-4 text-xs text-mc-text-secondary">{formatWeight(registration.registeredWeight)}</p>
      </div>
    ),
  },
  { key: 'occupancy', header: 'Ocupação', render: (registration) => <OccupancyStatus isAlone={registration.isAloneInCategory} /> },
  { key: 'paymentStatus', header: 'Pagamento', render: (registration) => <PaymentStatus status={registration.paymentStatus} /> },
]

export default function EventRegistrationsList({ registrations }: { registrations: EventRegistrationItem[] }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [team, setTeam] = useState('all')
  const [professor, setProfessor] = useState('all')

  const categories = useMemo(() => uniqueSorted(registrations.map((registration) => registration.categoryName)), [registrations])
  const teams = useMemo(() => uniqueSorted(registrations.map((registration) => registration.teamName)), [registrations])
  const professors = useMemo(() => uniqueSorted(registrations.map((registration) => registration.professorName)), [registrations])

  const filteredRegistrations = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR')
    return registrations.filter((registration) => {
      const matchesCategory = category === 'all' || registration.categoryName === category
      const matchesTeam = team === 'all' || registration.teamName === team
      const matchesProfessor = professor === 'all' || registration.professorName === professor
      const searchable = `${registration.number} ${registration.athleteName} ${registration.teamName} ${registration.professorName} ${registration.categoryName}`.toLocaleLowerCase('pt-BR')
      return matchesCategory && matchesTeam && matchesProfessor && (!normalizedQuery || searchable.includes(normalizedQuery))
    })
  }, [category, professor, query, registrations, team])

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-mc-border p-mc-16 sm:p-mc-20">
        <div className="grid gap-mc-12 md:grid-cols-2 xl:grid-cols-4">
          <label className="relative block">
            <span className="sr-only">Buscar inscrição efetivada</span>
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mc-text-secondary" size={18} />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar atleta, equipe, categoria ou número" className="pl-10" />
          </label>
          <label>
            <span className="sr-only">Filtrar por categoria</span>
            <Select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filtrar por categoria">
              <option value="all">Todas as categorias</option>
              {categories.map((value) => <option key={value} value={value}>{value}</option>)}
            </Select>
          </label>
          <label>
            <span className="sr-only">Filtrar por equipe</span>
            <Select value={team} onChange={(event) => setTeam(event.target.value)} aria-label="Filtrar por equipe">
              <option value="all">Todas as equipes</option>
              {teams.map((value) => <option key={value} value={value}>{value}</option>)}
            </Select>
          </label>
          <label>
            <span className="sr-only">Filtrar por professor</span>
            <Select value={professor} onChange={(event) => setProfessor(event.target.value)} aria-label="Filtrar por professor">
              <option value="all">Todos os professores</option>
              {professors.map((value) => <option key={value} value={value}>{value}</option>)}
            </Select>
          </label>
        </div>
        <p aria-live="polite" className="mt-mc-12 font-mc-interface text-sm text-mc-text-secondary">
          {filteredRegistrations.length} de {registrations.length} {registrations.length === 1 ? 'inscrição efetivada' : 'inscrições efetivadas'}
        </p>
      </div>

      {filteredRegistrations.length ? (
        <>
          <DataTable rows={filteredRegistrations} columns={columns} getRowKey={(registration) => registration.id} caption="Lista oficial de checagem" className="hidden rounded-none border-0 lg:block" />
          <div className="space-y-mc-12 p-mc-12 lg:hidden">
            {filteredRegistrations.map((registration) => (
              <MobileRecord key={registration.id}>
                <MobileRecordHeader>
                  <div className="min-w-0">
                    <MobileRecordTitle className="truncate text-lg">{registration.athleteName}</MobileRecordTitle>
                    <MobileRecordMeta>Inscrição #{registration.number} · {registration.teamName} · {registration.professorName}</MobileRecordMeta>
                  </div>
                  <OccupancyStatus isAlone={registration.isAloneInCategory} />
                </MobileRecordHeader>
                <dl className="mt-mc-16 grid gap-mc-12 font-mc-interface text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-mc-text-secondary">Categoria</dt>
                    <dd className="mt-mc-4 text-mc-text-primary">
                      {registration.categoryName}
                      {registration.originalCategoryName ? ` · original ${registration.originalCategoryName}` : ''}
                    </dd>
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
        <EmptyState icon={<ClipboardList size={32} />} title="Nenhuma inscrição encontrada" description="Ajuste a busca ou os filtros para ver outros efetivados." />
      )}
    </Card>
  )
}
