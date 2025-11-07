'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FiCalendar, FiMapPin, FiArrowLeft, FiUsers } from 'react-icons/fi'

// Dados mockados
const mockEvent = {
  id: 1,
  title: '2ª Copa Internacional Tri Fronteira',
  type: 'Campeonato Jiu-Jitsu',
  date: '09 de Novembro de 2025',
  dayOfWeek: 'Domingo',
  location: 'Dionísio Cerqueira/SC',
  image: '/images/event-banner.jpg',
  description: 'Um campeonato internacional de Jiu-Jitsu que reúne atletas de três países na fronteira.',
  requirements: '02kg de alimento não perecível',
  organizer: {
    name: 'Organização Zych',
    email: 'contato@zych.com.br',
    phone: '(27) 99945-0345',
  },
  schedule: {
    registration: { status: 'active', date: '01/11/2025 - 08/11/2025' },
    payment: { status: 'active', date: '01/11/2025 - 08/11/2025' },
    checkin: { status: 'pending', date: '08/11/2025' },
    brackets: { status: 'pending', date: '09/11/2025' },
    competition: { status: 'pending', date: '09/11/2025' },
  },
}

const tabs = [
  'SOBRE O EVENTO',
  'LOCAL DO EVENTO',
  'VALORES DAS INSCRIÇÕES',
  'FORMAS DE PAGAMENTO',
  'PREMIAÇÃO',
  'CATEGORIAS',
  'ABSOLUTO',
  'CHECAGEM',
  'CHAVES',
  'PESAGEM',
  'REGRAS',
  'DIREITO DE IMAGEM',
  'DECLARAÇÃO DE SAÚDE',
]

export default function EventDetails({ eventId }: { eventId: string }) {
  const [activeTab, setActiveTab] = useState(0)

  return (
    <div>
      {/* Header do Evento */}
      <section className="relative h-96 bg-gradient-to-r from-primary-dark to-primary-red">
        <div className="absolute inset-0 bg-black/40" />
        <div className="container mx-auto px-4 h-full flex items-center justify-center relative z-10">
          <div className="text-center text-white max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {mockEvent.title}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-4 text-lg">
              <div className="flex items-center space-x-2">
                <FiCalendar />
                <span>{mockEvent.date} - {mockEvent.dayOfWeek}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FiMapPin />
                <span>{mockEvent.location}</span>
              </div>
            </div>
          </div>
        </div>
        <Link
          href="/"
          className="absolute top-4 left-4 z-20 text-white hover:text-primary-orange flex items-center space-x-2 transition"
        >
          <FiArrowLeft />
          <span>voltar para eventos</span>
        </Link>
        <Link
          href={`/eventos/${eventId}/inscritos`}
          className="absolute top-4 right-4 z-20 bg-primary-orange text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition flex items-center space-x-2"
        >
          <FiUsers />
          <span>ATLETAS INSCRITOS</span>
        </Link>
      </section>

      {/* Menu de Abas */}
      <section className="bg-white border-b sticky top-20 z-40">
        <div className="container mx-auto px-4">
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`px-4 py-4 font-medium whitespace-nowrap border-b-2 transition ${
                  activeTab === index
                    ? 'border-primary-orange text-primary-orange'
                    : 'border-transparent text-gray-600 hover:text-primary-red'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Conteúdo das Abas */}
      <section className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          {activeTab === 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">Sobre o Evento</h2>
                <p className="text-gray-700 leading-relaxed">{mockEvent.description}</p>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-2">Requisitos de Entrada</h3>
                <p className="text-gray-700">{mockEvent.requirements}</p>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-xl font-bold mb-4">Organização</h3>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Nome:</strong> {mockEvent.organizer.name}</p>
                  <p><strong>Email:</strong> {mockEvent.organizer.email}</p>
                  <p><strong>Telefone:</strong> {mockEvent.organizer.phone}</p>
                </div>
                <button className="mt-4 bg-primary-red text-white px-6 py-2 rounded-lg hover:bg-red-700 transition">
                  ENVIAR MENSAGEM
                </button>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-xl font-bold mb-4">Datas Importantes</h3>
                <div className="space-y-3">
                  {Object.entries(mockEvent.schedule).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className={`w-3 h-3 rounded-full ${
                          value.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                        <span className="font-medium capitalize">{key}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        {value.status === 'active' ? '✓ Ativo' : '✗ Pendente'} - {value.date}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Local do Evento</h2>
              <div className="bg-gray-200 h-64 rounded-lg mb-4 flex items-center justify-center">
                <p className="text-gray-500">Mapa Google Maps será integrado aqui</p>
              </div>
              <div className="space-y-2 text-gray-700">
                <p><strong>Endereço:</strong> {mockEvent.location}</p>
                <p><strong>Referências:</strong> Próximo ao centro da cidade</p>
              </div>
            </div>
          )}

          {activeTab === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Valores das Inscrições</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-primary-dark text-white">
                      <th className="border p-3 text-left">Categoria</th>
                      <th className="border p-3 text-left">Faixa</th>
                      <th className="border p-3 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-3">Adulto</td>
                      <td className="border p-3">Branca</td>
                      <td className="border p-3 text-right">R$ 80,00</td>
                    </tr>
                    <tr>
                      <td className="border p-3">Adulto</td>
                      <td className="border p-3">Azul</td>
                      <td className="border p-3 text-right">R$ 100,00</td>
                    </tr>
                    <tr>
                      <td className="border p-3">Adulto</td>
                      <td className="border p-3">Roxa</td>
                      <td className="border p-3 text-right">R$ 120,00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab > 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">{tabs[activeTab]}</h2>
              <p className="text-gray-600">Conteúdo da aba {tabs[activeTab]} será implementado em breve.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

