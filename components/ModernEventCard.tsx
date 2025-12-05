'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Calendar, MapPin, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface EventCardProps {
  event: {
    id: number
    title: string
    type: string
    date: string
    dateFull: string
    location: string
    daysLeft: number
  }
  index: number
}

export default function ModernEventCard({ event, index }: EventCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [glowPosition, setGlowPosition] = useState({ x: 50, y: 50 })

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const mouseXSpring = useSpring(x, { stiffness: 500, damping: 100 })
  const mouseYSpring = useSpring(y, { stiffness: 500, damping: 100 })

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['17.5deg', '-17.5deg'])
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-17.5deg', '17.5deg'])

  useEffect(() => {
    const unsubscribeX = mouseXSpring.on('change', (latest) => {
      setGlowPosition((prev) => ({ ...prev, x: (latest + 0.5) * 100 }))
    })
    const unsubscribeY = mouseYSpring.on('change', (latest) => {
      setGlowPosition((prev) => ({ ...prev, y: (latest + 0.5) * 100 }))
    })

    return () => {
      unsubscribeX()
      unsubscribeY()
    }
  }, [mouseXSpring, mouseYSpring])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return

    const rect = cardRef.current.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = mouseX / width - 0.5
    const yPct = mouseY / height - 0.5

    x.set(xPct)
    y.set(yPct)
  }

  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        delay: index * 0.1,
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className="relative group"
    >
      <Link href={`/eventos/${event.id}`}>
        <div className="relative bg-white rounded-2xl p-6 border border-gray-200 hover:border-primary-blue/60 hover:shadow-lg transition-all duration-300 cursor-pointer h-full shadow-sm">
          {/* Corner Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-blue/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          {/* Conteúdo relativo */}
          <div className="relative z-10">
            {/* Badge de Dias */}
            <motion.div
              className="absolute top-4 right-4 px-3 py-1.5 bg-gradient-to-r from-primary-blue to-primary-accent rounded-full text-xs font-bold text-white flex items-center gap-1"
              animate={{
                boxShadow: [
                  '0 0 10px rgba(59, 130, 246, 0.5)',
                  '0 0 20px rgba(59, 130, 246, 0.8)',
                  '0 0 10px rgba(59, 130, 246, 0.5)',
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              {event.daysLeft} {event.daysLeft === 1 ? 'dia' : 'dias'}
            </motion.div>

            {/* Badge de Categoria */}
            <div className="inline-block px-3 py-1 bg-primary-accent/10 text-primary-accent rounded-lg text-xs font-medium mb-4">
              {event.type}
            </div>

            {/* Título */}
            <h3 className="text-xl font-display font-bold text-gray-900 mb-4 group-hover:text-primary-blue transition-all duration-300 line-clamp-2">
              {event.title}
            </h3>

            {/* Informações */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-blue/10 rounded-lg">
                  <Calendar size={18} className="text-primary-blue" />
                </div>
                <span className="text-sm text-gray-600">
                  {event.date} - {event.dateFull}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-accent/10 rounded-lg">
                  <MapPin size={18} className="text-primary-accent" />
                </div>
                <span className="text-sm text-gray-600">{event.location}</span>
              </div>
            </div>

            {/* Botão com seta */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-600 group-hover:text-primary-blue transition-colors">
                Ver detalhes
              </span>
              <motion.div
                className="p-2 bg-primary-blue/20 rounded-lg group-hover:bg-primary-blue/40 transition-colors"
                whileHover={{ x: 5 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <ArrowRight size={18} className="text-primary-blue" />
              </motion.div>
            </div>
          </div>

          {/* Glow Effect que segue o cursor */}
          <motion.div
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
            style={{
              background: `radial-gradient(600px circle at ${glowPosition.x}% ${glowPosition.y}%, rgba(59, 130, 246, 0.1), transparent 40%)`,
            }}
          />
        </div>
      </Link>
    </motion.div>
  )
}

