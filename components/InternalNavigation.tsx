'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

// Posição do último indicador. A navbar remonta ao trocar de layout (ex.: Visão geral -> Eventos, em /admin);
// guardar a posição permite que o indicador deslize a partir de onde estava em vez de reaparecer.
let lastIndicatorX: number | null = null
// Últimas permissões vistas: o skeleton de /admin/eventos (a navbar mora dentro da página) mantém a navbar na tela.
let lastFlags: { canManageEvents: boolean; canManageOrganization: boolean; isPlatformAdmin: boolean } | null = null
const INDICATOR_WIDTH = 36
const PENDING_TIMEOUT_MS = 8000

export default function InternalNavigation({
  canManageEvents: canManageEventsProp = false,
  canManageOrganization: canManageOrganizationProp = false,
  isPlatformAdmin: isPlatformAdminProp = false,
  fluid = false,
  remembered = false,
}: {
  remembered?: boolean
  canManageEvents?: boolean
  canManageOrganization?: boolean
  isPlatformAdmin?: boolean
  fluid?: boolean
}) {
  const isBrowser = typeof window !== 'undefined' // estado de módulo só no cliente: no servidor seria compartilhado entre usuários
  const flags = remembered && isBrowser && lastFlags
    ? lastFlags
    : { canManageEvents: canManageEventsProp, canManageOrganization: canManageOrganizationProp, isPlatformAdmin: isPlatformAdminProp }
  if (!remembered && isBrowser) lastFlags = flags
  const { canManageEvents, canManageOrganization, isPlatformAdmin } = flags
  const pathname = usePathname()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [pendingHref, setPendingHref] = useState<string | null>(null)
  const [failedHref, setFailedHref] = useState<string | null>(null)
  const [indicator, setIndicator] = useState<{ x: number; animate: boolean } | null>(null)
  const items = [
    { href: '/dashboard', label: 'Visão geral', active: (path: string) => path === '/dashboard' },
    canManageEvents ? { href: '/admin/eventos', label: 'Eventos', active: (path: string) => path.startsWith('/admin/eventos') } : null,
    canManageOrganization ? { href: '/dashboard/organizacao', label: 'Organização', active: (path: string) => path.startsWith('/dashboard/organizacao') } : null,
    isPlatformAdmin ? { href: '/platform/organizacoes', label: 'Organizações', active: (path: string) => path.startsWith('/platform/organizacoes') } : null,
    isPlatformAdmin ? { href: '/platform/destaques', label: 'Destaques', active: (path: string) => path.startsWith('/platform/destaques') } : null,
    { href: '/dashboard/meus-atletas', label: 'Atletas', active: (path: string) => path.startsWith('/dashboard/meus-atletas') },
    { href: '/dashboard/inscricoes', label: 'Inscrições', active: (path: string) => path.startsWith('/dashboard/inscricoes') || path.startsWith('/dashboard/pagamentos') },
    { href: '/dashboard/meu-perfil', label: 'Perfil', active: (path: string) => path === '/dashboard/meu-perfil' || path === '/dashboard/alterar-cadastro' },
  ].filter((item): item is NonNullable<typeof item> => Boolean(item))

  const activeHref = items.find((item) => item.active(pathname))?.href ?? null
  // Navegação confirmada (rota mudou): limpa o estado pendente. Nunca antes disso.
  useEffect(() => {
    setPendingHref(null)
    setFailedHref(null)
  }, [pathname])

  // Sem confirmação em tempo razoável: avisa e permite nova tentativa (não simula sucesso).
  useEffect(() => {
    if (!pendingHref) return
    const timer = window.setTimeout(() => {
      setFailedHref(pendingHref)
      setPendingHref(null)
    }, PENDING_TIMEOUT_MS)
    return () => window.clearTimeout(timer)
  }, [pendingHref])

  const targetHref = pendingHref ?? activeHref
  const itemsKey = items.map((item) => item.href).join('|')

  const measure = useCallback(() => {
    const track = trackRef.current
    const target = targetHref ? track?.querySelector<HTMLElement>(`[data-nav-href="${targetHref}"]`) : null
    if (!target) return null
    return target.offsetLeft + target.offsetWidth / 2 - INDICATOR_WIDTH / 2
  }, [targetHref])

  // Antes da pintura: se a navbar acabou de remontar, parte da posição anterior e desliza até a nova.
  useLayoutEffect(() => {
    const x = measure()
    if (x === null) {
      setIndicator(null)
      return
    }
    setIndicator((current) => {
      if (current) return { x, animate: true }
      if (lastIndicatorX !== null && lastIndicatorX !== x) return { x: lastIndicatorX, animate: false }
      return { x, animate: false }
    })
    lastIndicatorX = x
  }, [measure, itemsKey])

  // Segundo passo da remontagem: com a posição anterior já pintada, liga a transição e vai ao destino.
  useEffect(() => {
    if (!indicator || indicator.animate || lastIndicatorX === null || indicator.x === lastIndicatorX) return
    const frame = requestAnimationFrame(() => setIndicator({ x: lastIndicatorX as number, animate: true }))
    return () => cancelAnimationFrame(frame)
  }, [indicator])

  // Fontes/rolagem/tamanho de tela mudam as larguras: reposiciona sem animar.
  useEffect(() => {
    const track = trackRef.current
    if (!track || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      const x = measure()
      if (x !== null) {
        lastIndicatorX = x
        setIndicator((current) => (current && current.x !== x ? { x, animate: false } : current))
      }
    })
    observer.observe(track)
    return () => observer.disconnect()
  }, [measure])

  useEffect(() => {
    const scroller = scrollerRef.current
    const active = scroller?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!scroller || !active || scroller.scrollWidth <= scroller.clientWidth) return
    const left = active.getBoundingClientRect().left - scroller.getBoundingClientRect().left + scroller.scrollLeft
    scroller.scrollLeft = Math.max(0, left - (scroller.clientWidth - active.offsetWidth) / 2)
  }, [pathname])

  const retry = failedHref ? items.find((item) => item.href === failedHref) : null

  return (
    <nav aria-label="Navegação da área interna" aria-busy={pendingHref ? true : undefined} className="sticky top-16 z-40 border-b border-mc-border bg-white">
      <div
        ref={scrollerRef}
        className={fluid ? 'flex w-full overflow-x-auto px-4 sm:px-8 lg:px-12' : 'mx-auto flex max-w-7xl overflow-x-auto px-4 sm:px-6 lg:px-8'}
      >
        <div ref={trackRef} className="relative flex shrink-0">
          {items.map((item) => {
            const isActive = item.active(pathname)
            const isPending = pendingHref === item.href
            const highlighted = isPending || (isActive && !pendingHref)
            return (
              <Link
                key={item.href}
                href={item.href}
                data-nav-href={item.href}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => {
                  setFailedHref(null)
                  // Feedback imediato; a rota atual só muda quando a navegação é confirmada.
                  if (!isActive) setPendingHref(item.href)
                }}
                className={`relative inline-flex h-12 shrink-0 items-center px-3 font-mc-interface text-[0.8125rem] font-semibold uppercase tracking-[0.14em] transition-colors duration-mc-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mc-focus ${
                  highlighted ? 'text-mc-text-primary' : 'text-mc-text-secondary hover:text-mc-text-primary'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
          <span
            aria-hidden="true"
            data-testid="nav-indicator"
            data-state={pendingHref ? 'pending' : 'active'}
            className="pointer-events-none absolute bottom-0 left-0 h-0.5 bg-mc-action"
            style={{
              width: INDICATOR_WIDTH,
              transform: `translate3d(${indicator?.x ?? 0}px, 0, 0)`,
              opacity: indicator ? (pendingHref ? 0.55 : 1) : 0,
              transition: indicator?.animate
                ? 'transform var(--mc-motion-normal) var(--mc-ease-standard), opacity var(--mc-motion-fast) linear'
                : 'none',
            }}
          />
        </div>
      </div>
      {retry ? (
        <div role="alert" className="flex items-center gap-3 border-t border-mc-border bg-mc-surface-secondary px-4 py-2 font-mc-interface text-sm text-mc-text-secondary sm:px-8 lg:px-12">
          <span>Não foi possível abrir “{retry.label}”.</span>
          <Link
            href={retry.href}
            onClick={() => { setFailedHref(null); setPendingHref(retry.href) }}
            className="font-semibold text-mc-action hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus"
          >
            Tentar novamente
          </Link>
        </div>
      ) : null}
    </nav>
  )
}
