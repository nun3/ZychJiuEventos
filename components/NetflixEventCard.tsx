'use client'

import Image from 'next/image'
import { Calendar, MapPin } from 'lucide-react'

interface EventCardProps {
  event: {
    id: number
    title: string
    type: string
    date: string
    dateFull: string
    location: string
    daysLeft: number
    image?: string
  }
  index: number
  onClick: () => void
}

export default function NetflixEventCard({ event, index, onClick }: EventCardProps) {
  return (
    <div
      className="relative group cursor-pointer w-full h-full"
      onClick={onClick}
      style={{
        overflow: 'visible',
      }}
    >
      {/* Card Container - Tamanho responsivo para grid - Mais quadrado */}
      <div 
        className="relative bg-white rounded-lg border border-gray-200 overflow-hidden transition-all duration-300 shadow-sm hover:border-primary-blue/60 hover:shadow-2xl flex flex-col h-full hover:scale-[1.02]"
        style={{
          minHeight: 'clamp(350px, 45vw, 480px)', // Mais quadrado em todas as telas
        }}
      >
        {/* Imagem do Evento no topo */}
        {event.image ? (
          <div className="relative h-36 sm:h-44 md:h-56 lg:h-64 xl:h-72 w-full flex-shrink-0 overflow-hidden">
            <Image
              src={event.image}
              alt={event.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-300"
              sizes="(max-width: 640px) 280px, (max-width: 1024px) 380px, 460px"
            />
            {/* Overlay gradiente no hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        ) : (
          <div className="relative h-36 sm:h-44 md:h-56 lg:h-64 xl:h-72 w-full flex-shrink-0 bg-gradient-to-br from-primary-blue to-primary-accent" />
        )}


        {/* Badge de dias restantes - Responsivo */}
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 px-2 py-1 sm:px-2.5 sm:py-1 md:px-3 md:py-1.5 bg-primary-blue rounded-md z-20 shadow-lg">
          <span className="text-white text-xs sm:text-sm md:text-base lg:text-lg font-bold">
            {event.daysLeft}d
          </span>
        </div>

        {/* Conteúdo do card - Responsivo */}
        <div className="p-2.5 sm:p-3 md:p-4 lg:p-5 xl:p-6 flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Badge de Categoria - Responsivo */}
          <div className="inline-block px-2 py-1 sm:px-2.5 sm:py-1 md:px-3 md:py-1.5 lg:px-4 lg:py-2 xl:px-5 xl:py-2.5 bg-primary-accent/10 text-primary-accent rounded-lg text-xs sm:text-sm md:text-sm lg:text-base xl:text-lg font-medium mb-1.5 sm:mb-2 md:mb-3 lg:mb-4 xl:mb-5 w-fit">
            {event.type}
          </div>

          {/* Título do evento - Responsivo */}
          <h3 className="text-sm sm:text-base md:text-base lg:text-lg xl:text-xl font-bold text-gray-900 mb-1.5 sm:mb-2 md:mb-3 lg:mb-4 xl:mb-5 group-hover:text-primary-blue transition-colors duration-300 line-clamp-2 leading-tight">
            {event.title}
          </h3>

          {/* Informações - Responsivo */}
          <div className="space-y-1.5 sm:space-y-2 md:space-y-2.5 lg:space-y-3 xl:space-y-4 mt-auto">
            <div className="flex items-start gap-1 sm:gap-1.5 md:gap-2 lg:gap-2.5">
              <div className="p-1 sm:p-1 md:p-1.5 lg:p-2 xl:p-2.5 bg-primary-blue/10 rounded flex-shrink-0">
                <Calendar size={12} className="sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-[18px] lg:h-[18px] xl:w-[20px] xl:h-[20px] text-primary-blue" />
              </div>
              <span className="text-xs sm:text-sm md:text-sm lg:text-base xl:text-lg text-gray-700 leading-relaxed break-words flex-1 line-clamp-1">
                {event.date} - {event.dateFull}
              </span>
            </div>
            <div className="flex items-start gap-1 sm:gap-1.5 md:gap-2 lg:gap-2.5">
              <div className="p-1 sm:p-1 md:p-1.5 lg:p-2 xl:p-2.5 bg-primary-accent/10 rounded flex-shrink-0">
                <MapPin size={12} className="sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-[18px] lg:h-[18px] xl:w-[20px] xl:h-[20px] text-primary-accent" />
              </div>
              <span className="text-xs sm:text-sm md:text-sm lg:text-base xl:text-lg text-gray-700 leading-relaxed break-words flex-1 line-clamp-1">
                {event.location}
              </span>
            </div>
          </div>
        </div>

        {/* Efeito de brilho no hover */}
        <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-blue/5 to-transparent rounded-lg" />
        </div>
      </div>
    </div>
  )
}

