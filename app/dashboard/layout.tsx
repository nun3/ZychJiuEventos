import '../globals.css'
import type { Metadata } from 'next'
import ModernNavbar from '@/components/ModernNavbar'
import ModernFooter from '@/components/ModernFooter'

export const metadata: Metadata = {
  title: 'Painel do Professor - Meu Camp',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ModernNavbar />
      <div className="bg-[#f8fafc] pt-40 pb-12">{children}</div>
      <ModernFooter />
    </>
  )
}
