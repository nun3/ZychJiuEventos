import '../globals.css'
import type { Metadata } from 'next'
import ModernNavbar from '@/components/ModernNavbar'
import ModernFooter from '@/components/ModernFooter'

export const metadata: Metadata = {
  title: 'Admin - Meu Camp',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ModernNavbar />
      <div className="bg-[#f8fafc] pt-44 pb-12">{children}</div>
      <ModernFooter />
    </>
  )
}
