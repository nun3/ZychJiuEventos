'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Mail, MessageCircle } from 'lucide-react'

const navigationLinks = [
  { href: '/', label: 'Início' },
  { href: '/eventos', label: 'Eventos' },
  { href: '/academias', label: 'Academias e equipes' },
  { href: '/sistema', label: 'O sistema' },
  { href: '/quem-somos', label: 'Quem somos' },
  { href: '/login', label: 'Entrar' },
]

export default function ModernFooter() {
  const pathname = usePathname()
  const phoneNumber = '5541991526177'
  const message = 'Olá! Gostaria de mais informações sobre o MEU CAMP.'
  const isOperationalEventScreen = /^\/admin\/eventos\/[^/]+\/(configuracao|checagem|financeiro|chaves|programacao|resultados)$/.test(pathname)

  const handleWhatsApp = () => {
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank')
  }

  return (
    <>
      <footer className="mt-mc-48 bg-mc-structure text-white">
        <div className="mx-auto max-w-7xl px-4 py-mc-32 sm:px-6 sm:py-mc-48 lg:px-8">
          <div className="grid gap-x-mc-32 gap-y-mc-32 sm:grid-cols-2 lg:grid-cols-3">
            <section aria-labelledby="footer-about-title">
              <h2 id="footer-about-title" className="font-mc-display text-mc-h3 text-white">MEU CAMP</h2>
              <p className="mt-mc-12 font-mc-interface text-sm leading-6 text-slate-300">
                Plataforma para organizar e operar competições. A primeira modalidade é Jiu-Jitsu.
                Inscrições, checagem, chaves, programação e resultados no mesmo produto.
              </p>
            </section>

            <nav aria-labelledby="footer-navigation-title">
              <h2 id="footer-navigation-title" className="font-mc-display text-mc-h3 text-white">Navegação</h2>
              <ul className="mt-mc-12 space-y-mc-8">
                {navigationLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="font-mc-interface text-sm leading-6 text-slate-300 transition-colors duration-mc-normal hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mc-focus focus-visible:ring-offset-2 focus-visible:ring-offset-mc-structure">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <section aria-labelledby="footer-contact-title">
              <h2 id="footer-contact-title" className="font-mc-display text-mc-h3 text-white">Contato</h2>
              <ul className="mt-mc-12 space-y-mc-12 font-mc-interface text-sm leading-6 text-slate-300">
                <li className="flex items-start gap-mc-8">
                  <Mail aria-hidden="true" size={18} className="mt-0.5 shrink-0 text-blue-200" />
                  <span>contato@meucamp.com.br</span>
                </li>
              </ul>
              <p className="mt-mc-16 font-mc-interface text-sm leading-6 text-slate-300">
                Fale pelo WhatsApp no ícone do rodapé. No primeiro go-live, a cobrança das inscrições é registrada por baixa manual do organizador.
              </p>
            </section>
          </div>

          <div className="mt-mc-32 border-t border-white/20 pt-mc-24 font-mc-interface text-sm text-slate-300">
            <p>© {new Date().getFullYear()} MEU CAMP. Todos os direitos reservados.</p>
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
