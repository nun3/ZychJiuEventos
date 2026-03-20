'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { FiArrowLeft, FiSearch, FiEye } from 'react-icons/fi'
import { getEventById } from '@/lib/eventStorage'

export default function ResultadosPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params?.id as string
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [eventData, setEventData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'numero' | 'categoria' | 'filtros'>('numero')
  const [numero, setNumero] = useState('')
  const [apenasSemResultados, setApenasSemResultados] = useState(false)

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
            Resultados
          </h1>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-md p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('numero')}
              className={`px-6 py-3 font-semibold transition ${
                activeTab === 'numero'
                  ? 'border-b-2 border-[#0C3049] text-[#0C3049] bg-gray-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              N°
            </button>
            <button
              onClick={() => setActiveTab('categoria')}
              className={`px-6 py-3 font-semibold transition ${
                activeTab === 'categoria'
                  ? 'border-b-2 border-[#0C3049] text-[#0C3049] bg-gray-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Categoria
            </button>
            <button
              onClick={() => setActiveTab('filtros')}
              className={`px-6 py-3 font-semibold transition ${
                activeTab === 'filtros'
                  ? 'border-b-2 border-[#0C3049] text-[#0C3049] bg-gray-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Filtros
            </button>
          </div>

          {/* Conteúdo da Aba N° */}
          {activeTab === 'numero' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Digite o N°
                </label>
                <input
                  type="text"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="Digite o N°"
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C3049] focus:border-[#0C3049] italic text-gray-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-gray-700">
                  Apenas Categorias SEM Resultados?
                </label>
                <input
                  type="checkbox"
                  checked={apenasSemResultados}
                  onChange={(e) => setApenasSemResultados(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-600">Sim</span>
              </div>

              <div className="flex gap-4 mt-6">
                <button className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0C3049] to-blue-800 text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg transition">
                  <FiSearch size={20} />
                  Pesquisar
                </button>
                <button className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg transition">
                  <FiEye size={20} />
                  Visualizar Resultado
                </button>
              </div>
            </div>
          )}

          {/* Conteúdo da Aba Categoria */}
          {activeTab === 'categoria' && (
            <div className="text-center py-12 text-gray-500">
              <p>Busca por categoria em desenvolvimento...</p>
            </div>
          )}

          {/* Conteúdo da Aba Filtros */}
          {activeTab === 'filtros' && (
            <div className="text-center py-12 text-gray-500">
              <p>Filtros avançados em desenvolvimento...</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

