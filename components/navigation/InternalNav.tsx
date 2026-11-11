'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import GraduationAvatar from '@/components/GraduationAvatar'
import StaggeredMenu, { type StaggeredMenuItem } from '@/components/react-bits/StaggeredMenu'
import { AccountPanelHeader, INTERNAL_LINKS, SOCIAL_ITEMS, logoutItem, markCurrent } from '@/components/navigation/account-menu'
import { useAthleteBelt } from '@/hooks/useAthleteBelt'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { pushWithViewTransition } from '@/lib/navigation/view-transition'
import { createClient } from '@/lib/supabase/client'
import './internal-nav.css'

/**
 * Navegação das telas internas (dashboard, admin, platform): barra branca com a logo e o menu lateral StaggeredMenu
 * (React Bits). O painel entra pela direita; "Sair da conta" é um botão (encerra a sessão), os demais são links do app.
 * As telas públicas usam o menu cinematográfico (ModernNavbar).
 */
export default function InternalNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { currentUser, checked, isLoggedIn } = useCurrentUser()
  const belt = useAthleteBelt(isLoggedIn)
  const ringBelt = belt?.declared ? belt : null

  const handleLogout = async () => {
    await createClient().auth.signOut()
    window.location.assign('/login')
  }

  const items: StaggeredMenuItem[] = [...markCurrent(INTERNAL_LINKS, pathname), logoutItem(() => { void handleLogout() })]

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
        socialItems={SOCIAL_ITEMS}
        displaySocials
        panelHeader={currentUser ? <AccountPanelHeader user={currentUser} belt={belt} onNavigate={(href) => pushWithViewTransition(router.push, href)} /> : null}
        toggleAvatar={
          currentUser ? (
            <GraduationAvatar belt={ringBelt} size={40}>
              <span className="relative flex h-full w-full items-center justify-center bg-mc-action/10 text-sm font-bold text-mc-action">
                {currentUser.avatarUrl ? <Image src={currentUser.avatarUrl} alt="" fill sizes="40px" className="object-cover" /> : <span>{currentUser.initial}</span>}
              </span>
            </GraduationAvatar>
          ) : checked ? null : (
            <span className="mc-menu-avatar-skeleton" />
          )
        }
        toggleAvatarOpen={
          <GraduationAvatar belt={ringBelt} size={40}>
            <span className="flex h-full w-full items-center justify-center bg-mc-action/10 text-mc-action">
              <X aria-hidden="true" size={16} strokeWidth={2.25} />
            </span>
          </GraduationAvatar>
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
