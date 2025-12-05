'use client'

import ModernEventCard from './ModernEventCard'

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
  },
  {
    id: 2,
    title: '11ª Copa Espera Feliz de Jiu-Jitsu',
    type: 'Campeonato Jiu-Jitsu',
    date: '09 de Novembro',
    dateFull: '09/11/2025',
    location: 'Espera Feliz/MG',
    daysLeft: 3,
  },
  {
    id: 3,
    title: '2ª Copa Seven bjj',
    type: 'Campeonato Jiu-Jitsu',
    date: '15 de Novembro',
    dateFull: '15/11/2025',
    location: 'Palhoça/SC',
    daysLeft: 9,
  },
  {
    id: 4,
    title: 'Copa King de Jiu-Jitsu',
    type: 'Campeonato Jiu-Jitsu',
    date: '16 de Novembro',
    dateFull: '16/11/2025',
    location: 'Joinville/SC',
    daysLeft: 10,
  },
  {
    id: 5,
    title: 'Campeonato Neropolino de Jiu-Jitsu',
    type: 'Campeonato Jiu-Jitsu',
    date: '16 de Novembro',
    dateFull: '16/11/2025',
    location: 'Nerópolis Goiás/GO',
    daysLeft: 10,
  },
  {
    id: 6,
    title: '2º Festival Kids de Jiu-Jitsu',
    type: 'Campeonato Jiu-Jitsu',
    date: '16 de Novembro',
    dateFull: '16/11/2025',
    location: 'Clevelândia/PR',
    daysLeft: 10,
  },
]

export default function ModernEventGrid() {
  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Eventos Disponíveis</h2>
        <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent bg-white text-gray-700">
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
          {mockEvents.map((event, index) => (
            <ModernEventCard key={event.id} event={event} index={index} />
          ))}
        </div>
      )}

      {/* Paginação */}
      {mockEvents.length > 0 && (
        <div className="mt-8 flex justify-center">
          <div className="flex space-x-2">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-primary-blue hover:text-white transition bg-white text-gray-700">
              Anterior
            </button>
            <button className="px-4 py-2 bg-primary-blue text-white rounded-lg">
              1
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-primary-blue hover:text-white transition bg-white text-gray-700">
              2
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-primary-blue hover:text-white transition bg-white text-gray-700">
              Próximo
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

