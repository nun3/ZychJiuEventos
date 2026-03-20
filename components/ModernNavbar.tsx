'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'
import { Menu, X, User, FileText, Calendar, Users, Award, Ticket, LogOut, ChevronDown, ChevronUp, Plus } from 'lucide-react'

const accountLinks = [
  { href: '/dashboard/meu-perfil', label: 'Meu Perfil', icon: User },
  { href: '/dashboard/alterar-cadastro', label: 'Alterar Meu Cadastro', icon: FileText },
  { href: '/dashboard/inscricoes', label: 'Inscrições Realizadas', icon: Calendar },
  { href: '/dashboard/meus-atletas', label: 'Meus Atletas', icon: Users },
  { href: '/dashboard/minhas-filiacoes', label: 'Filiações Registradas', icon: Award },
  { href: '/dashboard/meus-ingressos', label: 'Meus Ingressos', icon: Ticket },
  { href: '/admin/autenticacao', label: 'Criar Evento', icon: Plus },
]

export default function ModernNavbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  // Simulando usuário logado - em produção, isso viria de um contexto/auth
  const [isLoggedIn] = useState(true) // true porque o perfil está sendo mostrado
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
      className={`fixed top-0 left-0 right-0 z-50 bg-white transition-all duration-300 ${
        isScrolled ? 'shadow-lg' : 'shadow-sm'
      }`}
    >
      <div className="w-full" style={{ maxWidth: '1600px', margin: '0 auto' }}>
        <div className="px-3 sm:px-5 lg:px-6 py-3 sm:py-4 lg:py-5">
          <div className="flex items-center justify-between w-full">
            {/* Logo */}
            <Link href="/" className="flex items-center flex-shrink-0" style={{ marginRight: isMobile ? '20px' : '40px' }}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 400 }}
                className="relative"
                style={{ width: isMobile ? '126px' : '162px', height: isMobile ? '63px' : '81px' }}
              >
                <Image
                  src="/images/meucamp-logo.png"
                  alt="Meu Camp"
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 768px) 180px, 240px"
                />
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center" style={{ gap: '29px', flex: '1', justifyContent: 'center' }}>
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-xs sm:text-sm md:text-sm lg:text-base font-semibold text-gray-900 hover:text-gray-700 transition-colors relative group whitespace-nowrap uppercase tracking-wide py-1.5"
                >
                  {link.label}
                  <motion.span
                    className="absolute bottom-0 left-0 w-0 h-0.5 bg-gray-900 group-hover:w-full transition-all duration-300"
                    initial={false}
                  />
                </Link>
              ))}
            </div>

            {/* Right Side Actions - Ícones e Botões */}
            <div className="hidden md:flex items-center gap-5 ml-auto flex-shrink-0">
              {/* Link Entrar - Só mostra se não estiver logado */}
              {!isLoggedIn && (
                <Link
                  href="/login"
                  className="text-xs sm:text-sm md:text-sm lg:text-base font-semibold text-gray-900 hover:text-gray-700 transition-colors whitespace-nowrap uppercase tracking-wide"
                >
                  Entrar
                </Link>
              )}

              {/* Perfil no Navbar - Estilo do exemplo - Só mostra se estiver logado */}
              {isLoggedIn && (
                <div className="relative account-menu-container">
                  <motion.button
                    onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-all duration-200"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    aria-label="Minha Conta"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-11 h-11 rounded-full bg-gray-900 flex items-center justify-center border-2 border-gray-300 overflow-hidden">
                        <span className="text-white font-semibold text-base">R</span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">Ricardo</span>
                    {isAccountMenuOpen ? (
                      <ChevronUp size={20} className="text-gray-600 flex-shrink-0" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-600 flex-shrink-0" />
                    )}
                  </motion.button>
                  {isAccountMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-xl overflow-hidden z-50"
                    >
                      <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
                        <div className="text-base font-semibold uppercase tracking-wide text-gray-900">
                          Meu Perfil
                        </div>
                      </div>
                      <ul className="py-2">
                        {accountLinks.map((item) => (
                          <li key={item.href}>
                            <Link
                              href={item.href}
                              className="flex items-center gap-4 px-5 py-4 text-gray-900 hover:bg-gray-100 transition text-xs sm:text-sm md:text-base"
                              onClick={() => setIsAccountMenuOpen(false)}
                            >
                              <item.icon size={24} className="text-gray-600" />
                              {item.label}
                            </Link>
                          </li>
                        ))}
                        <li className="border-t border-gray-200 mt-2">
                          <button className="flex w-full items-center gap-4 px-5 py-4 text-left text-gray-900 hover:bg-gray-100 transition text-sm sm:text-base md:text-lg">
                            <LogOut size={24} className="text-gray-600" />
                            Sair
                          </button>
                        </li>
                      </ul>
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-gray-900"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
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
                  className="block text-xs sm:text-sm md:text-base font-semibold text-gray-900 hover:text-gray-700 transition-colors py-3 uppercase tracking-wide"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 space-y-3 border-t border-gray-200">
                {!isLoggedIn && (
                  <Link
                    href="/login"
                    className="block text-xs sm:text-sm md:text-base font-semibold text-gray-900 hover:text-gray-700 transition-colors py-3 uppercase tracking-wide"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Entrar
                  </Link>
                )}
                {isLoggedIn && (
                  <div className="w-full">
                    <button
                      onClick={() => {
                        setIsAccountMenuOpen(!isAccountMenuOpen)
                        setIsMobileMenuOpen(false)
                      }}
                      className="flex items-center gap-3 px-4 py-3 text-gray-900 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all w-full"
                      aria-label="Minha Conta"
                    >
                      <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center border-2 border-gray-300">
                        <span className="text-white font-semibold text-lg">R</span>
                      </div>
                      <span className="text-lg font-semibold text-gray-900">Ricardo</span>
                    </button>
                    {isAccountMenuOpen && (
                      <div className="mt-2 rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
                        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                          <div className="text-base font-semibold uppercase tracking-wide text-gray-900">
                            Meu Perfil
                          </div>
                        </div>
                        <ul className="py-2">
                          {accountLinks.map((item) => (
                            <li key={item.href}>
                              <Link
                                href={item.href}
                                className="flex items-center gap-4 px-5 py-4 text-gray-900 hover:bg-gray-100 transition text-xs sm:text-sm md:text-base"
                                onClick={() => {
                                  setIsAccountMenuOpen(false)
                                  setIsMobileMenuOpen(false)
                                }}
                              >
                                <item.icon size={24} className="text-gray-600" />
                                {item.label}
                              </Link>
                            </li>
                          ))}
                          <li className="border-t border-gray-200 mt-2">
                            <button className="flex w-full items-center gap-4 px-5 py-4 text-left text-gray-900 hover:bg-gray-100 transition text-sm sm:text-base md:text-lg">
                              <LogOut size={24} className="text-gray-600" />
                              Sair
                            </button>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.nav>
  )
}

