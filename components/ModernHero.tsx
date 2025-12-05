'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, ArrowRight } from 'lucide-react'
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
    <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden pt-20 bg-gradient-to-b from-blue-50/30 to-transparent">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-hero opacity-30" />

      {/* Grid Decorativo */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Orbs Flutuantes */}
      <motion.div
        className="absolute top-20 right-20 w-72 h-72 bg-primary-blue rounded-full blur-3xl opacity-20"
        animate={{
          x: mousePosition.x,
          y: mousePosition.y,
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute bottom-20 left-20 w-96 h-96 bg-primary-accent rounded-full blur-3xl opacity-20"
        animate={{
          x: -mousePosition.x * 0.5,
          y: -mousePosition.y * 0.5,
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Content - Carousel */}
      <div className="relative z-10 container mx-auto px-6 text-center">
        {slides.map((slide, index) => (
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{
              opacity: index === currentSlide ? 1 : 0,
              y: index === currentSlide ? 0 : 30,
            }}
            transition={{ duration: 0.6 }}
            className={`absolute inset-0 flex flex-col items-center justify-center space-y-8 ${
              index === currentSlide ? 'relative' : 'absolute'
            }`}
          >
            {/* Title */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold gradient-text">
              {slide.title}
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-700 font-semibold max-w-2xl mx-auto">
              {slide.subtitle}
            </p>

            {/* Description */}
            {slide.description && (
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {slide.description}
              </p>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href={slide.cta === 'Explorar Eventos' ? '#eventos' : slide.cta === 'Criar Evento' ? '/criar-evento' : '#eventos'}
                  className="px-8 py-4 bg-gradient-to-r from-primary-blue to-primary-accent text-white rounded-lg font-medium text-lg flex items-center gap-2 hover:shadow-glow-primary transition-all duration-300"
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
                  {slide.cta === 'Explorar Eventos' && <ArrowRight size={20} />}
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href={slide.ctaSecondary === 'Criar Evento' ? '/criar-evento' : slide.ctaSecondary === 'Cadastre-se' ? '/cadastro' : slide.ctaSecondary === 'Saiba Mais' ? '/sistema' : '/cadastro'}
                  className="px-8 py-4 bg-white text-primary-blue rounded-lg font-medium text-lg border-2 border-primary-blue hover:bg-primary-blue hover:text-white transition-all duration-300 shadow-sm"
                >
                  {slide.ctaSecondary}
                </Link>
              </motion.div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Indicadores do Carousel */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex space-x-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`rounded-full transition-all duration-300 ${
              index === currentSlide
                ? 'bg-primary-blue w-10 h-3 shadow-lg'
                : 'bg-gray-300 hover:bg-gray-400 w-3 h-3'
            }`}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Linha Decorativa */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-blue to-transparent"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
      />

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 0.8 }}
      >
        <span className="text-xs text-gray-400 uppercase tracking-widest">Scroll</span>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <ChevronDown size={20} className="text-gray-400" />
        </motion.div>
      </motion.div>
    </section>
  )
}

