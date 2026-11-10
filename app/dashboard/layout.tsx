import '../globals.css'
import type { Metadata } from 'next'
import ModernFooter from '@/components/ModernFooter'
import InternalNav from '@/components/navigation/InternalNav'
import InternalNavigation from '@/components/InternalNavigation'
import { getDashboardActor } from '@/lib/auth/dashboard-actor'

export const metadata: Metadata = {
  title: 'Painel - Meu Camp',
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const actor = await getDashboardActor()
  return (
    <div className="min-h-screen bg-mc-background pt-16">
      <InternalNav />
      <InternalNavigation
        canManageEvents={Boolean(actor?.canManageEvents)}
        canManageOrganization={Boolean(actor?.canManageOrganization)}
        isPlatformAdmin={Boolean(actor?.isPlatformAdmin)}
        fluid
      />
      <div>{children}</div>
      <ModernFooter />
    </div>
  )
}
