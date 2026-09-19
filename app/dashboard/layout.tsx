import '../globals.css'
import type { Metadata } from 'next'
import ModernNavbar from '@/components/ModernNavbar'
import InternalNavigation from '@/components/InternalNavigation'
import { getDashboardActor } from '@/lib/auth/dashboard-actor'

export const metadata: Metadata = {
  title: 'Painel - Meu Camp',
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const actor = await getDashboardActor()
  return (
    <div className="min-h-screen bg-mc-background pt-20">
      <ModernNavbar />
      <InternalNavigation canManageEvents={Boolean(actor?.canManageEvents)} />
      <div>{children}</div>
    </div>
  )
}
