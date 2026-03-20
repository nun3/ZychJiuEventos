'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, MapPin, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface EventModalProps {
  event: {
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
  } | null
  isOpen: boolean
  onClose: () => void
}

export default function EventModal({ event, isOpen, onClose }: EventModalProps) {
  if (!event) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-50 backdrop-blur-sm"
          />

          {/* Modal - Estilo Netflix - Tamanho Maior */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-4xl bg-gray-900 rounded-lg overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Imagem grande no topo - Estilo Netflix - Responsivo */}
              <div className="relative h-[40vh] sm:h-[45vh] md:h-[50vh] min-h-[200px] sm:min-h-[250px] md:min-h-[300px] max-h-[400px] sm:max-h-[450px] md:max-h-[500px] bg-gradient-to-br from-primary-dark via-primary-blue to-primary-accent overflow-hidden">
                {event.image ? (
                  <>
                    <div className="absolute inset-0">
                      <Image
                        src={event.image}
                        alt={event.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                        priority
                      />
                    </div>
                    {/* Gradiente inferior para legibilidade */}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent" />
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-800" />
                )}

                {/* Botão fechar - Estilo Netflix (X branco em círculo) - Maior */}
                <button
                  onClick={onClose}
                  className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all z-20"
                  aria-label="Fechar"
                >
                  <X size={24} strokeWidth={2.5} />
                </button>

                {/* Título sobre a imagem - Estilo Netflix - Responsivo */}
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-5 lg:p-6 z-10">
                  <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2 md:mb-3 drop-shadow-2xl">
                    {event.title}
                  </h2>
                </div>
              </div>

              {/* Conteúdo abaixo da imagem - Estilo Netflix - Responsivo */}
              <div className="p-4 sm:p-5 md:p-6 lg:p-8 bg-gray-900">
                {/* Tags/Metadados - Estilo Netflix - Responsivo */}
                <div className="flex flex-wrap gap-2 sm:gap-2 md:gap-3 mb-3 sm:mb-4 md:mb-5">
                  <span className="px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 bg-gray-800/80 text-gray-300 rounded text-xs sm:text-sm md:text-base font-medium">
                    {new Date().getFullYear()}
                  </span>
                  <span className="px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 bg-gray-800/80 text-gray-300 rounded text-xs sm:text-sm md:text-base font-medium">
                    {event.type}
                  </span>
                  <span className="px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 bg-gray-800/80 text-gray-300 rounded text-xs sm:text-sm md:text-base font-medium">
                    {event.daysLeft} {event.daysLeft === 1 ? 'dia' : 'dias'} restantes
                  </span>
                  <span className="px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 bg-gray-800/80 text-gray-300 rounded text-xs sm:text-sm md:text-base font-medium flex items-center gap-1 sm:gap-2">
                    <Calendar size={14} className="sm:w-[16px] sm:h-[16px] md:w-[18px] md:h-[18px]" />
                    {event.date}
                  </span>
                  <span className="px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 bg-gray-800/80 text-gray-300 rounded text-xs sm:text-sm md:text-base font-medium flex items-center gap-1 sm:gap-2">
                    <MapPin size={14} className="sm:w-[16px] sm:h-[16px] md:w-[18px] md:h-[18px]" />
                    {event.location}
                  </span>
                </div>

                {/* Descrição/Sinopse - Estilo Netflix - Responsivo */}
                {event.description && (
                  <p className="text-white text-xs sm:text-sm md:text-base leading-relaxed mb-3 sm:mb-4 md:mb-5 max-w-3xl">
                    {event.description}
                  </p>
                )}

                {/* Botão principal - Estilo Netflix (vermelho/azul grande) - Responsivo */}
                <div className="flex items-center gap-4">
                  <Link
                    href={`/eventos/${event.id}`}
                    className="inline-flex items-center gap-2 sm:gap-2 md:gap-3 bg-primary-blue hover:bg-blue-600 text-white font-bold py-2 px-4 sm:py-2.5 sm:px-5 md:py-3 md:px-8 rounded text-xs sm:text-sm md:text-base transition-colors"
                    onClick={onClose}
                  >
                    Ver Detalhes Completos
                    <ArrowRight size={16} className="sm:w-[18px] sm:h-[18px] md:w-[20px] md:h-[20px] lg:w-[24px] lg:h-[24px]" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

