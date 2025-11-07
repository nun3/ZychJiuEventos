'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'

const slides = [
  {
    id: 1,
    title: 'Campeonatos, Cursos, Seminários, Workshops ou Camp',
    subtitle: 'Pensou em fazer um evento?',
    description: 'O Zych é a solução ideal para você.',
    cta: 'Clique AQUI e confira!',
    image: '/images/hero-1.jpg',
  },
  {
    id: 2,
    title: 'Deixe a Adrenalina para a Luta',
    subtitle: 'O ZYCH é a maior plataforma para organização de campeonato de lutas do Brasil.',
    description: '',
    cta: 'Confira nossos eventos',
    image: '/images/hero-2.jpg',
  },
  {
    id: 3,
    title: 'Seu Evento On-line',
    subtitle: 'Melhores recursos e funcionalidades para organizadores e atletas.',
    description: '',
    cta: 'Comece agora',
    image: '/images/hero-3.jpg',
  },
]

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  return (
    <section className="relative h-[500px] md:h-[600px] overflow-hidden bg-gradient-to-r from-primary-dark to-primary-red">
      {/* Slides */}
      <div className="relative h-full">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="absolute inset-0 bg-black/40 z-10" />
            <div className="container mx-auto px-4 h-full flex items-center justify-center relative z-20">
              <div className="text-center text-white max-w-4xl">
                <h1 className="text-3xl md:text-5xl font-bold mb-4">
                  {slide.title}
                </h1>
                {slide.subtitle && (
                  <p className="text-xl md:text-2xl mb-4">{slide.subtitle}</p>
                )}
                {slide.description && (
                  <p className="text-lg md:text-xl mb-6">{slide.description}</p>
                )}
                <Link
                  href="/eventos"
                  className="inline-block px-8 py-3 bg-primary-orange text-white font-bold rounded-lg hover:bg-orange-600 transition text-lg"
                >
                  {slide.cta}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navegação */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition"
        aria-label="Slide anterior"
      >
        <FiChevronLeft size={24} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition"
        aria-label="Próximo slide"
      >
        <FiChevronRight size={24} />
      </button>

      {/* Indicadores */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition ${
              index === currentSlide
                ? 'bg-primary-orange w-8'
                : 'bg-white/50 hover:bg-white/75'
            }`}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  )
}

