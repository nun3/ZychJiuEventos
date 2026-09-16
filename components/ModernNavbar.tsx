'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Award, Calendar, ChevronDown, ChevronUp, FileText, LogOut, Menu, Plus, Ticket, User, Users, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const accountLinks = [
  { href: '/dashboard/meu-perfil', label: 'Meu Perfil', icon: User },
  { href: '/dashboard/alterar-cadastro', label: 'Alterar Meu Cadastro', icon: FileText },
  { href: '/dashboard/inscricoes', label: 'Inscrições Realizadas', icon: Calendar },
  { href: '/dashboard/meus-atletas', label: 'Meus Atletas', icon: Users },
  { href: '/dashboard/minhas-filiacoes', label: 'Filiações Registradas', icon: Award },
  { href: '/dashboard/meus-ingressos', label: 'Meus Ingressos', icon: Ticket },
  { href: '/admin/autenticacao', label: 'Criar Evento', icon: Plus },
]

const navLinks = [
  { href: '/', label: 'Início' },
  { href: '/eventos', label: 'Eventos' },
  { href: '/academias', label: 'Academias' },
  { href: '/sistema', label: 'Sistema' },
  { href: '/quem-somos', label: 'Quem somos' },
]

type CurrentUser = { name: string; initial: string } | null

export default function ModernNavbar() {
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null)
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null)
  const accountButtonRef = useRef<HTMLButtonElement>(null)
  const accountMenuRef = useRef<HTMLDivElement>(null)
  const isLoggedIn = currentUser !== null

  useEffect(() => {
    const supabase = createClient()
    const applyUser = (user: { email?: string; user_metadata?: Record<string, unknown> } | null) => {
      if (!user) return setCurrentUser(null)
      const metadataName = typeof user.user_metadata?.nome_completo === 'string'
        ? user.user_metadata.nome_completo.trim()
        : ''
      const name = metadataName || user.email?.split('@')[0] || 'Usuário'
      setCurrentUser({ name, initial: name.charAt(0).toUpperCase() })
    }

    void supabase.auth.getUser().then(({ data }) => applyUser(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => applyUser(session?.user ?? null))
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const closeMobileMenuOnDesktop = () => {
      if (window.innerWidth >= 1024) setIsMobileMenuOpen(false)
    }
    window.addEventListener('resize', closeMobileMenuOnDesktop)
    return () => window.removeEventListener('resize', closeMobileMenuOnDesktop)
  }, [])

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (isAccountMenuOpen && !accountMenuRef.current?.contains(event.target as Node)) setIsAccountMenuOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false)
        mobileMenuButtonRef.current?.focus()
      }
      if (isAccountMenuOpen) {
        setIsAccountMenuOpen(false)
        accountButtonRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isAccountMenuOpen, isMobileMenuOpen])

  const closeMenus = () => {
    setIsMobileMenuOpen(false)
    setIsAccountMenuOpen(false)
  }

  const handleLogout = async () => {
    await createClient().auth.signOut()
    closeMenus()
    router.replace('/login')
    router.refresh()
  }

  const accountMenu = (
    <ul className="divide-y divide-mc-border">
      {accountLinks.map((item) => (
        <li key={item.href}>
          <Link href={item.href} className="flex min-h-12 items-center gap-mc-12 px-mc-16 py-mc-8 font-mc-interface text-sm font-medium text-mc-text-primary transition-colors duration-mc-normal hover:bg-mc-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mc-focus" onClick={closeMenus}>
            <item.icon aria-hidden="true" size={18} className="shrink-0 text-mc-text-secondary" />
            {item.label}
          </Link>
        </li>
      ))}
      <li>
        <button type="button" onClick={handleLogout} className="flex min-h-12 w-full items-center gap-mc-12 px-mc-16 py-mc-8 text-left font-mc-interface text-sm font-medium text-mc-error transition-colors duration-mc-normal hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mc-focus">
          <LogOut aria-hidden="true" size={18} className="shrink-0" />
          Sair
        </button>
      </li>
    </ul>
  )

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-mc-border bg-mc-surface shadow-mc-subtle">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-20 items-center justify-between gap-mc-16">
          <Link href="/" className="shrink-0 rounded-mc-small focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2" aria-label="Meu Camp — página inicial">
            <span className="relative block h-12 w-28 sm:h-14 sm:w-32">
              <Image src="/images/meucamp-logo.png" alt="Meu Camp" fill className="object-contain" priority sizes="(max-width: 639px) 112px, 128px" />
            </span>
          </Link>

          <nav aria-label="Navegação principal" className="hidden flex-1 items-center justify-center gap-5 lg:flex xl:gap-7">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="inline-flex min-h-10 items-center font-mc-interface text-sm font-semibold text-mc-text-primary transition-colors duration-mc-normal hover:text-mc-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden shrink-0 lg:flex lg:items-center">
            {!isLoggedIn ? (
              <Link href="/login" className="inline-flex min-h-10 items-center rounded-mc-medium px-mc-16 font-mc-interface text-sm font-semibold text-mc-text-primary transition-colors duration-mc-normal hover:bg-mc-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2">
                Entrar
              </Link>
            ) : (
              <div ref={accountMenuRef} className="relative">
                <button ref={accountButtonRef} type="button" onClick={() => setIsAccountMenuOpen((open) => !open)} aria-label="Minha Conta" aria-expanded={isAccountMenuOpen} aria-controls="account-menu" className="inline-flex min-h-12 items-center gap-mc-8 rounded-mc-medium px-mc-12 font-mc-interface text-sm font-semibold text-mc-text-primary transition-colors duration-mc-normal hover:bg-mc-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-mc-full bg-mc-structure text-sm text-white">{currentUser?.initial}</span>
                  <span className="max-w-36 truncate">{currentUser?.name}</span>
                  {isAccountMenuOpen ? <ChevronUp aria-hidden="true" size={18} /> : <ChevronDown aria-hidden="true" size={18} />}
                </button>
                {isAccountMenuOpen ? <div id="account-menu" role="menu" className="absolute right-0 mt-mc-8 w-80 overflow-hidden rounded-mc-medium border border-mc-border bg-mc-surface shadow-mc-elevated">{accountMenu}</div> : null}
              </div>
            )}
          </div>

          <button ref={mobileMenuButtonRef} type="button" className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-mc-medium text-mc-text-primary transition-colors duration-mc-normal hover:bg-mc-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2 lg:hidden" onClick={() => setIsMobileMenuOpen((open) => !open)} aria-expanded={isMobileMenuOpen} aria-controls="mobile-navigation" aria-label={isMobileMenuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}>
            {isMobileMenuOpen ? <X aria-hidden="true" size={24} /> : <Menu aria-hidden="true" size={24} />}
          </button>
        </div>

        {isMobileMenuOpen ? (
          <nav id="mobile-navigation" aria-label="Navegação principal" className="border-t border-mc-border py-mc-12 lg:hidden">
            <div className="space-y-mc-4">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="flex min-h-12 items-center rounded-mc-small px-mc-12 font-mc-interface text-base font-semibold text-mc-text-primary transition-colors duration-mc-normal hover:bg-mc-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2" onClick={() => setIsMobileMenuOpen(false)}>
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="mt-mc-12 border-t border-mc-border pt-mc-12">
              {!isLoggedIn ? (
                <Link href="/login" className="flex min-h-12 items-center justify-center rounded-mc-medium bg-mc-action px-mc-16 font-mc-interface text-base font-semibold text-white transition-colors duration-mc-normal hover:bg-mc-action/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2" onClick={() => setIsMobileMenuOpen(false)}>
                  Entrar
                </Link>
              ) : (
                <div className="overflow-hidden rounded-mc-medium border border-mc-border bg-mc-surface-secondary">
                  <div className="flex items-center gap-mc-12 px-mc-16 py-mc-12 font-mc-interface text-sm font-semibold text-mc-text-primary">
                    <span className="flex h-9 w-9 items-center justify-center rounded-mc-full bg-mc-structure text-white">{currentUser?.initial}</span>
                    <span className="truncate">{currentUser?.name}</span>
                  </div>
                  {accountMenu}
                </div>
              )}
            </div>
          </nav>
        ) : null}
      </div>
    </header>
  )
}
