'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Calendar, Files, GraduationCap, LayoutGrid, LogIn, LogOut, Newspaper, Plus, Trophy, User, Users, Workflow } from 'lucide-react'
import GraduationAvatar from '@/components/GraduationAvatar'
import type { StaggeredMenuItem } from '@/components/react-bits/StaggeredMenu'
import type { AthleteBeltState } from '@/hooks/useAthleteBelt'
import type { CurrentUser } from '@/hooks/useCurrentUser'
import { beltLabel } from '@/lib/athletes/belt'
import './internal-nav.css'

// Conteúdo do menu lateral branco (StaggeredMenu), compartilhado pelas telas internas (InternalNav) e pela navbar pública
// (ModernNavbar). A mecânica e o visual são os mesmos; aqui vivem só os itens, o cartão do perfil e os contatos.
export const CREATE_EVENT_HREF = '/admin/eventos/novo'
const WHATSAPP = 'https://wa.me/5541991526177?text=' + encodeURIComponent('Olá! Gostaria de mais informações sobre o MEU CAMP.')
const ICON = { size: 18, strokeWidth: 1.75 } as const

const ACCOUNT_LINKS: StaggeredMenuItem[] = [
  { link: '/dashboard', label: 'Meu painel', icon: <LayoutGrid {...ICON} />, section: 'Minha conta' },
  { link: '/dashboard/meu-perfil', label: 'Meu perfil', icon: <User {...ICON} /> },
  { link: '/dashboard/inscricoes', label: 'Minhas inscrições', icon: <Files {...ICON} /> },
  { link: '/dashboard/meus-atletas', label: 'Minhas equipes', icon: <Users {...ICON} /> },
]
const MY_EVENTS: StaggeredMenuItem = { link: '/admin/eventos', label: 'Meus eventos', icon: <Trophy {...ICON} />, section: 'Torneios & lutas' }
const CREATE_EVENT: StaggeredMenuItem = { link: CREATE_EVENT_HREF, label: 'Criar evento', icon: <Plus {...ICON} /> }

/** Itens das telas internas (inalterados em relação à versão anterior do InternalNav). */
export const INTERNAL_LINKS: StaggeredMenuItem[] = [
  ...ACCOUNT_LINKS,
  MY_EVENTS,
  { link: '/', label: 'Eventos', icon: <Calendar {...ICON} /> },
  CREATE_EVENT,
]

/** Páginas públicas (as mesmas do antigo menu cinematográfico). */
const PUBLIC_LINKS: StaggeredMenuItem[] = [
  { link: '/eventos', label: 'Eventos', icon: <Calendar {...ICON} />, section: 'Explorar' },
  { link: '/academias', label: 'Academias e equipes', icon: <GraduationCap {...ICON} /> },
  { link: '/sistema', label: 'O sistema', icon: <Workflow {...ICON} /> },
  { link: '/noticias', label: 'Notícias', icon: <Newspaper {...ICON} /> },
  { link: '/quem-somos', label: 'Quem somos', icon: <Trophy {...ICON} /> },
]

export const SOCIAL_ITEMS = [
  { label: 'E-mail', link: 'mailto:contato@meucamp.com.br' },
  { label: 'WhatsApp', link: WHATSAPP },
]

export function isCurrent(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
}

/** O destino mais específico vence (ex.: /dashboard/meu-perfil sobre /dashboard). */
export function markCurrent(list: StaggeredMenuItem[], pathname: string): StaggeredMenuItem[] {
  const best = list
    .filter((item) => item.link && isCurrent(pathname, item.link))
    .sort((a, b) => (b.link?.length ?? 0) - (a.link?.length ?? 0))[0]?.link
  return list.map((item) => ({ ...item, current: !!item.link && item.link === best }))
}

export function logoutItem(onLogout: () => void): StaggeredMenuItem {
  return { label: 'Sair da conta', icon: <LogOut {...ICON} />, section: 'Sessão', ariaLabel: 'Sair da conta', onClick: onLogout }
}

/** Itens da navbar pública: conta (logado) + páginas públicas; visitante vê as páginas públicas, entrar e criar evento. */
export function publicMenuItems({ loggedIn, pathname, createEventHref, onLogout }: { loggedIn: boolean; pathname: string; createEventHref: string; onLogout: () => void }): StaggeredMenuItem[] {
  if (loggedIn) {
    return markCurrent([...ACCOUNT_LINKS, MY_EVENTS, { ...CREATE_EVENT, link: createEventHref }, ...PUBLIC_LINKS], pathname).concat(logoutItem(onLogout))
  }
  return markCurrent(
    [...PUBLIC_LINKS, { link: '/login', label: 'Entrar', icon: <LogIn {...ICON} />, section: 'Conta' }, { ...CREATE_EVENT, link: createEventHref }],
    pathname,
  )
}

/** Cartão no topo do painel: foto com o aro de graduação, nome e link para o perfil. */
export function AccountPanelHeader({ user, belt, onNavigate }: { user: NonNullable<CurrentUser>; belt: AthleteBeltState | null; onNavigate: (href: string) => void }) {
  const ringBelt = belt?.declared ? belt : null
  return (
    <Link
      href="/dashboard/meu-perfil"
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
        event.preventDefault()
        onNavigate('/dashboard/meu-perfil')
      }}
      className="mc-menu-profile"
    >
      <GraduationAvatar belt={ringBelt} size={64}>
        <span className="mc-menu-profile-photo" aria-hidden="true">
          {user.avatarUrl ? <Image src={user.avatarUrl} alt="" fill sizes="64px" className="object-cover" /> : <span>{user.initial}</span>}
        </span>
      </GraduationAvatar>
      <span className="mc-menu-profile-text">
        <strong>{user.name}</strong>
        <small>Ver e editar perfil</small>
        {ringBelt ? <span className="sr-only">{beltLabel(ringBelt)}</span> : null}
      </span>
    </Link>
  )
}

