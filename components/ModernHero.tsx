'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

const slides = [
  {
    id: 1,
    title: 'Meu Camp',
    subtitle: 'A maior plataforma de eventos de Jiu-Jitsu do Brasil',
    description: 'Organize, participe e gerencie eventos de artes marciais de forma simples e eficiente.',
    cta: 'Explorar Eventos',
    ctaSecondary: 'Criar Evento',
  },
  {
    id: 2,
    title: 'Organize Seu Evento',
    subtitle: 'Ferramentas completas para organizadores',
    description: 'Sistema completo de gestão de eventos, inscrições, chaves e pagamentos em um só lugar.',
    cta: 'Criar Evento',
    ctaSecondary: 'Saiba Mais',
  },
  {
    id: 3,
    title: 'Participe de Campeonatos',
    subtitle: 'Encontre os melhores eventos do Brasil',
    description: 'Descubra campeonatos, cursos, seminários e workshops perto de você.',
    cta: 'Explorar Eventos',
    ctaSecondary: 'Cadastre-se',
  },
]

export default function ModernHero() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  }

  const letterVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 200,
      },
    },
  }

  return (
    <section className="relative min-h-[36vh] sm:min-h-[40vh] flex items-center justify-center overflow-hidden pt-11 sm:pt-14">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/images/home1.png)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
      </div>

      {/* Overlay escuro para melhorar legibilidade */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Content - Carousel */}
      <div className="relative z-10 container mx-auto px-4 sm:px-5 max-w-7xl text-center">
        {slides.map((slide, index) => (
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{
              opacity: index === currentSlide ? 1 : 0,
              y: index === currentSlide ? 0 : 30,
            }}
            transition={{ duration: 0.6 }}
            className={`absolute inset-0 flex flex-col items-center justify-center space-y-2 sm:space-y-3 ${
              index === currentSlide ? 'relative' : 'absolute'
            }`}
          >
            {/* Title */}
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-bold text-white drop-shadow-2xl px-4">
              {slide.title}
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base md:text-lg text-gray-300 font-semibold max-w-3xl mx-auto drop-shadow-lg px-4">
              {slide.subtitle}
            </p>

            {/* Description */}
            {slide.description && (
              <p className="text-xs sm:text-sm text-white/80 max-w-3xl mx-auto drop-shadow-md px-4">
                {slide.description}
              </p>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-2 pt-2 px-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href={slide.cta === 'Explorar Eventos' ? '#eventos' : slide.cta === 'Criar Evento' ? '/admin/autenticacao' : '#eventos'}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2 bg-gradient-to-r from-primary-blue to-primary-accent text-white rounded-lg font-medium text-xs sm:text-sm flex items-center gap-2 hover:shadow-glow-primary transition-all duration-300"
                  onClick={(e) => {
                    if (slide.cta === 'Explorar Eventos') {
                      e.preventDefault()
                      const eventosSection = document.getElementById('eventos')
                      if (eventosSection) {
                        eventosSection.scrollIntoView({ behavior: 'smooth' })
                      }
                    }
                  }}
                >
                  {slide.cta}
                  {slide.cta === 'Explorar Eventos' && <ArrowRight size={14} className="sm:w-4 sm:h-4" />}
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href={slide.ctaSecondary === 'Criar Evento' ? '/admin/autenticacao' : slide.ctaSecondary === 'Cadastre-se' ? '/cadastro' : slide.ctaSecondary === 'Saiba Mais' ? '/sistema' : '/cadastro'}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 md:px-5 md:py-2 bg-white text-primary-blue rounded-lg font-medium text-xs sm:text-sm border-2 border-primary-blue hover:bg-primary-blue hover:text-white transition-all duration-300 shadow-sm"
                >
                  {slide.ctaSecondary}
                </Link>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Indicadores do Carousel */}
      <div className="absolute bottom-10 sm:bottom-14 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'bg-primary-blue w-9 h-3 shadow-lg'
                : 'bg-gray-300 hover:bg-gray-400 w-3 h-3'
            }`}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Linha Decorativa */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent z-20"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
      />

    </section>
  )
}

