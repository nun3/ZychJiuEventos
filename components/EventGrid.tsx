'use client'

import Link from 'next/link'
import { FiCalendar, FiMapPin } from 'react-icons/fi'

// Dados mockados para visualização
const mockEvents = [
  {
    id: 1,
    title: '2ª Copa Internacional Tri Fronteira',
    type: 'Campeonato Jiu-Jitsu',
    date: '09 de Novembro',
    dateFull: '09/11/2025',
    location: 'Dionísio Cerqueira/SC',
    daysLeft: 3,
    image: '/images/event-1.jpg',
  },
  {
    id: 2,
    title: '11ª Copa Espera Feliz de Jiu-Jitsu',
    type: 'Campeonato Jiu-Jitsu',
    date: '09 de Novembro',
    dateFull: '09/11/2025',
    location: 'Espera Feliz/MG',
    daysLeft: 3,
    image: '/images/event-2.jpg',
  },
  {
    id: 3,
    title: '2ª Copa Seven bjj',
    type: 'Campeonato Jiu-Jitsu',
    date: '15 de Novembro',
    dateFull: '15/11/2025',
    location: 'Palhoça/SC',
    daysLeft: 9,
    image: '/images/event-3.jpg',
  },
  {
    id: 4,
    title: 'Copa King de Jiu-Jitsu',
    type: 'Campeonato Jiu-Jitsu',
    date: '16 de Novembro',
    dateFull: '16/11/2025',
    location: 'Joinville/SC',
    daysLeft: 10,
    image: '/images/event-4.jpg',
  },
  {
    id: 5,
    title: 'Campeonato Neropolino de Jiu-Jitsu',
    type: 'Campeonato Jiu-Jitsu',
    date: '16 de Novembro',
    dateFull: '16/11/2025',
    location: 'Nerópolis Goiás/GO',
    daysLeft: 10,
    image: '/images/event-5.jpg',
  },
  {
    id: 6,
    title: '2º Festival Kids de Jiu-Jitsu',
    type: 'Campeonato Jiu-Jitsu',
    date: '16 de Novembro',
    dateFull: '16/11/2025',
    location: 'Clevelândia/PR',
    daysLeft: 10,
    image: '/images/event-6.jpg',
  },
]

function EventCard({ event }: { event: typeof mockEvents[0] }) {
  return (
    <Link
      href={`/eventos/${event.id}`}
      className="block bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden group"
    >
      {/* Imagem do evento */}
      <div className="relative h-48 bg-gradient-to-br from-primary-dark to-primary-red overflow-hidden">
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition" />
        <div className="absolute top-4 right-4 bg-primary-blue text-white px-3 py-1 rounded-full text-sm font-bold">
          {event.daysLeft} {event.daysLeft === 1 ? 'dia' : 'dias'} restantes
        </div>
        <div className="absolute bottom-4 left-4 text-white">
          <span className="bg-black/50 px-2 py-1 rounded text-xs font-medium">
            {event.type}
          </span>
        </div>
      </div>

      {/* Conteúdo do card */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 group-hover:text-primary-red transition line-clamp-2">
          {event.title}
        </h3>
        
        <div className="space-y-2 text-gray-600">
          <div className="flex items-center space-x-2">
            <FiCalendar className="text-primary-red" />
            <span className="text-sm">{event.date} - {event.dateFull}</span>
          </div>
          <div className="flex items-center space-x-2">
            <FiMapPin className="text-primary-red" />
            <span className="text-sm">{event.location}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t">
          <button className="w-full bg-primary-blue text-white font-bold py-2 rounded hover:bg-blue-700 transition">
            Ver Detalhes
          </button>
        </div>
      </div>
    </Link>
  )
}

export default function EventGrid() {
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Eventos Disponíveis</h2>
        <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent">
          <option>Ordenar por... Data – Próximos Eventos</option>
          <option>Data – Eventos Distantes</option>
          <option>Nome do Evento A-Z</option>
          <option>Nome do Evento Z-A</option>
          <option>Localidade (Estado) A-Z</option>
          <option>Localidade (Estado) Z-A</option>
        </select>
      </div>

      {mockEvents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-500 text-lg">
            Ops! Não encontramos nenhum evento para a combinação de filtros que foi feita.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}

      {/* Paginação */}
      {mockEvents.length > 0 && (
        <div className="mt-8 flex justify-center">
          <div className="flex space-x-2">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-primary-blue hover:text-white transition">
              Anterior
            </button>
            <button className="px-4 py-2 bg-primary-blue text-white rounded-lg">
              1
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-primary-blue hover:text-white transition">
              2
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-primary-blue hover:text-white transition">
              Próximo
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

