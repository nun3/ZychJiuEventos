'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  FiPlus,
  FiFileText,
  FiSettings,
  FiUsers,
  FiMail,
  FiZap,
  FiDollarSign,
  FiCheckSquare,
  FiCalendar,
  FiKey,
  FiList,
  FiBarChart,
  FiAward,
  FiActivity,
  FiClipboard,
  FiCreditCard,
  FiMessageCircle,
  FiThumbsUp,
  FiArrowLeft,
  FiLogOut,
} from 'react-icons/fi'
import { getEventById } from '@/lib/eventStorage'

interface MenuOption {
  id: string
  label: string
  icon: any
  href: string
  color: string
  description: string
}

// Opções principais que serão exibidas
const mainMenuOptions: MenuOption[] = [
  {
    id: 'financeiro',
    label: 'Financeiro',
    icon: FiDollarSign,
    href: '/admin/eventos/[id]/financeiro',
    color: 'from-emerald-500 to-emerald-600',
    description: 'Controle financeiro e pagamentos',
  },
  {
    id: 'regulamento',
    label: 'Regulamento',
    icon: FiFileText,
    href: '/admin/eventos/[id]/regulamento',
    color: 'from-purple-500 to-purple-600',
    description: 'Regulamento e regras do evento',
  },
  {
    id: 'configuracao',
    label: 'Configuração',
    icon: FiSettings,
    href: '/admin/eventos/[id]/configuracao',
    color: 'from-gray-500 to-gray-600',
    description: 'Configurações gerais do evento',
  },
  {
    id: 'checagem',
    label: 'Checagem',
    icon: FiCheckSquare,
    href: '/admin/eventos/[id]/checagem',
    color: 'from-cyan-500 to-cyan-600',
    description: 'Verificação de inscrições',
  },
  {
    id: 'resultados',
    label: 'Resultados',
    icon: FiActivity,
    href: '/admin/eventos/[id]/resultados',
    color: 'from-amber-500 to-amber-600',
    description: 'Resultados e classificações',
  },
  {
    id: 'placar',
    label: 'Placar',
    icon: FiBarChart,
    href: '/admin/eventos/[id]/placar',
    color: 'from-red-500 to-red-600',
    description: 'Placar e pontuação',
  },
  {
    id: 'pesagem',
    label: 'Pesagem',
    icon: FiList,
    href: '/admin/eventos/[id]/pesagem',
    color: 'from-teal-500 to-teal-600',
    description: 'Controle de pesagem',
  },
  {
    id: 'tarefas',
    label: 'Tarefas',
    icon: FiCalendar,
    href: '/admin/eventos/[id]/tarefas',
    color: 'from-orange-500 to-orange-600',
    description: 'Cronograma e tarefas',
  },
  {
    id: 'secretaria',
    label: 'Secretaria',
    icon: FiZap,
    href: '/admin/eventos/[id]/secretaria',
    color: 'from-indigo-500 to-indigo-600',
    description: 'Gestão administrativa',
  },
  {
    id: 'chaves',
    label: 'Chaves',
    icon: FiKey,
    href: '/admin/eventos/[id]/chaves',
    color: 'from-yellow-500 to-yellow-600',
    description: 'Gerenciar chaves e brackets',
  },
  {
    id: 'filiacao',
    label: 'Filiação/Gremiação',
    icon: FiCreditCard,
    href: '/admin/eventos/[id]/filiacao',
    color: 'from-sky-500 to-sky-600',
    description: 'Filiações e gremiações',
  },
]

// Todas as opções (para referência futura)
const menuOptions: MenuOption[] = [
  {
    id: 'planejamento',
    label: 'Planejamento',
    icon: FiPlus,
    href: '/admin/eventos/[id]/planejamento',
    color: 'from-blue-500 to-blue-600',
    description: 'Planejamento e orçamento do evento',
  },
  {
    id: 'regulamento',
    label: 'Regulamento',
    icon: FiFileText,
    href: '/admin/eventos/[id]/regulamento',
    color: 'from-purple-500 to-purple-600',
    description: 'Regulamento e regras do evento',
  },
  {
    id: 'configuracao',
    label: 'Configuração',
    icon: FiSettings,
    href: '/admin/eventos/[id]/configuracao',
    color: 'from-gray-500 to-gray-600',
    description: 'Configurações gerais do evento',
  },
  {
    id: 'cadastros',
    label: 'Cadastros',
    icon: FiUsers,
    href: '/admin/eventos/[id]/cadastros',
    color: 'from-green-500 to-green-600',
    description: 'Gerenciar cadastros e participantes',
  },
  {
    id: 'fale-conosco',
    label: 'Fale Conosco',
    icon: FiMail,
    href: '/admin/eventos/[id]/fale-conosco',
    color: 'from-pink-500 to-pink-600',
    description: 'Mensagens e contatos',
  },
  {
    id: 'secretaria',
    label: 'Secretaria',
    icon: FiZap,
    href: '/admin/eventos/[id]/secretaria',
    color: 'from-indigo-500 to-indigo-600',
    description: 'Gestão administrativa',
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    icon: FiDollarSign,
    href: '/admin/eventos/[id]/financeiro',
    color: 'from-emerald-500 to-emerald-600',
    description: 'Controle financeiro e pagamentos',
  },
  {
    id: 'checagem',
    label: 'Checagem',
    icon: FiCheckSquare,
    href: '/admin/eventos/[id]/checagem',
    color: 'from-cyan-500 to-cyan-600',
    description: 'Verificação de inscrições',
  },
  {
    id: 'tarefas',
    label: 'Tarefas',
    icon: FiCalendar,
    href: '/admin/eventos/[id]/tarefas',
    color: 'from-orange-500 to-orange-600',
    description: 'Cronograma e tarefas',
  },
  {
    id: 'chaves',
    label: 'Chaves',
    icon: FiKey,
    href: '/admin/eventos/[id]/chaves',
    color: 'from-yellow-500 to-yellow-600',
    description: 'Gerenciar chaves e brackets',
  },
  {
    id: 'pesagem',
    label: 'Pesagem',
    icon: FiList,
    href: '/admin/eventos/[id]/pesagem',
    color: 'from-teal-500 to-teal-600',
    description: 'Controle de pesagem',
  },
  {
    id: 'placar',
    label: 'Placar',
    icon: FiBarChart,
    href: '/admin/eventos/[id]/placar',
    color: 'from-red-500 to-red-600',
    description: 'Placar e pontuação',
  },
  {
    id: 'resultados',
    label: 'Resultados',
    icon: FiActivity,
    href: '/admin/eventos/[id]/resultados',
    color: 'from-amber-500 to-amber-600',
    description: 'Resultados e classificações',
  },
  {
    id: 'premiacao',
    label: 'Premiação',
    icon: FiAward,
    href: '/admin/eventos/[id]/premiacao',
    color: 'from-rose-500 to-rose-600',
    description: 'Gestão de premiações',
  },
  {
    id: 'lista-espera',
    label: 'Lista de Espera',
    icon: FiClipboard,
    href: '/admin/eventos/[id]/lista-espera',
    color: 'from-violet-500 to-violet-600',
    description: 'Gerenciar lista de espera',
  },
  {
    id: 'filiacao',
    label: 'Filiação/Gremiação',
    icon: FiCreditCard,
    href: '/admin/eventos/[id]/filiacao',
    color: 'from-sky-500 to-sky-600',
    description: 'Filiações e gremiações',
  },
  {
    id: 'comunicacao',
    label: 'Comunicação',
    icon: FiMessageCircle,
    href: '/admin/eventos/[id]/comunicacao',
    color: 'from-lime-500 to-lime-600',
    description: 'Comunicação com participantes',
  },
  {
    id: 'avaliacao',
    label: 'Avaliação',
    icon: FiThumbsUp,
    href: '/admin/eventos/[id]/avaliacao',
    color: 'from-fuchsia-500 to-fuchsia-600',
    description: 'Avaliações e feedback',
  },
]

export default function EventManagementPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params?.id as string
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [eventData, setEventData] = useState<any>(null)

  useEffect(() => {
    // Verificar autenticação
    const authStatus = 'true' // A autorização é validada pelo middleware.
    if (authStatus === 'true') {
      setIsAuthenticated(true)
      
      // Carregar dados do evento do localStorage
      const id = parseInt(eventId)
      if (!isNaN(id)) {
        const stored = getEventById(id)
        if (stored) {
          setEventData({
            id: stored.id,
            title: stored.titulo,
            date: stored.date || new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
            location: stored.location || 'Local não informado',
            inscritos: 245, // Mockado por enquanto
            status: stored.status,
          })
        } else {
          // Fallback para dados mockados se não encontrar
          setEventData({
            id: eventId,
            title: '2ª Copa Internacional Tri Fronteira',
            date: '16 de Novembro de 2025',
            location: 'Clevelândia/PR',
            inscritos: 245,
            status: 'ativo',
          })
        }
      }
      
      setIsLoading(false)
    } else {
      router.push('/admin/autenticacao')
    }
  }, [router, eventId])

  const handleLogout = async () => {
    await createClient().auth.signOut()
    router.replace('/admin/autenticacao')
    router.refresh()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#0C3049] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Carregando evento...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !eventData) {
    return null
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm -mt-44 pt-44">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/eventos"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-[#0C3049] transition-colors"
              >
                <FiArrowLeft size={20} />
                <span className="font-semibold">Voltar para Eventos</span>
              </Link>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 border-2 border-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              <FiLogOut size={18} />
              Sair
            </button>
          </div>
          
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 uppercase tracking-wide mb-2">
              {eventData.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-gray-600">
              <span className="text-lg">{eventData.date}</span>
              <span className="text-lg">•</span>
              <span className="text-lg">{eventData.location}</span>
              <span className="text-lg">•</span>
              <span className="text-lg font-semibold text-[#0C3049]">{eventData.inscritos} inscritos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard de Gestão */}
      <div className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 uppercase tracking-wide mb-2">
            Gestão do Evento
          </h2>
          <p className="text-gray-600 text-lg">
            Selecione uma opção para gerenciar seu evento
          </p>
        </div>

        {/* Grid de Opções */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-6">
          {mainMenuOptions.map((option) => {
            const Icon = option.icon
            const href = option.href.replace('[id]', eventId)
            
            return (
              <Link
                key={option.id}
                href={href}
                className="group relative bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-transparent transform hover:-translate-y-1"
              >
                {/* Gradiente de fundo no hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${option.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                
                {/* Conteúdo */}
                <div className="relative p-4 md:p-6 flex flex-col items-center justify-center text-center min-h-[140px] md:min-h-[160px]">
                  {/* Ícone */}
                  <div className={`mb-3 md:mb-4 p-3 md:p-4 rounded-xl md:rounded-2xl bg-gradient-to-br ${option.color} shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    <Icon className="text-white" size={28} />
                  </div>
                  
                  {/* Label */}
                  <h3 className="text-xs md:text-sm font-bold text-gray-900 group-hover:text-white transition-colors duration-300 uppercase tracking-wide leading-tight">
                    {option.label}
                  </h3>
                  
                  {/* Descrição (aparece no hover) */}
                  <p className="mt-2 text-[10px] md:text-xs text-gray-500 group-hover:text-white/90 opacity-0 group-hover:opacity-100 transition-opacity duration-300 line-clamp-2 px-2">
                    {option.description}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </main>
  )
}
