import type { Metadata } from 'next'
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'

// Keep legacy weights available while pages migrate independently.
const inter = Inter({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'], display: 'swap', variable: '--font-inter' })
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600', '700'], display: 'swap', variable: '--font-space-grotesk' })

export const metadata: Metadata = {
  title: 'Meu Camp - Plataforma de Eventos Online',
  description: 'Plataforma completa para gerenciar, divulgar e organizar eventos de Jiu-Jitsu. Campeonatos, cursos, seminários e workshops.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body>{children}</body>
    </html>
  )
}
