'use client'

import { useState } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppWidget from '@/components/WhatsAppWidget'
import AthleteSelectionModal from '@/components/AthleteSelectionModal'
import Link from 'next/link'
import { FiArrowLeft, FiUsers, FiCalendar, FiMapPin } from 'react-icons/fi'

// Dados mockados do evento
const mockEvent = {
  id: 1,
  title: '2º FESTIVAL KIDS DE JIU-JITSU',
  date: '16 de Novembro de 2025',
  dayOfWeek: 'Domingo',
  location: 'Clevelândia/PR',
  fullLocation: 'Centro Esportivo Municipal Idevaldo Zardo',
  time: 'AS 9:00 H',
  registrationPeriod: 'De 10/10 até 13/11',
}

// Dados mockados de atletas cadastrados
const mockAthletes = [
  {
    id: 1,
    name: 'ARTHUR DA COSTA RAMOS',
    age: 9,
    gender: 'M' as const,
    academy: 'ZYCH JIU JITSU / RICARDO ZYCH',
    belt: 'Branca',
    weight: '26.00',
  },
  {
    id: 2,
    name: 'ÁGATA GIORDANI',
    age: 9,
    gender: 'F' as const,
    academy: 'ZYCH JIU JITSU / RICARDO ZYCH',
    belt: 'Branca',
    weight: '35.00',
  },
  {
    id: 3,
    name: 'ANA VITÓRIA C. RAMOS',
    age: 9,
    gender: 'F' as const,
    academy: 'ZYCH JIU JITSU / RICARDO ZYCH',
    belt: 'Branca',
    weight: '23.00',
  },
  {
    id: 4,
    name: 'BENJAMIN GROBE DE ALMEIDA',
    age: 8,
    gender: 'M' as const,
    academy: 'ZYCH JIU JITSU / RICARDO ZYCH',
    belt: 'Branca',
    weight: '48.00',
    isRegistered: true,
  },
  {
    id: 5,
    name: 'BRUNO PEREIRA COSSUL DOBROWOLSKI',
    age: 20,
    gender: 'M' as const,
    academy: 'ZYCH JIU JITSU / RICARDO ZYCH',
    belt: 'Branca',
    weight: '70.00',
    isRegistered: true,
  },
  {
    id: 6,
    name: 'CAETANO DALL ACQUA',
    age: 10,
    gender: 'M' as const,
    academy: 'ZYCH JIU JITSU / RICARDO ZYCH',
    belt: 'Branca',
    weight: '64.00',
  },
  {
    id: 7,
    name: 'CAETANO FILIPPINI',
    age: 8,
    gender: 'M' as const,
    academy: 'ZYCH JIU JITSU / RICARDO ZYCH',
    belt: 'Cinza',
    weight: '41.00',
  },
  {
    id: 8,
    name: 'CATARINA LOURENÇO BASSO',
    age: 7,
    gender: 'F' as const,
    academy: 'ZYCH JIU JITSU / RICARDO ZYCH',
    belt: 'Branca',
    weight: '32.00',
  },
  {
    id: 9,
    name: 'DAVI BALDIN LUVIZAO',
    age: 12,
    gender: 'M' as const,
    academy: 'ZYCH JIU JITSU / RICARDO ZYCH',
    belt: 'Branca',
    weight: '34.00',
  },
  {
    id: 10,
    name: 'EMANUEL CARVALHO LAZARIM',
    age: 10,
    gender: 'M' as const,
    academy: 'ZYCH JIU JITSU / RICARDO ZYCH',
    belt: 'Branca',
    weight: '48.00',
    isRegistered: true,
  },
]

export default function AthletesRegistrationPage({ params }: { params: { id: string } }) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleConfirmSelection = (selectedIds: number[]) => {
    console.log('Atletas selecionados:', selectedIds)
    // Aqui você processaria a seleção
  }

  return (
    <main className="min-h-screen">
      <Header />
      <div className="pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <Link
              href={`/eventos/${params.id}/inscricao`}
              className="text-gray-600 hover:text-primary-orange flex items-center space-x-2 transition mb-4"
            >
              <FiArrowLeft />
              <span>voltar</span>
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
              REALIZAR INSCRIÇÃO DE MEUS ATLETAS
            </h1>
          </div>

          {/* Card do Evento */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
            <div className="flex flex-col lg:flex-row">
              {/* Banner - Lado Esquerdo */}
              <div className="lg:w-1/2 relative bg-gradient-to-br from-primary-dark via-primary-dark to-primary-orange p-8 md:p-12">
                <div className="relative z-10 text-white">
                  {/* Emblema Circular Verde */}
                  <div className="mb-6 flex justify-center">
                    <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-green-600 flex items-center justify-center border-8 border-white shadow-lg">
                      <div className="text-center px-4">
                        <h2 className="text-lg md:text-xl font-bold mb-2 text-white">
                          {mockEvent.title}
                        </h2>
                        <div className="flex justify-center space-x-2 mb-2">
                          <span className="text-2xl">👦</span>
                          <span className="text-2xl">👧</span>
                          <span className="text-2xl">👦</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Data */}
                  <div className="text-center mb-4">
                    <p className="text-2xl md:text-3xl font-bold">
                      {mockEvent.date.toUpperCase()}
                    </p>
                  </div>

                  {/* Local e Horário */}
                  <div className="space-y-2 text-sm md:text-base">
                    <p><strong>LOCAL:</strong> {mockEvent.fullLocation}</p>
                    <p><strong>{mockEvent.time}</strong></p>
                    <p>{mockEvent.location}</p>
                  </div>

                  {/* Logo */}
                  <div className="mt-6">
                    <div className="bg-white/20 px-4 py-2 rounded text-xs inline-block">
                      Jiu-Jitsu
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalhes - Lado Direito */}
              <div className="lg:w-1/2 p-6 md:p-8">
                <h2 className="text-2xl md:text-3xl font-bold text-primary-orange mb-4">
                  {mockEvent.title}
                </h2>
                <div className="space-y-3 text-gray-700">
                  <div>
                    <span className="text-primary-red font-bold">PERÍODO DE INSCRIÇÃO</span>
                    <p className="text-gray-800">{mockEvent.registrationPeriod}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FiCalendar className="text-primary-red" />
                    <span>{mockEvent.date}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FiMapPin className="text-primary-red" />
                    <span>{mockEvent.location}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Seção de Inscrição */}
          <div className="bg-white rounded-lg shadow-md p-6 md:p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-primary-orange mb-4">
              Atletas para Inscrever
            </h2>

            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full bg-primary-red hover:bg-red-700 text-white font-bold py-4 px-6 rounded-lg transition mb-4"
            >
              SELECIONAR MEUS ATLETAS
            </button>

            <p className="text-gray-700 mb-6">
              <strong>ATENÇÃO:</strong> Poderá ser feito apenas{' '}
              <span className="underline">20</span> inscrições por vez, havendo muitos atletas repita esse procedimento novamente.
            </p>

            {/* Box de Atenção */}
            <div className="bg-amber-50 border-t-4 border-primary-red p-4 rounded-lg">
              <p className="font-bold text-gray-800 mb-2">ATENÇÃO:</p>
              <p className="text-gray-700 mb-2">
                Para o campeonato, a idade é calculada com base no ano de nascimento.
              </p>
              <p className="text-gray-700">
                <strong>Exemplo:</strong> O atleta nasceu em 2015, então em 2025 ele tem 10 anos.
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <WhatsAppWidget />

      {/* Modal de Seleção */}
      <AthleteSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        athletes={mockAthletes}
        eventId={params.id}
        onConfirmSelection={handleConfirmSelection}
      />
    </main>
  )
}

