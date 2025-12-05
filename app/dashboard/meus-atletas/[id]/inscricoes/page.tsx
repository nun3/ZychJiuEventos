'use client'

import Link from 'next/link'
import ModernNavbar from '@/components/ModernNavbar'
import ModernFooter from '@/components/ModernFooter'
import { FiArrowLeft, FiCalendar, FiMapPin, FiEdit, FiCheck, FiAlertTriangle, FiFileText, FiX } from 'react-icons/fi'

// Dados mockados do atleta
const mockAthlete = {
  id: 'agata-gordiani',
  name: 'Ágata Gordiani',
  age: 9,
}

// Dados mockados de inscrições
const mockRegistrations = [
  {
    id: '0086',
    eventId: '1',
    eventName: '2º FESTIVAL KIDS DE JIU-JITSU',
    date: '16/11/2025',
    location: 'Clevelândia/PR',
    category: 'Infantil A - Branca/Cinza - Pesadíssimo - Masculino',
    team: 'ZYCH JIU JITSU / RICARDO ZYCH',
    value: 50.00,
    paymentStatus: 'pending',
    registrationStatus: 'pending',
    eventStatus: 'active', // active ou concluded
  },
  {
    id: '0029',
    eventId: '2',
    eventName: 'ESTCAMP KIDS DE JIU-JITSU',
    date: '15/06/2025',
    location: 'Clevelândia/PR',
    category: 'Infantil A - Branca/Cinza - Super Pesado - Masculino',
    team: 'ZYCH JIU JITSU / RICARDO ZYCH',
    value: 80.00,
    paymentStatus: 'confirmed',
    registrationStatus: 'confirmed',
    eventStatus: 'concluded',
  },
]

export default function AthleteRegistrationsPage({ params }: { params: { id: string } }) {
  const activeRegistrations = mockRegistrations.filter((r) => r.eventStatus === 'active')
  const concludedRegistrations = mockRegistrations.filter((r) => r.eventStatus === 'concluded')

  return (
    <main className="container mx-auto px-4">
      <section className="rounded-2xl bg-white shadow">
        <header className="border-b border-gray-200 bg-[#0C3049] px-6 py-6 text-white">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href="/dashboard/meus-atletas"
              className="text-white hover:text-primary-orange transition"
            >
              <FiArrowLeft size={20} />
            </Link>
            <h1 className="text-2xl font-bold uppercase tracking-wide">
              Inscrições - {mockAthlete.name}
            </h1>
          </div>
          <p className="text-sm text-blue-100">Visualize e gerencie as inscrições do atleta</p>
        </header>

        <div className="px-6 py-8">
          {/* Campeonatos Ativos */}
          {activeRegistrations.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Campeonato ativo</h2>
              <div className="space-y-6">
                {activeRegistrations.map((registration) => (
                  <div
                    key={registration.id}
                    className="border-t-2 border-primary-red rounded-lg bg-white shadow-sm"
                  >
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">
                        {registration.eventName}
                      </h3>

                      <div className="space-y-2 text-gray-600 mb-4">
                        <div className="flex items-center space-x-2">
                          <FiCalendar className="text-primary-red" />
                          <span>{registration.date}, {registration.location}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FiMapPin className="text-primary-red" />
                          <span>{registration.location}</span>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <p>
                          <span className="text-primary-orange cursor-pointer">Categoria de Peso Jiu-Jitsu</span>
                          <span className="ml-2 text-primary-red cursor-pointer">
                            <FiEdit size={14} className="inline" />
                          </span>
                        </p>
                        <p className="font-medium text-gray-800">{registration.category}</p>
                        <p>{registration.team}</p>
                      </div>

                      <div className="space-y-2 text-sm mb-4">
                        <p className="text-gray-700">
                          <strong>N° da Inscrição:</strong> {registration.id}
                        </p>
                        <p className="text-gray-700">
                          <strong>Valor:</strong> R$ {registration.value.toFixed(2).replace('.', ',')}
                        </p>
                        <div className="flex items-center space-x-2">
                          <strong className="text-gray-700">Pagamento:</strong>
                          {registration.paymentStatus === 'confirmed' ? (
                            <>
                              <FiCheck className="text-green-600" />
                              <span className="text-green-600 font-medium">Confirmado</span>
                            </>
                          ) : (
                            <>
                              <FiAlertTriangle className="text-red-600" />
                              <span className="text-red-600 font-medium">Pendente</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <strong className="text-gray-700">Inscrição:</strong>
                          {registration.registrationStatus === 'confirmed' ? (
                            <span className="text-green-600 font-medium">Efetivada</span>
                          ) : (
                            <span className="text-red-600 font-medium">Pendente</span>
                          )}
                        </div>
                      </div>

                      {/* Botões de Ação */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
                        <button className="bg-primary-red hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center space-x-2">
                          <span className="text-xl">💎</span>
                          <span>Pagar com Pix</span>
                        </button>
                        <button className="bg-primary-red hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center space-x-2">
                          <FiFileText />
                          <span>Pagar em Boleto</span>
                        </button>
                        <button className="bg-primary-red hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center space-x-2">
                          <FiCheck />
                          <span>Checagem</span>
                        </button>
                        <button className="bg-primary-red hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center space-x-2">
                          <FiEdit />
                          <span>Alterar Inscrição</span>
                        </button>
                        <button className="border-2 border-primary-red text-primary-red hover:bg-red-50 font-bold py-3 px-4 rounded-lg transition flex items-center justify-center space-x-2">
                          <FiX />
                          <span>Cancelar Inscrição</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Campeonatos Concluídos */}
          {concludedRegistrations.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Campeonato já concluído</h2>
              <div className="space-y-6">
                {concludedRegistrations.map((registration) => (
                  <div
                    key={registration.id}
                    className="border border-gray-200 rounded-lg bg-white shadow-sm"
                  >
                    <div className="p-6">
                      <h3 className="text-lg font-bold text-gray-800 mb-4">
                        {registration.eventName}
                      </h3>

                      <div className="space-y-2 text-gray-600 mb-4">
                        <div className="flex items-center space-x-2">
                          <FiCalendar className="text-primary-red" />
                          <span>{registration.date}, {registration.location}</span>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <p>
                          <span className="text-primary-orange cursor-pointer">Categoria de Peso Jiu-Jitsu</span>
                        </p>
                        <p className="font-medium text-gray-800">{registration.category}</p>
                        <p>{registration.team}</p>
                      </div>

                      <div className="space-y-2 text-sm mb-4">
                        <p className="text-gray-700">
                          <strong>N° da Inscrição:</strong> {registration.id}
                        </p>
                        <p className="text-gray-700">
                          <strong>Valor:</strong> R$ {registration.value.toFixed(2).replace('.', ',')}
                        </p>
                        <div className="flex items-center space-x-2">
                          <strong className="text-gray-700">Pagamento:</strong>
                          <FiCheck className="text-green-600" />
                          <span className="text-green-600 font-medium">Confirmado</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <strong className="text-gray-700">Inscrição:</strong>
                          <span className="text-green-600 font-medium">Efetivada</span>
                        </div>
                      </div>

                      {/* Botões de Ação para Concluídos */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
                        <button
                          disabled
                          className="bg-gray-300 text-gray-500 font-bold py-3 px-4 rounded-lg transition flex items-center justify-center space-x-2 cursor-not-allowed"
                        >
                          <FiFileText />
                          <span>Emitir Recibo de Pagamento</span>
                        </button>
                        <button className="bg-primary-red hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center space-x-2">
                          <FiFileText />
                          <span>Emitir Declaração de Participação</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeRegistrations.length === 0 && concludedRegistrations.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                Nenhuma inscrição encontrada para este atleta.
              </p>
            </div>
          )}
        </div>
      </section>
      </div>
      <ModernFooter />
    </main>
  )
}

