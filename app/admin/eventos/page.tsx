'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FiCalendar, FiMapPin, FiUsers, FiEdit, FiPlus, FiLogOut, FiSettings } from 'react-icons/fi'

// Dados mockados dos eventos do organizador
const mockOrganizerEvents = [
  {
    id: 1,
    title: '2ª Copa Internacional Tri Fronteira',
    date: '16 de Novembro de 2025',
    location: 'Clevelândia/PR',
    inscritos: 245,
    status: 'ativo',
    image: '/images/2-festival-kids-2025.png',
  },
  {
    id: 2,
    title: '11ª Copa Espera Feliz de Jiu-Jitsu',
    date: '23 de Novembro de 2025',
    location: 'Espera Feliz/MG',
    inscritos: 189,
    status: 'ativo',
    image: '/images/event-2.jpg',
  },
  {
    id: 3,
    title: '2ª Copa Seven bjj',
    date: '30 de Novembro de 2025',
    location: 'Palhoça/SC',
    inscritos: 156,
    status: 'rascunho',
    image: '/images/event-3.jpg',
  },
  {
    id: 4,
    title: 'Copa King de Jiu-Jitsu',
    date: '07 de Dezembro de 2025',
    location: 'Joinville/SC',
    inscritos: 98,
    status: 'ativo',
    image: '/images/event-4.jpg',
  },
]

export default function OrganizerEventsPage() {
  const router = useRouter()
  const [usuario, setUsuario] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verificar autenticação
    const authStatus = localStorage.getItem('admin_authenticated')
    const adminUsuario = localStorage.getItem('admin_usuario')
    
    if (authStatus === 'true' && adminUsuario) {
      setUsuario(adminUsuario)
      setIsLoading(false)
    } else {
      router.push('/admin/autenticacao')
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('admin_authenticated')
    localStorage.removeItem('admin_usuario')
    router.push('/admin/autenticacao')
  }

  const handleEventClick = (eventId: number) => {
    // Redirecionar para a página de gerenciamento do evento
    router.push(`/admin/eventos/${eventId}/gerenciar`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0C3049] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Carregando eventos...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm -mt-44 pt-44">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 uppercase tracking-wide">
                Meus Eventos
              </h1>
              <p className="text-gray-600 text-lg mt-1">
                Olá, <span className="font-semibold text-[#0C3049]">{usuario}</span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/admin/eventos/novo"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0C3049] to-[#1a4a6b] text-white font-bold py-3 px-6 rounded-lg text-lg uppercase tracking-wide hover:from-[#1a4a6b] hover:to-[#0C3049] transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <FiPlus size={20} />
                Novo Evento
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 border-2 border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg text-lg hover:bg-gray-50 transition-colors"
              >
                <FiLogOut size={20} />
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="container mx-auto px-6 py-8">
        {mockOrganizerEvents.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="max-w-md mx-auto">
              <FiCalendar className="mx-auto text-gray-400 mb-4" size={64} />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Nenhum evento encontrado</h2>
              <p className="text-gray-600 mb-6">
                Você ainda não criou nenhum evento. Comece criando seu primeiro evento!
              </p>
              <Link
                href="/admin/eventos/novo"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-[#0C3049] to-[#1a4a6b] text-white font-bold py-3 px-8 rounded-lg text-lg uppercase tracking-wide hover:from-[#1a4a6b] hover:to-[#0C3049] transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <FiPlus size={20} />
                Criar Primeiro Evento
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Estatísticas Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm uppercase tracking-wide font-semibold mb-1">
                      Total de Eventos
                    </p>
                    <p className="text-3xl font-bold text-gray-900">{mockOrganizerEvents.length}</p>
                  </div>
                  <FiCalendar className="text-blue-500" size={32} />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm uppercase tracking-wide font-semibold mb-1">
                      Eventos Ativos
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {mockOrganizerEvents.filter(e => e.status === 'ativo').length}
                    </p>
                  </div>
                  <FiSettings className="text-green-500" size={32} />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm uppercase tracking-wide font-semibold mb-1">
                      Total de Inscritos
                    </p>
                    <p className="text-3xl font-bold text-gray-900">
                      {mockOrganizerEvents.reduce((sum, e) => sum + e.inscritos, 0)}
                    </p>
                  </div>
                  <FiUsers className="text-purple-500" size={32} />
                </div>
              </div>
            </div>

            {/* Grid de Eventos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockOrganizerEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
                  onClick={() => handleEventClick(event.id)}
                >
                  {/* Imagem do Evento */}
                  <div className="relative h-48 bg-gray-200 overflow-hidden">
                    {event.image ? (
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#0C3049] to-[#1a4a6b]">
                        <FiCalendar className="text-white opacity-50" size={48} />
                      </div>
                    )}
                    {/* Badge de Status */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                          event.status === 'ativo'
                            ? 'bg-green-500 text-white'
                            : event.status === 'rascunho'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-gray-500 text-white'
                        }`}
                      >
                        {event.status}
                      </span>
                    </div>
                  </div>

                  {/* Conteúdo do Card */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-[#0C3049] transition-colors">
                      {event.title}
                    </h3>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <FiCalendar className="text-[#0C3049]" size={18} />
                        <span className="text-sm">{event.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <FiMapPin className="text-[#0C3049]" size={18} />
                        <span className="text-sm">{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <FiUsers className="text-[#0C3049]" size={18} />
                        <span className="text-sm font-semibold">{event.inscritos} inscritos</span>
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex gap-2 pt-4 border-t border-gray-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/admin/eventos/${event.id}/gerenciar`)
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-[#0C3049] text-white font-semibold py-2 px-4 rounded-lg text-sm hover:bg-[#1a4a6b] transition-colors"
                      >
                        <FiEdit size={16} />
                        Gerenciar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/admin/eventos/${event.id}/configuracao`)
                        }}
                        className="inline-flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                      >
                        <FiSettings size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}

