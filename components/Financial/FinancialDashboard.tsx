'use client'

import { useState } from 'react'
import { FiFilter, FiDownload, FiDollarSign, FiPercent, FiCheckCircle, FiClock } from 'react-icons/fi'
import AdvancedFilters, { FilterData } from './AdvancedFilters'

// Mock data for transactions
const mockTransactions = [
  {
    id: 1,
    date: '2025-01-15',
    athleteName: 'João Silva',
    category: 'Faixa Branca - 75kg',
    netValue: 85.50,
    status: 'paid',
  },
  {
    id: 2,
    date: '2025-01-15',
    athleteName: 'Maria Santos',
    category: 'Faixa Azul - 60kg',
    netValue: 85.50,
    status: 'paid',
  },
  {
    id: 3,
    date: '2025-01-14',
    athleteName: 'Pedro Oliveira',
    category: 'Faixa Preta - 85kg',
    netValue: 108.00,
    status: 'paid',
  },
  {
    id: 4,
    date: '2025-01-14',
    athleteName: 'Ana Costa',
    category: 'Faixa Marrom - 55kg',
    netValue: 85.50,
    status: 'processing',
  },
  {
    id: 5,
    date: '2025-01-13',
    athleteName: 'Carlos Mendes',
    category: 'Faixa Roxa - 70kg',
    netValue: 85.50,
    status: 'paid',
  },
]

const PLATFORM_FEE_PERCENTAGE = 10 // 10% platform fee

export default function FinancialDashboard() {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState<FilterData | null>(null)

  // Calculate totals from mock data
  const totalGross = mockTransactions.reduce((sum, t) => {
    // Reverse calculate gross from net (net = gross * 0.9)
    const gross = t.netValue / 0.9
    return sum + gross
  }, 0)
  
  const platformFees = totalGross * (PLATFORM_FEE_PERCENTAGE / 100)
  const availableBalance = totalGross - platformFees

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date)
  }

  const handleApplyFilters = (filters: FilterData) => {
    setAppliedFilters(filters)
    // Here you would filter the transactions based on the filters
    console.log('Applied filters:', filters)
  }

  const handleExportReport = () => {
    // Export logic here
    console.log('Exporting report...')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Financeiro</h1>
          <p className="text-slate-600 mt-1">Visão geral e saques</p>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsFilterOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <FiFilter size={18} />
            Filtros Avançados
          </button>
          <button
            onClick={handleExportReport}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <FiDownload size={18} />
            Exportar Relatório
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Total Bruto */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiDollarSign className="text-blue-600" size={24} />
            </div>
          </div>
          <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-1">
            Total Bruto
          </h3>
          <p className="text-3xl font-bold text-slate-900 mb-2">
            {formatCurrency(totalGross)}
          </p>
          <p className="text-xs text-slate-500">Receita total de inscrições</p>
        </div>

        {/* Card 2: Taxas da Plataforma */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-slate-100 rounded-lg">
              <FiPercent className="text-slate-600" size={24} />
            </div>
          </div>
          <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-1">
            Taxas da Plataforma
          </h3>
          <p className="text-3xl font-bold text-slate-900 mb-2">
            {formatCurrency(platformFees)}
          </p>
          <p className="text-xs text-slate-500">{PLATFORM_FEE_PERCENTAGE}% de comissão</p>
        </div>

        {/* Card 3: Saldo Disponível - Highlighted */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg border-2 border-emerald-400 p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg">
                <FiDollarSign className="text-white" size={24} />
              </div>
            </div>
            <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wide mb-1">
              Saldo Disponível
            </h3>
            <p className="text-3xl font-bold text-white mb-4">
              {formatCurrency(availableBalance)}
            </p>
            <button className="w-full bg-white text-emerald-600 font-bold py-3 px-4 rounded-lg hover:bg-emerald-50 transition-colors text-sm shadow-md">
              SOLICITAR SAQUE
            </button>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-900">Transações Recentes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wide">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wide">
                  Atleta
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wide">
                  Categoria
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wide">
                  Valor Líquido
                </th>
                <th className="px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wide">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {mockTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-700">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                    {transaction.athleteName}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {transaction.category}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900 text-right font-bold">
                    {formatCurrency(transaction.netValue)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {transaction.status === 'paid' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                        <FiCheckCircle size={12} />
                        Pago
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                        <FiClock size={12} />
                        Processando
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advanced Filters Modal */}
      <AdvancedFilters
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={handleApplyFilters}
      />
    </div>
  )
}

