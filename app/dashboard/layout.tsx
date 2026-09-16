import '../globals.css'
import type { Metadata } from 'next'
import ModernNavbar from '@/components/ModernNavbar'
import InternalNavigation from '@/components/InternalNavigation'

export const metadata: Metadata = {
  title: 'Painel do organizador - Meu Camp',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-mc-background pt-20">
      <ModernNavbar />
      <InternalNavigation />
      <div>{children}</div>
    </div>
  )
}
