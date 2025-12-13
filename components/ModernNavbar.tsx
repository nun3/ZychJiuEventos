'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'
import { Menu, X, User, FileText, Calendar, Users, Award, Ticket, LogOut, ChevronDown, ChevronUp } from 'lucide-react'

const accountLinks = [
  { href: '/dashboard/meu-perfil', label: 'Meu Perfil', icon: User },
  { href: '/dashboard/alterar-cadastro', label: 'Alterar Meu Cadastro', icon: FileText },
  { href: '/dashboard/inscricoes', label: 'Inscrições Realizadas', icon: Calendar },
  { href: '/dashboard/meus-atletas', label: 'Meus Atletas', icon: Users },
  { href: '/dashboard/minhas-filiacoes', label: 'Filiações Registradas', icon: Award },
  { href: '/dashboard/meus-ingressos', label: 'Meus Ingressos', icon: Ticket },
]

export default function ModernNavbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isAccountMenuOpen && !target.closest('.account-menu-container')) {
        setIsAccountMenuOpen(false)
      }
    }
    if (isAccountMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isAccountMenuOpen])

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setIsScrolled(latest > 50)
  })

  const navLinks = [
    { href: '/', label: 'Início' },
    { href: '/eventos', label: 'Eventos' },
    { href: '/academias', label: 'Academias' },
    { href: '/sistema', label: 'Sistema' },
    { href: '/quem-somos', label: 'Quem somos' },
  ]

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="fixed top-0 left-0 right-0 z-50 bg-white transition-all duration-300"
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
                  className="text-base sm:text-lg md:text-lg lg:text-xl xl:text-xl font-medium text-gray-900 hover:text-gray-700 transition-colors relative group whitespace-nowrap"
                >
                  {link.label}
                  <motion.span
                    className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-900 group-hover:w-full transition-all duration-300"
                    initial={false}
                  />
                </Link>
              ))}
              {/* Minha Conta no centro */}
              <div className="relative account-menu-container">
                <button
                  onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                  className="text-base sm:text-lg md:text-lg lg:text-xl xl:text-xl font-medium text-gray-900 hover:text-gray-700 transition-colors relative group whitespace-nowrap flex items-center gap-1"
                >
                  Minha Conta
                  {isAccountMenuOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  <motion.span
                    className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-900 group-hover:w-full transition-all duration-300"
                    initial={false}
                  />
                </button>
                {isAccountMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden z-50">
                    <div className="border-b border-gray-700 bg-gray-900 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-white">
                      Minha conta
                    </div>
                    <ul className="py-2 text-sm">
                      {accountLinks.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className="flex items-center gap-3 px-4 py-3 text-white hover:bg-gray-800 transition"
                            onClick={() => setIsAccountMenuOpen(false)}
                          >
                            <item.icon size={18} className="text-white" />
                            {item.label}
                          </Link>
                        </li>
                      ))}
                      <li className="border-t border-gray-700 mt-2">
                        <button className="flex w-full items-center gap-3 px-4 py-3 text-left text-white hover:bg-gray-800 transition">
                          <LogOut size={18} className="text-white" />
                          Sair
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* CTA Button */}
            <div className="hidden md:flex items-center" style={{ gap: '24px', marginLeft: 'auto', flexShrink: 0 }}>
              <Link
                href="/login"
                className="text-base sm:text-lg md:text-lg lg:text-xl xl:text-xl font-medium text-gray-900 hover:text-gray-700 transition-colors whitespace-nowrap"
              >
                Entrar
              </Link>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/cadastro"
                  className="px-6 py-2.5 sm:px-6 sm:py-2.5 md:px-6 md:py-2.5 lg:px-8 lg:py-3 xl:px-8 xl:py-3 bg-gray-900 text-white rounded-lg font-medium text-base sm:text-base md:text-base lg:text-lg xl:text-lg hover:bg-gray-800 transition-all duration-300 whitespace-nowrap"
                >
                  Criar Evento
                </Link>
              </motion.div>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-gray-900"
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
                  className="block text-gray-900 hover:text-gray-700 transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 space-y-2 border-t border-gray-200">
                <Link
                  href="/login"
                  className="block text-gray-900 hover:text-gray-700 transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="block px-6 py-2.5 bg-gray-900 text-white rounded-lg font-medium text-center hover:bg-gray-800 transition"
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

