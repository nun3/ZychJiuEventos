'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { FiArrowLeft, FiSearch } from 'react-icons/fi'
import { getEventById } from '@/lib/eventStorage'

export default function FiliacaoPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params?.id as string
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [eventData, setEventData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'geral'>('geral')
  const [servico, setServico] = useState('Filiação')
  const [situacaoFiliacao, setSituacaoFiliacao] = useState('')
  const [situacaoPagamento, setSituacaoPagamento] = useState('')
  const [tipoPagamento, setTipoPagamento] = useState('')
  const [confirmadoPor, setConfirmadoPor] = useState('')

  useEffect(() => {
    const authStatus = localStorage.getItem('admin_authenticated')
    if (authStatus === 'true') {
      setIsAuthenticated(true)
      
      const id = parseInt(eventId)
      if (!isNaN(id)) {
        const stored = getEventById(id)
        if (stored) {
          setEventData({
            id: stored.id,
            title: stored.titulo,
          })
        }
      }
      
      setIsLoading(false)
    } else {
      router.push('/admin/autenticacao')
    }
  }, [router, eventId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0C3049] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm -mt-44 pt-44">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link
              href={`/admin/eventos/${eventId}/gerenciar`}
              className="inline-flex items-center gap-2 text-gray-600 hover:text-[#0C3049] transition-colors"
            >
              <FiArrowLeft size={20} />
              <span className="font-semibold">Voltar para Gestão</span>
            </Link>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 uppercase tracking-wide">
            Gestão da Filiação
          </h1>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-bold text-[#0C3049] mb-4">Filtros de Pesquisa</h2>
          
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('geral')}
              className={`px-6 py-3 font-semibold transition ${
                activeTab === 'geral'
                  ? 'border-b-2 border-[#0C3049] text-[#0C3049] bg-gray-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Geral
            </button>
          </div>

          {/* Filtros */}
          {activeTab === 'geral' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                    Serviço
                  </label>
                  <select
                    value={servico}
                    onChange={(e) => setServico(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C3049] focus:border-[#0C3049]"
                  >
                    <option>Filiação</option>
                    <option>Filiação de Atleta</option>
                    <option>Filiação de Professor</option>
                    <option>Filiação de Academia</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                    Situação da Filiação
                  </label>
                  <select
                    value={situacaoFiliacao}
                    onChange={(e) => setSituacaoFiliacao(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C3049] focus:border-[#0C3049]"
                  >
                    <option value="">Selecione...</option>
                    <option>Aguardando Validação</option>
                    <option>Aguardando Novo Documento</option>
                    <option>Documento(s) Revisado(s)</option>
                    <option>Ativa</option>
                    <option>Vencida</option>
                    <option>Inativa</option>
                    <option>Cancelada</option>
                    <option>Suspensa</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                    Situação do Pagamento
                  </label>
                  <select
                    value={situacaoPagamento}
                    onChange={(e) => setSituacaoPagamento(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C3049] focus:border-[#0C3049]"
                  >
                    <option value="">Selecione...</option>
                    <option>Pendente</option>
                    <option>Confirmado</option>
                    <option>Estornado</option>
                    <option>Isento</option>
                    <option>Grátis</option>
                    <option>Pagar no Evento</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                    Tipo de Pagamento
                  </label>
                  <select
                    value={tipoPagamento}
                    onChange={(e) => setTipoPagamento(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C3049] focus:border-[#0C3049]"
                  >
                    <option value="">Selecione...</option>
                    <option>Depósito Bancário ou TED - Transf. Eletrônica</option>
                    <option>Dinheiro</option>
                    <option>Boleto Bancário</option>
                    <option>Cartão de Crédito</option>
                    <option>Pix</option>
                    <option>PicPay</option>
                    <option>Cartão de Débito</option>
                    <option>Pix Manual</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                    Confirmado Por
                  </label>
                  <select
                    value={confirmadoPor}
                    onChange={(e) => setConfirmadoPor(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C3049] focus:border-[#0C3049]"
                  >
                    <option value="">Selecione...</option>
                    <option>Organizador</option>
                    <option>Sistema</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0C3049] to-blue-800 text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg transition">
                  <FiSearch size={20} />
                  Pesquisar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

