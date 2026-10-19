'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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

export default function ModernNavbar({ overlayAtTop = false }: { overlayAtTop?: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null)
  const [scrolled, setScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const avatarButtonRef = useRef<HTMLButtonElement>(null)
  const drawerLayerRef = useRef<HTMLDivElement>(null)
  const drawerRef = useRef<HTMLElement>(null)
  const isHomeTop = (pathname === '/' || overlayAtTop) && !scrolled
  const isLoggedIn = currentUser !== null
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

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 32)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

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
        avatarButtonRef.current?.focus()
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
    router.replace('/login')
    router.refresh()
  }
  const linkClass = isHomeTop ? 'text-white hover:text-blue-200 focus-visible:ring-white' : 'text-mc-text-primary hover:text-mc-action focus-visible:ring-mc-focus'

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-50 transition-colors duration-mc-normal ${isHomeTop ? 'bg-transparent' : 'border-b border-mc-border bg-white/95 shadow-mc-subtle backdrop-blur-md'}`}>
        <a href="#conteudo-principal" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-mc-small focus:bg-mc-action focus:px-4 focus:py-2 focus:text-white">Pular para o conteúdo principal</a>
        <div className="flex min-h-20 w-full items-center justify-between gap-8 px-4 sm:px-8 lg:px-12 xl:px-20">
          <div className="flex items-center gap-10">
            <Link href="/" aria-label="MEU CAMP — Início" className="shrink-0 rounded-mc-small focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2">
              <span className="relative block h-8 w-40 sm:w-44"><Image src={isHomeTop ? '/images/meucamp-wordmark-light.png' : '/images/meucamp-wordmark.png'} alt="MEU CAMP" fill priority sizes="176px" className="object-contain object-left" /></span>
            </Link>
            <Link href="/" aria-current={pathname === '/' ? 'page' : undefined} className={`hidden min-h-11 items-center border-b-2 text-xs font-bold uppercase tracking-[0.18em] transition-colors focus-visible:outline-none focus-visible:ring-2 md:inline-flex ${pathname === '/' ? 'border-mc-action' : 'border-transparent'} ${linkClass}`}>Início</Link>
          </div>
          <nav aria-label="Navegação principal" className="ml-auto hidden w-auto shrink-0 items-center gap-6 md:flex">
            {isLoggedIn ? (
              <button ref={avatarButtonRef} type="button" aria-label={`Abrir menu de ${currentUser.name}`} aria-expanded={drawerOpen} aria-controls="account-drawer" onClick={() => setDrawerOpen(true)} className={`relative order-2 flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 transition-all duration-mc-slow focus-visible:outline-none focus-visible:ring-2 ${isHomeTop ? 'border-white/70 bg-white/10 text-white focus-visible:ring-white' : 'border-mc-border bg-mc-action/10 text-mc-action focus-visible:ring-mc-focus'} ${drawerOpen ? 'scale-75 opacity-0' : 'opacity-100'}`}>
                {currentUser.avatarUrl ? <Image src={currentUser.avatarUrl} alt="" fill sizes="44px" className="object-cover" /> : <span className="font-mc-display font-bold">{currentUser.initial}</span>}
              </button>
            ) : <Link href="/login" className={`inline-flex min-h-11 items-center text-xs font-bold uppercase tracking-[0.18em] transition-colors focus-visible:outline-none focus-visible:ring-2 ${linkClass}`}>Login</Link>}
            <Link href={createEventHref} className="group order-1 inline-flex min-h-11 items-center gap-2 rounded-mc-small bg-mc-action px-5 text-xs font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Criar evento <ArrowRight aria-hidden="true" size={15} className="transition-transform group-hover:translate-x-1" /></Link>
          </nav>
          <button type="button" aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={mobileOpen} aria-controls="mobile-public-menu" onClick={() => setMobileOpen(open => !open)} className={`inline-flex h-11 w-11 items-center justify-center rounded-mc-small focus-visible:outline-none focus-visible:ring-2 md:hidden ${linkClass}`}>{mobileOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</button>
        </div>
        {mobileOpen ? (
          <nav id="mobile-public-menu" aria-label="Navegação principal mobile" className="border-t border-mc-border bg-white px-4 py-4 shadow-mc-elevated md:hidden">
            <Link href="/" onClick={closeMenus} className="flex min-h-12 items-center border-b border-mc-border text-sm font-bold uppercase tracking-[0.16em] text-mc-text-primary">Início</Link>
            {isLoggedIn ? <button type="button" onClick={() => { setMobileOpen(false); setDrawerOpen(true) }} className="flex min-h-12 w-full items-center border-b border-mc-border text-left text-sm font-bold uppercase tracking-[0.16em] text-mc-text-primary">Minha conta</button> : <Link href="/login" onClick={closeMenus} className="flex min-h-12 items-center border-b border-mc-border text-sm font-bold uppercase tracking-[0.16em] text-mc-text-primary">Login</Link>}
            <Link href={createEventHref} onClick={closeMenus} className="flex min-h-12 items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-mc-action">Criar evento <ArrowRight aria-hidden="true" size={16} /></Link>
          </nav>
        ) : null}
      </header>

      <div ref={drawerLayerRef} className={`fixed inset-0 z-[60] transition-visibility duration-mc-normal ${drawerOpen ? 'visible' : 'invisible'}`} aria-hidden={!drawerOpen}>
        <button type="button" aria-label="Fechar menu da conta" tabIndex={drawerOpen ? 0 : -1} onClick={closeMenus} className={`absolute inset-0 bg-mc-text-primary/55 transition-opacity duration-mc-slow ${drawerOpen ? 'opacity-100' : 'opacity-0'}`} />
        <aside ref={drawerRef} id="account-drawer" role="dialog" aria-modal="true" aria-labelledby="account-drawer-title" className={`absolute inset-y-0 right-0 flex w-[min(90vw,21.25rem)] flex-col bg-mc-surface shadow-mc-elevated transition-transform duration-mc-slow ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between border-b border-mc-border px-5 py-5">
            <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-mc-action">Sua conta</p><h2 id="account-drawer-title" className="mt-1 truncate font-mc-display text-xl font-bold text-mc-text-primary">{currentUser?.name || 'Conta'}</h2></div>
            <button ref={closeButtonRef} type="button" aria-label="Fechar menu" onClick={() => { setDrawerOpen(false); avatarButtonRef.current?.focus() }} className="flex h-11 w-11 items-center justify-center rounded-mc-small text-mc-text-primary hover:bg-mc-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"><X aria-hidden="true" /></button>
          </div>
          <nav aria-label="Menu da conta" className="flex-1 px-3 py-4">{accountLinks.map(link => <Link key={link.href} href={link.href} onClick={closeMenus} className="group flex min-h-14 items-center gap-3 rounded-mc-medium px-3 text-sm font-semibold text-mc-text-primary transition-colors hover:bg-mc-action/5 hover:text-mc-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"><link.icon aria-hidden="true" size={20} className="text-mc-action" />{link.label}<ArrowRight aria-hidden="true" size={16} className="ml-auto transition-transform group-hover:translate-x-1" /></Link>)}</nav>
          <div className="border-t border-mc-border p-4"><button type="button" onClick={handleLogout} className="flex min-h-12 w-full items-center gap-3 rounded-mc-medium px-3 text-sm font-semibold text-mc-error hover:bg-mc-error/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"><LogOut aria-hidden="true" size={20} />Sair da conta</button></div>
        </aside>
      </div>
    </>
  )
}
