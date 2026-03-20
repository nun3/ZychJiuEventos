'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { FiArrowLeft, FiSearch, FiUserPlus, FiMoreVertical } from 'react-icons/fi'
import { getEventById } from '@/lib/eventStorage'

export default function SecretariaPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params?.id as string
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [eventData, setEventData] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'especifico' | 'geral'>('especifico')
  const [searchType, setSearchType] = useState<'cpf' | 'nome' | 'email' | 'celular' | 'codigo' | 'cpfResponsavel'>('cpf')
  const [searchValue, setSearchValue] = useState('')
  const [mostrarFoto, setMostrarFoto] = useState(false)

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

  const getPlaceholder = () => {
    const placeholders = {
      cpf: 'Digite o CPF',
      nome: 'Digite o Nome',
      email: 'Digite o E-mail',
      celular: 'Digite o Celular',
      codigo: 'Digite o Código',
      cpfResponsavel: 'Digite o CPF do Responsável',
    }
    return placeholders[searchType]
  }

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
            <div className="flex gap-2">
              <button className="inline-flex items-center gap-2 border-2 border-[#0C3049] text-[#0C3049] font-semibold py-2 px-4 rounded-lg hover:bg-[#0C3049] hover:text-white transition">
                <FiUserPlus size={18} />
                Novo
                <span className="text-xs">▼</span>
              </button>
              <button className="inline-flex items-center gap-2 border-2 border-[#0C3049] text-[#0C3049] font-semibold py-2 px-4 rounded-lg hover:bg-[#0C3049] hover:text-white transition">
                Outras funcionalidades
                <span className="text-xs">▼</span>
              </button>
            </div>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 uppercase tracking-wide">
            Cadastro de Pessoas
          </h1>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-md p-6">
          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('especifico')}
              className={`px-6 py-3 font-semibold transition ${
                activeTab === 'especifico'
                  ? 'border-b-2 border-[#0C3049] text-[#0C3049] bg-gray-50'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Específico
            </button>
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

          {/* Conteúdo da Aba Específico */}
          {activeTab === 'especifico' && (
            <div className="space-y-4">
              {/* Tipos de Busca */}
              <div className="flex flex-wrap gap-2 mb-4">
                {(['cpf', 'nome', 'email', 'celular', 'codigo', 'cpfResponsavel'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSearchType(type)}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      searchType === type
                        ? 'bg-[#0C3049] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type === 'cpf' && 'CPF'}
                    {type === 'nome' && 'Nome'}
                    {type === 'email' && 'E-mail'}
                    {type === 'celular' && 'Celular'}
                    {type === 'codigo' && 'Código'}
                    {type === 'cpfResponsavel' && 'CPF do Responsável'}
                  </button>
                ))}
              </div>

              {/* Campo de Busca */}
              <div>
                <input
                  type="text"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={getPlaceholder()}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C3049] focus:border-[#0C3049] text-lg"
                />
              </div>

              {/* Opções */}
              <div className="flex items-center justify-between">
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

                <button className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0C3049] to-blue-800 text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg transition">
                  <FiSearch size={20} />
                  Pesquisar
                </button>
              </div>
            </div>
          )}

          {/* Conteúdo da Aba Geral */}
          {activeTab === 'geral' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                    País
                  </label>
                  <select className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C3049] focus:border-[#0C3049]">
                    <option>BRASIL</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                    Estado
                  </label>
                  <select className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C3049] focus:border-[#0C3049]">
                    <option value="">Selecione...</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                    Cidade
                  </label>
                  <select className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C3049] focus:border-[#0C3049]">
                    <option value="">Selecione...</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                    Esporte
                  </label>
                  <select className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C3049] focus:border-[#0C3049]">
                    <option value="">Selecione...</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                    Graduação
                  </label>
                  <select className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C3049] focus:border-[#0C3049]">
                    <option value="">Selecione...</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                    Equipe
                  </label>
                  <input
                    type="text"
                    placeholder="DIGITE e AGUARDE..."
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C3049] focus:border-[#0C3049]"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                    Professor
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
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                    Perfil
                  </label>
                  <select className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C3049] focus:border-[#0C3049]">
                    <option value="">Selecione...</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                    Deficiente
                  </label>
                  <select className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C3049] focus:border-[#0C3049]">
                    <option value="">Selecione...</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                    Peso (com kimono)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C3049] focus:border-[#0C3049]"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C3049] focus:border-[#0C3049]"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                    Período do Cadastro
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C3049] focus:border-[#0C3049]"
                    />
                    <span className="text-gray-600">a</span>
                    <input
                      type="date"
                      className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C3049] focus:border-[#0C3049]"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 uppercase">
                    Faixa Etária (em anos)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="INÍCIO"
                      className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C3049] focus:border-[#0C3049]"
                    />
                    <span className="text-gray-600">a</span>
                    <input
                      type="number"
                      placeholder="FIM"
                      className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C3049] focus:border-[#0C3049]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
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

                <div className="flex items-center gap-4">
                  <select className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0C3049] focus:border-[#0C3049]">
                    <option value="">Inscritos no Evento:</option>
                  </select>
                  
                  <button className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0C3049] to-blue-800 text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg transition">
                    <FiSearch size={20} />
                    Pesquisar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

