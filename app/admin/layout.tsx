import '../globals.css'
import type { Metadata } from 'next'
import ModernNavbar from '@/components/ModernNavbar'
import ModernFooter from '@/components/ModernFooter'

export const metadata: Metadata = {
  title: 'Admin - Meu Camp',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#f8fafc]">
        <ModernNavbar />
        <div className="pt-44 pb-12">{children}</div>
        <ModernFooter />
      </body>
    </html>
  )
}
