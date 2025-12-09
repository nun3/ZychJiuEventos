'use client'

import { motion } from 'framer-motion'
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
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{
        delay: index * 0.05,
        duration: 0.3,
      }}
      className="relative group cursor-pointer flex-shrink-0"
      onClick={onClick}
      whileHover={{ 
        scale: 1.03, 
        zIndex: 50,
        transition: { duration: 0.3, ease: 'easeOut' }
      }}
      style={{ 
        transformOrigin: 'center center',
        willChange: 'transform',
        overflow: 'visible',
      }}
    >
      {/* Card Container - Tamanho responsivo */}
      <div 
        className="relative bg-white rounded-lg border border-gray-200 overflow-hidden transition-all duration-300 shadow-sm hover:border-primary-blue/60 hover:shadow-2xl flex flex-col"
        style={{ 
          width: 'clamp(280px, 90vw, 460px)',
          height: 'clamp(420px, 80vh, 680px)',
          flexShrink: 0,
        }}
      >
        {/* Imagem do Evento no topo */}
        {event.image ? (
          <div className="relative h-48 sm:h-64 md:h-72 lg:h-80 w-full flex-shrink-0 overflow-hidden">
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
          <div className="relative h-48 sm:h-64 md:h-72 lg:h-80 w-full flex-shrink-0 bg-gradient-to-br from-primary-dark to-primary-red" />
        )}

        {/* Badge de ranking (para eventos em alta) - Estilo Netflix Top 10 - Responsivo */}
        {index < 10 && (
          <span 
            aria-hidden="true" 
            className="absolute font-bold tracking-tight z-20 pointer-events-none hidden sm:block"
            style={{ 
              fontSize: 'clamp(80px, 15vw, 160px)',
              lineHeight: '1',
              color: 'rgba(0, 0, 0, 0.08)',
              fontWeight: '900',
              bottom: 'clamp(60px, 15vh, 100px)',
              left: 'clamp(10px, 2vw, 20px)',
              letterSpacing: '-8px',
            }}
          >
            {index + 1}
          </span>
        )}

        {/* Badge de dias restantes - Responsivo */}
        <div className="absolute top-2 right-2 sm:top-4 sm:right-4 md:top-5 md:right-5 px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2.5 bg-primary-blue rounded-md z-20 shadow-lg">
          <span className="text-white text-sm sm:text-base md:text-lg lg:text-xl font-bold">
            {event.daysLeft}d
          </span>
        </div>

        {/* Conteúdo do card - Responsivo */}
        <div className="p-4 sm:p-6 md:p-7 lg:p-8 flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Badge de Categoria - Responsivo */}
          <div className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2.5 lg:px-6 lg:py-3 bg-primary-accent/10 text-primary-accent rounded-lg text-sm sm:text-base md:text-lg lg:text-xl font-medium mb-3 sm:mb-4 md:mb-5 lg:mb-6 w-fit">
            {event.type}
          </div>

          {/* Título do evento - Responsivo */}
          <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-5 lg:mb-7 group-hover:text-primary-blue transition-colors duration-300 line-clamp-2 leading-tight">
            {event.title}
          </h3>

          {/* Informações - Responsivo */}
          <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6 mt-auto">
            <div className="flex items-start gap-2 sm:gap-3 md:gap-4">
              <div className="p-1.5 sm:p-2 md:p-2.5 lg:p-3 bg-primary-blue/10 rounded flex-shrink-0">
                <Calendar size={16} className="sm:w-[18px] sm:h-[18px] md:w-[20px] md:h-[20px] lg:w-[22px] lg:h-[22px] text-primary-blue" />
              </div>
              <span className="text-xs sm:text-sm md:text-base lg:text-xl text-gray-700 leading-relaxed break-words flex-1 line-clamp-1">
                {event.date} - {event.dateFull}
              </span>
            </div>
            <div className="flex items-start gap-2 sm:gap-3 md:gap-4">
              <div className="p-1.5 sm:p-2 md:p-2.5 lg:p-3 bg-primary-accent/10 rounded flex-shrink-0">
                <MapPin size={16} className="sm:w-[18px] sm:h-[18px] md:w-[20px] md:h-[20px] lg:w-[22px] lg:h-[22px] text-primary-accent" />
              </div>
              <span className="text-xs sm:text-sm md:text-base lg:text-xl text-gray-700 leading-relaxed break-words flex-1 line-clamp-1">
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
    </motion.div>
  )
}

