'use client'

import { useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { FormField } from '@/components/ui/FormField'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

const eventTypes = [
  'Todos',
  'Campeonato',
  'Seminário',
  'Desafio/Confrontos',
  'Curso/Workshop',
  'MMA',
  'Camp',
  'Aulão',
]

const sports = [
  'Todas',
  'Aikido',
  'Capoeira',
  'Grappling',
  'Jiu-Jitsu',
  'Judo',
  'Karatê',
  'Kickboxing',
  'Krav Maga',
  'Kung Fu',
  'MuayThai',
  'ParaJiu-Jitsu',
  'Sambo',
  'Submission (NO-GI)',
  'Taekwondo',
  'Wrestling',
]

const states = [
  'Todos',
  'AC - Acre',
  'AL - Alagoas',
  'AP - Amapá',
  'AM - Amazonas',
  'BA - Bahia',
  'CE - Ceará',
  'DF - Distrito Federal',
  'ES - Espírito Santo',
  'GO - Goiás',
  'MA - Maranhão',
  'MT - Mato Grosso',
  'MS - Mato Grosso do Sul',
  'MG - Minas Gerais',
  'PA - Pará',
  'PB - Paraíba',
  'PR - Paraná',
  'PE - Pernambuco',
  'PI - Piauí',
  'RJ - Rio de Janeiro',
  'RN - Rio Grande do Norte',
  'RS - Rio Grande do Sul',
  'RO - Rondônia',
  'RR - Roraima',
  'SC - Santa Catarina',
  'SP - São Paulo',
  'SE - Sergipe',
  'TO - Tocantins',
]

interface EventFiltersProps {
  onFilterChange?: (filters: {
    eventType: string
    sport: string
    state: string
    search: string
    period: string
    startDate: string
    endDate: string
  }) => void
}

const initialFilters = {
  eventType: 'Todos',
  sport: 'Todas',
  state: 'Todos',
  search: '',
  period: 'todos',
  startDate: '',
  endDate: '',
}

export default function EventFilters({ onFilterChange }: EventFiltersProps) {
  const [filters, setFilters] = useState(initialFilters)

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    const nextFilters = { ...filters, [key]: value }
    setFilters(nextFilters)
    onFilterChange?.(nextFilters)
  }

  const clearFilters = () => {
    setFilters(initialFilters)
    onFilterChange?.(initialFilters)
  }

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => value !== initialFilters[key as keyof typeof initialFilters])

  return (
    <section className="rounded-mc-large border border-mc-border bg-mc-surface p-mc-16 shadow-mc-subtle sm:p-mc-24" aria-labelledby="filters-title">
      <div className="flex flex-wrap items-center justify-between gap-mc-12">
        <div className="flex items-center gap-mc-8">
          <SlidersHorizontal aria-hidden="true" size={20} className="text-mc-action" />
          <h3 id="filters-title" className="font-mc-interface font-semibold text-mc-text-primary">Encontre seu evento</h3>
        </div>
        {hasActiveFilters ? (
          <Button variant="ghost" size="small" onClick={clearFilters} className="gap-mc-8 text-mc-action">
            <X aria-hidden="true" size={17} />
            Limpar filtros
          </Button>
        ) : null}
      </div>

      <div className="mt-mc-16 grid gap-mc-16 lg:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1.5 lg:col-span-2 xl:col-span-1">
          <label htmlFor="event-search" className="block font-mc-interface text-sm font-semibold text-mc-text-primary">Nome do evento</label>
          <div className="relative">
            <Search aria-hidden="true" size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mc-text-secondary" />
            <Input
              id="event-search"
              value={filters.search}
              onChange={(event) => handleFilterChange('search', event.target.value)}
              placeholder="Digite para pesquisar"
              className="pl-10"
            />
          </div>
        </div>
        <FormField id="event-type" label="Tipo">
          <Select id="event-type" value={filters.eventType} onChange={(event) => handleFilterChange('eventType', event.target.value)}>
            {eventTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </Select>
        </FormField>
        <FormField id="event-sport" label="Modalidade">
          <Select id="event-sport" value={filters.sport} onChange={(event) => handleFilterChange('sport', event.target.value)}>
            {sports.map((sport) => <option key={sport} value={sport}>{sport}</option>)}
          </Select>
        </FormField>
        <FormField id="event-state" label="Estado">
          <Select id="event-state" value={filters.state} onChange={(event) => handleFilterChange('state', event.target.value)}>
            {states.map((state) => <option key={state} value={state}>{state}</option>)}
          </Select>
        </FormField>
      </div>

      <details className="mt-mc-16 border-t border-mc-border pt-mc-16">
        <summary className="min-h-11 cursor-pointer font-mc-interface text-sm font-semibold text-mc-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus">
          Filtrar por data
        </summary>
        <div className="mt-mc-12 grid gap-mc-16 sm:grid-cols-3">
          <FormField id="event-period" label="Período">
            <Select id="event-period" value={filters.period} onChange={(event) => handleFilterChange('period', event.target.value)}>
              <option value="todos">Todos</option>
              <option value="este-mes">Este mês</option>
              <option value="proximo-mes">Próximo mês</option>
              <option value="este-ano">Este ano</option>
              <option value="proximo-ano">Próximo ano</option>
            </Select>
          </FormField>
          <FormField id="event-start-date" label="Data inicial">
            <Input id="event-start-date" type="date" value={filters.startDate} onChange={(event) => handleFilterChange('startDate', event.target.value)} />
          </FormField>
          <FormField id="event-end-date" label="Data final">
            <Input id="event-end-date" type="date" value={filters.endDate} onChange={(event) => handleFilterChange('endDate', event.target.value)} />
          </FormField>
        </div>
      </details>
    </section>
  )
}
