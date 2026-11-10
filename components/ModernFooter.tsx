'use client'

import { usePathname } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import { SiteFooter } from '@/components/SiteFooter'

const WHATSAPP_NUMBER = '5541991526177'
const WHATSAPP_MESSAGE = 'Olá! Gostaria de mais informações sobre o MEU CAMP.'

/**
 * Rodapé padrão da plataforma: o Halftone (retícula), em todas as páginas que usam este componente, mais o botão
 * flutuante do WhatsApp (que não aparece nas telas operacionais do evento). A Home usa o SiteFooter direto, sem o botão.
 */
export default function ModernFooter() {
  const pathname = usePathname()
  const isOperationalEventScreen = /^\/admin\/eventos\/[^/]+\/(configuracao|checagem|financeiro|chaves|programacao|resultados)$/.test(pathname)

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`, '_blank')
  }

  return (
    <>
      <div className="mt-mc-48">
        <SiteFooter />
      </div>

      {!isOperationalEventScreen && (
        <button type="button" onClick={handleWhatsApp} className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-[calc(env(safe-area-inset-right)+1rem)] z-40 flex min-h-12 min-w-12 items-center justify-center rounded-mc-full bg-[#25D366] text-white shadow-mc-elevated transition-colors duration-mc-normal hover:bg-[#20BA5A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2 sm:bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:right-[calc(env(safe-area-inset-right)+1.5rem)] sm:min-h-14 sm:min-w-14" aria-label="Fale conosco no WhatsApp">
          <MessageCircle aria-hidden="true" size={24} />
        </button>
      )}
    </>
  )
}
