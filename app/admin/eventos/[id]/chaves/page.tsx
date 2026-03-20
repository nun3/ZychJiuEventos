'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { FiArrowLeft, FiKey, FiEye, FiPrinter, FiMoreVertical, FiCheckCircle, FiXCircle } from 'react-icons/fi'
import { getEventById } from '@/lib/eventStorage'

export default function ChavesPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params?.id as string
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [eventData, setEventData] = useState<any>(null)
  const [tipoCategoria, setTipoCategoria] = useState('')
  const [categoria, setCategoria] = useState('')
  const [mostrarFoto, setMostrarFoto] = useState(false)
  const [apenasComAtletas, setApenasComAtletas] = useState(false)
  const [apenasNaoGeradas, setApenasNaoGeradas] = useState(false)
  const [statusFiltro, setStatusFiltro] = useState<'gerada' | 'naoGerada' | 'todos'>('todos')

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
            <button className="inline-flex items-center gap-2 border-2 border-[#0C3049] text-[#0C3049] font-semibold py-2 px-4 rounded-lg hover:bg-[#0C3049] hover:text-white transition">
              Outras funcionalidades
              <span className="text-xs">▼</span>
            </button>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 uppercase tracking-wide">
            Chaves
          </h1>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna Esquerda - Filtros */}
            <div className="lg:col-span-2 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                    Tipo Categoria
                  </label>
                  <select
                    value={tipoCategoria}
                    onChange={(e) => setTipoCategoria(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C3049] focus:border-[#0C3049]"
                  >
                    <option value="">Selecione...</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                    Categoria
                  </label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C3049] focus:border-[#0C3049]"
                  >
                    <option value="">Selecione...</option>
                  </select>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Mostrar Foto?
                  </label>
                  <input
                    type="checkbox"
                    checked={mostrarFoto}
                    onChange={(e) => setMostrarFoto(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-600">Sim</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Apenas Chaves com Atletas?
                  </label>
                  <input
                    type="checkbox"
                    checked={apenasComAtletas}
                    onChange={(e) => setApenasComAtletas(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-600">Sim</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-gray-700">
                    Apenas Chaves NÃO Geradas?
                  </label>
                  <input
                    type="checkbox"
                    checked={apenasNaoGeradas}
                    onChange={(e) => setApenasNaoGeradas(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-600">Sim</span>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-4 pt-2">
                <button
                  onClick={() => setStatusFiltro('gerada')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                    statusFiltro === 'gerada'
                      ? 'bg-green-100 text-green-700 border-2 border-green-500'
                      : 'bg-gray-100 text-gray-600 border-2 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  <FiCheckCircle size={18} />
                  <span className="font-semibold">Chave Gerada</span>
                </button>
                
                <button
                  onClick={() => setStatusFiltro('naoGerada')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                    statusFiltro === 'naoGerada'
                      ? 'bg-red-100 text-red-700 border-2 border-red-500'
                      : 'bg-gray-100 text-gray-600 border-2 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  <FiXCircle size={18} />
                  <span className="font-semibold">Chave NÃO Gerada</span>
                </button>
              </div>
            </div>

            {/* Coluna Direita - Botões */}
            <div className="space-y-4">
              <button className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#0C3049] to-blue-800 text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg transition">
                <FiKey size={20} />
                Gerar Chave
                <span className="text-xs">▼</span>
              </button>
              
              <button className="w-full inline-flex items-center justify-center gap-2 border-2 border-[#0C3049] text-[#0C3049] font-bold py-3 px-6 rounded-lg hover:bg-[#0C3049] hover:text-white transition">
                <FiEye size={20} />
                Visualizar Chave
              </button>
              
              <button className="w-full inline-flex items-center justify-center gap-2 border-2 border-[#0C3049] text-[#0C3049] font-bold py-3 px-6 rounded-lg hover:bg-[#0C3049] hover:text-white transition">
                <FiPrinter size={20} />
                Imprimir Chave
                <span className="text-xs">▼</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

