'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

/**
 * The mesa has its own navigation; keep the usual admin shell on every other route.
 * /admin/autenticacao é a página de login do admin: quem chega nela ainda não está logado, então recebe o nav público
 * (o menu interno tem "Sair da conta" e os links da conta).
 */
export function OperatorLayoutBoundary({ children, navigation, publicNavigation, footer }: {
  children: ReactNode
  navigation: ReactNode
  publicNavigation?: ReactNode
  footer: ReactNode
}) {
  const pathname = usePathname()
  if (/^\/admin\/eventos\/[^/]+\/operacao\/?$/.test(pathname)) return <>{children}</>
  const nav = publicNavigation && /^\/admin\/autenticacao(\/|$)/.test(pathname) ? publicNavigation : navigation
  return <>{nav}<div className="min-h-screen bg-mc-background pt-16">{children}</div>{footer}</>
}
