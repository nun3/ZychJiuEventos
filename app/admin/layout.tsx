import '../globals.css'
import type { Metadata } from 'next'
import ModernNavbar from '@/components/ModernNavbar'
import InternalNav from '@/components/navigation/InternalNav'
import ModernFooter from '@/components/ModernFooter'
import { OperatorLayoutBoundary } from '@/components/live/OperatorLayoutBoundary'

export const metadata: Metadata = {
  title: 'Admin - Meu Camp',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <OperatorLayoutBoundary navigation={<InternalNav />} publicNavigation={<ModernNavbar />} footer={<ModernFooter />}>
      {children}
    </OperatorLayoutBoundary>
  )
}
