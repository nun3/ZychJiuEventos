'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiX, FiSearch, FiCalendar, FiMapPin } from 'react-icons/fi'

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

export default function EventFilters() {
  const [activeTab, setActiveTab] = useState('tipo')
  const [filters, setFilters] = useState({
    eventType: 'Todos',
    sport: 'Todas',
    state: 'Todos',
    search: '',
    period: 'todos',
    startDate: '',
    endDate: '',
  })

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      eventType: 'Todos',
      sport: 'Todas',
      state: 'Todos',
      search: '',
      period: 'todos',
      startDate: '',
      endDate: '',
    })
  }

  const hasActiveFilters = 
    filters.eventType !== 'Todos' ||
    filters.sport !== 'Todas' ||
    filters.state !== 'Todos' ||
    filters.search !== '' ||
    filters.period !== 'todos'

  return (
    <section className="mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Filtrar eventos</h2>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-primary-blue hover:underline flex items-center space-x-1 text-sm"
            >
              <FiX size={16} />
              <span>limpar filtros</span>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b">
          <button
            onClick={() => setActiveTab('tipo')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'tipo'
                ? 'border-b-2 border-primary-blue text-primary-blue'
                : 'text-gray-600 hover:text-primary-blue'
            }`}
          >
            Tipo e Esporte
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'data'
                ? 'border-b-2 border-primary-blue text-primary-blue'
                : 'text-gray-600 hover:text-primary-blue'
            }`}
          >
            <FiCalendar className="inline mr-1" />
            Data
          </button>
          <button
            onClick={() => setActiveTab('local')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'local'
                ? 'border-b-2 border-primary-blue text-primary-blue'
                : 'text-gray-600 hover:text-primary-blue'
            }`}
          >
            <FiMapPin className="inline mr-1" />
            Local
          </button>
          <button
            onClick={() => setActiveTab('pesquisar')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'pesquisar'
                ? 'border-b-2 border-primary-blue text-primary-blue'
                : 'text-gray-600 hover:text-primary-blue'
            }`}
          >
            <FiSearch className="inline mr-1" />
            Pesquisar
          </button>
        </div>

        {/* Conteúdo das Tabs */}
        <div className="mt-4">
          {activeTab === 'tipo' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de evento
                </label>
                <select
                  value={filters.eventType}
                  onChange={(e) => handleFilterChange('eventType', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                >
                  {eventTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Esporte
                </label>
                <select
                  value={filters.sport}
                  onChange={(e) => handleFilterChange('sport', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                >
                  {sports.map((sport) => (
                    <option key={sport} value={sport}>
                      {sport}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Período
                </label>
                <select
                  value={filters.period}
                  onChange={(e) => handleFilterChange('period', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                >
                  <option value="todos">Todos</option>
                  <option value="este-mes">Este mês</option>
                  <option value="proximo-mes">Próximo mês</option>
                  <option value="este-ano">Este ano</option>
                  <option value="proximo-ano">Próximo ano</option>
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Do dia
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Até o dia
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'local' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Localidade (Estado)
              </label>
              <select
                value={filters.state}
                onChange={(e) => handleFilterChange('state', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
              >
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeTab === 'pesquisar' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pesquisa por título
              </label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Digite o nome do evento..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-orange focus:border-transparent"
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </section>
  )
}

