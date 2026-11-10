'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

/** Mostra uma barra fina no topo se a troca de página demorar. Some quando a rota muda; nunca bloqueia cliques. */
const SHOW_AFTER_MS = 150
const GIVE_UP_MS = 12000

export function RouteProgress() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const showTimer = useRef<number | undefined>(undefined)
  const giveUpTimer = useRef<number | undefined>(undefined)
  const lastPath = useRef(pathname)

  useEffect(() => {
    const clear = () => {
      window.clearTimeout(showTimer.current)
      window.clearTimeout(giveUpTimer.current)
    }
    const onClick = (event: MouseEvent) => {
      // Transições já tratadas (View Transitions) e atalhos do navegador ficam de fora.
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!anchor || (anchor.target && anchor.target !== '_self') || anchor.hasAttribute('download')) return
      const url = new URL(anchor.href, window.location.href)
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return
      clear()
      // Só aparece se a navegação demorar: trocas instantâneas não piscam.
      showTimer.current = window.setTimeout(() => setVisible(true), SHOW_AFTER_MS)
      giveUpTimer.current = window.setTimeout(() => setVisible(false), GIVE_UP_MS)
    }
    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('click', onClick)
      clear()
    }
  }, [])

  useEffect(() => {
    if (lastPath.current === pathname) return
    lastPath.current = pathname
    window.clearTimeout(showTimer.current)
    window.clearTimeout(giveUpTimer.current)
    setVisible(false)
  }, [pathname])

  if (!visible) return null
  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[80] h-0.5">
        <div className="mc-route-progress h-full w-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.7)]" />
      </div>
      <span role="status" className="sr-only">Carregando página…</span>
    </>
  )
}
