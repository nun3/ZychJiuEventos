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
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 md:top-5 md:right-5 px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2.5 bg-primary-blue rounded-md z-20 shadow-lg">
          <span className="text-white text-sm sm:text-base md:text-lg lg:text-xl font-bold">
            {event.daysLeft}d
          </span>
        </div>

        {/* Conteúdo do card - Responsivo */}
        <div className="p-3 sm:p-4 md:p-6 lg:p-7 xl:p-8 flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Badge de Categoria - Responsivo */}
          <div className="inline-block px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 lg:px-5 lg:py-2.5 xl:px-6 xl:py-3 bg-primary-accent/10 text-primary-accent rounded-lg text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-medium mb-2 sm:mb-3 md:mb-4 lg:mb-5 xl:mb-6 w-fit">
            {event.type}
          </div>

          {/* Título do evento - Responsivo */}
          <h3 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4 lg:mb-5 xl:mb-7 group-hover:text-primary-blue transition-colors duration-300 line-clamp-2 leading-tight">
            {event.title}
          </h3>

          {/* Informações - Responsivo */}
          <div className="space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-5 xl:space-y-6 mt-auto">
            <div className="flex items-start gap-1.5 sm:gap-2 md:gap-3 lg:gap-4">
              <div className="p-1 sm:p-1.5 md:p-2 lg:p-2.5 xl:p-3 bg-primary-blue/10 rounded flex-shrink-0">
                <Calendar size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-[20px] lg:h-[20px] xl:w-[22px] xl:h-[22px] text-primary-blue" />
              </div>
              <span className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-gray-700 leading-relaxed break-words flex-1 line-clamp-1">
                {event.date} - {event.dateFull}
              </span>
            </div>
            <div className="flex items-start gap-1.5 sm:gap-2 md:gap-3 lg:gap-4">
              <div className="p-1 sm:p-1.5 md:p-2 lg:p-2.5 xl:p-3 bg-primary-accent/10 rounded flex-shrink-0">
                <MapPin size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-[20px] lg:h-[20px] xl:w-[22px] xl:h-[22px] text-primary-accent" />
              </div>
              <span className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-gray-700 leading-relaxed break-words flex-1 line-clamp-1">
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

