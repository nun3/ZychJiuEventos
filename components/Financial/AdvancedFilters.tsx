'use client'

import { useState } from 'react'
import { FiX } from 'react-icons/fi'

interface AdvancedFiltersProps {
  isOpen: boolean
  onClose: () => void
  onApply: (filters: FilterData) => void
}

export interface FilterData {
  inscriptionNumber: string
  athleteName: string
  paymentStatus: string
  team: string
  paymentPeriodStart: string
  paymentPeriodEnd: string
  categoryWeight: string
  showCancelled: boolean
}

export default function AdvancedFilters({ isOpen, onClose, onApply }: AdvancedFiltersProps) {
  const [filters, setFilters] = useState<FilterData>({
    inscriptionNumber: '',
    athleteName: '',
    paymentStatus: '',
    team: '',
    paymentPeriodStart: '',
    paymentPeriodEnd: '',
    categoryWeight: '',
    showCancelled: false,
  })

  const handleInputChange = (field: keyof FilterData, value: string | boolean) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleClear = () => {
    setFilters({
      inscriptionNumber: '',
      athleteName: '',
      paymentStatus: '',
      team: '',
      paymentPeriodStart: '',
      paymentPeriodEnd: '',
      categoryWeight: '',
      showCancelled: false,
    })
  }

  const handleApply = () => {
    onApply(filters)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-slate-900">Filtros Avançados</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Fechar"
          >
            <FiX size={20} className="text-slate-600" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Nº da Inscrição */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Nº da Inscrição
              </label>
              <input
                type="text"
                value={filters.inscriptionNumber}
                onChange={(e) => handleInputChange('inscriptionNumber', e.target.value)}
                placeholder="Ex: 12345"
                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C3049] focus:border-[#0C3049] text-slate-900"
              />
            </div>

            {/* Nome do Atleta - Full Width */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Nome do Atleta
              </label>
              <input
                type="text"
                value={filters.athleteName}
                onChange={(e) => handleInputChange('athleteName', e.target.value)}
                placeholder="Digite o nome completo do atleta"
                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C3049] focus:border-[#0C3049] text-slate-900"
              />
            </div>

            {/* Situação do Pagamento */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Situação do Pagamento
              </label>
              <select
                value={filters.paymentStatus}
                onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C3049] focus:border-[#0C3049] text-slate-900 bg-white"
              >
                <option value="">Selecione...</option>
                <option value="paid">Pago</option>
                <option value="pending">Pendente</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>

            {/* Equipe */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Equipe
              </label>
              <select
                value={filters.team}
                onChange={(e) => handleInputChange('team', e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C3049] focus:border-[#0C3049] text-slate-900 bg-white"
              >
                <option value="">Selecione...</option>
                <option value="team1">Zych Jiu Jitsu</option>
                <option value="team2">Gracie Barra</option>
                <option value="team3">Alliance</option>
              </select>
            </div>

            {/* Período do Pagamento */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Período do Pagamento
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={filters.paymentPeriodStart}
                  onChange={(e) => handleInputChange('paymentPeriodStart', e.target.value)}
                  className="flex-1 px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C3049] focus:border-[#0C3049] text-slate-900"
                />
                <span className="text-slate-500 font-medium">até</span>
                <input
                  type="date"
                  value={filters.paymentPeriodEnd}
                  onChange={(e) => handleInputChange('paymentPeriodEnd', e.target.value)}
                  className="flex-1 px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C3049] focus:border-[#0C3049] text-slate-900"
                />
              </div>
            </div>

            {/* Categoria / Peso */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Categoria / Peso
              </label>
              <input
                type="text"
                value={filters.categoryWeight}
                onChange={(e) => handleInputChange('categoryWeight', e.target.value)}
                placeholder="Ex: Faixa Preta - 85kg"
                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C3049] focus:border-[#0C3049] text-slate-900"
              />
            </div>

            {/* Checkbox: Exibir Cancelados? */}
            <div className="md:col-span-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.showCancelled}
                  onChange={(e) => handleInputChange('showCancelled', e.target.checked)}
                  className="w-5 h-5 text-[#0C3049] border-2 border-slate-300 rounded focus:ring-2 focus:ring-[#0C3049]"
                />
                <span className="text-sm font-semibold text-slate-700">
                  Exibir Cancelados?
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={handleClear}
            className="px-6 py-2.5 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 transition-colors"
          >
            Limpar
          </button>
          <button
            onClick={handleApply}
            className="px-6 py-2.5 bg-[#0C3049] text-white font-semibold rounded-lg hover:bg-[#0a2538] transition-colors shadow-sm"
          >
            Aplicar Filtros
          </button>
        </div>
      </div>
    </div>
  )
}

