'use client'

import { useCallback, useEffect, useRef, useState, type FocusEvent, type MouseEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowRight, CalendarDays, ClipboardList, LayoutDashboard, LogOut, Menu, UserRound, UsersRound, X } from 'lucide-react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { createClient } from '@/lib/supabase/client'

const CREATE_EVENT_HREF = '/admin/eventos/novo'
const CREATE_EVENT_REGISTER = `/login?mode=register&redirectTo=${encodeURIComponent(CREATE_EVENT_HREF)}`
const accountLinks = [
  { href: '/dashboard', label: 'Meu painel', icon: LayoutDashboard },
  { href: '/dashboard/meu-perfil', label: 'Meu perfil', icon: UserRound },
  { href: '/dashboard/inscricoes', label: 'Minhas inscrições', icon: ClipboardList },
  { href: '/dashboard/meus-atletas', label: 'Minhas equipes', icon: UsersRound },
  { href: '/admin/eventos', label: 'Meus eventos', icon: CalendarDays },
]
type CurrentUser = { name: string; initial: string; avatarUrl: string | null } | null

const MARK = 36
const SCROLL_THRESHOLD = 72

function currentNavKey(pathname: string) {
  // A Home reúne o destaque e o calendário de campeonatos: "Eventos" é o item ativo nela também.
  if (pathname === '/') return 'eventos'
  if (pathname === '/eventos' || pathname.startsWith('/eventos/')) return 'eventos'
  if (pathname === '/login') return 'login'
  return null
}

const itemBase = 'inline-flex h-16 items-center px-3 font-mc-interface text-[0.8125rem] font-semibold uppercase tracking-[0.14em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
const itemColor = (white: boolean) =>
  white ? 'text-white hover:text-blue-200 focus-visible:ring-white' : 'text-mc-text-primary hover:text-mc-action focus-visible:ring-mc-focus'
const accentColor = (white: boolean) =>
  white ? 'text-blue-300 hover:text-blue-200 focus-visible:ring-white' : 'text-mc-action hover:text-mc-action/80 focus-visible:ring-mc-focus'

/**
 * overlayAtTop: nasce transparente sobre um hero escuro.
 * scrolledTone: como fica depois de rolar — 'solid' (branco, padrão) ou 'glass' (vidro translúcido, texto claro; usado na Home).
 */
export default function ModernNavbar({ overlayAtTop = false, scrolledTone = 'solid' }: { overlayAtTop?: boolean; scrolledTone?: 'solid' | 'glass' }) {
  const pathname = usePathname()
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(!overlayAtTop)
  const [mark, setMark] = useState({ left: 0, visible: false })
  const barRef = useRef<HTMLElement>(null)
  const nodes = useRef(new Map<string, HTMLElement>())
  const restingKey = currentNavKey(pathname)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const hamburgerRef = useRef<HTMLButtonElement>(null)
  const drawerLayerRef = useRef<HTMLDivElement>(null)
  const drawerRef = useRef<HTMLElement>(null)
  const mobileLayerRef = useRef<HTMLDivElement>(null)
  const mobilePanelRef = useRef<HTMLElement>(null)
  const isLoggedIn = currentUser !== null
  const glassWhenScrolled = overlayAtTop && scrolledTone === 'glass'
  const useWhiteText = overlayAtTop && (glassWhenScrolled || !scrolled)
  const createEventHref = isLoggedIn ? CREATE_EVENT_HREF : CREATE_EVENT_REGISTER

  const closeMenus = useCallback(() => { setDrawerOpen(false); setMobileOpen(false) }, [])
  const focusAccountTrigger = useCallback(() => {
    const contaEl = nodes.current.get('conta')
    if (contaEl && contaEl.offsetParent !== null) contaEl.focus()
    else hamburgerRef.current?.focus()
  }, [])

  useEffect(() => {
    const supabase = createClient()
    let active = true
    const applyUser = async (user: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null) => {
      if (!user) return setCurrentUser(null)
      const metadataName = typeof user.user_metadata?.nome_completo === 'string' ? user.user_metadata.nome_completo.trim() : ''
      const name = metadataName || user.email?.split('@')[0] || 'Usuário'
      const { data: profile } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).maybeSingle()
      if (!active) return
      const metadataAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture
      const avatar = profile?.avatar_url || metadataAvatar
      setCurrentUser({ name, initial: name.charAt(0).toUpperCase(), avatarUrl: typeof avatar === 'string' ? avatar : null })
    }
    void supabase.auth.getUser().then(({ data }) => applyUser(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => applyUser(session?.user ?? null))
    const syncProfileAvatar = () => { void supabase.auth.getUser().then(({ data }) => applyUser(data.user)) }
    window.addEventListener('meucamp:avatar-updated', syncProfileAvatar)
    return () => {
      active = false
      listener.subscription.unsubscribe()
      window.removeEventListener('meucamp:avatar-updated', syncProfileAvatar)
    }
  }, [])

  const moveMark = useCallback((key: string | null) => {
    const bar = barRef.current
    const el = key ? nodes.current.get(key) : null
    if (!bar || !el) {
      setMark((current) => ({ ...current, visible: false }))
      return
    }
    const barBox = bar.getBoundingClientRect()
    const itemBox = el.getBoundingClientRect()
    setMark({ left: itemBox.left - barBox.left + itemBox.width / 2 - MARK / 2, visible: true })
  }, [])

  const bindItem = useCallback((key: string) => (el: HTMLElement | null) => {
    if (el) nodes.current.set(key, el)
    else nodes.current.delete(key)
  }, [])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => moveMark(restingKey))
    const onResize = () => moveMark(restingKey)
    window.addEventListener('resize', onResize)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
    }
  }, [moveMark, restingKey, isLoggedIn])

  useEffect(() => closeMenus(), [pathname, closeMenus])

  // Transição Base -> Movimento -> Controle -> Estabilização do header só se aplica a quem pede overlay.
  useEffect(() => {
    if (!overlayAtTop) { setScrolled(true); return }
    let frame = 0
    const update = () => { setScrolled(window.scrollY > SCROLL_THRESHOLD); frame = 0 }
    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [overlayAtTop])

  // Fecha o menu mobile se a viewport cruzar para desktop com ele aberto (evita scroll travado/foco preso).
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 768px)')
    const onChange = (event: MediaQueryListEvent) => { if (event.matches) setMobileOpen(false) }
    desktop.addEventListener('change', onChange)
    return () => desktop.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    drawerLayerRef.current?.toggleAttribute('inert', !drawerOpen)
  }, [drawerOpen])

  useEffect(() => {
    mobileLayerRef.current?.toggleAttribute('inert', !mobileOpen)
  }, [mobileOpen])

  useEffect(() => {
    if (!drawerOpen && !mobileOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        const wasMobile = mobileOpen
        closeMenus()
        if (wasMobile) hamburgerRef.current?.focus()
        else focusAccountTrigger()
        return
      }
      if (event.key !== 'Tab') return
      const activePanel = drawerOpen ? drawerRef.current : mobileOpen ? mobilePanelRef.current : null
      if (!activePanel) return
      const focusable = Array.from(activePanel.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'))
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    if (drawerOpen) closeButtonRef.current?.focus()
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', onKeyDown) }
  }, [drawerOpen, mobileOpen, closeMenus, focusAccountTrigger])

  // Cascata técnica do menu mobile: painel desliza por CSS, itens entram em stagger pelo GSAP.
  useGSAP(() => {
    const panel = mobilePanelRef.current
    if (!panel || !mobileOpen) return
    const items = panel.querySelectorAll<HTMLElement>('[data-mobile-nav-item]')
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(
        items,
        { x: 28, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.38, stagger: 0.07, ease: 'power3.out', delay: 0.08 },
      )
    })
    return () => mm.revert()
  }, { scope: mobilePanelRef, dependencies: [mobileOpen], revertOnUpdate: true })

  const handleLogout = async () => {
    await createClient().auth.signOut()
    closeMenus()
    window.location.assign('/login')
  }
  const navigateWithTransition = useCallback((href: string) => (event: MouseEvent) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
    const doc = document as Document & { startViewTransition?: (callback: () => void) => void }
    const canTransition = typeof doc.startViewTransition === 'function'
      && window.matchMedia('(prefers-reduced-motion: no-preference)').matches
    if (!canTransition) return
    event.preventDefault()
    doc.startViewTransition!(() => router.push(href))
  }, [router])
  const follow = (event: MouseEvent | FocusEvent) => {
    const key = (event.target as HTMLElement).closest<HTMLElement>('[data-nav-key]')?.dataset.navKey
    if (key) moveMark(key)
  }

  // z-[65]: acima dos overlays do drawer/menu (z-[60]) para o botão hambúrguer permanecer clicável com o menu aberto.
  const headerClass = overlayAtTop
    ? `fixed inset-x-0 top-0 z-[65] transition-all duration-300 ease-out motion-reduce:transition-none ${
        glassWhenScrolled && scrolled
          ? 'mc-glass-bar'
          : useWhiteText
            ? 'border-b border-transparent bg-gradient-to-b from-mc-nav-dark/70 via-mc-nav-dark/30 to-transparent'
            : 'border-b border-mc-border bg-white shadow-mc-elevated'
      }`
    : 'fixed inset-x-0 top-0 z-[65] border-b border-mc-border bg-white'

  return (
    <>
      <header className={headerClass}>
        <a href="#conteudo-principal" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-mc-small focus:bg-mc-action focus:px-4 focus:py-2 focus:text-white">Pular para o conteúdo principal</a>
        <div className="relative h-16" onMouseLeave={() => moveMark(restingKey)}>
          <nav
            ref={barRef}
            aria-label="Navegação principal"
            onMouseOver={follow}
            onMouseLeave={() => moveMark(restingKey)}
            onFocus={follow}
            onBlur={() => moveMark(restingKey)}
            className="relative grid h-16 grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-8 lg:px-12"
          >
            <div className="hidden justify-self-start md:block">
              <Link
                href="/"
                ref={bindItem('eventos')}
                data-nav-key="eventos"
                aria-current={restingKey === 'eventos' ? 'page' : undefined}
                onClick={navigateWithTransition('/')}
                className={`${itemBase} ${itemColor(useWhiteText)}`}
              >
                Eventos
              </Link>
            </div>
            <Link
              href="/"
              ref={bindItem('home')}
              data-nav-key="home"
              aria-label="MEU CAMP, início"
              onClick={navigateWithTransition('/')}
              className={`col-start-2 flex h-16 items-center justify-self-center rounded-mc-small focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${useWhiteText ? 'focus-visible:ring-white' : 'focus-visible:ring-mc-focus'}`}
            >
              <span className="relative block h-7 w-36 sm:w-40">
                <Image src="/images/meucamp-wordmark.png" alt="" fill priority sizes="160px" className={`object-contain transition-opacity duration-300 motion-reduce:transition-none ${useWhiteText ? 'opacity-0' : 'opacity-100'}`} />
                {overlayAtTop ? (
                  <Image src="/images/meucamp-wordmark-light.png" alt="" fill sizes="160px" className={`object-contain transition-opacity duration-300 motion-reduce:transition-none ${useWhiteText ? 'opacity-100' : 'opacity-0'}`} />
                ) : null}
              </span>
            </Link>
            <div className="col-start-3 hidden w-max items-center justify-self-end gap-3 md:flex">
              {isLoggedIn ? (
                <button
                  ref={bindItem('conta')}
                  data-nav-key="conta"
                  type="button"
                  aria-label={`Abrir menu de ${currentUser.name}`}
                  aria-expanded={drawerOpen}
                  aria-controls="account-drawer"
                  onClick={() => { setMobileOpen(false); setDrawerOpen(true) }}
                  className={`relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 ${
                    useWhiteText ? 'border-white/40 bg-white/15 text-white focus-visible:ring-white' : 'border-mc-border bg-mc-action/10 text-mc-action focus-visible:ring-mc-focus'
                  } ${drawerOpen ? 'opacity-0' : 'opacity-100'}`}
                >
                  {currentUser.avatarUrl ? <Image src={currentUser.avatarUrl} alt="" fill sizes="40px" className="object-cover" /> : <span className="font-mc-display text-sm font-bold">{currentUser.initial}</span>}
                </button>
              ) : (
                <Link href="/login" ref={bindItem('login')} data-nav-key="login" aria-current={restingKey === 'login' ? 'page' : undefined} onClick={navigateWithTransition('/login')} className={`${itemBase} ${itemColor(useWhiteText)}`}>
                  Login
                </Link>
              )}
              <Link href={createEventHref} ref={bindItem('criar')} data-nav-key="criar" className={`${itemBase} gap-1.5 ${accentColor(useWhiteText)}`}>
                Criar evento
                <ArrowRight aria-hidden="true" size={15} />
              </Link>
            </div>
            <button
              ref={hamburgerRef}
              type="button"
              aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-public-menu"
              onClick={() => setMobileOpen((open) => !open)}
              className={`col-start-3 inline-flex h-11 w-11 justify-self-end items-center justify-center rounded-mc-small focus-visible:outline-none focus-visible:ring-2 md:hidden ${
                useWhiteText ? 'text-white focus-visible:ring-white' : 'text-mc-text-primary focus-visible:ring-mc-focus'
              }`}
            >
              {mobileOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </button>
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute bottom-0 left-0 hidden h-0.5 w-9 bg-mc-action motion-reduce:transition-none md:block ${mark.visible ? 'opacity-100' : 'opacity-0'}`}
              style={{ transform: `translate3d(${mark.left}px, 0, 0)`, transition: 'transform 200ms ease, opacity 200ms ease' }}
            />
          </nav>
        </div>
      </header>

      <div ref={drawerLayerRef} className={`fixed inset-0 z-[60] transition-visibility duration-mc-normal ${drawerOpen ? 'visible' : 'invisible'}`} aria-hidden={!drawerOpen}>
        <button type="button" aria-label="Fechar menu da conta" tabIndex={drawerOpen ? 0 : -1} onClick={closeMenus} className={`absolute inset-0 bg-mc-text-primary/55 transition-opacity duration-mc-slow ${drawerOpen ? 'opacity-100' : 'opacity-0'}`} />
        <aside ref={drawerRef} id="account-drawer" role="dialog" aria-modal="true" aria-labelledby="account-drawer-title" className={`absolute top-16 bottom-0 right-0 flex w-[min(90vw,21.25rem)] flex-col bg-mc-surface shadow-mc-elevated transition-transform duration-mc-slow ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between border-b border-mc-border px-5 py-5">
            <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-mc-action">Sua conta</p><h2 id="account-drawer-title" className="mt-1 truncate font-mc-display text-xl font-bold text-mc-text-primary">{currentUser?.name || 'Conta'}</h2></div>
            <button ref={closeButtonRef} type="button" aria-label="Fechar menu" onClick={() => { setDrawerOpen(false); focusAccountTrigger() }} className="flex h-11 w-11 items-center justify-center rounded-mc-small text-mc-text-primary hover:bg-mc-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"><X aria-hidden="true" /></button>
          </div>
          <nav aria-label="Menu da conta" className="flex-1 px-3 py-4">{accountLinks.map(link => <Link key={link.href} href={link.href} prefetch={false} onClick={closeMenus} className="group flex min-h-14 items-center gap-3 rounded-mc-medium px-3 text-sm font-semibold text-mc-text-primary transition-colors hover:bg-mc-action/5 hover:text-mc-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"><link.icon aria-hidden="true" size={20} className="text-mc-action" />{link.label}<ArrowRight aria-hidden="true" size={16} className="ml-auto transition-transform group-hover:translate-x-1" /></Link>)}</nav>
          <div className="border-t border-mc-border p-4"><button type="button" onClick={handleLogout} className="flex min-h-12 w-full items-center gap-3 rounded-mc-medium px-3 text-sm font-semibold text-mc-error hover:bg-mc-error/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"><LogOut aria-hidden="true" size={20} />Sair da conta</button></div>
        </aside>
      </div>

      <div ref={mobileLayerRef} className={`fixed inset-0 z-[60] transition-visibility duration-mc-normal md:hidden ${mobileOpen ? 'visible' : 'invisible'}`} aria-hidden={!mobileOpen}>
        <button type="button" aria-label="Fechar menu de navegação" tabIndex={mobileOpen ? 0 : -1} onClick={closeMenus} className={`absolute inset-0 bg-mc-text-primary/55 transition-opacity duration-mc-slow ${mobileOpen ? 'opacity-100' : 'opacity-0'}`} />
        <nav
          ref={mobilePanelRef}
          id="mobile-public-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Navegação principal mobile"
          className={`absolute top-16 bottom-0 right-0 flex w-[min(85vw,20rem)] flex-col bg-white shadow-mc-elevated transition-transform duration-mc-slow ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="border-b border-mc-border px-5 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-mc-action">Menu</p>
          </div>
          <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-5 py-4">
            <Link data-mobile-nav-item href="/" aria-current={restingKey === 'eventos' ? 'page' : undefined} onClick={(event) => { closeMenus(); navigateWithTransition('/')(event) }} className="flex min-h-12 items-center border-b border-mc-border text-sm font-bold uppercase tracking-[0.16em] text-mc-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus">
              Eventos
              {restingKey === 'eventos' ? <span aria-hidden="true" className="ml-3 h-0.5 w-9 bg-mc-action" /> : null}
            </Link>
            {isLoggedIn ? (
              <button data-mobile-nav-item type="button" onClick={() => { setMobileOpen(false); setDrawerOpen(true) }} className="flex min-h-12 w-full items-center border-b border-mc-border text-left text-sm font-bold uppercase tracking-[0.16em] text-mc-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus">
                Minha conta
              </button>
            ) : (
              <Link data-mobile-nav-item href="/login" aria-current={restingKey === 'login' ? 'page' : undefined} onClick={(event) => { closeMenus(); navigateWithTransition('/login')(event) }} className="flex min-h-12 items-center border-b border-mc-border text-sm font-bold uppercase tracking-[0.16em] text-mc-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus">
                Login
                {restingKey === 'login' ? <span aria-hidden="true" className="ml-3 h-0.5 w-9 bg-mc-action" /> : null}
              </Link>
            )}
            <Link data-mobile-nav-item href={createEventHref} onClick={closeMenus} className="flex min-h-12 items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-mc-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus">
              Criar evento <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
        </nav>
      </div>
    </>
  )
}
