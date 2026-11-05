'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'

/** The mesa has its own navigation; keep the usual admin shell on every other route. */
export function OperatorLayoutBoundary({ children, navigation, footer }: {
  children: ReactNode
  navigation: ReactNode
  footer: ReactNode
}) {
  const pathname = usePathname()
  if (/^\/admin\/eventos\/[^/]+\/operacao\/?$/.test(pathname)) return <>{children}</>
  return <>{navigation}<div className="min-h-screen bg-mc-background pt-16">{children}</div>{footer}</>
}
