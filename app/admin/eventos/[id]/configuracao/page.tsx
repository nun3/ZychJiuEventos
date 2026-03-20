'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { FiArrowLeft, FiSave, FiX, FiInfo, FiClipboard, FiDollarSign, FiCheckSquare, FiKey, FiActivity, FiCalendar, FiThumbsUp } from 'react-icons/fi'
import { getEventById, saveEvent } from '@/lib/eventStorage'

interface ConfigSection {
  id: string
  label: string
  icon: any
}

const configSections: ConfigSection[] = [
  { id: 'sobre', label: 'Sobre o Evento', icon: FiInfo },
  { id: 'inscricoes', label: 'Das Inscrições', icon: FiClipboard },
  { id: 'pagamento', label: 'Do Pagamento', icon: FiDollarSign },
  { id: 'checagem', label: 'Da Checagem', icon: FiCheckSquare },
  { id: 'chaves', label: 'Das Chaves', icon: FiKey },
  { id: 'resultados', label: 'Dos Resultados', icon: FiActivity },
  { id: 'cronograma', label: 'Do Cronograma', icon: FiCalendar },
  { id: 'avaliacao', label: 'Da Avaliação', icon: FiThumbsUp },
]

export default function ConfiguracaoPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params?.id as string
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [eventData, setEventData] = useState<any>(null)
  const [activeSection, setActiveSection] = useState<string>('pagamento')

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
            ...stored,
          })
        }
      }
      
      setIsLoading(false)
    } else {
      router.push('/admin/autenticacao')
    }
  }, [router, eventId])

  const handleSave = () => {
    if (eventData) {
      saveEvent(eventData)
      alert('Configurações salvas com sucesso!')
    }
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
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 uppercase tracking-wide">
            Configuração do Evento
          </h1>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Dados</h2>
            
            {/* Lista de Seções */}
            <div className="space-y-2">
              {configSections.map((section) => {
                const Icon = section.icon
                const isActive = activeSection === section.id
                
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center justify-between rounded-lg border-2 px-4 py-3 text-left transition ${
                      isActive
                        ? 'border-[#0C3049] bg-blue-50'
                        : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
                    }`}
                  >
                    <span className="flex items-center gap-3 text-gray-800 font-semibold">
                      <Icon className={isActive ? 'text-[#0C3049]' : 'text-gray-600'} size={18} />
                      {section.label}
                    </span>
                    <span className="text-gray-400">›</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Conteúdo da Seção Ativa */}
          {activeSection === 'pagamento' && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Configurações de Pagamento</h3>
              <p className="text-gray-600">
                Aqui você pode configurar as opções de pagamento do evento, formas de pagamento aceitas, prazos, etc.
              </p>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-4 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => router.push(`/admin/eventos/${eventId}/gerenciar`)}
              className="inline-flex items-center gap-2 bg-gray-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-600 transition"
            >
              <FiX size={20} />
              Fechar
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0C3049] to-blue-800 text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg transition"
            >
              <FiSave size={20} />
              Salvar
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}

