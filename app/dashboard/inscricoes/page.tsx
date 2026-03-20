'use client'

import Link from 'next/link'
import { useState } from 'react'
import { FiUser, FiEdit, FiUsers, FiClipboard, FiAward, FiCreditCard, FiChevronRight, FiFileText, FiCheckCircle, FiAlertCircle, FiDownload, FiStar, FiSearch } from 'react-icons/fi'

const menuItems = [
  { href: '/dashboard/meu-perfil', label: 'Meu Perfil', icon: FiUser },
  { href: '/dashboard/alterar-cadastro', label: 'Alterar Meu Cadastro', icon: FiEdit },
  { href: '/dashboard/meus-atletas', label: 'Meus Atletas', icon: FiUsers },
  { href: '/dashboard/inscricoes', label: 'Inscrições Realizadas', icon: FiClipboard, active: true },
  { href: '/dashboard/minhas-filiacoes', label: 'Minhas Filiações', icon: FiAward },
  { href: '/dashboard/meus-ingressos', label: 'Meus Ingressos', icon: FiCreditCard },
]

interface Registration {
  id: string
  athleteName: string
  age: number
  eventName: string
  eventDate: string
  modality: string[]
  category: string[]
  team: string
  professor: string
  registrationNumber: string
  price: number
  paymentStatus: 'confirmed' | 'pending'
  registrationStatus: 'confirmed' | 'pending'
  registeredAt: string
}

// Inscrições do próprio professor (vazio para mostrar alerta)
const mockMyRegistrations: Registration[] = []

// Inscrições dos atletas do professor
const mockAthleteRegistrations: Registration[] = [
  {
    id: '1',
    athleteName: 'ARTHUR DA COSTA RAMOS',
    age: 10,
    eventName: '1ª COPA GREMIO INDUSTRIAL KIDS DE JIU-JITSU',
    eventDate: '07/12/2025',
    modality: ['Categoria de Peso Jiu-Jitsu'],
    category: ['Infantil B - Branca/Cinza - Pluma - Masculino'],
    team: 'Zych Jiu Jitsu',
    professor: 'Ricardo Zych',
    registrationNumber: '0003',
    price: 70.00,
    paymentStatus: 'confirmed',
    registrationStatus: 'confirmed',
    registeredAt: '11/11/2025 10:00',
  },
  {
    id: '2',
    athleteName: 'ÁGATA GIORDANI',
    age: 9,
    eventName: '1ª COPA GREMIO INDUSTRIAL KIDS DE JIU-JITSU',
    eventDate: '07/12/2025',
    modality: ['Categoria de Peso Jiu-Jitsu'],
    category: ['Infantil A - Branca/Cinza - Extra Pesadíssimo - Feminino'],
    team: 'Zych Jiu Jitsu',
    professor: 'Ricardo Zych',
    registrationNumber: '0029',
    price: 70.00,
    paymentStatus: 'confirmed',
    registrationStatus: 'confirmed',
    registeredAt: '27/11/2025 16:32',
  },
  {
    id: '3',
    athleteName: 'CAETANO DALL ACQUA',
    age: 10,
    eventName: '1ª COPA GREMIO INDUSTRIAL KIDS DE JIU-JITSU',
    eventDate: '07/12/2025',
    modality: ['Categoria de Peso e Absoluto Jiu-Jitsu', 'Categoria de Peso Jiu-Jitsu'],
    category: ['Infantil B - Todas Faixas - Live - Masculino', 'Infantil B - Branca/Cinza - Pesadíssimo - Masculino'],
    team: 'Zych Jiu Jitsu',
    professor: 'Ricardo Zych',
    registrationNumber: '0005',
    price: 95.00,
    paymentStatus: 'confirmed',
    registrationStatus: 'confirmed',
    registeredAt: '11/11/2025 10:00',
  },
]

export default function InscricoesPage() {
  const [selectedEvent, setSelectedEvent] = useState<string>('all')

  // Agrupar inscrições dos atletas por evento
  const groupedByEvent = mockAthleteRegistrations.reduce((acc, reg) => {
    if (!acc[reg.eventName]) {
      acc[reg.eventName] = []
    }
    acc[reg.eventName].push(reg)
    return acc
  }, {} as Record<string, Registration[]>)

  const events = Object.keys(groupedByEvent)
  const filteredAthleteRegistrations = selectedEvent === 'all' 
    ? mockAthleteRegistrations 
    : groupedByEvent[selectedEvent] || []

  const hasMyRegistrations = mockMyRegistrations.length > 0
  const hasAthleteRegistrations = mockAthleteRegistrations.length > 0

  return (
    <div className="container mx-auto px-6 pt-6 pb-12">
      <section className="rounded-2xl bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-[#0C3049] via-blue-800 to-[#0C3049] px-6 py-8 text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
          <div className="relative">
            <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-wide mb-2">Minhas Inscrições</h1>
            <p className="text-base text-blue-100">Acompanhe todas as suas inscrições realizadas</p>
          </div>
        </div>

        <div className="grid gap-6 px-6 py-8 lg:grid-cols-[220px,1fr]">
          {/* Menu Lateral */}
          <aside className="space-y-3">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                    item.active
                      ? 'border-primary-blue bg-primary-blue text-white shadow'
                      : 'border-gray-200 text-gray-600 hover:border-primary-blue hover:text-primary-blue'
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              )
            })}
            <button className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-500 hover:bg-gray-50 transition w-full">
              Sair da conta
              <FiChevronRight size={14} />
            </button>
          </aside>

          <div className="space-y-8">
            {/* Seção: Minhas Inscrições (do Professor) */}
            <div>
              <h2 className="text-2xl font-bold text-teal-600 uppercase tracking-wide mb-4">Minhas Inscrições</h2>
              
              {/* Alerta quando não há inscrições do professor */}
              {!hasMyRegistrations && (
                <div className="rounded-xl border-2 border-pink-200 bg-pink-50 p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        <FiAlertCircle className="text-red-600" size={24} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-red-800 mb-2 uppercase">Atenção</h3>
                      <p className="text-base text-gray-700">
                        Você ainda NÃO se inscreveu em nenhum evento no site. Clique{' '}
                        <Link href="/eventos" className="text-primary-blue font-semibold hover:underline">
                          AQUI
                        </Link>{' '}
                        para acessar os Eventos e realizar a sua inscrição.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Lista de inscrições do professor (quando houver) */}
              {hasMyRegistrations && (
                <div className="space-y-4">
                  {mockMyRegistrations.map((reg) => (
                    <div key={reg.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                      {/* Conteúdo das inscrições do professor */}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Seção: Inscrições de Meus Atletas */}
            <div>
              <h2 className="text-2xl font-bold text-teal-600 uppercase tracking-wide mb-4">Inscrições de Meus Atletas</h2>
              
              {hasAthleteRegistrations && (
                <>

                  {/* Filtro por Evento */}
                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FiSearch className="text-gray-400" size={18} />
                      <label className="block text-sm font-semibold text-gray-700 uppercase">Filtrar por Evento</label>
                    </div>
                    <select
                      value={selectedEvent}
                      onChange={(e) => setSelectedEvent(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition bg-white"
                    >
                      <option value="all">Todos os Eventos</option>
                      {events.map((event) => (
                        <option key={event} value={event}>{event} em {groupedByEvent[event][0].eventDate}</option>
                      ))}
                    </select>
                  </div>

                  {/* Lista de Inscrições Agrupadas por Evento */}
                  {Object.entries(selectedEvent === 'all' ? groupedByEvent : { [selectedEvent]: groupedByEvent[selectedEvent] || [] }).map(([eventName, registrations]) => (
                    <div key={eventName} className="space-y-4">
                      {/* Header do Evento */}
                      <div className="rounded-xl border-2 border-primary-blue bg-blue-50 p-4">
                        <h3 className="text-lg font-bold text-gray-800 uppercase mb-1">{eventName}</h3>
                        <p className="text-sm text-gray-600">
                          em {registrations[0].eventDate} • N° de Inscrições Realizadas: <span className="font-semibold text-primary-blue">{registrations.length}</span>
                        </p>
                      </div>

                    {/* Cards de Inscrições */}
                    <div className="space-y-4">
                      {registrations.map((reg) => (
                        <div key={reg.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition">
                          {/* Header do Atleta */}
                          <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-900 uppercase mb-1">
                                {reg.athleteName}, {reg.age} ANOS
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                                <span>Equipe: <span className="font-semibold">{reg.team}</span></span>
                                <span>Professor: <span className="font-semibold">{reg.professor}</span></span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-mono text-gray-400 mb-1">#{reg.registrationNumber}</p>
                              <p className="text-lg font-bold text-primary-blue">R$ {reg.price.toFixed(2).replace('.', ',')}</p>
                            </div>
                          </div>

                          {/* Modalidades e Categorias */}
                          <div className="mb-4 space-y-3">
                            {reg.modality.map((mod, index) => (
                              <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <p className="text-sm font-semibold text-gray-700 uppercase mb-2">Modalidade</p>
                                <p className="text-base font-medium text-gray-800 mb-2">{mod}</p>
                                {reg.category[index] && (
                                  <p className="text-sm text-gray-600">{reg.category[index]}</p>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Status e Data */}
                          <div className="flex flex-wrap items-center gap-4 mb-4 pb-4 border-b border-gray-200">
                            <div className="flex items-center gap-2">
                              {reg.paymentStatus === 'confirmed' ? (
                                <>
                                  <FiCheckCircle className="text-green-600" size={18} />
                                  <span className="text-sm font-semibold text-green-700">Pagamento: Confirmado</span>
                                </>
                              ) : (
                                <>
                                  <FiAlertCircle className="text-amber-600" size={18} />
                                  <span className="text-sm font-semibold text-amber-700">Pagamento: Pendente</span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {reg.registrationStatus === 'confirmed' ? (
                                <>
                                  <FiCheckCircle className="text-green-600" size={18} />
                                  <span className="text-sm font-semibold text-green-700">Inscrição: Efetivada</span>
                                </>
                              ) : (
                                <>
                                  <FiAlertCircle className="text-amber-600" size={18} />
                                  <span className="text-sm font-semibold text-amber-700">Inscrição: Pendente</span>
                                </>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">
                              Inscrito em {reg.registeredAt}
                            </div>
                          </div>

                          {/* Botões de Ação */}
                          <div className="flex flex-wrap gap-3">
                            <button className="flex items-center gap-2 rounded-lg border-2 border-red-300 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50">
                              <FiDownload size={16} />
                              Recibo de Pagamento
                            </button>
                            <button className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700">
                              <FiFileText size={16} />
                              Declaração de Participação
                            </button>
                            <button className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700">
                              <FiStar size={16} />
                              Avaliar o Evento
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

