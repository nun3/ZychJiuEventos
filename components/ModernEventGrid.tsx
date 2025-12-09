'use client'

import { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import NetflixEventCard from './NetflixEventCard'
import EventModal from './EventModal'

// Tipo para os eventos
export interface Event {
  id: number
  title: string
  type: string
  date: string
  dateFull: string
  location: string
  daysLeft: number
  image?: string
  description?: string
  organizer?: {
    name: string
    email: string
    phone: string
  }
  eventType?: string // Tipo específico: 'Campeonato', 'Seminário', etc.
  sport?: string // Esporte específico: 'Jiu-Jitsu', 'Judo', etc.
  state?: string // Estado: 'SC', 'MG', etc.
  dateObj?: Date // Data como objeto Date para comparação
}

// Dados mockados - muitos eventos para o carousel
const mockEvents: Event[] = [
  {
    id: 1,
    title: '2ª Copa Internacional Tri Fronteira',
    type: 'Campeonato Jiu-Jitsu',
    eventType: 'Campeonato',
    sport: 'Jiu-Jitsu',
    state: 'SC - Santa Catarina',
    date: '09 de Novembro',
    dateFull: '09/11/2025',
    dateObj: new Date('2025-11-09'),
    location: 'Dionísio Cerqueira/SC',
    daysLeft: 3,
    image: '/images/2-festival-kids-2025.png',
    description: 'Um campeonato internacional de Jiu-Jitsu que reúne atletas de três países na fronteira. Venha participar desta competição única!',
    organizer: {
      name: 'Organização Meu Camp',
      email: 'contato@meucamp.com.br',
      phone: '(27) 99945-0345',
    },
  },
  {
    id: 2,
    title: '11ª Copa Espera Feliz de Jiu-Jitsu',
    type: 'Campeonato Jiu-Jitsu',
    eventType: 'Campeonato',
    sport: 'Jiu-Jitsu',
    state: 'MG - Minas Gerais',
    date: '09 de Novembro',
    dateFull: '09/11/2025',
    dateObj: new Date('2025-11-09'),
    location: 'Espera Feliz/MG',
    daysLeft: 3,
    description: 'A maior competição de Jiu-Jitsu de Minas Gerais. Participe e mostre seu talento!',
  },
  {
    id: 3,
    title: '2ª Copa Seven bjj',
    type: 'Campeonato Jiu-Jitsu',
    eventType: 'Campeonato',
    sport: 'Jiu-Jitsu',
    state: 'SC - Santa Catarina',
    date: '15 de Novembro',
    dateFull: '15/11/2025',
    dateObj: new Date('2025-11-15'),
    location: 'Palhoça/SC',
    daysLeft: 9,
    description: 'Competição estadual com atletas de todo Santa Catarina.',
  },
  {
    id: 4,
    title: 'Copa King de Jiu-Jitsu',
    type: 'Campeonato Jiu-Jitsu',
    eventType: 'Campeonato',
    sport: 'Jiu-Jitsu',
    state: 'SC - Santa Catarina',
    date: '16 de Novembro',
    dateFull: '16/11/2025',
    dateObj: new Date('2025-11-16'),
    location: 'Joinville/SC',
    daysLeft: 10,
    description: 'O maior campeonato do norte de Santa Catarina.',
  },
  {
    id: 5,
    title: 'Campeonato Neropolino de Jiu-Jitsu',
    type: 'Campeonato Jiu-Jitsu',
    eventType: 'Campeonato',
    sport: 'Jiu-Jitsu',
    state: 'GO - Goiás',
    date: '16 de Novembro',
    dateFull: '16/11/2025',
    dateObj: new Date('2025-11-16'),
    location: 'Nerópolis Goiás/GO',
    daysLeft: 10,
    description: 'Competição tradicional de Goiás reunindo os melhores atletas.',
  },
  {
    id: 6,
    title: '2º Festival Kids de Jiu-Jitsu',
    type: 'Campeonato Jiu-Jitsu',
    eventType: 'Campeonato',
    sport: 'Jiu-Jitsu',
    state: 'PR - Paraná',
    date: '16 de Novembro',
    dateFull: '16/11/2025',
    dateObj: new Date('2025-11-16'),
    location: 'Clevelândia/PR',
    daysLeft: 10,
    image: '/images/2-festival-kids-2025.png',
    description: 'Festival dedicado exclusivamente para atletas mirins. Uma experiência única para os pequenos lutadores!',
  },
  {
    id: 7,
    title: 'Campeonato Regional de Jiu-Jitsu',
    type: 'Campeonato Jiu-Jitsu',
    eventType: 'Campeonato',
    sport: 'Jiu-Jitsu',
    state: 'PR - Paraná',
    date: '23 de Novembro',
    dateFull: '23/11/2025',
    dateObj: new Date('2025-11-23'),
    location: 'Curitiba/PR',
    daysLeft: 17,
    description: 'Competição regional com participação de várias academias do Paraná.',
  },
  {
    id: 8,
    title: '3ª Copa Estadual de Jiu-Jitsu',
    type: 'Campeonato Jiu-Jitsu',
    eventType: 'Campeonato',
    sport: 'Jiu-Jitsu',
    state: 'SC - Santa Catarina',
    date: '30 de Novembro',
    dateFull: '30/11/2025',
    dateObj: new Date('2025-11-30'),
    location: 'Florianópolis/SC',
    daysLeft: 24,
    description: 'A maior competição estadual de Santa Catarina.',
  },
  {
    id: 9,
    title: 'Campeonato Nacional de Jiu-Jitsu',
    type: 'Campeonato Jiu-Jitsu',
    eventType: 'Campeonato',
    sport: 'Jiu-Jitsu',
    state: 'SP - São Paulo',
    date: '07 de Dezembro',
    dateFull: '07/12/2025',
    dateObj: new Date('2025-12-07'),
    location: 'São Paulo/SP',
    daysLeft: 31,
    description: 'O maior campeonato nacional do ano. Não perca!',
  },
  {
    id: 10,
    title: 'Copa Interestadual Sul',
    type: 'Campeonato Jiu-Jitsu',
    eventType: 'Campeonato',
    sport: 'Jiu-Jitsu',
    state: 'RS - Rio Grande do Sul',
    date: '14 de Dezembro',
    dateFull: '14/12/2025',
    dateObj: new Date('2025-12-14'),
    location: 'Porto Alegre/RS',
    daysLeft: 38,
    description: 'Competição que reúne atletas de SC, PR e RS.',
  },
  {
    id: 11,
    title: 'Copa Master de Jiu-Jitsu',
    type: 'Campeonato Jiu-Jitsu',
    eventType: 'Campeonato',
    sport: 'Jiu-Jitsu',
    state: 'MG - Minas Gerais',
    date: '21 de Dezembro',
    dateFull: '21/12/2025',
    dateObj: new Date('2025-12-21'),
    location: 'Belo Horizonte/MG',
    daysLeft: 45,
    description: 'Exclusivo para atletas master. Uma competição especial para veteranos.',
  },
  {
    id: 12,
    title: 'Campeonato Feminino de Jiu-Jitsu',
    type: 'Campeonato Jiu-Jitsu',
    eventType: 'Campeonato',
    sport: 'Jiu-Jitsu',
    state: 'RJ - Rio de Janeiro',
    date: '28 de Dezembro',
    dateFull: '28/12/2025',
    dateObj: new Date('2025-12-28'),
    location: 'Rio de Janeiro/RJ',
    daysLeft: 52,
    description: 'Competição exclusiva para mulheres. Empoderamento através do esporte.',
  },
  {
    id: 13,
    title: 'Copa de Inverno de Jiu-Jitsu',
    type: 'Campeonato Jiu-Jitsu',
    eventType: 'Campeonato',
    sport: 'Jiu-Jitsu',
    state: 'DF - Distrito Federal',
    date: '04 de Janeiro',
    dateFull: '04/01/2026',
    dateObj: new Date('2026-01-04'),
    location: 'Brasília/DF',
    daysLeft: 59,
    description: 'Inicie o ano com uma competição de alto nível na capital federal.',
  },
  {
    id: 14,
    title: 'Campeonato Litoral de Jiu-Jitsu',
    type: 'Campeonato Jiu-Jitsu',
    eventType: 'Campeonato',
    sport: 'Jiu-Jitsu',
    state: 'SC - Santa Catarina',
    date: '11 de Janeiro',
    dateFull: '11/01/2026',
    dateObj: new Date('2026-01-11'),
    location: 'Florianópolis/SC',
    daysLeft: 66,
    description: 'Competição à beira-mar com vista deslumbrante.',
  },
  {
    id: 15,
    title: 'Copa Metropolitana de Jiu-Jitsu',
    type: 'Campeonato Jiu-Jitsu',
    eventType: 'Campeonato',
    sport: 'Jiu-Jitsu',
    state: 'PR - Paraná',
    date: '18 de Janeiro',
    dateFull: '18/01/2026',
    dateObj: new Date('2026-01-18'),
    location: 'Curitiba/PR',
    daysLeft: 73,
    description: 'A maior competição da região metropolitana.',
  },
]

interface FilterState {
  eventType: string
  sport: string
  state: string
  search: string
  period: string
  startDate: string
  endDate: string
}

interface NetflixCarouselProps {
  events: Event[]
  onEventClick: (event: Event) => void
}

// Função para filtrar eventos
export function filterEvents(events: Event[], filters: FilterState): Event[] {
  return events.filter((event) => {
    // Filtro por tipo de evento
    if (filters.eventType !== 'Todos' && event.eventType !== filters.eventType) {
      return false
    }

    // Filtro por esporte
    if (filters.sport !== 'Todas' && event.sport !== filters.sport) {
      return false
    }

    // Filtro por estado
    if (filters.state !== 'Todos' && event.state !== filters.state) {
      return false
    }

    // Filtro por busca de texto
    if (filters.search && !event.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }

    // Filtro por período
    if (filters.period !== 'todos' && event.dateObj) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const eventDate = new Date(event.dateObj)
      eventDate.setHours(0, 0, 0, 0)

      switch (filters.period) {
        case 'este-mes':
          if (eventDate.getMonth() !== today.getMonth() || eventDate.getFullYear() !== today.getFullYear()) {
            return false
          }
          break
        case 'proximo-mes':
          const nextMonth = new Date(today)
          nextMonth.setMonth(nextMonth.getMonth() + 1)
          if (eventDate.getMonth() !== nextMonth.getMonth() || eventDate.getFullYear() !== nextMonth.getFullYear()) {
            return false
          }
          break
        case 'este-ano':
          if (eventDate.getFullYear() !== today.getFullYear()) {
            return false
          }
          break
        case 'proximo-ano':
          if (eventDate.getFullYear() !== today.getFullYear() + 1) {
            return false
          }
          break
      }
    }

    // Filtro por data específica (range)
    if (filters.startDate && event.dateObj) {
      const startDate = new Date(filters.startDate)
      startDate.setHours(0, 0, 0, 0)
      const eventDate = new Date(event.dateObj)
      eventDate.setHours(0, 0, 0, 0)
      if (eventDate < startDate) {
        return false
      }
    }

    if (filters.endDate && event.dateObj) {
      const endDate = new Date(filters.endDate)
      endDate.setHours(23, 59, 59, 999)
      const eventDate = new Date(event.dateObj)
      eventDate.setHours(0, 0, 0, 0)
      if (eventDate > endDate) {
        return false
      }
    }

    return true
  })
}

function NetflixCarouselRow({ events, onEventClick }: NetflixCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    
    // Largura do card (460px) + gap entre cards (24px gap-6)
    const cardWidth = 460 + 24 // 484px por card completo com espaçamento
    const containerWidth = scrollRef.current.clientWidth
    const maxScroll = scrollRef.current.scrollWidth - containerWidth
    const currentScroll = scrollRef.current.scrollLeft
    
    let newScrollLeft: number
    
    if (direction === 'right') {
      // Avançar: mostra do card 5 ao 10 (mantém o card 6 como transição)
      // Scroll de 4 cards para mostrar 5-10
      const scrollAmount = cardWidth * 4
      newScrollLeft = currentScroll + scrollAmount
      
      // Se ultrapassar o máximo, vai direto para o final
      if (newScrollLeft > maxScroll) {
        newScrollLeft = maxScroll
      }
    } else {
      // Voltar: mostra do card 1 ao 6
      const scrollAmount = cardWidth * 4
      newScrollLeft = currentScroll - scrollAmount
      
      // Se for menor que 0, vai direto para o início
      if (newScrollLeft < 0) {
        newScrollLeft = 0
        // Forçar botão esquerdo a desaparecer imediatamente
        setShowLeftArrow(false)
      }
    }
    
    scrollRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth',
    })
    
    // Atualizar os botões imediatamente
    handleScroll()
    
    // Atualizar novamente após o scroll terminar para garantir
    setTimeout(() => {
      handleScroll()
      // Verificação extra: se scrollLeft for 0, forçar botão esquerdo a desaparecer
      if (scrollRef.current && scrollRef.current.scrollLeft <= 20) {
        setShowLeftArrow(false)
      }
    }, 400)
  }

  const handleScroll = () => {
    if (!scrollRef.current) return
    
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    const maxScroll = scrollWidth - clientWidth
    const tolerance = 10 // Margem de tolerância para detectar início/fim
    
    // Botão esquerdo: desaparece quando está no início (scrollLeft <= tolerance)
    const isAtStart = scrollLeft <= tolerance
    setShowLeftArrow(!isAtStart)
    
    // Botão direito: desaparece quando está no final (scrollLeft >= maxScroll - tolerance)
    const isAtEnd = scrollLeft >= maxScroll - tolerance || maxScroll <= 0
    setShowRightArrow(!isAtEnd)
  }

  useEffect(() => {
    // Garantir que o scroll comece na posição 0 e o botão esquerdo esteja oculto
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0
      setShowLeftArrow(false)
    }
    
    // Pequeno delay para garantir que o DOM está pronto
    setTimeout(() => {
      handleScroll()
    }, 100)
    
    const container = scrollRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      window.addEventListener('resize', handleScroll)
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll)
      }
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  return (
    <div className="mb-16 relative group w-full" style={{ overflow: 'visible' }}>
      <div className="relative group/netflix-row w-full mt-8" style={{ overflow: 'visible', zIndex: 1, position: 'relative', paddingTop: '100px', paddingBottom: '150px', marginTop: 'calc(-100px + 2rem)' }}>
        {/* Container de Scroll - Layout horizontal fixo estilo Netflix - Largura total */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-3 sm:gap-4 md:gap-5 lg:gap-6 overflow-x-auto overflow-y-visible hide-scrollbar scroll-smooth py-4 sm:py-5 md:py-6 netflix-carousel-container"
          style={{
            scrollSnapType: 'x proximity',
            scrollPaddingLeft: isMobile ? '16px' : '85px',
            scrollPaddingRight: isMobile ? '16px' : '85px',
            flexWrap: 'nowrap',
            width: isMobile ? '100vw' : '98vw',
            marginLeft: isMobile ? 'calc(-50vw + 50%)' : 'calc(-49vw + 50%)',
            paddingLeft: isMobile ? '16px' : 'max(32px, calc((100vw - 1600px) / 2 + 32px))',
            paddingRight: '16px',
            overflowX: 'auto',
            overflowY: 'visible',
          }}
        >
          {events.map((event, index) => (
            <div
              key={event.id}
              className="flex-shrink-0 relative netflix-card-wrapper"
              style={{
                scrollSnapAlign: index === events.length - 1 ? 'end' : 'start',
              }}
            >
              <NetflixEventCard 
                event={event} 
                index={index} 
                onClick={() => onEventClick(event)}
              />
            </div>
          ))}
        </div>

        {/* Seta Esquerda - Estilo Netflix simplificado - Centralizada com a div dos cards */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute top-1/2 -translate-y-1/2 z-50 w-14 h-14 rounded-full bg-black/80 hover:bg-black/95 flex items-center justify-center transition-all duration-200 shadow-2xl backdrop-blur-sm"
            style={{
              left: isMobile ? '8px' : 'calc(-49vw + 50% + 32px)',
            }}
            aria-label="Rolar para esquerda"
          >
            <ChevronLeft className="text-white text-2xl" strokeWidth={3} />
          </button>
        )}

        {/* Seta Direita - Estilo Netflix simplificado - Centralizada com a div dos cards */}
        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute top-1/2 -translate-y-1/2 z-50 w-14 h-14 rounded-full bg-black/80 hover:bg-black/95 flex items-center justify-center transition-all duration-200 shadow-2xl backdrop-blur-sm"
            style={{
              right: isMobile ? '8px' : 'calc(-49vw + 50% + 32px)',
            }}
            aria-label="Rolar para direita"
          >
            <ChevronRight className="text-white text-2xl" strokeWidth={3} />
          </button>
        )}
      </div>
    </div>
  )
}

interface FilterState {
  eventType: string
  sport: string
  state: string
  search: string
  period: string
  startDate: string
  endDate: string
}

interface ModernEventGridProps {
  filters?: FilterState
}

export default function ModernEventGrid({ filters }: ModernEventGridProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Filtrar eventos baseado nos filtros
  const filteredEvents = filters
    ? filterEvents(mockEvents, filters)
    : mockEvents

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setTimeout(() => setSelectedEvent(null), 300)
  }

  return (
    <>
      <section className="mt-8">
        {filteredEvents.length > 0 ? (
          <NetflixCarouselRow 
            events={filteredEvents} 
            onEventClick={handleEventClick}
          />
        ) : (
          <div className="text-center py-16">
            <p className="text-xl text-gray-600">Nenhum evento encontrado com os filtros selecionados.</p>
            <p className="text-sm text-gray-500 mt-2">Tente ajustar os filtros para ver mais resultados.</p>
          </div>
        )}
      </section>

      <EventModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  )
}

