import '../globals.css'
import type { Metadata } from 'next'
import DashboardHeader from '@/components/DashboardHeader'
import Footer from '@/components/Footer'
import WhatsAppWidget from '@/components/WhatsAppWidget'

export const metadata: Metadata = {
  title: 'Admin - Meu Camp',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50">
        <DashboardHeader />
        <div className="pt-24 pb-16 min-h-[calc(100vh-200px)]">{children}</div>
        <Footer />
        <WhatsAppWidget />
      </body>
    </html>
  )
}
