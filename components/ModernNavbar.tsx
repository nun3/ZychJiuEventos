'use client'

import { useCallback, useEffect, useRef, useState, type FocusEvent, type MouseEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight, CalendarDays, ClipboardList, LayoutDashboard, LogOut, Menu, UserRound, UsersRound, X } from 'lucide-react'
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

function currentNavKey(pathname: string) {
  if (pathname === '/') return 'home'
  if (pathname === '/eventos' || pathname.startsWith('/eventos/')) return 'eventos'
  if (pathname === '/login') return 'login'
  return null
}

export default function ModernNavbar({ overlayAtTop = false }: { overlayAtTop?: boolean }) {
  const pathname = usePathname()
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mark, setMark] = useState({ left: 0, visible: false })
  const barRef = useRef<HTMLElement>(null)
  const nodes = useRef(new Map<string, HTMLElement>())
  const restingKey = currentNavKey(pathname)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const drawerLayerRef = useRef<HTMLDivElement>(null)
  const drawerRef = useRef<HTMLElement>(null)
  const isLoggedIn = currentUser !== null
  void overlayAtTop
  const createEventHref = isLoggedIn ? CREATE_EVENT_HREF : CREATE_EVENT_REGISTER

  const closeMenus = useCallback(() => { setDrawerOpen(false); setMobileOpen(false) }, [])

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

  useEffect(() => {
    drawerLayerRef.current?.toggleAttribute('inert', !drawerOpen)
  }, [drawerOpen])

  useEffect(() => {
    if (!drawerOpen && !mobileOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenus()
        nodes.current.get('conta')?.focus()
        return
      }
      if (event.key !== 'Tab' || !drawerOpen || !drawerRef.current) return
      const focusable = Array.from(drawerRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'))
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    if (drawerOpen) closeButtonRef.current?.focus()
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', onKeyDown) }
  }, [drawerOpen, mobileOpen, closeMenus])

  const handleLogout = async () => {
    await createClient().auth.signOut()
    closeMenus()
    window.location.assign('/login')
  }
  const itemClass = 'inline-flex h-16 items-center px-3 font-mc-interface text-[0.8125rem] font-semibold uppercase tracking-[0.14em] text-mc-text-primary transition-colors duration-200 hover:text-mc-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2'
  const follow = (event: MouseEvent | FocusEvent) => {
    const key = (event.target as HTMLElement).closest<HTMLElement>('[data-nav-key]')?.dataset.navKey
    if (key) moveMark(key)
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-mc-border bg-white">
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
                href="/eventos"
                ref={bindItem('eventos')}
                data-nav-key="eventos"
                aria-current={restingKey === 'eventos' ? 'page' : undefined}
                className={itemClass}
              >
                Eventos
              </Link>
            </div>
            <Link
              href="/"
              ref={bindItem('home')}
              data-nav-key="home"
              aria-label="MEU CAMP, início"
              aria-current={restingKey === 'home' ? 'page' : undefined}
              className="col-start-2 flex h-16 items-center justify-self-center rounded-mc-small focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2"
            >
              <span className="relative block h-7 w-36 sm:w-40">
                <Image src="/images/meucamp-wordmark.png" alt="" fill priority sizes="160px" className="object-contain" />
              </span>
            </Link>
            <div className="col-start-3 hidden w-max justify-self-end md:flex">
              {isLoggedIn ? (
                <button
                  ref={bindItem('conta')}
                  data-nav-key="conta"
                  type="button"
                  aria-label={`Abrir menu de ${currentUser.name}`}
                  aria-expanded={drawerOpen}
                  aria-controls="account-drawer"
                  onClick={() => setDrawerOpen(true)}
                  className={`relative mx-2 flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-mc-border bg-mc-action/10 text-mc-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus ${drawerOpen ? 'opacity-0' : 'opacity-100'}`}
                >
                  {currentUser.avatarUrl ? <Image src={currentUser.avatarUrl} alt="" fill sizes="40px" className="object-cover" /> : <span className="font-mc-display text-sm font-bold">{currentUser.initial}</span>}
                </button>
              ) : (
                <Link href="/login" ref={bindItem('login')} data-nav-key="login" aria-current={restingKey === 'login' ? 'page' : undefined} className={itemClass}>
                  Login
                </Link>
              )}
              <Link href={createEventHref} ref={bindItem('criar')} data-nav-key="criar" className={`${itemClass} gap-1.5 text-mc-action`}>
                Criar evento
                <ArrowRight aria-hidden="true" size={15} />
              </Link>
            </div>
            <button type="button" aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={mobileOpen} aria-controls="mobile-public-menu" onClick={() => setMobileOpen(open => !open)} className="col-start-3 inline-flex h-11 w-11 justify-self-end items-center justify-center rounded-mc-small text-mc-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus md:hidden">{mobileOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</button>
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute bottom-0 left-0 hidden h-0.5 w-9 bg-mc-action motion-reduce:transition-none md:block ${mark.visible ? 'opacity-100' : 'opacity-0'}`}
              style={{ transform: `translate3d(${mark.left}px, 0, 0)`, transition: 'transform 200ms ease, opacity 200ms ease' }}
            />
          </nav>
        </div>
        {mobileOpen ? (
          <nav id="mobile-public-menu" aria-label="Navegação principal mobile" className="border-t border-mc-border bg-white px-4 py-2 shadow-mc-elevated md:hidden">
            <Link href="/eventos" aria-current={restingKey === 'eventos' ? 'page' : undefined} onClick={closeMenus} className="flex min-h-12 items-center border-b border-mc-border text-sm font-bold uppercase tracking-[0.16em] text-mc-text-primary">
              Eventos
              {restingKey === 'eventos' ? <span aria-hidden="true" className="ml-3 h-0.5 w-9 bg-mc-action" /> : null}
            </Link>
            {isLoggedIn ? <button type="button" onClick={() => { setMobileOpen(false); setDrawerOpen(true) }} className="flex min-h-12 w-full items-center border-b border-mc-border text-left text-sm font-bold uppercase tracking-[0.16em] text-mc-text-primary">Minha conta</button> : <Link href="/login" aria-current={restingKey === 'login' ? 'page' : undefined} onClick={closeMenus} className="flex min-h-12 items-center border-b border-mc-border text-sm font-bold uppercase tracking-[0.16em] text-mc-text-primary">Login{restingKey === 'login' ? <span aria-hidden="true" className="ml-3 h-0.5 w-9 bg-mc-action" /> : null}</Link>}
            <Link href={createEventHref} onClick={closeMenus} className="flex min-h-12 items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-mc-action">Criar evento <ArrowRight aria-hidden="true" size={16} /></Link>
          </nav>
        ) : null}
      </header>

      <div ref={drawerLayerRef} className={`fixed inset-0 z-[60] transition-visibility duration-mc-normal ${drawerOpen ? 'visible' : 'invisible'}`} aria-hidden={!drawerOpen}>
        <button type="button" aria-label="Fechar menu da conta" tabIndex={drawerOpen ? 0 : -1} onClick={closeMenus} className={`absolute inset-0 bg-mc-text-primary/55 transition-opacity duration-mc-slow ${drawerOpen ? 'opacity-100' : 'opacity-0'}`} />
        <aside ref={drawerRef} id="account-drawer" role="dialog" aria-modal="true" aria-labelledby="account-drawer-title" className={`absolute inset-y-0 right-0 flex w-[min(90vw,21.25rem)] flex-col bg-mc-surface shadow-mc-elevated transition-transform duration-mc-slow ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between border-b border-mc-border px-5 py-5">
            <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-mc-action">Sua conta</p><h2 id="account-drawer-title" className="mt-1 truncate font-mc-display text-xl font-bold text-mc-text-primary">{currentUser?.name || 'Conta'}</h2></div>
            <button ref={closeButtonRef} type="button" aria-label="Fechar menu" onClick={() => { setDrawerOpen(false); nodes.current.get('conta')?.focus() }} className="flex h-11 w-11 items-center justify-center rounded-mc-small text-mc-text-primary hover:bg-mc-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"><X aria-hidden="true" /></button>
          </div>
          <nav aria-label="Menu da conta" className="flex-1 px-3 py-4">{accountLinks.map(link => <Link key={link.href} href={link.href} prefetch={false} onClick={closeMenus} className="group flex min-h-14 items-center gap-3 rounded-mc-medium px-3 text-sm font-semibold text-mc-text-primary transition-colors hover:bg-mc-action/5 hover:text-mc-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"><link.icon aria-hidden="true" size={20} className="text-mc-action" />{link.label}<ArrowRight aria-hidden="true" size={16} className="ml-auto transition-transform group-hover:translate-x-1" /></Link>)}</nav>
          <div className="border-t border-mc-border p-4"><button type="button" onClick={handleLogout} className="flex min-h-12 w-full items-center gap-3 rounded-mc-medium px-3 text-sm font-semibold text-mc-error hover:bg-mc-error/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"><LogOut aria-hidden="true" size={20} />Sair da conta</button></div>
        </aside>
      </div>
    </>
  )
}
