'use client'

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, LogOut, Menu, X, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type SubLink = { href: string; label: string }
type MenuKey = 'eventos' | 'noticias' | 'conta' | null

/** Somente rotas públicas/implementadas — sem links quebrados. */
const eventosLinks: SubLink[] = [
  { href: '/eventos', label: 'Próximos campeonatos' },
]

const noticiasLinks: SubLink[] = [
  { href: '/noticias', label: 'Novidades' },
]

const contaLinks: SubLink[] = [
  { href: '/dashboard', label: 'Meu painel' },
  { href: '/dashboard/meu-perfil', label: 'Meu perfil' },
  { href: '/dashboard/inscricoes', label: 'Minhas inscrições' },
  { href: '/dashboard/meus-atletas', label: 'Minhas equipes' },
  { href: '/admin/eventos', label: 'Meus eventos' },
]

const CREATE_EVENT_HREF = '/admin/eventos/novo'
const CREATE_EVENT_LOGIN = `/login?redirectTo=${encodeURIComponent(CREATE_EVENT_HREF)}`
const SCROLL_THRESHOLD_PX = 64
const CLOSE_DELAY_MS = 200

type CurrentUser = { name: string; initial: string } | null

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function ModernNavbar() {
  const router = useRouter()
  const pathname = usePathname()
  const submenuId = useId()
  const mobileNavId = useId()
  const [openMenu, setOpenMenu] = useState<MenuKey>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState<MenuKey>(null)
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null)
  const [scrolled, setScrolled] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navRef = useRef<HTMLElement>(null)
  const mobileButtonRef = useRef<HTMLButtonElement>(null)
  const isLoggedIn = currentUser !== null
  const createEventHref = isLoggedIn ? CREATE_EVENT_HREF : CREATE_EVENT_LOGIN

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  const openDesktopMenu = (key: MenuKey) => {
    clearCloseTimer()
    setOpenMenu(key)
  }

  const scheduleCloseDesktopMenu = () => {
    clearCloseTimer()
    closeTimer.current = setTimeout(() => setOpenMenu(null), CLOSE_DELAY_MS)
  }

  const closeAll = useCallback(() => {
    clearCloseTimer()
    setOpenMenu(null)
    setMobileOpen(false)
    setMobileExpanded(null)
  }, [])

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
    let frame = 0
    const syncScrolled = (next: boolean) => setScrolled((current) => (current === next ? current : next))
    const readScrollY = () => window.scrollY || document.documentElement.scrollTop || 0
    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        const y = readScrollY()
        syncScrolled(y > SCROLL_THRESHOLD_PX)
        if (y > SCROLL_THRESHOLD_PX + 80) setOpenMenu(null)
      })
    }
    const anchor = document.createElement('div')
    Object.assign(anchor.style, { position: 'relative', width: '0', height: '0', overflow: 'visible', pointerEvents: 'none' })
    const sentinel = document.createElement('div')
    sentinel.setAttribute('aria-hidden', 'true')
    Object.assign(sentinel.style, {
      position: 'absolute', top: '0', left: '0', width: '1px', height: `${SCROLL_THRESHOLD_PX + 1}px`, opacity: '0',
    })
    anchor.appendChild(sentinel)
    document.body.insertBefore(anchor, document.body.firstChild)
    const observer = new IntersectionObserver(([entry]) => syncScrolled(!entry.isIntersecting), { root: null, threshold: 0 })
    observer.observe(sentinel)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      observer.disconnect()
      anchor.remove()
      window.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false)
        setMobileExpanded(null)
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  useEffect(() => {
    closeAll()
  }, [pathname, closeAll])

  useEffect(() => {
    const onPointer = (event: MouseEvent) => {
      if (openMenu && navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenMenu(null)
      }
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (mobileOpen) {
        setMobileOpen(false)
        mobileButtonRef.current?.focus()
        return
      }
      if (openMenu) setOpenMenu(null)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
      clearCloseTimer()
    }
  }, [mobileOpen, openMenu])

  const handleLogout = async () => {
    await createClient().auth.signOut()
    closeAll()
    router.replace('/login')
    router.refresh()
  }

  const dark = scrolled
  const topLink = (active: boolean, menuOpen: boolean) => {
    const base = 'relative inline-flex min-h-11 items-center gap-mc-4 font-mc-interface text-xs font-bold uppercase tracking-[0.16em] transition-colors duration-[180ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
    if (dark) {
      return `${base} text-white hover:text-white/80 focus-visible:ring-white focus-visible:ring-offset-mc-nav-dark ${active || menuOpen ? 'after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:bg-mc-action' : ''}`
    }
    return `${base} text-mc-text-primary hover:text-mc-action focus-visible:ring-mc-focus focus-visible:ring-offset-white ${active || menuOpen ? 'text-mc-action after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:bg-mc-action' : ''}`
  }

  const createEventLink = dark
    ? 'group inline-flex min-h-11 items-center gap-mc-8 font-mc-interface text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors duration-[180ms] hover:text-mc-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-mc-nav-dark'
    : 'group inline-flex min-h-11 items-center gap-mc-8 font-mc-interface text-xs font-bold uppercase tracking-[0.14em] text-mc-text-primary transition-colors duration-[180ms] hover:text-mc-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2'

  const submenuLinks = openMenu === 'eventos'
    ? eventosLinks
    : openMenu === 'noticias'
      ? noticiasLinks
      : openMenu === 'conta'
        ? contaLinks
        : []

  const renderDesktopTrigger = (
    key: Exclude<MenuKey, null>,
    href: string | null,
    label: string,
    active: boolean,
  ) => {
    const menuOpen = openMenu === key
    const className = topLink(active, menuOpen)
    const commonProps = {
      className,
      'aria-expanded': menuOpen,
      'aria-controls': submenuId,
      onMouseEnter: () => openDesktopMenu(key),
      onMouseLeave: scheduleCloseDesktopMenu,
      onFocus: () => openDesktopMenu(key),
      onKeyDown: (event: ReactKeyboardEvent) => {
        if (event.key === 'ArrowDown' || event.key === ' ') {
          event.preventDefault()
          openDesktopMenu(key)
        }
        if (event.key === 'Escape') setOpenMenu(null)
      },
    }

    if (href) {
      return (
        <Link
          href={href}
          {...commonProps}
          onClick={() => openDesktopMenu(key)}
        >
          {label}
          <ChevronDown aria-hidden="true" size={14} className={`transition-transform duration-[180ms] ${menuOpen ? 'rotate-180' : ''}`} />
        </Link>
      )
    }

    return (
      <button type="button" {...commonProps} onClick={() => openDesktopMenu(menuOpen ? null : key)}>
        <span className="max-w-[9rem] truncate normal-case tracking-normal">{label}</span>
        <ChevronDown aria-hidden="true" size={14} className={`transition-transform duration-[180ms] ${menuOpen ? 'rotate-180' : ''}`} />
      </button>
    )
  }

  return (
    <header
      ref={navRef}
      data-scrolled={scrolled ? 'true' : 'false'}
      className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,box-shadow] duration-[200ms] ${dark ? 'border-b border-white/10 bg-mc-nav-dark shadow-mc-elevated' : 'border-b border-mc-border bg-white shadow-mc-subtle'}`}
    >
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-mc-small focus:bg-mc-action focus:px-mc-16 focus:py-mc-8 focus:font-mc-interface focus:text-sm focus:font-semibold focus:text-white"
      >
        Pular para o conteúdo principal
      </a>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Desktop */}
        <div className={`hidden min-h-16 grid-cols-[1fr_auto_1fr] items-center lg:grid ${scrolled ? 'min-h-16' : 'min-h-[4.25rem]'}`}>
          <nav aria-label="Navegação principal" className="flex items-center justify-self-start gap-mc-24 xl:gap-mc-32">
            {renderDesktopTrigger('eventos', '/eventos', 'Eventos', isActive(pathname, '/eventos'))}
            {renderDesktopTrigger('noticias', '/noticias', 'Notícias', isActive(pathname, '/noticias'))}
          </nav>

          <Link
            href="/"
            className={`justify-self-center rounded-mc-small focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${dark ? 'focus-visible:ring-white focus-visible:ring-offset-mc-nav-dark' : 'focus-visible:ring-mc-focus focus-visible:ring-offset-white'}`}
            aria-label="Meu Camp — página inicial"
          >
            <span className="relative block h-7 w-40">
              <Image
                src={dark ? '/images/meucamp-wordmark-light.png' : '/images/meucamp-wordmark.png'}
                alt="MEU CAMP"
                fill
                className="object-contain"
                priority
                sizes="160px"
              />
            </span>
          </Link>

          <div className="flex items-center justify-self-end gap-mc-16 xl:gap-mc-24">
            {!isLoggedIn ? (
              <Link
                href="/login"
                className={topLink(isActive(pathname, '/login'), false)}
              >
                Entrar
              </Link>
            ) : (
              renderDesktopTrigger('conta', null, currentUser?.name || 'Conta', false)
            )}
            <Link href={createEventHref} className={createEventLink}>
              Criar evento
              <ArrowRight aria-hidden="true" size={16} className="transition-transform duration-[180ms] group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        {/* Mobile: logo | hamburger */}
        <div className="flex min-h-16 items-center justify-between lg:hidden">
          <Link
            href="/"
            className={`rounded-mc-small focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${dark ? 'focus-visible:ring-white focus-visible:ring-offset-mc-nav-dark' : 'focus-visible:ring-mc-focus focus-visible:ring-offset-white'}`}
            aria-label="Meu Camp — página inicial"
          >
            <span className="relative block h-7 w-36">
              <Image
                src={dark ? '/images/meucamp-wordmark-light.png' : '/images/meucamp-wordmark.png'}
                alt="MEU CAMP"
                fill
                className="object-contain object-left"
                priority
                sizes="144px"
              />
            </span>
          </Link>
          <button
            ref={mobileButtonRef}
            type="button"
            className={dark
              ? 'inline-flex min-h-11 min-w-11 items-center justify-center rounded-mc-small text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-mc-nav-dark'
              : 'inline-flex min-h-11 min-w-11 items-center justify-center rounded-mc-small text-mc-text-primary hover:bg-mc-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2'}
            aria-expanded={mobileOpen}
            aria-controls={mobileNavId}
            aria-label={mobileOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X aria-hidden="true" size={24} /> : <Menu aria-hidden="true" size={24} />}
          </button>
        </div>
      </div>

      {/* Desktop horizontal submenu strip */}
      <div
        id={submenuId}
        hidden={!openMenu}
        className={`hidden border-t transition-[max-height,opacity] duration-[180ms] lg:block ${openMenu ? 'max-h-16 opacity-100' : 'pointer-events-none max-h-0 opacity-0'} ${dark ? 'border-white/10 bg-mc-nav-dark' : 'border-mc-border bg-white shadow-mc-subtle'}`}
        onMouseEnter={clearCloseTimer}
        onMouseLeave={scheduleCloseDesktopMenu}
      >
        {openMenu ? (
          <div className="mx-auto flex max-w-7xl items-center gap-mc-24 overflow-x-auto px-4 py-mc-12 sm:px-6 lg:gap-mc-32 lg:px-8" role="navigation" aria-label="Submenu">
            {submenuLinks.map((link) => (
              <Link
                key={`${openMenu}-${link.href}-${link.label}`}
                href={link.href}
                className={dark
                  ? 'inline-flex min-h-11 shrink-0 items-center whitespace-nowrap font-mc-interface text-xs font-bold uppercase tracking-[0.14em] text-white/90 transition-colors duration-[180ms] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white'
                  : 'inline-flex min-h-11 shrink-0 items-center whitespace-nowrap font-mc-interface text-xs font-bold uppercase tracking-[0.14em] text-mc-text-secondary transition-colors duration-[180ms] hover:text-mc-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus'}
                onClick={closeAll}
              >
                {link.label}
              </Link>
            ))}
            {openMenu === 'conta' ? (
              <>
                <span className={`hidden h-5 w-px shrink-0 sm:block ${dark ? 'bg-white/20' : 'bg-mc-border'}`} aria-hidden="true" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className="ml-auto inline-flex min-h-11 shrink-0 items-center gap-mc-8 whitespace-nowrap font-mc-interface text-xs font-bold uppercase tracking-[0.14em] text-mc-error transition-colors duration-[180ms] hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
                >
                  <LogOut aria-hidden="true" size={15} />
                  Sair
                </button>
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Mobile menu */}
      {mobileOpen ? (
        <nav
          id={mobileNavId}
          aria-label="Navegação principal"
          className="border-t border-mc-border bg-white lg:hidden"
        >
          <div className="mx-auto max-w-7xl space-y-mc-4 px-4 py-mc-16 sm:px-6">
            {([
              { key: 'eventos' as const, href: '/eventos', label: 'Eventos', children: eventosLinks },
              { key: 'noticias' as const, href: '/noticias', label: 'Notícias', children: noticiasLinks },
            ]).map((item) => {
              const expanded = mobileExpanded === item.key
              return (
                <div key={item.key} className="border-b border-mc-border">
                  <div className="flex items-stretch">
                    <Link
                      href={item.href}
                      className="flex min-h-12 flex-1 items-center font-mc-interface text-sm font-bold uppercase tracking-[0.14em] text-mc-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
                      onClick={closeAll}
                    >
                      {item.label}
                    </Link>
                    <button
                      type="button"
                      className="inline-flex min-h-12 min-w-12 items-center justify-center text-mc-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
                      aria-expanded={expanded}
                      aria-controls={`mobile-sub-${item.key}`}
                      aria-label={expanded ? `Recolher ${item.label}` : `Expandir ${item.label}`}
                      onClick={() => setMobileExpanded((current) => (current === item.key ? null : item.key))}
                    >
                      {expanded ? <ChevronUp aria-hidden="true" size={18} /> : <ChevronDown aria-hidden="true" size={18} />}
                    </button>
                  </div>
                  {expanded ? (
                    <ul id={`mobile-sub-${item.key}`} className="space-y-mc-4 pb-mc-12 pl-mc-12">
                      {item.children.map((child) => (
                        <li key={child.href + child.label}>
                          <Link href={child.href} className="flex min-h-11 items-center font-mc-interface text-sm font-semibold text-mc-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus" onClick={closeAll}>
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              )
            })}

            {isLoggedIn ? (
              <div className="border-b border-mc-border">
                <div className="flex items-stretch">
                  <Link
                    href="/dashboard"
                    className="flex min-h-12 flex-1 items-center font-mc-interface text-sm font-bold uppercase tracking-[0.14em] text-mc-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
                    onClick={closeAll}
                  >
                    Meu painel
                  </Link>
                  <button
                    type="button"
                    className="inline-flex min-h-12 min-w-12 items-center justify-center text-mc-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
                    aria-expanded={mobileExpanded === 'conta'}
                    aria-controls="mobile-sub-conta"
                    aria-label={mobileExpanded === 'conta' ? 'Recolher minha conta' : 'Expandir minha conta'}
                    onClick={() => setMobileExpanded((current) => (current === 'conta' ? null : 'conta'))}
                  >
                    {mobileExpanded === 'conta' ? <ChevronUp aria-hidden="true" size={18} /> : <ChevronDown aria-hidden="true" size={18} />}
                  </button>
                </div>
                {mobileExpanded === 'conta' ? (
                  <ul id="mobile-sub-conta" className="space-y-mc-4 pb-mc-12 pl-mc-12">
                    {contaLinks.map((child) => (
                      <li key={child.href}>
                        <Link href={child.href} className="flex min-h-11 items-center font-mc-interface text-sm font-semibold text-mc-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus" onClick={closeAll}>
                          {child.label}
                        </Link>
                      </li>
                    ))}
                    <li>
                      <button type="button" onClick={handleLogout} className="flex min-h-11 items-center gap-mc-8 font-mc-interface text-sm font-semibold text-mc-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus">
                        <LogOut aria-hidden="true" size={16} />
                        Sair
                      </button>
                    </li>
                  </ul>
                ) : null}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex min-h-12 items-center border-b border-mc-border font-mc-interface text-sm font-bold uppercase tracking-[0.14em] text-mc-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
                onClick={closeAll}
              >
                Entrar
              </Link>
            )}

            <Link href={createEventHref} className={`${createEventLink} mt-mc-12`} onClick={closeAll}>
              Criar evento
              <ArrowRight aria-hidden="true" size={16} className="transition-transform duration-[180ms] group-hover:translate-x-0.5" />
            </Link>
          </div>
        </nav>
      ) : null}
    </header>
  )
}
