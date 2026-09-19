import type { ReactNode } from 'react'
import ModernFooter from '@/components/ModernFooter'
import ModernNavbar from '@/components/ModernNavbar'
import { PageContainer } from '@/components/ui/PageContainer'

export default function InstitutionalPage({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <main className="min-h-screen bg-mc-background">
      <ModernNavbar />
      <section className="bg-mc-structure pt-20 text-white">
        <PageContainer className="py-mc-48 sm:py-mc-64">
          <p className="font-mc-interface text-sm font-semibold uppercase tracking-[0.16em] text-blue-200">{eyebrow}</p>
          <h1 className="mt-mc-12 max-w-3xl font-mc-display text-3xl font-semibold leading-tight sm:text-mc-h1">{title}</h1>
          <p className="mt-mc-16 max-w-2xl font-mc-interface text-lg leading-7 text-slate-200">{description}</p>
          {actions ? <div className="mt-mc-24 flex flex-col gap-mc-12 sm:flex-row">{actions}</div> : null}
        </PageContainer>
      </section>
      <PageContainer className="py-mc-48 sm:py-mc-64">{children}</PageContainer>
      <ModernFooter />
    </main>
  )
}
