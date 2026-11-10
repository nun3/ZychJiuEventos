'use client'

/**
 * Menu cinematográfico: porte de components/events/CinematicAccountMenu.tsx
 * (integration/motion-lab-eventos-20261107), ele mesmo um porte de components/motion-lab/CinematicMenu.tsx
 * (experiment/meucamp-motion-design, 72a88a5). Mesmo contrato de foco, Escape, Tab e isolamento do fundo (inert).
 *
 * Adaptações: itens com href usam <Link> e navegam pelo app (sem recarregar a página; clique com modificador segue
 * o navegador); item com onAction vira <button> (ex.: sair da conta); aria-current na página atual; cascata de
 * entrada por variável CSS (--i); lista longa em duas colunas.
 *
 * Movimento: ampliação por proximidade do Dock (React Bits, https://reactbits.dev/components/dock), em dock-magnify.ts.
 * Não há realce: a própria opção cresce perto do ponteiro (ou do foco do teclado) e volta ao tamanho ao se afastar,
 * com a mola do Dock (sem repique). O bit não é instalado.
 */

import { useEffect, useId, useRef } from 'react'
import type { MouseEvent as ReactMouseEvent, RefObject } from 'react'
import Link from 'next/link'
import { createMagnifier, type Magnifier } from './dock-magnify'
import { inertBackground } from './inert-background'
import './cinematic-menu.css'

export type CinematicMenuItem =
  | { href: string; index: string; label: string; current?: boolean; onAction?: undefined }
  | { href?: undefined; index: string; label: string; current?: boolean; onAction: () => void }

type CinematicMenuProps = {
  open: boolean
  items: CinematicMenuItem[]
  onClose: () => void
  triggerRef: RefObject<HTMLButtonElement>
  /** Navega para um destino (o nav aplica a View Transition). */
  onNavigate: (href: string) => void
  /** Id referenciado por aria-controls no botão que abre o menu. */
  id?: string
  topLabel?: string
}

const FOCUSABLE = 'a[href], button:not([disabled])'
const DENSE_FROM = 8
export function CinematicMenu({ open, items, onClose, triggerRef, onNavigate, id = 'cinematic-menu', topLabel = 'menu' }: CinematicMenuProps) {
  const titleId = useId()
  const menuRef = useRef<HTMLElement>(null)
  const firstItemRef = useRef<HTMLAnchorElement & HTMLButtonElement>(null)
  const itemRefs = useRef<(HTMLElement | null)[]>([])
  const magnifier = useRef<Magnifier | null>(null)

  useEffect(() => {
    document.body.classList.toggle('ml-menu-open', open)
    const menu = menuRef.current
    // O menu e o gatilho ficam no mesmo escopo; o resto da página (irmãos dos ancestrais do escopo) fica inert.
    const inerted = open && menu ? inertBackground(menu) : []
    if (menu) {
      if (open) menu.removeAttribute('inert')
      else menu.setAttribute('inert', '')
    }

    // `visibility` só vira "visible" ao fim da transição de abertura: focar antes disso é ignorado em silêncio.
    const focusFirstItem = () => {
      const node = firstItemRef.current
      if (node && document.activeElement !== node) node.focus({ preventScroll: true })
    }
    const onMenuTransitionEnd = (event: TransitionEvent) => {
      if (event.propertyName === 'visibility') focusFirstItem()
    }
    let fallbackTimer = 0
    if (open) {
      focusFirstItem()
      menu?.addEventListener('transitionend', onMenuTransitionEnd)
      fallbackTimer = window.setTimeout(focusFirstItem, 250)
    }
    return () => {
      document.body.classList.remove('ml-menu-open')
      for (const node of inerted) node.removeAttribute('inert')
      menu?.removeEventListener('transitionend', onMenuTransitionEnd)
      window.clearTimeout(fallbackTimer)
    }
  }, [open])

  // Ampliação por proximidade: nasce ao abrir e some ao fechar (nenhum quadro de animação com o menu fechado).
  useEffect(() => {
    if (!open) return
    const dock = createMagnifier(() => itemRefs.current)
    magnifier.current = dock
    return () => {
      dock.destroy()
      magnifier.current = null
    }
  }, [open, items.length])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!open) return
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        triggerRef.current?.focus()
        return
      }
      if (event.key !== 'Tab' || !menuRef.current) return
      const nodes = Array.from(menuRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (node) => !node.hasAttribute('tabindex') || node.tabIndex >= 0,
      )
      if (!nodes.length) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, triggerRef])

  const followLink = (event: ReactMouseEvent<HTMLAnchorElement>, href: string) => {
    onClose()
    // Com modificador (nova aba, etc.) o navegador cuida; sem ele, navegamos pelo app (sem recarregar).
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    onNavigate(href)
  }

  return (
    <aside ref={menuRef} className="ml-cinematic-menu" id={id} aria-hidden={!open} aria-labelledby={titleId}>
      <div
        className="ml-menu-haze"
        aria-hidden="true"
        onClick={() => {
          onClose()
          triggerRef.current?.focus()
        }}
      />
      <div className="ml-menu-orbit ml-menu-orbit-a" aria-hidden="true" />
      <div className="ml-menu-orbit ml-menu-orbit-b" aria-hidden="true" />
      <div className="ml-menu-inner">
        <div className="ml-menu-topline">
          <span>{topLabel}</span>
          <span>meu camp</span>
        </div>
        <nav className="ml-menu-links" aria-label="Menu principal" data-dense={items.length >= DENSE_FROM ? '' : undefined}>
          <h2 id={titleId} className="sr-only">
            Menu principal
          </h2>
          {items.map((item, index) => {
            const content = (
              <>
                <span className="ml-menu-link-index">{item.index}</span>
                <span className="ml-menu-link-text">{item.label}</span>
                <span className="ml-menu-link-arrow" aria-hidden="true">↗</span>
              </>
            )
            const shared = {
              ref: (el: HTMLElement | null) => {
                itemRefs.current[index] = el
                if (index === 0) (firstItemRef as { current: HTMLElement | null }).current = el
              },
              tabIndex: open ? 0 : -1,
              'data-menu-link': true,
              style: { '--i': index } as React.CSSProperties,
            }
            if (item.onAction) {
              return (
                <button
                  key={item.label}
                  type="button"
                  {...shared}
                  onClick={() => {
                    onClose()
                    item.onAction()
                  }}
                >
                  {content}
                </button>
              )
            }
            return (
              <Link
                key={item.label}
                href={item.href}
                aria-current={item.current ? 'page' : undefined}
                {...shared}
                onClick={(event) => followLink(event, item.href)}
              >
                {content}
              </Link>
            )
          })}
        </nav>
        <div className="ml-menu-bottomline">
          <span>meu camp</span>
          <span>jiu-jitsu</span>
        </div>
      </div>
    </aside>
  )
}
