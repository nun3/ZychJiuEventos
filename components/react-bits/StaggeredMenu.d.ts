import type { MouseEvent, ReactNode } from 'react'

export interface StaggeredMenuItem {
  label: string
  ariaLabel?: string
  /** Destino. Sem `link`, o item vira <button> e usa `onClick`. */
  link?: string
  onClick?: (event: MouseEvent) => void
  /** Marca a página atual (aria-current). */
  current?: boolean
}

export interface StaggeredMenuSocialItem {
  label: string
  link: string
}

export interface StaggeredMenuProps {
  position?: 'left' | 'right'
  colors?: string[]
  items?: StaggeredMenuItem[]
  socialItems?: StaggeredMenuSocialItem[]
  displaySocials?: boolean
  displayItemNumbering?: boolean
  className?: string
  logoUrl?: string
  /** Elemento no lugar da logo por URL (ex.: <Link><Image/></Link>). */
  logo?: ReactNode
  menuButtonColor?: string
  openMenuButtonColor?: string
  accentColor?: string
  changeMenuColorOnOpen?: boolean
  isFixed?: boolean
  closeOnClickAway?: boolean
  labels?: { open?: string; close?: string; openAria?: string; closeAria?: string }
  socialsTitle?: string
  panelLabel?: string
  /** Chamado em clique simples de item com `link`; o app navega e o menu já fechou. */
  onItemClick?: (item: StaggeredMenuItem, event: MouseEvent) => void
  onMenuOpen?: () => void
  onMenuClose?: () => void
}

export declare const StaggeredMenu: (props: StaggeredMenuProps) => JSX.Element
export default StaggeredMenu
