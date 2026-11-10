import { SiteFooter } from '@/components/SiteFooter'
import { WhatsAppFloat } from '@/components/WhatsAppFloat'

/**
 * Rodapé padrão da plataforma: o Halftone (retícula) mais o botão flutuante do WhatsApp (que não aparece nas telas
 * operacionais do evento). A Home usa SiteFooter + WhatsAppFloat diretamente, sem a margem superior.
 */
export default function ModernFooter() {
  return (
    <>
      <div className="mt-mc-48">
        <SiteFooter />
      </div>
      <WhatsAppFloat />
    </>
  )
}
