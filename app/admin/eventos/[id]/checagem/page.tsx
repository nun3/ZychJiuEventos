'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { FiArrowLeft, FiSearch } from 'react-icons/fi'
import { getEventById } from '@/lib/eventStorage'

export default function ChecagemPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params?.id as string
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [eventData, setEventData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'categoria' | 'atleta' | 'equipe'>('categoria')

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
            Checagem
          </h1>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-md p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('categoria')}
              className={`px-6 py-3 font-semibold transition ${
                activeTab === 'categoria'
                  ? 'border-b-2 border-[#0C3049] text-[#0C3049]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Por Categoria
            </button>
            <button
              onClick={() => setActiveTab('atleta')}
              className={`px-6 py-3 font-semibold transition ${
                activeTab === 'atleta'
                  ? 'border-b-2 border-[#0C3049] text-[#0C3049]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Por Atleta
            </button>
            <button
              onClick={() => setActiveTab('equipe')}
              className={`px-6 py-3 font-semibold transition ${
                activeTab === 'equipe'
                  ? 'border-b-2 border-[#0C3049] text-[#0C3049]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Por Equipe
            </button>
          </div>

          {/* Filtros */}
          {activeTab === 'categoria' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                    Tipo Categoria
                  </label>
                  <select className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C3049] focus:border-[#0C3049]">
                    <option value="">Selecione...</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                    Categoria
                  </label>
                  <select className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C3049] focus:border-[#0C3049]">
                    <option value="">Selecione...</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                    Faixa
                  </label>
                  <select className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C3049] focus:border-[#0C3049]">
                    <option value="">Selecione...</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                    Peso
                  </label>
                  <select className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C3049] focus:border-[#0C3049]">
                    <option value="">Selecione...</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                    Sexo
                  </label>
                  <select className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C3049] focus:border-[#0C3049]">
                    <option value="">Selecione...</option>
                    <option>Masculino</option>
                    <option>Feminino</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                      Ordenar Registros
                    </label>
                    <select className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C3049] focus:border-[#0C3049]">
                      <option>Nome do Atleta</option>
                      <option>Data de Inscrição</option>
                      <option>Categoria</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-6">
                    <label className="text-sm font-semibold text-gray-700 uppercase">
                      Mostrar Foto do Atleta?
                    </label>
                    <input type="checkbox" className="w-4 h-4" />
                    <span className="text-sm text-gray-600">Sim</span>
                  </div>
                </div>
                
                <button className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0C3049] to-blue-800 text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg transition">
                  <FiSearch size={20} />
                  Pesquisar
                </button>
              </div>
            </div>
          )}

          {activeTab === 'atleta' && (
            <div className="text-center py-12 text-gray-500">
              <p>Filtros por Atleta em desenvolvimento...</p>
            </div>
          )}

          {activeTab === 'equipe' && (
            <div className="text-center py-12 text-gray-500">
              <p>Filtros por Equipe em desenvolvimento...</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

