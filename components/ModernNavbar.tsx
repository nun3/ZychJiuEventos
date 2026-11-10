'use client'

import { BeltBadge } from '@/components/BeltBadge'
import { useAthleteBelt } from '@/hooks/useAthleteBelt'
import { beltLabel } from '@/lib/athletes/belt'
import { useCallback, useEffect, useRef, useState, type FocusEvent, type MouseEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ArrowRight, Menu, X } from 'lucide-react'
import { CinematicMenu, type CinematicMenuItem } from '@/components/navigation/CinematicMenu'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { pushWithViewTransition } from '@/lib/navigation/view-transition'
import { createClient } from '@/lib/supabase/client'

const CREATE_EVENT_HREF = '/admin/eventos/novo'
const CREATE_EVENT_REGISTER = `/login?mode=register&redirectTo=${encodeURIComponent(CREATE_EVENT_HREF)}`
const MENU_ID = 'site-menu'
const accountLinks = [
  { href: '/dashboard', label: 'Meu painel' },
  { href: '/dashboard/meu-perfil', label: 'Meu perfil' },
  { href: '/dashboard/inscricoes', label: 'Minhas inscrições' },
  { href: '/dashboard/meus-atletas', label: 'Minhas equipes' },
  { href: '/admin/eventos', label: 'Meus eventos' },
]
const publicMenuLinks = [
  { href: '/eventos', label: 'Eventos' },
  { href: '/academias', label: 'Academias e equipes' },
  { href: '/sistema', label: 'O sistema' },
  { href: '/noticias', label: 'Notícias' },
  { href: '/quem-somos', label: 'Quem somos' },
]

const MARK = 36
const SCROLL_THRESHOLD = 72

function currentNavKey(pathname: string) {
  // A Home ("/") é a experiência da marca: nenhum item do menu fica ativo nela.
  if (pathname === '/login') return 'login'
  return null
}

const itemBase = 'inline-flex h-16 items-center px-3 font-mc-interface text-[0.8125rem] font-semibold uppercase tracking-[0.14em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
const itemColor = (white: boolean) =>
  white ? 'text-white hover:text-blue-200 focus-visible:ring-white' : 'text-mc-text-primary hover:text-mc-action focus-visible:ring-mc-focus'
const accentColor = (white: boolean) =>
  white ? 'text-blue-300 hover:text-blue-200 focus-visible:ring-white' : 'text-mc-action hover:text-mc-action/80 focus-visible:ring-mc-focus'

/**
 * Navegação das telas públicas (Home, eventos, institucionais, login). Abre o menu cinematográfico: o avatar (desktop,
 * logado) e o hambúrguer (celular) são os gatilhos. As telas internas (dashboard, admin, platform) usam o InternalNav.
 *
 * overlayAtTop: nasce transparente sobre um hero escuro.
 * scrolledTone: como fica depois de rolar — 'solid' (branco, padrão) ou 'glass' (vidro translúcido, texto claro; usado na Home).
 */
export default function ModernNavbar({
  overlayAtTop = false,
  scrolledTone = 'solid',
}: {
  overlayAtTop?: boolean
  scrolledTone?: 'solid' | 'glass'
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { currentUser, isLoggedIn } = useCurrentUser()
  const belt = useAthleteBelt(isLoggedIn)
  const [menuOpen, setMenuOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const [scrolled, setScrolled] = useState(!overlayAtTop)
  const [mark, setMark] = useState({ left: 0, visible: false })
  const barRef = useRef<HTMLElement>(null)
  const nodes = useRef(new Map<string, HTMLElement>())
  const restingKey = currentNavKey(pathname)
  const glassWhenScrolled = overlayAtTop && scrolledTone === 'glass'
  const useWhiteText = overlayAtTop && (glassWhenScrolled || !scrolled)
  const createEventHref = isLoggedIn ? CREATE_EVENT_HREF : CREATE_EVENT_REGISTER

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

  // Ao trocar de página o menu fecha.
  useEffect(() => setMenuOpen(false), [pathname])

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

  const handleLogout = async () => {
    await createClient().auth.signOut()
    setMenuOpen(false)
    window.location.assign('/login')
  }
  const push = useCallback((href: string) => pushWithViewTransition(router.push, href), [router])
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

  // z-[65]: acima do menu cinematográfico (z-[61]) para o botão de abrir/fechar continuar clicável com o menu aberto.
  const headerClass = overlayAtTop
    ? `fixed inset-x-0 top-0 z-[65] transition-all duration-300 ease-out motion-reduce:transition-none ${
        glassWhenScrolled && scrolled
          ? 'mc-glass-bar'
          : useWhiteText
            ? 'border-b border-transparent bg-gradient-to-b from-mc-nav-dark/70 via-mc-nav-dark/30 to-transparent'
            : 'border-b border-mc-border bg-white shadow-mc-elevated'
      }`
    : 'fixed inset-x-0 top-0 z-[65] border-b border-mc-border bg-white'

  const here = (href: string) => (href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`))
  const menuItems: CinematicMenuItem[] = [
    ...publicMenuLinks.map((link) => ({ ...link, current: here(link.href) })),
    ...(isLoggedIn ? accountLinks.map(({ href, label }) => ({ href, label, current: here(href) })) : [{ href: '/login', label: 'Entrar', current: here('/login') }]),
    { href: createEventHref, label: 'Criar evento' },
    ...(isLoggedIn ? [{ label: 'Sair da conta', onAction: () => { void handleLogout() } }] : []),
  ].map((item, i) => ({ ...item, index: String(i + 1).padStart(2, '0') })) as CinematicMenuItem[]

  return (
    // O menu e o gatilho precisam estar no mesmo escopo: o CinematicMenu isola (inert) tudo que está fora dele.
    <div>
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
            <div className="justify-self-start">
              {belt ? (
                <Link
                  href="/experiencia"
                  onClick={navigateWithTransition('/experiencia')}
                  aria-label={`Experiência MEU CAMP (${beltLabel(belt)})`}
                  title={beltLabel(belt)}
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none ${useWhiteText ? 'focus-visible:ring-white' : 'focus-visible:ring-mc-focus'}`}
                >
                  <BeltBadge belt={belt.belt} grau={belt.grau} size={30} />
                </Link>
              ) : null}
            </div>
            <Link
              href="/eventos"
              ref={bindItem('home')}
              data-nav-key="home"
              aria-label="MEU CAMP, eventos"
              onClick={navigateWithTransition('/eventos')}
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
                  ref={(el) => { bindItem('conta')(el); if (el) triggerRef.current = el }}
                  data-nav-key="conta"
                  type="button"
                  aria-label={menuOpen ? 'Fechar menu' : `Abrir menu de ${currentUser?.name ?? 'Conta'}`}
                  aria-expanded={menuOpen}
                  aria-controls={MENU_ID}
                  onClick={() => setMenuOpen((open) => !open)}
                  className={`relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 ${
                    useWhiteText ? 'border-white/40 bg-white/15 text-white focus-visible:ring-white' : 'border-mc-border bg-mc-action/10 text-mc-action focus-visible:ring-mc-focus'
                  }`}
                >
                  {menuOpen ? <X aria-hidden="true" size={18} /> : currentUser?.avatarUrl ? <Image src={currentUser.avatarUrl} alt="" fill sizes="40px" className="object-cover" /> : <span className="font-mc-display text-sm font-bold">{currentUser?.initial}</span>}
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
              ref={(el) => { if (el) triggerRef.current = el }}
              type="button"
              aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={menuOpen}
              aria-controls={MENU_ID}
              onClick={() => setMenuOpen((open) => !open)}
              className={`col-start-3 inline-flex h-11 w-11 justify-self-end items-center justify-center rounded-mc-small focus-visible:outline-none focus-visible:ring-2 md:hidden ${
                useWhiteText ? 'text-white focus-visible:ring-white' : 'text-mc-text-primary focus-visible:ring-mc-focus'
              }`}
            >
              {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </button>
            <span
              aria-hidden="true"
              className={`pointer-events-none absolute bottom-0 left-0 hidden h-0.5 w-9 bg-mc-action motion-reduce:transition-none md:block ${mark.visible ? 'opacity-100' : 'opacity-0'}`}
              style={{ transform: `translate3d(${mark.left}px, 0, 0)`, transition: 'transform 200ms ease, opacity 200ms ease' }}
            />
          </nav>
        </div>
      </header>

      <CinematicMenu
        id={MENU_ID}
        open={menuOpen}
        items={menuItems}
        onClose={() => setMenuOpen(false)}
        triggerRef={triggerRef as React.RefObject<HTMLButtonElement>}
        onNavigate={push}
        topLabel={isLoggedIn && currentUser ? currentUser.name : 'menu'}
      />
    </div>
  )
}
