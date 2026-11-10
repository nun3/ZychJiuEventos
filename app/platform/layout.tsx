import '../globals.css'
import type { Metadata } from 'next'
import InternalNavigation from '@/components/InternalNavigation'
import InternalNav from '@/components/navigation/InternalNav'
import { getDashboardActor } from '@/lib/auth/dashboard-actor'

export const metadata: Metadata = {
  title: 'Plataforma - Meu Camp',
}

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const actor = await getDashboardActor()
  return (
    <div className="min-h-screen bg-mc-background pt-16">
      <InternalNav />
      <InternalNavigation
        canManageEvents={Boolean(actor?.canManageEvents)}
        canManageOrganization={Boolean(actor?.canManageOrganization)}
        isPlatformAdmin={Boolean(actor?.isPlatformAdmin)}
      />
      <div>{children}</div>
    </div>
  )
}
