'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'
import { Menu, X } from 'lucide-react'

export default function ModernNavbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const { scrollY } = useScroll()
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setIsScrolled(latest > 50)
  })

  const navLinks = [
    { href: '/', label: 'Início' },
    { href: '/eventos', label: 'Eventos' },
    { href: '/academias', label: 'Academias' },
    { href: '/sistema', label: 'Sistema' },
    { href: '/quem-somos', label: 'Sobre' },
  ]

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white/80 backdrop-blur-md shadow-md' : 'bg-white/60 backdrop-blur-sm'
      }`}
    >
      <div className="w-full" style={{ maxWidth: '1600px', margin: '0 auto' }}>
        <div className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 lg:py-5 xl:py-6">
          <div className="flex items-center justify-between w-full">
            {/* Logo */}
            <Link href="/" className="flex items-center" style={{ marginRight: isMobile ? '20px' : '40px', flexShrink: 0 }}>
              <motion.span
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-display font-bold text-gray-900"
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                Meu Camp
              </motion.span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center" style={{ gap: '32px', flex: '1', justifyContent: 'center' }}>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-lg sm:text-xl md:text-xl lg:text-2xl xl:text-3xl font-medium text-gray-700 hover:text-primary-blue transition-colors relative group whitespace-nowrap"
                >
                  {link.label}
                  <motion.span
                    className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-blue to-primary-accent group-hover:w-full transition-all duration-300"
                    initial={false}
                  />
                </Link>
              ))}
            </div>

            {/* CTA Button */}
            <div className="hidden md:flex items-center" style={{ gap: '24px', marginLeft: 'auto', flexShrink: 0 }}>
              <Link
                href="/login"
                className="text-lg sm:text-xl md:text-xl lg:text-2xl xl:text-3xl font-medium text-gray-700 hover:text-primary-blue transition-colors whitespace-nowrap"
              >
                Entrar
              </Link>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/cadastro"
                  className="px-6 py-2.5 sm:px-8 sm:py-3 md:px-10 md:py-4 lg:px-12 lg:py-5 xl:px-16 xl:py-6 bg-gradient-to-r from-primary-blue to-primary-accent text-white rounded-lg font-medium text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl hover:shadow-glow-primary transition-all duration-300 whitespace-nowrap"
                >
                  Criar Evento
                </Link>
              </motion.div>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-gray-700"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          <motion.div
            initial={false}
            animate={{
              height: isMobileMenuOpen ? 'auto' : 0,
              opacity: isMobileMenuOpen ? 1 : 0,
            }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden"
          >
            <div className="pt-4 pb-2 space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-gray-700 hover:text-primary-blue transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 space-y-2 border-t border-gray-200">
                <Link
                  href="/login"
                  className="block text-gray-700 hover:text-primary-blue transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="block px-6 py-2.5 bg-gradient-to-r from-primary-blue to-primary-accent text-white rounded-lg font-medium text-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Criar Evento
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.nav>
  )
}

