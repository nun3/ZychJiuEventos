'use client'

import { useState } from 'react'
import { CalendarRange, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

const states = [
  { value: 'Todos', label: 'Todos os estados' },
  { value: 'AC', label: 'AC — Acre' },
  { value: 'AL', label: 'AL — Alagoas' },
  { value: 'AP', label: 'AP — Amapá' },
  { value: 'AM', label: 'AM — Amazonas' },
  { value: 'BA', label: 'BA — Bahia' },
  { value: 'CE', label: 'CE — Ceará' },
  { value: 'DF', label: 'DF — Distrito Federal' },
  { value: 'ES', label: 'ES — Espírito Santo' },
  { value: 'GO', label: 'GO — Goiás' },
  { value: 'MA', label: 'MA — Maranhão' },
  { value: 'MT', label: 'MT — Mato Grosso' },
  { value: 'MS', label: 'MS — Mato Grosso do Sul' },
  { value: 'MG', label: 'MG — Minas Gerais' },
  { value: 'PA', label: 'PA — Pará' },
  { value: 'PB', label: 'PB — Paraíba' },
  { value: 'PR', label: 'PR — Paraná' },
  { value: 'PE', label: 'PE — Pernambuco' },
  { value: 'PI', label: 'PI — Piauí' },
  { value: 'RJ', label: 'RJ — Rio de Janeiro' },
  { value: 'RN', label: 'RN — Rio Grande do Norte' },
  { value: 'RS', label: 'RS — Rio Grande do Sul' },
  { value: 'RO', label: 'RO — Rondônia' },
  { value: 'RR', label: 'RR — Roraima' },
  { value: 'SC', label: 'SC — Santa Catarina' },
  { value: 'SP', label: 'SP — São Paulo' },
  { value: 'SE', label: 'SE — Sergipe' },
  { value: 'TO', label: 'TO — Tocantins' },
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
  /** Home: barra compacta sem card. Padrão: mesma barra com margem inferior. */
  variant?: 'toolbar' | 'stacked'
  initialSearch?: string
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

const fieldClass = 'min-h-11 rounded-mc-small border-0 bg-mc-surface-secondary ring-1 ring-inset ring-mc-border/80 focus:ring-2 focus:ring-mc-focus/25'

export default function EventFilters({ onFilterChange, variant = 'stacked', initialSearch = '' }: EventFiltersProps) {
  const [filters, setFilters] = useState({ ...initialFilters, search: initialSearch })
  const [datesOpen, setDatesOpen] = useState(false)

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    const nextFilters = { ...filters, [key]: value }
    setFilters(nextFilters)
    onFilterChange?.(nextFilters)
  }

  const clearFilters = () => {
    setFilters(initialFilters)
    setDatesOpen(false)
    onFilterChange?.(initialFilters)
  }

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => value !== initialFilters[key as keyof typeof initialFilters])
  const hasCustomDates = filters.period !== 'todos' || Boolean(filters.startDate || filters.endDate)

  return (
    <section
      className={variant === 'toolbar' ? '' : 'mb-mc-32'}
      aria-label="Filtros de eventos"
    >
      <div className="flex flex-col gap-mc-12">
        <div className="flex flex-col gap-mc-12 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search aria-hidden="true" size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mc-text-secondary" />
            <Input
              id="event-search"
              aria-label="Nome do evento"
              value={filters.search}
              onChange={(event) => handleFilterChange('search', event.target.value)}
              placeholder="Buscar campeonato..."
              className={`${fieldClass} pl-11 text-base shadow-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-mc-12 sm:grid-cols-3 lg:flex lg:shrink-0 lg:gap-mc-12">
            <Select
              id="event-state"
              aria-label="Estado"
              value={filters.state}
              onChange={(event) => handleFilterChange('state', event.target.value)}
              className={`${fieldClass} lg:min-w-[11rem] shadow-none`}
            >
              {states.map((state) => <option key={state.value} value={state.value}>{state.label}</option>)}
            </Select>

            <Select
              id="event-period"
              aria-label="Período"
              value={filters.period}
              onChange={(event) => handleFilterChange('period', event.target.value)}
              className={`${fieldClass} lg:min-w-[10.5rem] shadow-none`}
            >
              <option value="todos">Qualquer data</option>
              <option value="este-mes">Este mês</option>
              <option value="proximo-mes">Próximo mês</option>
              <option value="este-ano">Este ano</option>
              <option value="proximo-ano">Próximo ano</option>
            </Select>

            <button
              type="button"
              onClick={() => setDatesOpen((open) => !open)}
              aria-expanded={datesOpen}
              aria-controls="event-date-filters"
              className={`inline-flex min-h-11 items-center justify-center gap-mc-8 rounded-mc-small px-mc-12 font-mc-interface text-sm font-semibold transition-colors duration-mc-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus ${hasCustomDates || datesOpen ? 'bg-mc-action/10 text-mc-action ring-1 ring-inset ring-mc-action/30' : 'bg-mc-surface-secondary text-mc-text-secondary ring-1 ring-inset ring-mc-border/80 hover:text-mc-text-primary'}`}
            >
              <CalendarRange aria-hidden="true" size={17} />
              <span className="hidden sm:inline">Intervalo</span>
            </button>
          </div>
        </div>

        {datesOpen ? (
          <div id="event-date-filters" className="grid gap-mc-12 border-t border-mc-border/80 pt-mc-12 sm:grid-cols-2 lg:max-w-md">
            <div>
              <label htmlFor="event-start-date" className="mb-mc-4 block font-mc-interface text-xs font-semibold uppercase tracking-wide text-mc-text-secondary">De</label>
              <Input
                id="event-start-date"
                type="date"
                value={filters.startDate}
                onChange={(event) => handleFilterChange('startDate', event.target.value)}
                className={`${fieldClass} shadow-none`}
              />
            </div>
            <div>
              <label htmlFor="event-end-date" className="mb-mc-4 block font-mc-interface text-xs font-semibold uppercase tracking-wide text-mc-text-secondary">Até</label>
              <Input
                id="event-end-date"
                type="date"
                value={filters.endDate}
                onChange={(event) => handleFilterChange('endDate', event.target.value)}
                className={`${fieldClass} shadow-none`}
              />
            </div>
          </div>
        ) : null}

        {hasActiveFilters ? (
          <div className="flex justify-end">
            <Button variant="ghost" size="small" onClick={clearFilters} className="gap-mc-8 text-mc-text-secondary hover:text-mc-action">
              <X aria-hidden="true" size={16} />
              Limpar filtros
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
