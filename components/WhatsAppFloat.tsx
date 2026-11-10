'use client'

import { usePathname } from 'next/navigation'

const HREF = 'https://wa.me/5541991526177?text=' + encodeURIComponent('Olá! Gostaria de mais informações sobre o MEU CAMP.')

/** Telas operacionais do evento ficam sem o botão (a mesa de operação precisa do espaço). */
const OPERATIONAL = /^\/admin\/eventos\/[^/]+\/(configuracao|checagem|financeiro|chaves|programacao|resultados)$/

/**
 * Botão flutuante do WhatsApp, o mesmo em todas as páginas: círculo verde com o glifo oficial, anel de pulso discreto
 * (desligado com prefers-reduced-motion) e, no desktop, o rótulo "Fale conosco" abre ao passar o mouse ou focar.
 */
export function WhatsAppFloat() {
  const pathname = usePathname()
  if (OPERATIONAL.test(pathname)) return null

  return (
    <a
      href={HREF}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Fale conosco no WhatsApp"
      className="group fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-[calc(env(safe-area-inset-right)+1rem)] z-40 flex h-14 items-center gap-0 rounded-full bg-gradient-to-br from-[#2BD46A] to-[#128C4A] pl-[14px] pr-[14px] text-white shadow-[0_10px_30px_-8px_rgba(18,140,74,0.65),inset_0_1px_0_rgba(255,255,255,0.35)] ring-1 ring-white/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_-8px_rgba(18,140,74,0.8),inset_0_1px_0_rgba(255,255,255,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#128C4A] sm:bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:right-[calc(env(safe-area-inset-right)+1.5rem)]"
    >
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-[#25D366]/50 motion-safe:animate-ping [animation-duration:2.8s]" />
      <svg aria-hidden="true" viewBox="0 0 32 32" className="h-7 w-7 shrink-0 fill-current">
        <path d="M16.03 3C8.84 3 3 8.83 3 16c0 2.3.6 4.54 1.74 6.52L3 29l6.65-1.7A13 13 0 0 0 16.03 29C23.2 29 29 23.17 29 16S23.2 3 16.03 3Zm0 23.8c-2 0-3.95-.54-5.66-1.56l-.4-.24-3.95 1.01 1.06-3.84-.27-.4A10.7 10.7 0 0 1 5.2 16c0-5.9 4.9-10.7 10.83-10.7 5.93 0 10.77 4.8 10.77 10.7s-4.84 10.8-10.77 10.8Zm5.9-8.03c-.32-.16-1.9-.94-2.2-1.05-.3-.1-.51-.16-.73.16-.2.32-.83 1.05-1.02 1.27-.19.2-.37.23-.7.08-.32-.16-1.36-.5-2.6-1.6-.96-.85-1.6-1.9-1.8-2.22-.18-.32-.02-.5.14-.65.15-.15.32-.37.48-.56.16-.19.2-.32.32-.54.1-.21.05-.4-.03-.56-.08-.16-.73-1.75-1-2.4-.26-.62-.53-.54-.73-.55h-.62c-.2 0-.56.08-.85.4-.3.32-1.12 1.1-1.12 2.68 0 1.57 1.15 3.1 1.3 3.3.16.22 2.26 3.45 5.46 4.83.76.33 1.36.52 1.82.67.77.24 1.46.2 2.01.12.61-.09 1.9-.78 2.16-1.53.27-.75.27-1.4.19-1.53-.08-.13-.3-.21-.62-.37Z" />
      </svg>
      <span className="max-w-0 overflow-hidden whitespace-nowrap font-mc-interface text-sm font-bold opacity-0 transition-all duration-300 group-hover:ml-2.5 group-hover:max-w-[9rem] group-hover:opacity-100 group-focus-visible:ml-2.5 group-focus-visible:max-w-[9rem] group-focus-visible:opacity-100 max-sm:hidden">
        Fale conosco
      </span>
    </a>
  )
}
