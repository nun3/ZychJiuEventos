'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import StaggeredMenu, { type StaggeredMenuItem } from '@/components/react-bits/StaggeredMenu'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { pushWithViewTransition } from '@/lib/navigation/view-transition'
import { createClient } from '@/lib/supabase/client'
import './internal-nav.css'

const CREATE_EVENT_HREF = '/admin/eventos/novo'
const WHATSAPP = 'https://wa.me/5541991526177?text=' + encodeURIComponent('Olá! Gostaria de mais informações sobre o MEU CAMP.')

const links = [
  { link: '/dashboard', label: 'Meu painel' },
  { link: '/dashboard/meu-perfil', label: 'Meu perfil' },
  { link: '/dashboard/inscricoes', label: 'Minhas inscrições' },
  { link: '/dashboard/meus-atletas', label: 'Minhas equipes' },
  { link: '/admin/eventos', label: 'Meus eventos' },
  { link: '/', label: 'Eventos' },
  { link: CREATE_EVENT_HREF, label: 'Criar evento' },
]

const socialItems = [
  { label: 'E-mail', link: 'mailto:contato@meucamp.com.br' },
  { label: 'WhatsApp', link: WHATSAPP },
]

function isCurrent(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
}

/**
 * Navegação das telas internas (dashboard, admin, platform): barra branca com a logo e o menu lateral StaggeredMenu
 * (React Bits). O painel entra pela direita; "Sair da conta" é um botão (encerra a sessão), os demais são links do app.
 * As telas públicas usam o menu cinematográfico (ModernNavbar).
 */
export default function InternalNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { currentUser } = useCurrentUser()

  const handleLogout = async () => {
    await createClient().auth.signOut()
    window.location.assign('/login')
  }

  // O destino mais específico vence (ex.: /dashboard/meu-perfil sobre /dashboard).
  const currentLink = links
    .filter((item) => isCurrent(pathname, item.link))
    .sort((a, b) => b.link.length - a.link.length)[0]?.link

  const items: StaggeredMenuItem[] = [
    ...links.map((item) => ({ ...item, current: item.link === currentLink })),
    { label: 'Sair da conta', ariaLabel: 'Sair da conta', onClick: () => { void handleLogout() } },
  ]

  return (
    <div>
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[80] focus:rounded-mc-small focus:bg-mc-action focus:px-4 focus:py-2 focus:text-white"
      >
        Pular para o conteúdo principal
      </a>
      <div aria-hidden="true" className="fixed inset-x-0 top-0 z-[60] h-16 border-b border-mc-border bg-white" />
      <StaggeredMenu
        className="mc-internal-menu"
        isFixed
        position="right"
        items={items}
        socialItems={socialItems}
        displaySocials
        toggleAvatar={
          currentUser ? (
            currentUser.avatarUrl ? (
              <Image src={currentUser.avatarUrl} alt="" fill sizes="32px" className="object-cover" />
            ) : (
              <span>{currentUser.initial}</span>
            )
          ) : null
        }
        displayItemNumbering
        colors={['#0b2742', '#2563eb']}
        accentColor="#2563eb"
        menuButtonColor="#0f172a"
        openMenuButtonColor="#0f172a"
        changeMenuColorOnOpen
        labels={{ open: 'Menu', close: 'Fechar', openAria: currentUser ? `Abrir menu de ${currentUser.name}` : 'Abrir menu', closeAria: 'Fechar menu' }}
        socialsTitle="Contato"
        panelLabel="Menu principal"
        onItemClick={(item) => item.link && pushWithViewTransition(router.push, item.link)}
        logo={
          <Link href="/" aria-label="MEU CAMP, início" className="relative block h-7 w-36 sm:w-40">
            <Image src="/images/meucamp-wordmark.png" alt="" fill priority sizes="160px" className="object-contain" />
          </Link>
        }
      />
    </div>
  )
}
