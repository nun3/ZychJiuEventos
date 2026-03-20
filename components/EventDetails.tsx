'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FiMapPin, FiArrowLeft, FiAward, FiDollarSign, FiCreditCard, FiStar, FiList, FiZap, FiClock, FiCheckCircle, FiKey, FiBarChart, FiShield, FiCamera, FiHeart } from 'react-icons/fi'
import RegistrationWizard from '@/components/RegistrationWizard'
import dynamic from 'next/dynamic'
import { getEventById, type StoredEvent } from '@/lib/eventStorage'

// Importações dinâmicas para as outras abas
const WeightTableContent = dynamic(() => import('./WeightTableContent'), { ssr: false })
const RegisteredAthletesContent = dynamic(() => import('./RegisteredAthletesContent'), { ssr: false })
const FinancialContent = dynamic(() => import('./FinancialContent'), { ssr: false })

// Dados mockados padrão
const defaultMockEvent = {
  id: 1,
  title: '2ª Copa Internacional Tri Fronteira',
  type: 'Campeonato Jiu-Jitsu',
  date: '16 de Novembro de 2025',
  dayOfWeek: 'Domingo',
  location: 'Clevelândia/PR',
  fullLocation: 'Centro Esportivo Municipal Idevaldo Zardo',
  time: 'AS 9:00 H',
  image: '/images/2-festival-kids-2025.png',
  description: 'Um campeonato internacional de Jiu-Jitsu que reúne atletas de três países na fronteira.',
  requirements: '02kg de alimento não perecível',
  organizer: {
    name: 'Organização Meu Camp',
    email: 'contato@meucamp.com.br',
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

// Converter StoredEvent para formato do mockEvent
function storedToMockEvent(stored: StoredEvent): typeof defaultMockEvent {
  return {
    id: stored.id,
    title: stored.titulo,
    type: stored.type || 'Campeonato Jiu-Jitsu',
    date: stored.date || new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
    dayOfWeek: stored.dateObj ? new Date(stored.dateObj).toLocaleDateString('pt-BR', { weekday: 'long' }) : 'Domingo',
    location: stored.location || 'Local não informado',
    fullLocation: stored.location || 'Local não informado',
    time: 'AS 9:00 H',
    image: stored.bannerImage || stored.destaqueImage || '/images/2-festival-kids-2025.png',
    description: stored.apresentacao || stored.description || 'Descrição do evento não disponível.',
    requirements: '02kg de alimento não perecível',
    organizer: {
      name: stored.organizer,
      email: 'contato@meucamp.com.br',
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
}

// Abas principais (ações)
const mainTabs = [
  'INFORMAÇÕES',
  'INSCRIÇÕES',
  'ATLETAS INSCRITOS',
  'TABELA DE PESO',
  'FINANCEIRO',
]

// Sub-abas dentro de INFORMAÇÕES (seguindo o modelo do iLutas)
const infoSubTabs = [
  { id: 'sobre', label: 'SOBRE O EVENTO', icon: FiAward },
  { id: 'local', label: 'LOCAL DO EVENTO', icon: FiMapPin },
  { id: 'valores', label: 'VALORES DAS INSCRIÇÕES', icon: FiDollarSign },
  { id: 'pagamento', label: 'FORMAS DE PAGAMENTO', icon: FiCreditCard },
  { id: 'premiacao', label: 'PREMIAÇÃO', icon: FiStar },
  { id: 'categorias', label: 'CATEGORIAS', icon: FiList },
  { id: 'absoluto', label: 'ABSOLUTO', icon: FiZap },
  { id: 'checagem', label: 'CHECAGEM', icon: FiCheckCircle },
  { id: 'chaves', label: 'CHAVES', icon: FiKey },
  { id: 'pesagem', label: 'PESAGEM', icon: FiBarChart },
  { id: 'regras', label: 'REGRAS', icon: FiShield },
  { id: 'direito-imagem', label: 'DIREITO DE IMAGEM', icon: FiCamera },
  { id: 'declaracao-saude', label: 'DECLARAÇÃO DE SAÚDE', icon: FiHeart },
]

export default function EventDetails({ eventId }: { eventId: string }) {
  const [activeTab, setActiveTab] = useState(0)
  const [activeInfoSubTab, setActiveInfoSubTab] = useState(0)
  const [eventData, setEventData] = useState<typeof defaultMockEvent>(defaultMockEvent)

  // Carregar evento do localStorage ou usar mock padrão
  useEffect(() => {
    const id = parseInt(eventId)
    if (!isNaN(id)) {
      const stored = getEventById(id)
      if (stored && stored.status === 'published') {
        setEventData(storedToMockEvent(stored))
      } else {
        // Se não encontrar ou não estiver publicado, usar mock padrão se for ID 1
        if (id === 1) {
          setEventData(defaultMockEvent)
        }
      }
    }
  }, [eventId])

  const mockEvent = eventData

  return (
    <div>
      {/* Header com link voltar */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-3 py-3">
          <div className="flex items-center justify-end">
            <Link
              href="/"
              className="text-gray-600 hover:text-primary-blue flex items-center space-x-2 transition"
            >
              <FiArrowLeft />
              <span className="text-xs md:text-sm">voltar para eventos</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Banner do Evento - Simplificado */}
      <section className="bg-white py-7">
        <div className="container mx-auto px-3">
          {/* Título do Evento acima do banner */}
          <div className="mb-5">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 text-center uppercase">
              {mockEvent.title}
            </h1>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Banner com Imagem */}
            <div className="relative w-full flex items-center justify-center bg-gray-100">
              {mockEvent.image ? (
                <img
                  src={mockEvent.image}
                  alt={mockEvent.title}
                  className="w-full h-auto max-h-[600px] object-contain"
                />
              ) : (
                <div 
                  className="w-full h-[400px] md:h-[500px] lg:h-[600px] bg-gradient-to-br from-primary-dark via-primary-dark to-primary-blue"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Menu de Abas Principais */}
      <section className="bg-white border-b sticky top-20 z-40">
        <div className="container mx-auto px-3">
          <div className="flex overflow-x-auto scrollbar-hide">
            {mainTabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`px-2 sm:px-3 md:px-4 py-2 sm:py-3 md:py-4 text-xs sm:text-sm md:text-sm lg:text-base font-semibold whitespace-nowrap border-b-2 transition ${
                  activeTab === index
                    ? 'border-primary-blue text-primary-blue'
                    : 'border-transparent text-gray-600 hover:text-primary-blue'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </section>


      {/* Conteúdo das Abas */}
      <section className="container mx-auto px-3 py-7 max-w-[1800px]">
        {/* Aba: INFORMAÇÕES - sem container duplo */}
        {activeTab === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Abas das Informações - 2 linhas: 6 em cima, 7 embaixo */}
            <div className="border-b border-gray-200">
              {/* Primeira linha: 6 abas lado a lado */}
              <div className="flex">
                {infoSubTabs.slice(0, 6).map((tab, index) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveInfoSubTab(index)}
                      className={`flex-1 px-2 py-4 text-xs sm:text-sm md:text-sm lg:text-base font-semibold flex items-center justify-center gap-2 transition border-b-4 ${
                        activeInfoSubTab === index
                          ? 'bg-white border-blue-500 text-blue-600 font-bold'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Icon size={16} className="flex-shrink-0 md:w-4 md:h-4 lg:w-5 lg:h-5" />
                      <span className="whitespace-nowrap text-center">{tab.label}</span>
                    </button>
                  )
                })}
              </div>
              
              {/* Segunda linha: 7 abas lado a lado */}
              <div className="flex">
                {infoSubTabs.slice(6, 13).map((tab, index) => {
                  const Icon = tab.icon
                  const actualIndex = index + 6
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveInfoSubTab(actualIndex)}
                      className={`flex-1 px-3 py-5 text-xs sm:text-sm md:text-base lg:text-lg font-semibold flex items-center justify-center gap-2 transition border-b-4 ${
                        activeInfoSubTab === actualIndex
                          ? 'bg-white border-blue-500 text-blue-600 font-bold'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Icon size={18} className="flex-shrink-0 md:size-5 lg:size-6" />
                      <span className="whitespace-nowrap text-center">{tab.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Conteúdo das Abas */}
            <div className="p-3 sm:p-5 md:p-6 lg:p-10">
              {/* SOBRE O EVENTO */}
              {activeInfoSubTab === 0 && (
                <div>
                  <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800 mb-3 sm:mb-5 uppercase">SOBRE O EVENTO</h2>
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-3 sm:p-5 md:p-6 mb-5 sm:mb-7">
                    {(() => {
                      const id = parseInt(eventId)
                      const stored = !isNaN(id) ? getEventById(id) : null
                      const apresentacao = stored?.apresentacao || mockEvent.description || 'Descrição do evento não disponível.'
                      
                      return (
                        <div className="space-y-3">
                          {apresentacao.split('\n').map((paragraph, idx) => (
                            paragraph.trim() && (
                              <p key={idx} className="text-xs sm:text-sm md:text-base leading-relaxed text-gray-700">
                                {paragraph}
                              </p>
                            )
                          ))}
                        </div>
                      )
                    })()}
                  </div>
                </div>
              )}

              {/* LOCAL DO EVENTO */}
              {activeInfoSubTab === 1 && (
                <div>
                  <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800 mb-3 sm:mb-5 uppercase">LOCAL DO EVENTO</h2>
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-3 sm:p-5 md:p-6">
                    <div className="text-center mb-3 sm:mb-5">
                    <FiMapPin className="w-10 h-10 sm:w-14 sm:h-14 md:w-18 md:h-18 text-blue-600 mx-auto mb-2 sm:mb-3" />
                      <p className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-800 uppercase">Ginásio do Grêmio Esportivo Industrial</p>
                      <p className="text-xs sm:text-sm md:text-sm italic text-gray-700 mt-2">R. Araucária, 883 Bairro Santa Terezinha</p>
                      <p className="text-xs sm:text-sm md:text-sm font-semibold italic text-gray-800 mt-1">Pato Branco/PR</p>
                    </div>
                    <div className="text-center mt-4 sm:mt-6">
                      <a
                        href="https://maps.app.goo.gl/XpTPbsmWMk2p6GdJ8"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-primary-blue hover:bg-blue-700 text-white font-bold py-2.5 px-6 sm:py-3 sm:px-8 md:py-4 md:px-10 text-sm sm:text-base md:text-lg rounded-xl transition"
                      >
                        Ver no Mapa
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* VALORES DAS INSCRIÇÕES */}
              {activeInfoSubTab === 2 && (
                <div>
                  <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800 mb-3 sm:mb-5 uppercase">VALORES DAS INSCRIÇÕES</h2>
                  <div className="grid md:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto mb-6">
                    <div className="bg-white border-2 border-green-500 rounded-2xl p-3 sm:p-5 md:p-7 text-center shadow-lg">
                      <p className="text-xl sm:text-2xl md:text-3xl font-black text-green-600 mb-2">R$ 70,00</p>
                      <p className="text-xs sm:text-sm md:text-sm font-semibold italic text-gray-800">Apenas Categoria de Peso</p>
                    </div>
                    <div className="bg-white border-2 border-blue-500 rounded-2xl p-3 sm:p-5 md:p-7 text-center shadow-lg transform scale-105">
                      <p className="text-xl sm:text-2xl md:text-3xl font-black text-blue-600 mb-2">R$ 95,00</p>
                      <p className="text-xs sm:text-sm md:text-sm font-semibold italic text-gray-800">Categoria de Peso + Absoluto</p>
                      <p className="text-xs sm:text-sm md:text-sm italic text-gray-600 mt-2">Mais popular</p>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <button
                      onClick={() => setActiveTab(1)}
                      className="bg-gradient-to-r from-primary-blue to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105 uppercase text-sm sm:text-base"
                    >
                      Inscrever
                    </button>
                  </div>
                </div>
              )}

              {/* FORMAS DE PAGAMENTO */}
              {activeInfoSubTab === 3 && (
                <div>
                  <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800 mb-3 sm:mb-5 uppercase">FORMAS DE PAGAMENTO</h2>
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-3 sm:p-5 md:p-7 space-y-3 sm:space-y-5">
                    <div>
                      <p className="text-xs sm:text-sm md:text-base leading-relaxed text-gray-700 mb-3 sm:mb-4">
                        As inscrições serão feitas impreterivelmente pelo <strong className="italic">site Meu Camp</strong>.
                      </p>
                      <p className="text-xs sm:text-sm md:text-base leading-relaxed text-gray-700 mb-3 sm:mb-4">
                        Poderão ser feitas <strong className="uppercase">Inscrições Individuais</strong> e <strong className="uppercase">Inscrições por Equipe</strong>, tanto pelo próprio atleta, professor ou responsável por atletas.
                      </p>
                      <p className="text-xs sm:text-sm md:text-base leading-relaxed text-gray-700 mb-3 sm:mb-4">
                        Apenas o responsável pelo atleta de menor poderá inscrevê-lo. Antes, o responsável deve fazer o <strong>cadastro no site</strong>, em seguida <strong>cadastrar o atleta</strong> para posterior realização da inscrição do atleta menor.
                      </p>
                      <p className="text-xs sm:text-sm md:text-base leading-relaxed text-gray-700 mb-3 sm:mb-4">
                        Qualquer atleta poderá realizar a inscrição de outro atleta, desde que todos estejam devidamente cadastrados no sistema.
                      </p>
                      <p className="text-xs sm:text-sm md:text-base leading-relaxed text-gray-700 mb-3 sm:mb-4">
                        Para informar a equipe, acesse o menu principal <strong className="italic">"Minha Equipe"</strong> ou <strong className="italic">"Meus Atletas"</strong>.
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-blue-300">
                      <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-800 mb-3 sm:mb-4 uppercase">Pagamento</h3>
                      <p className="text-xs sm:text-sm md:text-base text-gray-700 mb-3 sm:mb-4">
                        O pagamento da inscrição poderá ser feito por <strong className="uppercase">Pix</strong> ou <strong className="uppercase">Boleto</strong>.
                      </p>
                      <p className="text-xs sm:text-sm md:text-base font-semibold text-blue-600 mb-2 uppercase">IMPORTANTE:</p>
                      <p className="text-xs sm:text-sm md:text-base text-gray-700">
                        Pode ser feito um único pagamento no valor total, com a possibilidade de envio do link de pagamento a terceiros (como patrocinadores).
                      </p>
                    </div>
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 sm:p-6 rounded-xl">
                      <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-800 mb-3 sm:mb-4 uppercase">Sobre o Reembolso</h3>
                      <p className="text-xs sm:text-sm md:text-base text-gray-700">
                        Depois de inscrito, o atleta <strong>não terá direito à devolução do pagamento</strong>, seja por desistência, ausência, desclassificação ou impedimento. Em casos especiais, sendo autorizado, será cobrado 10% do valor do pagamento.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* PREMIAÇÃO */}
              {activeInfoSubTab === 4 && (
                <div>
                  <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800 mb-3 sm:mb-5 uppercase">PREMIAÇÃO</h2>
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-3 sm:p-5 md:p-7 space-y-3 sm:space-y-5">
                    <div className="bg-yellow-100 border-2 border-yellow-400 rounded-xl p-4 sm:p-6">
                      <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-800 mb-2 sm:mb-3 uppercase">Premiação Festival de 04 até 07 anos</h3>
                      <p className="text-xs sm:text-sm md:text-base text-gray-700">
                        Todas as crianças que participarem do festival ganharão <strong>medalhas de ouro</strong>.
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-blue-300">
                      <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-800 mb-2 sm:mb-3 uppercase">Premiações das Categorias de Peso dos 08 até 17 anos</h3>
                      <p className="text-sm sm:text-base md:text-lg text-gray-700 mb-2">
                        Medalha para <strong>1º, 2º e 3º Colocado</strong> haverá dois 3º lugares.
                      </p>
                      <p className="text-xs sm:text-sm md:text-base text-gray-700">
                        Todas as faixas medalhas.
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-blue-300">
                      <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-800 mb-2 sm:mb-3 uppercase">Premiações das Equipes Campeãs</h3>
                      <p className="text-xs sm:text-sm md:text-base text-gray-700">
                        Haverá troféu de equipe do <strong>1º ao 5º lugar</strong>
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-300">
                      <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-800 mb-2 sm:mb-3 uppercase">Sistema de Pontuação</h3>
                      <ul className="space-y-2 text-sm sm:text-base md:text-lg text-gray-700">
                        <li>· <strong>Campeão:</strong> 9 Pontos</li>
                        <li>· <strong>2º Lugar:</strong> 3 Pontos</li>
                        <li>· <strong>3º Lugar:</strong> 1 Ponto</li>
                      </ul>
                      <div className="mt-4">
                        <h4 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-800 mb-2 uppercase">Critério de Desempate</h4>
                        <p className="text-xs sm:text-sm md:text-base text-gray-700">1. Maior número de Campeões</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* CATEGORIAS */}
              {activeInfoSubTab === 5 && (
                <div>
                  <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800 mb-3 sm:mb-5 uppercase">CATEGORIAS</h2>
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-3 sm:p-5 md:p-7 space-y-3 sm:space-y-5">
                    <p className="text-sm sm:text-base md:text-lg leading-relaxed text-gray-700">
                      As divisões seguem os <strong>critérios oficiais de idade e peso adotados pela <span className="italic">CBJJE</span></strong>, assegurando padronização e transparência durante todo o evento.
                    </p>
                    <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-blue-300">
                      <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-800 mb-3 sm:mb-4 uppercase">Faixas Etárias e Divisões</h3>
                      <p className="text-xs sm:text-sm md:text-base text-gray-700 mb-3 sm:mb-4">
                        O campeonato é destinado exclusivamente às <strong>categorias de base</strong>, compreendendo atletas com idade entre <strong>04 e 16 anos</strong>, distribuídos da seguinte forma:
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-sm sm:text-base md:text-lg text-gray-700 ml-4">
                        <li><strong className="italic">Pré-Mirim</strong></li>
                        <li><strong className="italic">Mirim</strong></li>
                        <li><strong className="italic">Infantil</strong></li>
                        <li><strong className="italic">Infanto-Juvenil</strong></li>
                        <li><strong className="italic">Juvenil</strong></li>
                      </ul>
                    </div>
                    <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-blue-300">
                      <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-800 mb-3 sm:mb-4 uppercase">Faixas</h3>
                      <p className="text-xs sm:text-sm md:text-base text-gray-700">
                        As lutas serão separadas conforme as <strong>graduações oficiais da <span className="italic">CBJJ</span></strong>, respeitando o nível técnico e a idade de cada competidor.
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-blue-300">
                      <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-800 mb-3 sm:mb-4 uppercase">Categorias de Peso</h3>
                      <p className="text-xs sm:text-sm md:text-base text-gray-700">
                        As divisões de peso seguem a <strong>tabela oficial da <span className="italic">CBJJE</span></strong>, considerando o peso <strong>com kimono</strong> no momento da pesagem.
                      </p>
                    </div>
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 sm:p-6 rounded-xl">
                      <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-800 mb-3 sm:mb-4 uppercase">Atenção</h3>
                      <ul className="list-disc list-inside space-y-2 text-sm sm:text-base md:text-lg text-gray-700 ml-4">
                        <li>As faixas até 15 anos serão agrupadas da seguinte forma: <strong className="italic">Brancas/Cinza</strong> e <strong className="italic">Amarela/Laranja/Verde</strong> como <strong className="italic">Coloridas</strong></li>
                        <li>A <strong>idade é calculada pelo ano de nascimento</strong>. Exemplo: (ano atual – ano nascimento) = 2025 – 2016 = 9 anos, independente do mês de aniversário. Se o atleta faz aniversário em janeiro considera 9 anos, se o atleta fará aniversário em dezembro também será considerado 9 anos.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* ABSOLUTO */}
              {activeInfoSubTab === 6 && (
                <div>
                  <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800 mb-3 sm:mb-5 uppercase">ABSOLUTO</h2>
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-3 sm:p-5 md:p-7 space-y-3 sm:space-y-5">
                    <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-blue-300">
                      <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-800 mb-3 sm:mb-4 uppercase">Critérios de Participação</h3>
                      <ul className="list-disc list-inside space-y-2 text-sm sm:text-base md:text-lg text-gray-700 ml-4">
                        <li>Poderão participar <strong>somente os atletas campeões de suas respectivas categorias de peso</strong>.</li>
                        <li>O Absoluto será <strong>dividido por faixas e idades compatíveis</strong>, de modo a manter o equilíbrio técnico e a segurança dos competidores.</li>
                        <li>O atleta deverá confirmar sua participação <strong>imediatamente após o término de sua categoria de peso</strong>, junto à mesa organizadora.</li>
                      </ul>
                    </div>
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 sm:p-6 rounded-xl">
                      <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-800 mb-3 sm:mb-4 uppercase">Observações Importantes</h3>
                      <ul className="list-disc list-inside space-y-2 text-sm sm:text-base md:text-lg text-gray-700 ml-4">
                        <li>O <strong>peso do atleta no Absoluto será livre</strong>, respeitando apenas a faixa e categoria de idade.</li>
                        <li>A <strong>premiação do Absoluto</strong> será entregue <strong>somente se houver no mínimo 04 (quatro) atletas inscritos</strong> na respectiva divisão.</li>
                        <li><strong>Não haverá pontuação por equipe</strong> referente às disputas do Absoluto.</li>
                        <li>O atleta deverá estar <strong>disponível e atento à chamada de sua categoria</strong>, sob pena de <strong>eliminação por ausência (WO)</strong>.</li>
                      </ul>
                    </div>
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 sm:p-6 rounded-xl">
                      <p className="text-sm sm:text-base md:text-lg leading-relaxed text-gray-700">
                        O Absoluto é uma categoria especial que proporciona aos jovens atletas a experiência de <strong>testar seus limites além das divisões de peso</strong>, promovendo o espírito de superação e o verdadeiro propósito do jiu-jitsu: <strong>crescimento técnico e pessoal através do desafio</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* CHECAGEM */}
              {activeInfoSubTab === 7 && (
                <div>
                  <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800 mb-3 sm:mb-5 uppercase">CHECAGEM</h2>
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-3 sm:p-5 md:p-7">
                    <div className="space-y-4 text-sm sm:text-base md:text-lg leading-relaxed text-gray-700">
                      <p>
                        A checagem será <strong>realizada exclusivamente de forma online</strong>, através da página oficial do evento no site.
                      </p>
                      <p>
                        O período de checagem estará <strong>disponível logo após o encerramento das inscrições</strong>, dentro do prazo estipulado pela organização.
                      </p>
                      <p>
                        Durante este período, os <strong>professores e responsáveis pelas equipes</strong> deverão verificar cuidadosamente os <strong>nomes, idades, categorias, faixas e pesos</strong> dos atletas inscritos.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* CHAVES */}
              {activeInfoSubTab === 8 && (
                <div>
                  <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800 mb-3 sm:mb-5 uppercase">CHAVES</h2>
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-3 sm:p-5 md:p-7">
                    <div className="space-y-4 text-sm sm:text-base md:text-lg leading-relaxed text-gray-700 mb-4 sm:mb-6">
                      <p>
                        As chaves serão <strong>divulgadas oficialmente no site</strong>, após o encerramento da checagem e da conferência final de todos os dados.
                      </p>
                      <p>
                        Recomenda-se que <strong>professores, atletas e responsáveis</strong> acompanhem atentamente a publicação, verificando o <strong>horário e a ordem aproximada das lutas</strong>.
                      </p>
                    </div>
                    
                    {/* Exemplo de uso do ResponsiveIframe para visualização de chaves/brackets */}
                    {/* 
                    <div className="mt-6">
                      <ResponsiveIframe
                        src="URL_DO_IFRAME_DAS_CHAVES_AQUI"
                        title="Visualização das Chaves do Evento"
                        aspectRatio="16:9"
                        className="rounded-lg shadow-lg"
                      />
                    </div>
                    */}
                  </div>
                </div>
              )}

              {/* PESAGEM */}
              {activeInfoSubTab === 9 && (
                <div>
                  <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800 mb-3 sm:mb-5 uppercase">PESAGEM</h2>
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-3 sm:p-5 md:p-7 space-y-3 sm:space-y-5">
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 sm:p-6 rounded-xl">
                      <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-800 mb-2 sm:mb-3 uppercase">Na Pesagem é Indispensável o Uso do Kimono</h3>
                      <p className="text-xs sm:text-sm md:text-base text-gray-700">
                        A pesagem será realizada <strong>com o kimono</strong>, seguindo os padrões oficiais da <span className="italic">CBJJE</span>.
                      </p>
                    </div>
                    <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-blue-300">
                      <p className="text-xs sm:text-sm md:text-base text-gray-700 mb-3 sm:mb-4">
                        O atleta deve estar dentro da faixa de peso da categoria escolhida no momento da pesagem.
                      </p>
                      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-xl">
                        <p className="text-2xl font-semibold text-gray-800 mb-2 uppercase">IMPORTANTE:</p>
                        <p className="text-xs sm:text-sm md:text-base text-gray-700">
                          A idade é calculada pelo ano de nascimento. Exemplo: (ano atual – ano nascimento) = 2025 – 2016 = 9 anos, independente do mês de aniversário. Se o atleta faz aniversário em janeiro considera 9 anos, se o atleta fará aniversário em dezembro será considerado com 9 anos igualmente mesmo que não tenha feito o aniversário ainda.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* REGRAS */}
              {activeInfoSubTab === 10 && (
                <div>
                  <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800 mb-3 sm:mb-5 uppercase">FISCALIZAÇÃO E REGRAS</h2>
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-3 sm:p-5 md:p-7 space-y-3 sm:space-y-5">
                    <p className="text-sm sm:text-base md:text-lg leading-relaxed text-gray-700">
                      Como o nosso objetivo é sempre fazer um bom campeonato e bem organizado, para a competição, <strong className="uppercase">NÃO será permitido</strong>:
                    </p>
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 sm:p-6 rounded-xl">
                      <ul className="list-disc list-inside space-y-2 text-sm sm:text-base md:text-lg text-gray-700 ml-4">
                        <li><span className="italic">Kimono</span> sujo</li>
                        <li>Manga mais curta do que o recomendado</li>
                        <li>Calça curta</li>
                        <li><span className="italic">Faixa</span> ou <span className="italic">Kimono</span> rasgada</li>
                      </ul>
                    </div>
                    <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-blue-300">
                      <p className="text-xs sm:text-sm md:text-base text-gray-700 mb-3 sm:mb-4">
                        O competidor que se encontrar em uma dessas situações terá um tempo para troca do <span className="italic">kimono</span>, senão será automaticamente desclassificado da competição sem direito a recorrer.
                      </p>
                      <p className="text-xs sm:text-sm md:text-base text-gray-700">
                        As regras do torneio são as estabelecidas pela <strong className="uppercase">ORGANIZAÇÃO DO EVENTO</strong>. Salvo as regras de arbitragem que segue a <span className="italic">CBJJ</span> podem ser visualizadas no site www.cbjj.com.br.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* DIREITO DE IMAGEM */}
              {activeInfoSubTab === 11 && (
                <div>
                  <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800 mb-3 sm:mb-5 uppercase">DIREITO DE IMAGEM</h2>
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-3 sm:p-5 md:p-7 space-y-3">
                    <p className="text-sm sm:text-base md:text-lg leading-relaxed text-gray-700">
                      Ao realizar a inscrição na <strong className="uppercase">1ª COPA GRÊMIO INDUSTRIAL KIDS DE JIU-JITSU</strong>, o atleta e seus responsáveis legais <strong>autorizam, de forma automática e irrevogável</strong>, o uso de sua <strong>imagem, voz e nome</strong> para fins de <strong>divulgação institucional e promocional</strong> do evento.
                    </p>
                    <p className="text-sm sm:text-base md:text-lg leading-relaxed text-gray-700">
                      Essa autorização inclui a <strong>captação, reprodução e publicação</strong> de fotos, vídeos e demais registros audiovisuais realizados durante o evento, podendo ser utilizados pela <strong>organização, patrocinadores e parceiros oficiais</strong>, em mídias sociais, websites, materiais impressos, televisivos e demais meios de comunicação.
                    </p>
                    <p className="text-sm sm:text-base md:text-lg leading-relaxed text-gray-700">
                      A utilização do material será feita <strong>sem ônus financeiro</strong> para qualquer das partes, tendo caráter <strong>exclusivamente informativo, esportivo e promocional</strong>, respeitando sempre a <strong>ética, a integridade e a boa imagem dos participantes</strong>.
                    </p>
                    <p className="text-sm sm:text-base md:text-lg leading-relaxed text-gray-700">
                      Os responsáveis legais, ao confirmarem a inscrição do atleta, <strong>concordam plenamente com os termos deste regulamento</strong>, não cabendo qualquer tipo de reivindicação futura referente ao uso de imagem vinculado ao evento.
                    </p>
                    <p className="text-sm sm:text-base md:text-lg leading-relaxed text-gray-700">
                      Esta cláusula tem como finalidade <strong>preservar a transparência e o profissionalismo</strong> da competição, garantindo o direito da organização de <strong>registrar e divulgar</strong> os momentos marcantes desta celebração do jiu-jitsu infantil.
                    </p>
                  </div>
                </div>
              )}

              {/* DECLARAÇÃO DE SAÚDE */}
              {activeInfoSubTab === 12 && (
                <div>
                  <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-800 mb-3 sm:mb-5 uppercase">DECLARAÇÃO DE SAÚDE</h2>
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-3 sm:p-5 md:p-7 space-y-3 sm:space-y-5">
                    <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-blue-300">
                      <p className="text-xs sm:text-sm md:text-base leading-relaxed text-gray-700 mb-3 sm:mb-4">
                        A participação no evento implica que o atleta está <strong>em plenas condições de saúde</strong>, devidamente <strong>autorizado por seus responsáveis legais</strong> e liberado para a prática esportiva.
                      </p>
                      <p className="text-xs sm:text-sm md:text-base leading-relaxed text-gray-700 mb-3 sm:mb-4">
                        É de responsabilidade dos <strong>professores e responsáveis</strong> assegurar que o atleta esteja <strong>preparado física e psicologicamente</strong> para competir, respeitando seus limites individuais.
                      </p>
                      <p className="text-sm sm:text-base md:text-lg leading-relaxed text-gray-700">
                        A organização recomenda que todos os atletas estejam com <strong>exames médicos e avaliações físicas atualizadas</strong>, garantindo uma participação segura.
                      </p>
                    </div>
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 sm:p-6 rounded-xl">
                      <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-800 mb-3 sm:mb-4 uppercase">Atendimento Médico</h3>
                      <p className="text-xs sm:text-sm md:text-base text-gray-700">
                        Durante todo o evento haverá <strong>equipe médica e paramédica de plantão</strong>, apta a prestar atendimento imediato em casos de lesão, mal-estar ou qualquer situação emergencial.
                      </p>
                      <p className="text-sm sm:text-base md:text-lg text-gray-700 mt-3 sm:mt-4">
                        Caso seja constatada qualquer condição que coloque em risco a saúde do atleta, a equipe médica poderá <strong>impedir sua continuidade na competição</strong>, visando sua segurança e bem-estar.
                      </p>
                    </div>
                    <div className="bg-green-50 border-l-4 border-green-400 p-4 sm:p-6 rounded-xl">
                      <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-800 mb-3 sm:mb-4 uppercase">Conduta e Segurança</h3>
                      <p className="text-xs sm:text-sm md:text-base text-gray-700">
                        A organização reforça que <strong>golpes ilegais, atitudes antidesportivas ou condutas perigosas</strong> não serão toleradas e poderão resultar em <strong>desclassificação imediata</strong> do atleta.
                      </p>
                      <p className="text-sm sm:text-base md:text-lg text-gray-700 mt-3 sm:mt-4">
                        A integridade e o respeito são princípios fundamentais do jiu-jitsu. Assim, o evento prioriza um ambiente <strong>seguro, educativo e responsável</strong>, em que cada atleta possa expressar seu talento com <strong>disciplina, respeito e espírito esportivo</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 1 ? (
          /* Aba: INSCRIÇÕES - sem container duplo */
          <RegistrationWizard eventId={eventId} />
        ) : activeTab === 2 ? (
          /* Aba: ATLETAS INSCRITOS - sem container duplo */
          <RegisteredAthletesContent eventId={eventId} />
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            {/* Aba: TABELA DE PESO */}
            {activeTab === 3 && (
              <WeightTableContent eventId={eventId} />
            )}

            {/* Aba: FINANCEIRO */}
            {activeTab === 4 && (
              <FinancialContent eventId={eventId} />
            )}
          </div>
        )}
      </section>
    </div>
  )
}

