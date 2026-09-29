'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Calendar, ChevronDown, ChevronUp, ClipboardList, LayoutDashboard, LogOut, Menu, User, Users, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const accountLinks = [
  { href: '/dashboard', label: 'Painel', icon: LayoutDashboard },
  { href: '/dashboard/meu-perfil', label: 'Meu perfil', icon: User },
  { href: '/dashboard/meus-atletas', label: 'Meus atletas', icon: Users },
  { href: '/dashboard/inscricoes', label: 'Inscrições e pagamentos', icon: ClipboardList },
  { href: '/eventos', label: 'Eventos publicados', icon: Calendar },
]

const leftNavLinks = [
  { href: '/', label: 'Início' },
  { href: '/eventos', label: 'Eventos' },
  { href: '/academias', label: 'Academias' },
]

const rightNavLinks = [
  { href: '/sistema', label: 'Sistema' },
  { href: '/quem-somos', label: 'Quem somos' },
]

const mobileNavLinks = [...leftNavLinks, ...rightNavLinks]

type CurrentUser = { name: string; initial: string } | null

export default function ModernNavbar() {
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null)
  const [scrolled, setScrolled] = useState(false)
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
    const SCROLL_THRESHOLD_PX = 12
    let frame = 0

    const syncScrolled = (next: boolean) => {
      setScrolled((current) => (current === next ? current : next))
    }

    const readScrollY = () => window.scrollY || document.documentElement.scrollTop || 0

    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        syncScrolled(readScrollY() > SCROLL_THRESHOLD_PX)
      })
    }

    // Marcador ancorado no topo do documento, sem empurrar o layout.
    const anchor = document.createElement('div')
    anchor.setAttribute('data-mc-nav-sentinel-anchor', '')
    Object.assign(anchor.style, {
      position: 'relative',
      width: '0',
      height: '0',
      overflow: 'visible',
      pointerEvents: 'none',
    })
    const sentinel = document.createElement('div')
    sentinel.setAttribute('aria-hidden', 'true')
    sentinel.setAttribute('data-mc-nav-sentinel', '')
    Object.assign(sentinel.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '1px',
      height: `${SCROLL_THRESHOLD_PX + 1}px`,
      opacity: '0',
    })
    anchor.appendChild(sentinel)
    document.body.insertBefore(anchor, document.body.firstChild)

    const observer = new IntersectionObserver(
      ([entry]) => syncScrolled(!entry.isIntersecting),
      { root: null, threshold: 0 },
    )
    observer.observe(sentinel)

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('scroll', onScroll, { passive: true, capture: true })

    return () => {
      observer.disconnect()
      anchor.remove()
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('scroll', onScroll, { capture: true })
      if (frame) window.cancelAnimationFrame(frame)
    }
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

  const navLinkClass = scrolled
    ? 'inline-flex min-h-10 items-center font-mc-interface text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors duration-mc-normal hover:text-white/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black'
    : 'inline-flex min-h-10 items-center font-mc-interface text-xs font-bold uppercase tracking-[0.14em] text-mc-text-primary transition-colors duration-mc-normal hover:text-mc-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2 focus-visible:ring-offset-white'
  const controlClass = scrolled
    ? 'inline-flex min-h-10 items-center rounded-mc-medium px-mc-12 font-mc-interface text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors duration-mc-normal hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black'
    : 'inline-flex min-h-10 items-center rounded-mc-medium px-mc-12 font-mc-interface text-xs font-bold uppercase tracking-[0.14em] text-mc-text-primary transition-colors duration-mc-normal hover:bg-mc-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2 focus-visible:ring-offset-white'
  const logoFocusClass = scrolled
    ? 'focus-visible:ring-white focus-visible:ring-offset-black'
    : 'focus-visible:ring-mc-focus focus-visible:ring-offset-white'
  const mobileControlClass = scrolled
    ? 'text-white hover:bg-white/10 focus-visible:ring-white focus-visible:ring-offset-black'
    : 'text-mc-text-primary hover:bg-mc-surface-secondary focus-visible:ring-mc-focus focus-visible:ring-offset-white'

  return (
    <header
      data-scrolled={scrolled ? 'true' : 'false'}
      className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-mc-normal ${scrolled ? 'border-white/10 bg-black shadow-mc-elevated' : 'border-mc-border bg-white shadow-mc-subtle'}`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`relative flex items-center justify-center transition-[min-height] duration-mc-normal ${scrolled ? 'min-h-14' : 'min-h-[4.5rem]'}`}>
          <nav aria-label="Navegação principal" className="contents">
            <div className="hidden flex-1 items-center justify-end gap-5 lg:flex xl:gap-7">
              {leftNavLinks.map((link) => (
                <Link key={link.href} href={link.href} className={navLinkClass}>
                  {link.label}
                </Link>
              ))}
            </div>

            <Link
              href="/"
              className={`relative z-10 mx-mc-16 shrink-0 rounded-mc-small focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 lg:mx-mc-24 ${logoFocusClass}`}
              aria-label="Meu Camp — página inicial"
            >
              <span className={`relative mx-auto block transition-[width,height] duration-mc-normal ${scrolled ? 'h-7 w-40 sm:h-8 sm:w-48' : 'h-8 w-44 sm:h-9 sm:w-56'}`}>
                <Image
                  src={scrolled ? '/images/meucamp-wordmark-light.png' : '/images/meucamp-wordmark.png'}
                  alt="Meu Camp"
                  fill
                  className="object-contain"
                  priority
                  sizes="(max-width: 639px) 176px, 224px"
                />
              </span>
            </Link>

            <div className="hidden flex-1 items-center justify-start gap-5 lg:flex xl:gap-7">
              {rightNavLinks.map((link) => (
                <Link key={link.href} href={link.href} className={navLinkClass}>
                  {link.label}
                </Link>
              ))}
              {!isLoggedIn ? (
                <Link href="/login" className={controlClass}>
                  Entrar
                </Link>
              ) : (
                <div ref={accountMenuRef} className="relative">
                  <button
                    ref={accountButtonRef}
                    type="button"
                    onClick={() => setIsAccountMenuOpen((open) => !open)}
                    aria-label="Minha Conta"
                    aria-expanded={isAccountMenuOpen}
                    aria-controls="account-menu"
                    className={`${controlClass} gap-mc-8`}
                  >
                    <span className={`flex h-8 w-8 items-center justify-center rounded-mc-full text-sm font-semibold ${scrolled ? 'bg-white text-black' : 'bg-black text-white'}`}>
                      {currentUser?.initial}
                    </span>
                    <span className="max-w-28 truncate normal-case tracking-normal">{currentUser?.name}</span>
                    {isAccountMenuOpen ? <ChevronUp aria-hidden="true" size={16} /> : <ChevronDown aria-hidden="true" size={16} />}
                  </button>
                  {isAccountMenuOpen ? (
                    <div id="account-menu" role="menu" className="absolute right-0 mt-mc-8 w-80 overflow-hidden rounded-mc-medium border border-mc-border bg-mc-surface shadow-mc-elevated">
                      {accountMenu}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </nav>

          <button
            ref={mobileMenuButtonRef}
            type="button"
            className={`absolute right-0 inline-flex min-h-12 min-w-12 items-center justify-center rounded-mc-medium transition-colors duration-mc-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 lg:hidden ${mobileControlClass}`}
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={isMobileMenuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
          >
            {isMobileMenuOpen ? <X aria-hidden="true" size={24} /> : <Menu aria-hidden="true" size={24} />}
          </button>
        </div>

        {isMobileMenuOpen ? (
          <nav id="mobile-navigation" aria-label="Navegação principal" className={`border-t py-mc-12 lg:hidden ${scrolled ? 'border-white/15' : 'border-mc-border'}`}>
            <div className="space-y-mc-4">
              {mobileNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex min-h-12 items-center rounded-mc-small px-mc-12 font-mc-interface text-sm font-bold uppercase tracking-[0.14em] transition-colors duration-mc-normal focus-visible:outline-none focus-visible:ring-2 ${scrolled ? 'text-white hover:bg-white/10 focus-visible:ring-white' : 'text-mc-text-primary hover:bg-mc-surface-secondary focus-visible:ring-mc-focus'}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className={`mt-mc-12 border-t pt-mc-12 ${scrolled ? 'border-white/15' : 'border-mc-border'}`}>
              {!isLoggedIn ? (
                <Link
                  href="/login"
                  className={`flex min-h-12 items-center justify-center rounded-mc-medium px-mc-16 font-mc-interface text-sm font-bold uppercase tracking-[0.14em] transition-colors duration-mc-normal focus-visible:outline-none focus-visible:ring-2 ${scrolled ? 'bg-white text-black hover:bg-white/90 focus-visible:ring-white' : 'bg-mc-action text-white hover:bg-mc-action/90 focus-visible:ring-mc-focus'}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Entrar
                </Link>
              ) : (
                <div className="overflow-hidden rounded-mc-medium border border-mc-border bg-mc-surface">
                  <div className="flex items-center gap-mc-12 px-mc-16 py-mc-12 font-mc-interface text-sm font-semibold text-mc-text-primary">
                    <span className="flex h-9 w-9 items-center justify-center rounded-mc-full bg-black text-white">{currentUser?.initial}</span>
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
