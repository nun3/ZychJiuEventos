'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Facebook, Instagram, Mail, MessageCircle, Phone, Youtube } from 'lucide-react'

const navigationLinks = [
  { href: '/academias', label: 'Para Organizadores de Eventos' },
  { href: '/sistema', label: 'Sistema de Gestão de Academia' },
  { href: '/quem-somos', label: 'Quem Somos' },
  { href: '#eventos', label: 'Nossos Eventos' },
  { href: '/cadastro', label: 'Cadastre-se' },
  { href: '/login', label: 'Acessar Conta' },
]

const socialLinks = [
  { href: 'https://facebook.com', label: 'Facebook do Meu Camp', icon: Facebook },
  { href: 'https://instagram.com', label: 'Instagram do Meu Camp', icon: Instagram },
  { href: 'https://youtube.com', label: 'YouTube do Meu Camp', icon: Youtube },
]

export default function ModernFooter() {
  const pathname = usePathname()
  const phoneNumber = '5541991526177'
  const message = 'Olá! Gostaria de mais informações sobre os eventos.'
  const isOperationalEventScreen = /^\/admin\/eventos\/[^/]+\/(checagem|pesagem)$/.test(pathname)

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank')
  }

  return (
    <>
      <footer className="mt-mc-48 bg-mc-structure text-white">
        <div className="mx-auto max-w-7xl px-4 py-mc-32 sm:px-6 sm:py-mc-48 lg:px-8">
          <div className="grid gap-x-mc-32 gap-y-mc-32 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <section className="sm:col-span-2 lg:col-span-1" aria-labelledby="footer-about-title">
              <h2 id="footer-about-title" className="font-mc-display text-mc-h3 text-white">Sobre o Meu Camp</h2>
              <p className="mt-mc-12 font-mc-interface text-sm leading-6 text-slate-300">O Meu Camp é um site de Prestação de Serviços para Organização de Eventos, Venda de Ingressos, Controle de Filiações e Serviços em Geral para Federações, Associações e Organizadores Independentes.</p>
              <p className="mt-mc-12 font-mc-interface text-sm leading-6 text-slate-300">Saiba mais sobre os nossos serviços <Link href="/servicos" className="font-semibold text-white underline decoration-mc-action underline-offset-4 hover:text-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mc-structure">AQUI</Link>.</p>
            </section>

            <nav aria-labelledby="footer-navigation-title">
              <h2 id="footer-navigation-title" className="font-mc-display text-mc-h3 text-white">Navegação</h2>
              <ul className="mt-mc-12 space-y-mc-8">
                {navigationLinks.map((link) => (
                  <li key={link.href}><Link href={link.href} className="font-mc-interface text-sm leading-6 text-slate-300 transition-colors duration-mc-normal hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mc-structure">{link.label}</Link></li>
                ))}
              </ul>
            </nav>

            <section aria-labelledby="footer-contact-title">
              <h2 id="footer-contact-title" className="font-mc-display text-mc-h3 text-white">Fale conosco</h2>
              <ul className="mt-mc-12 space-y-mc-12 font-mc-interface text-sm leading-5 text-slate-300">
                <li className="flex items-start gap-mc-8"><Phone aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-blue-200" /><span>Suporte Operacional - (27) 99945-0345</span></li>
                <li className="flex items-start gap-mc-8"><Phone aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-blue-200" /><span>Comercial - (27) 99660-0345</span></li>
                <li className="flex items-start gap-mc-8"><Mail aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-blue-200" /><span>contato@meucamp.com.br</span></li>
              </ul>
              <p className="mt-mc-16 font-mc-interface text-sm leading-6 text-slate-300"><strong className="font-semibold text-white">Atendimento on-line:</strong><br />Acesse o ícone do WhatsApp no rodapé para falar conosco.<br />Horário: Seg à Sex das 09 às 19h (dias úteis)</p>
            </section>

            <section aria-labelledby="footer-social-title">
              <h2 id="footer-social-title" className="font-mc-display text-mc-h3 text-white">Redes sociais</h2>
              <ul className="mt-mc-12 flex gap-mc-12">
                {socialLinks.map((social) => (
                  <li key={social.href}><a href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label} className="flex min-h-12 min-w-12 items-center justify-center rounded-mc-full bg-white/10 text-white transition-colors duration-mc-normal hover:bg-mc-action focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mc-structure"><social.icon aria-hidden="true" size={20} /></a></li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="footer-payment-title">
              <h2 id="footer-payment-title" className="font-mc-display text-mc-h3 text-white">Formas de pagamento</h2>
              <p className="mt-mc-12 font-mc-interface text-sm leading-6 text-slate-300">Boleto, Depósito Bancário ou Transferência Eletrônica<br /><span className="text-mc-caption">(informações na página do evento)</span></p>
              <div className="mt-mc-16 flex flex-wrap gap-mc-8" aria-label="Bandeiras aceitas">
                {['Visa', 'MC', 'Elo'].map((brand) => <span key={brand} className="flex h-9 min-w-14 items-center justify-center rounded-mc-small bg-white px-mc-8 font-mc-interface text-xs font-bold text-mc-text-primary">{brand}</span>)}
              </div>
              <p className="mt-mc-16 font-mc-interface text-mc-caption leading-5 text-slate-400">Portal Meu Camp tem Certificado de Segurança, para proteger os dados dos atletas e dos organizadores.</p>
            </section>
          </div>

          <div className="mt-mc-32 flex flex-col gap-mc-12 border-t border-white/20 pt-mc-24 font-mc-interface text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()}, Portal Meu Camp – Todos os direitos reservados.</p>
            <div className="flex flex-wrap gap-x-mc-16 gap-y-mc-8">
              <Link href="/termos" className="hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mc-structure">Termos de Uso</Link>
              <Link href="/privacidade" className="hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mc-structure">Política de Privacidade</Link>
            </div>
          </div>
        </div>
      </footer>

      {!isOperationalEventScreen && (
        <button type="button" onClick={handleWhatsApp} className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-[calc(env(safe-area-inset-right)+1rem)] z-40 flex min-h-12 min-w-12 items-center justify-center rounded-mc-full bg-[#25D366] text-white shadow-mc-elevated transition-colors duration-mc-normal hover:bg-[#20BA5A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2 sm:bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] sm:right-[calc(env(safe-area-inset-right)+1.5rem)] sm:min-h-14 sm:min-w-14" aria-label="Fale conosco no WhatsApp">
          <MessageCircle aria-hidden="true" size={24} />
        </button>
      )}
    </>
  )
}
